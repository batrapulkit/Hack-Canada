// server/src/controllers/quoteController.js
import { supabase } from '../config/supabase.js';
import { emitEvent, EVENTS } from '../services/automationEngine.js';
import { calculateItineraryTotals } from '../services/pricingService.js';
import { validateTransition } from '../services/stateMachine.js';
import { getNextInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
// Get Quotes
export const getQuotes = async (req, res) => {
    try {
        const { itineraryId, clientId } = req.query;

        let query = supabase
            .from('quotes')
            .select('*, client:clients(full_name, name, email), itinerary:itineraries(destination), quote_items(*)')
            .eq('agency_id', req.user.agency_id)
            .order('created_at', { ascending: false });

        if (itineraryId) query = query.eq('itinerary_id', itineraryId);
        if (clientId) query = query.eq('client_id', clientId);

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, quotes: data });
    } catch (err) {
        console.error('Error fetching quotes:', err);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};

// Create Quote
export const createQuote = async (req, res) => {
    try {
        const { itinerary_id, client_id, total, notes, due_date, items, status, title, introduction, header_text, footer_text } = req.body;

        let quoteData = {
            agency_id: req.user.agency_id,
            client_id,
            status: status || 'draft', // Allow overriding status (e.g. for seeding)
            created_by: req.user.id,
            valid_until: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes,
            title: title || 'Proposal',
            introduction,
            header_text,
            footer_text
        };

        let quoteItemsData = [];

        // Option A: Create from Itinerary
        if (itinerary_id) {
            const { data: itinerary, error: itinError } = await supabase
                .from('itineraries')
                .select('*, itinerary_items(*)')
                .eq('id', itinerary_id)
                .eq('agency_id', req.user.agency_id)
                .single();

            if (itinError || !itinerary) {
                return res.status(404).json({ error: 'Itinerary not found' });
            }

            const { totalPrice } = calculateItineraryTotals(itinerary.itinerary_items || []);
            quoteData.itinerary_id = itinerary_id;
            quoteData.total_price = totalPrice;
            // Generate items from itinerary items
            if (itinerary.itinerary_items && itinerary.itinerary_items.length > 0) {
                quoteItemsData = itinerary.itinerary_items.map(item => ({
                    description: item.title || item.description || 'Travel Service',
                    quantity: 1,
                    unit_price: item.final_price || item.cost_price || 0
                }));
            }
        }
        // Option B: Generic Quote (Custom Items or Total)
        else {
            if (!client_id) return res.status(400).json({ error: 'Client ID is required' });

            if (items && items.length > 0) {
                // Calculate total from items
                const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
                quoteData.total_price = calculatedTotal;
                quoteItemsData = items;
            } else {
                // Fallback to explicit total
                quoteData.total_price = total || 0;
                // Create a single default item
                quoteItemsData.push({
                    description: notes || 'Travel Services',
                    quantity: 1,
                    unit_price: quoteData.total_price
                });
            }
        }

        const { data: quote, error } = await supabase
            .from('quotes')
            .insert(quoteData)
            .select()
            .single();

        if (error) throw error;

        // Insert Items
        if (quoteItemsData.length > 0) {
            const itemsToInsert = quoteItemsData.map(item => ({
                quote_id: quote.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);
            if (itemsError) {
                console.error("Error inserting quote items:", itemsError);
                // Non-fatal? Or should we rollback? For now log it.
            }
        }

        // Emit Event (Optional)
        await emitEvent(EVENTS.QUOTE.CREATED, {
            agency_id: req.user.agency_id,
            id: quote.id,
            lead_id: client_id,
            entityType: 'QUOTE',
            message: `Quote created ($${quoteData.total_price})`
        });

        res.status(201).json({ success: true, quote });
    } catch (err) {
        console.error('Error creating quote:', err);
        res.status(500).json({ error: 'Failed to create quote', details: err.message });
    }
};

// Update Quote (General)
export const updateQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Expects title, introduction, etc. or status

        // Filter allowed fields
        const allowed = ['title', 'introduction', 'header_text', 'footer_text', 'notes', 'valid_until', 'total_price', 'status'];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        filteredUpdates.updated_at = new Date().toISOString();

        if (updates.items && Array.isArray(updates.items)) {
            // Recalculate total if items provided
            const calculatedTotal = updates.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
            filteredUpdates.total_price = calculatedTotal;

            // Replace items transactionally-ish
            await supabase.from('quote_items').delete().eq('quote_id', id);

            const itemsToInsert = updates.items.map(item => ({
                quote_id: id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));

            if (itemsToInsert.length > 0) {
                await supabase.from('quote_items').insert(itemsToInsert);
            }
        }

        const { data, error } = await supabase
            .from('quotes')
            .update(filteredUpdates)
            .eq('id', id)
            .eq('agency_id', req.user.agency_id)
            .select('*, quote_items(*)')
            .single();

        if (error) throw error;

        res.json({ success: true, quote: data });
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ error: 'Failed to update quote' });
    }
};

