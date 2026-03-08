// server/src/controllers/analyticsController.js
import { supabase } from '../config/supabase.js';

export const getProfitabilityStats = async (req, res) => {
    try {
        const { timeRange } = req.query; // 'month', 'year', 'all'
        const agencyId = req.user.agency_id;

        // 1. Fetch Invoices (Revenue)
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('total, subtotal, status, created_at, invoice_items(*)')
            .eq('agency_id', agencyId)
            .neq('status', 'void'); // Count drafted? maybe only paid/sent.
        // Usually "Revenue" = Paid Invoices
        // "Projected Revenue" = Sent/Draft

        if (invError) throw invError;

        // 2. Fetch Itinerary Items (Costs)
        // We need to link invoices to itineraries to get costs accurately,
        // OR just fetch all itinerary items for the period.
        // Ideally: Profit = Invoice Total - Itinerary Cost

        // Simplification for Dashboard:
        // Fetch all *confirmed* itinerary items (booked/confirmed) within range
        const { data: costItems, error: costError } = await supabase
            .from('itinerary_items')
            .select('cost_price, final_price, status, created_at')
            .eq('agency_id', agencyId);

        if (costError) throw costError;

        // 3. Aggregate Data
        let totalRevenue = 0;
        let totalCost = 0;

        // Filter by time range if needed (omitted for MVP simplicity - returning all-time)

        const paidInvoices = invoices.filter(i => i.status === 'paid');
        totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        // Estimate Cost from Itinerary Items associated with revenue
        // This is tricky without strict linking.
        // Approximate: Sum of cost_price of all items
        totalCost = costItems.reduce((sum, item) => sum + (parseFloat(item.cost_price) || 0), 0);

        const grossProfit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

        // Weekly Trends (Placeholder)
        const trends = {
            weekly: [],
            labels: []
        };

        // Top Suppliers (Placeholder)
        const topSuppliers = [];

        res.json({
            success: true,
            stats: {
                totalRevenue,
                totalCost,
                grossProfit,
                margin: `${margin}%`,
                trends,
                topSuppliers
            }
        });

    } catch (err) {
        console.error('SERVER ERROR in getProfitabilityStats:', err);
        res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
    }
};
