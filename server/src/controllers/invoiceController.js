import { supabase } from '../config/supabase.js';
import { getNextInvoiceNumber } from '../utils/invoiceNumberGenerator.js';

export async function getInvoices(req, res) {
  try {
    const { clientId, itineraryId } = req.query;

    // --- ADOPT ORPHANED INVOICES ---
    try {
      await supabase
        .from("invoices")
        .update({ agency_id: req.user.agency_id })
        .eq("created_by", req.user.id)
        .is("agency_id", null);
    } catch (err) {
      console.error("Invoice adoption error:", err);
    }
    // -------------------------------

    let query = supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('agency_id', req.user.agency_id)
      .order('created_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);
    if (itineraryId) query = query.eq('itinerary_id', itineraryId);

    const { data, error } = await query;

    if (error) throw error;

    // Manual join for clients and itineraries
    const enriched = await Promise.all((data || []).map(async (invoice) => {
      let client = null;
      let itinerary = null;

      if (invoice.client_id) {
        const { data: c } = await supabase
          .from('clients')
          .select('id, full_name, email')
          .eq('id', invoice.client_id)
          .single();
        client = c;
      }

      if (invoice.itinerary_id) {
        const { data: i } = await supabase
          .from('itineraries')
          .select('id, destination')
          .eq('id', invoice.itinerary_id)
          .single();
        itinerary = i;
      }

      return { ...invoice, client, itinerary };
    }));

    res.json({ success: true, invoices: enriched });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugLogPath = path.join(__dirname, '../../debug.log');

export const createInvoice = async (req, res) => {
  try {
    const logMsg = `\n[INVOICE DEBUG] Payload: ${JSON.stringify(req.body)}\n[INVOICE DEBUG] User: ${JSON.stringify(req.user)}\n`;
    try { fs.appendFileSync(debugLogPath, logMsg); } catch (e) { console.error("Log failed", e); }

    console.log("[CreateInvoice] Payload:", JSON.stringify(req.body));
    console.log("[CreateInvoice] User:", JSON.stringify(req.user)); // Check if user/agency_id exists

    const {
      client_id,
      itinerary_id,
      items,
      notes,
      due_date,
      issue_date,
      currency,
      status, // Allow status override
      created_at // Allow created_at override
    } = req.body;

    if (!client_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Client and at least one item are required' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax_total = 0; // Implement tax logic if needed
    const total = subtotal + tax_total;

    // Get next sequential invoice number
    const invoiceNumber = await getNextInvoiceNumber(req.user.agency_id);

    // 1. Create Invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        agency_id: req.user.agency_id,
        client_id,
        itinerary_id,
        invoice_number: invoiceNumber,
        status: status || 'draft',
        issue_date: issue_date || new Date().toISOString(),
        due_date,
        currency: currency || 'USD',
        subtotal,
        tax_total,
        total,
        amount_paid: status === 'paid' ? total : 0, // Auto-fill amount_paid if paid
        notes,
        created_by: req.user.id,
        created_at: created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (invError) throw invError;

    // 2. Create Invoice Items
    const invoiceItems = items.map(item => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      booking_id: item.booking_id || null
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback invoice creation if items fail (manual rollback since no transactions in simple REST)
      await supabase.from('invoices').delete().eq('id', invoice.id);
      throw itemsError;
    }

    res.status(201).json({ success: true, invoice: { ...invoice, invoice_items: invoiceItems } });
  } catch (error) {
    console.error('Error in createInvoice:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message, hint: error.hint });
  }
};

export async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { items, ...updates } = req.body;

    // Update Invoice fields
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .eq('agency_id', req.user.agency_id);
      if (error) throw error;
    }

    // Update Items if provided
    if (items) {
      // Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      // Insert new items
      const invoiceItems = items.map(item => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        booking_id: item.booking_id || null
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Recalculate totals
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      await supabase
        .from('invoices')
        .update({
          subtotal,
          total: subtotal // + tax 
        })
        .eq('id', id);
    }

    // Fetch updated invoice
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, invoice: data });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
}

export async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('agency_id', req.user.agency_id);

    if (error) throw error;
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
}

export async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch Invoice + Items
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (error) throw error;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // 2. Manual Joins
    let client = null;
    let itinerary = null;

    // Fetch Client
    if (invoice.client_id) {
      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', invoice.client_id)
        .single();
      client = c;
    }

    // Fetch Itinerary
    if (invoice.itinerary_id) {
      const { data: i } = await supabase
        .from('itineraries')
        .select('*') // Fetch full itinerary to display destination in invoice
        .eq('id', invoice.itinerary_id)
        .single();
      itinerary = i;
    }

    // 3. Return enriched result
    res.json({ success: true, invoice: { ...invoice, client, itinerary } });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

export async function createPaymentLink(req, res) {
  try {
    const { id } = req.params;

    // 1. Get Invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_number, total, currency')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // 2. Mock Stripe Link (or real if env keys exist)
    // For MVP/Demo:
    const mockLink = `https://pay.triponic.com/${invoice.invoice_number}?amt=${invoice.total}&cur=${invoice.currency}`;

    return res.json({ success: true, url: mockLink });

  } catch (err) {
    console.error('Create payment link error:', err);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
}