// Update Quote Status (Accept/Reject/Send)
export const updateQuoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data: current, error: fetchError } = await supabase
            .from('quotes')
            .select('status, agency_id')
            .eq('id', id)
            .eq('agency_id', req.user.agency_id)
            .single();

        if (fetchError) throw fetchError;

        // Validate Transition
        try {
            validateTransition('QUOTE', current.status, status);
        } catch (e) {
            console.error(`[UPDATE QUOTE] Transition Error: ${e.message}`);
            return res.status(400).json({ error: e.message });
        }

        const { data, error } = await supabase
            .from('quotes')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('agency_id', req.user.agency_id)
            .select()
            .single();

        if (error) throw error;

        // Automation
        if (status === 'accepted') {
            await emitEvent(EVENTS.QUOTE.ACCEPTED, {
                agency_id: req.user.agency_id,
                id: id,
                entityType: 'QUOTE',
                message: 'Quote Accepted by Client'
            });
        } else if (status === 'sent') {
            await emitEvent(EVENTS.QUOTE.SENT, {
                agency_id: req.user.agency_id,
                id: id,
                entityType: 'QUOTE',
                message: 'Quote Sent to Client'
            });
        }

        res.json({ success: true, quote: data });

    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ error: 'Failed to update quote' });
    }
};

// Convert to Invoice
export const convertQuoteToInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Quote
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*, itinerary:itineraries(*, itinerary_items(*)), quote_items(*)')
            .eq('id', id)
            .eq('agency_id', req.user.agency_id)
            .single();

        if (quoteError) throw quoteError;

        // Check if already invoiced? (Ideally check DB relation, but we can just check status)
        if (quote.status === 'invoiced') {
            return res.status(400).json({ error: 'Quote already invoiced' });
        }

        // 2. Create Invoice
        const invoiceNumber = await getNextInvoiceNumber(req.user.agency_id);
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                agency_id: req.user.agency_id,
                client_id: quote.client_id,
                itinerary_id: quote.itinerary_id,
                quote_id: quote.id,
                invoice_number: invoiceNumber,
                status: 'draft',
                issue_date: new Date().toISOString(),
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                subtotal: quote.total_price,
                total: quote.total_price,
                currency: quote.currency,
                created_by: req.user.id
            })
            .select()
            .single();

        if (invError) throw invError;

        // 3. Create Invoice Items from Itinerary Items
        // Note: Generic quotes might not have itinerary. Handle this.
        // 3. Create Invoice Items
        let items = [];

        // Priority 1: Quote Items (Explicitly added to quote)
        if (quote.quote_items && quote.quote_items.length > 0) {
            items = quote.quote_items.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: parseFloat(item.quantity) * parseFloat(item.unit_price) // or let DB generated column handle it? Invoice items might not have generated col. checking schema... likely simple columns.
            }));
        }
        // Priority 2: Itinerary Items (if linked and no explicit quote items override)
        else if (quote.itinerary && quote.itinerary.itinerary_items) {
            items = quote.itinerary.itinerary_items.map(item => ({
                invoice_id: invoice.id,
                description: item.title,
                quantity: 1,
                unit_price: item.final_price || item.cost_price,
                amount: item.final_price || item.cost_price
            }));
        }
        // Priority 3: Fallback Single Item
        else {
            items.push({
                invoice_id: invoice.id,
                description: quote.introduction || "Quote Conversion", // Use introduction or notes as description?
                quantity: 1,
                unit_price: quote.total_price,
                amount: quote.total_price
            });
        }

        if (items.length > 0) {
            await supabase.from('invoice_items').insert(items);
        }

        // 4. Update Quote Status
        await supabase.from('quotes').update({ status: 'invoiced' }).eq('id', id);

        res.json({ success: true, invoice });

    } catch (err) {
        console.error('Error converting quote:', err);
        res.status(500).json({ error: 'Failed to convert quote' });
    }
};
// Delete Quote
export const deleteQuote = async (req, res) => {
    console.log(`[DELETE QUOTE] Request received for ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        console.log(`[DELETE QUOTE] Agency: ${req.user.agency_id}, Quote ID: ${id}`);

        const { error, count } = await supabase
            .from('quotes')
            .delete({ count: 'exact' }) // Request count
            .eq('id', id)
            .eq('agency_id', req.user.agency_id);

        if (error) throw error;

        console.log(`[DELETE QUOTE] Deleted rows: ${count}`);

        res.json({ success: true, message: 'Quote deleted', count });
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({ error: 'Failed to delete quote' });
    }
};
