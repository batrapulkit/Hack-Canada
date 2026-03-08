import { supabase } from "../config/supabase.js";

// ===========================
// GET ALL SUPPLIERS
// ===========================
export const getSuppliers = async (req, res) => {
    try {
        const { limit, sort } = req.query;

        let query = supabase
            .from("suppliers")
            .select("*")
            .eq("agency_id", req.user.agency_id);

        if (sort) {
            // sort format might be '-created_date' or 'created_date'
            const ascending = !sort.startsWith('-');
            const column = sort.replace('-', '');
            query = query.order(column, { ascending });
        } else {
            query = query.order("created_at", { ascending: false });
        }

        if (limit) {
            const n = parseInt(limit, 10);
            if (!isNaN(n)) query = query.limit(n);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, suppliers: data });
    } catch (err) {
        console.error("Get suppliers error:", err);
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
};

// ===========================
// CREATE SUPPLIER
// ===========================
export const createSupplier = async (req, res) => {
    try {
        const { name, type, email, region, website_url, logo_url, is_active, api_config } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Supplier name is required" });
        }

        // Check if supplier already exists
        const { data: existing } = await supabase
            .from("suppliers")
            .select("id")
            .eq("agency_id", req.user.agency_id)
            .ilike("name", name) // Case-insensitive check
            .single();

        const payload = {
            name,
            type: type || 'Other',
            email: email || null,
            region: region || null,
            website_url: website_url || null,
            logo_url: logo_url || null,
            is_active: is_active !== undefined ? is_active : true,
            api_config: api_config || {},
            agency_id: req.user.agency_id,
            updated_at: new Date().toISOString()
        };

        let data, error;

        if (existing) {
            // Update existing supplier
            const result = await supabase
                .from("suppliers")
                .update(payload)
                .eq("id", existing.id)
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Create new supplier
            payload.created_at = new Date().toISOString();
            const result = await supabase
                .from("suppliers")
                .insert(payload)
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        res.json({ success: true, supplier: data });
    } catch (err) {
        console.error("Create/Update supplier error:", err);
        res.status(500).json({ error: "Failed to save supplier" });
    }
};

// ===========================
// UPDATE SUPPLIER
// ===========================
export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("suppliers")
            .update(updates)
            .eq("id", id)
            .eq("agency_id", req.user.agency_id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, supplier: data });
    } catch (err) {
        console.error("Update supplier error:", err);
        res.status(500).json({ error: "Failed to update supplier" });
    }
};

// ===========================
// DELETE SUPPLIER
// ===========================
export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("suppliers")
            .delete()
            .eq("id", id)
            .eq("agency_id", req.user.agency_id);

        if (error) throw error;

        res.json({ success: true, message: "Supplier deleted" });
    } catch (err) {
        console.error("Delete supplier error:", err);
        res.status(500).json({ error: "Failed to delete supplier" });
    }
};
