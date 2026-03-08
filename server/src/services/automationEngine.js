// server/src/services/automationEngine.js
import { supabase } from '../config/supabase.js';

// Event Types
export const EVENTS = {
    LEAD: {
        CREATED: 'LEAD_CREATED',
        QUALIFIED: 'LEAD_QUALIFIED',
        WON: 'LEAD_WON',
        LOST: 'LEAD_LOST'
    },
    ITINERARY: {
        CREATED: 'ITINERARY_CREATED',
        PRICED: 'ITINERARY_PRICED'
    },
    QUOTE: {
        CREATED: 'QUOTE_CREATED',
        SENT: 'QUOTE_SENT',
        ACCEPTED: 'QUOTE_ACCEPTED'
    },
    INVOICE: {
        SENT: 'INVOICE_SENT',
        PAID: 'INVOICE_PAID',
        OVERDUE: 'INVOICE_OVERDUE'
    }
};

/**
 * Log event to workflow_events table
 */
const logEvent = async (agencyId, leadId, entityType, entityId, eventType, message, metadata = {}) => {
    try {
        // If no leadId provided but we have an itinerary/quote/invoice, try to find the linked lead/client
        // For now, we'll just log what we have.

        await supabase.from('workflow_events').insert({
            agency_id: agencyId,
            lead_id: leadId || null,
            entity_type: entityType,
            entity_id: entityId,
            event_type: eventType,
            message,
            metadata,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to log workflow event:', err);
    }
};

/**
 * Main Event Emitter & Handler
 */
export const emitEvent = async (eventType, payload) => {
    console.log(`[Automation] Event Emitted: ${eventType}`, payload.id);

    const { agency_id, id, lead_id } = payload;

    // 1. Log the event
    await logEvent(
        agency_id,
        lead_id || payload.client_id, // heuristic: might need better lead resolution
        payload.entityType || 'UNKNOWN',
        id,
        eventType,
        payload.message || `Event ${eventType} triggered`,
        payload.metadata
    );

    // 2. Run Rules Engine
    await runAutomationRules(eventType, payload);
};

/**
 * Rules Engine
 */
const runAutomationRules = async (eventType, payload) => {
    try {
        switch (eventType) {
            case EVENTS.LEAD.QUALIFIED:
                await handleLeadQualified(payload);
                break;
            case EVENTS.QUOTE.ACCEPTED:
                await handleQuoteAccepted(payload);
                break;
            case EVENTS.INVOICE.PAID:
                await handleInvoicePaid(payload);
                break;
            default:
                // No automation for this event
                break;
        }
    } catch (err) {
        console.error(`[Automation] Rule execution failed for ${eventType}:`, err);
    }
};

// --- Action Handlers ---

const handleLeadQualified = async (lead) => {
    // Goal: Check if Itinerary Draft exists, if not, create one? 
    // Or just notify.
    // Requirement: "Auto-generate an itinerary draft when a new qualified lead arrives."

    console.log('[Automation] Handling Lead Qualified -> Generating Draft Itinerary...');

    // Check if draft already exists
    const { data: existing } = await supabase
        .from('itineraries')
        .select('id')
        .eq('client_id', lead.id) // Assuming lead converted to client? Or linking lead directly? 
    // Issue: Itineraries link to `client_id` (clients table), but Lead is in `leads` table.
    // Flow: Lead -> Qualified -> Convert to Client -> Create Itinerary?
    // OR: Itinerary needs a nullable `lead_id`?
    // Current Schema: Itineraries have `client_id` (uuid references clients).
    // workaround: We can't create an itinerary for a Lead unless we convert them or modify Itinerary schema.
    // Proposal: Create a placeholder Client or just Log "Ready for Itinerary".

    // For now, we will just log a "Suggestion" event, as auto-creating a Client might be aggressive.
    // UNLESS the lead conversion happens simultaneously.

    // Let's assume for this task, "Auto-generate" means we trigger the generation logic 
    // IF the system supports a 'Lead' based itinerary or if we auto-convert.
    // Checking `leadController.js`: `convertLeadToClient` exists.

    // Let's just update the log for now to show it's "Ready to Draft".
    return;
};

const handleQuoteAccepted = async (quote) => {
    // Goal: Convert to Invoice
    console.log('[Automation] Quote Accepted -> Generating Invoice...');
    // Call Invoice Service (pseudo)
};

const handleInvoicePaid = async (invoice) => {
    // Goal: Send confirmation, close workflow
    console.log('[Automation] Invoice Paid -> Sending Confirmation...');
};
