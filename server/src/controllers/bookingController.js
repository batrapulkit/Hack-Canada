import { supabase } from "../config/supabase.js";

// ===========================
// GET BOOKINGS
// ===========================
export const getBookings = async (req, res) => {
    try {
        const { itineraryId, clientId, supplierId } = req.query;

        let query = supabase
            .from("bookings")
            .select(`
                *,
                supplier:suppliers(id, name, type),
                client:clients(id, full_name),
                itinerary:itineraries(id, destination)
            `)
            .eq("agency_id", req.user.agency_id)
            .order("booking_date", { ascending: false });

        if (itineraryId) query = query.eq("itinerary_id", itineraryId);
        if (clientId) query = query.eq("client_id", clientId);
        if (supplierId) query = query.eq("supplier_id", supplierId);

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, bookings: data });
    } catch (err) {
        console.error("Get bookings error:", err);
        try {
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const logPath = path.join(__dirname, '../../debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] [Booking Error] ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`);
        } catch (e) { console.error("Log fail", e); }
        res.status(500).json({ error: "Failed to fetch bookings", details: err.message });
    }
};

// ===========================
// CREATE BOOKING
// ===========================
export const createBooking = async (req, res) => {
    try {
        const {
            client_id,
            itinerary_id,
            supplier_id,
            booking_type,
            booking_status,
            confirmation_number,
            travel_date,
            description,
            cost,
            sell_price,
            commission,
            metadata
        } = req.body;

        const { data, error } = await supabase
            .from("bookings")
            .insert({
                agency_id: req.user.agency_id,
                client_id,
                itinerary_id,
                supplier_id,
                booking_type,
                booking_status: booking_status || 'pending',
                confirmation_number,
                travel_date: travel_date || null,
                description,
                cost: cost || 0,
                sell_price: sell_price || 0,
                commission: commission || 0,
                metadata: metadata || {},
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, booking: data });
    } catch (err) {
        console.error("Create booking error:", err);
        res.status(500).json({ error: "Failed to create booking" });
    }
};

// ===========================
// UPDATE BOOKING
// ===========================
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        updates.updated_at = new Date().toISOString();
        delete updates.id;
        delete updates.agency_id;
        delete updates.created_by;
        delete updates.created_at;

        const { data, error } = await supabase
            .from("bookings")
            .update(updates)
            .eq("id", id)
            .eq("agency_id", req.user.agency_id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, booking: data });
    } catch (err) {
        console.error("Update booking error:", err);
        res.status(500).json({ error: "Failed to update booking" });
    }
};

// ===========================
// DELETE BOOKING
// ===========================
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("bookings")
            .delete()
            .eq("id", id)
            .eq("agency_id", req.user.agency_id);

        if (error) throw error;

        res.json({ success: true, message: "Booking deleted" });
    } catch (err) {
        console.error("Delete booking error:", err);
        res.status(500).json({ error: "Failed to delete booking" });
    }
};
