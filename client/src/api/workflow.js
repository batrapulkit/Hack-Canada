import api from './client';

// Workflow & Automation
export const fetchWorkflowEvents = async (leadId) => {
    try {
        // Assuming workflow_events is exposed via a custom endpoint or Supabase directly. 
        // If we want to use the backend API:
        // return api.get(`/workflow/events/${leadId}`).then(res => res.data);

        // HOWEVER, the original code used Supabase client directly.
        // If the backend has a route for this, we use it. 
        // If it was direct DB access, we should probably keep it OR move it to backend.
        // Looking at server routes, there is NO specific 'workflow' route file, BUT 'leads' might have it?
        // Or we stick to Supabase for reading events if RLS allows it.
        // Original code: supabase.from('workflow_events')...
        // Let's keep the Supabase direct read for events IF it works, BUT usually mixing is bad.
        // Actually, the error was in fetchProfitability which fetches from /api/analytics.
        // Let's fix the API calls first.

        // Original Code for fetchWorkflowEvents was Supabase direct.
        // Let's LEAVE fetchWorkflowEvents as Supabase direct for now if it works, 
        // OR better, move it to use the new `authentication` properly.
        // But to be safe and fix the reported error, I will focus on the API calls.

        // RE-READING ORIGINAL CODE:
        // fetchWorkflowEvents used supabase.from...
        // The others used fetch('/api/...')

        // Use the original supabase import for the direct DB call
        const { supabase } = await import('@/config/supabase');
        const { data, error } = await supabase
            .from('workflow_events')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error fetching workflow events", err);
        return [];
    }
};

// Quotes
export const createQuote = async (itineraryId) => {
    const res = await api.post('/quotes', { itinerary_id: itineraryId });
    return res.data;
};

export const convertQuoteToInvoice = async (quoteId) => {
    const res = await api.post(`/quotes/${quoteId}/convert`);
    return res.data;
};

// Analytics
export const fetchProfitability = async (timeRange = 'all') => {
    // This was the failing one
    const res = await api.get(`/analytics/profitability?timeRange=${timeRange}`);
    return res.data;
};

// Itinerary Items
export const addItineraryItem = async (itineraryId, itemData) => {
    const res = await api.post(`/itineraries/${itineraryId}/items`, itemData);
    return res.data;
};

export const updateItineraryItem = async (itemId, updates) => {
    const res = await api.patch(`/itineraries/items/${itemId}`, updates);
    return res.data;
};

export const deleteItineraryItem = async (itemId) => {
    const res = await api.delete(`/itineraries/items/${itemId}`);
    return res.data;
};

