// server/src/controllers/clientController.js
import { supabase } from "../config/supabase.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../../debug.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [CLIENTS] ${message}\n`;
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

/*
  Notes:
  - Frontend expects `client.name` in some places. DB uses `full_name`.
    We return both `full_name` and an alias `name` so frontend works without changes.
  - getClientStats returns the nested `stats` object Dashboard expects:
      stats.clients.total, stats.clients.active, stats.clients.new_this_month
    plus lightweight placeholders for itineraries/revenue/bookings so the Dashboard code
    can read the expected structure.
*/

// ===========================
// Helper: map db client -> frontend shape
// ===========================
function mapClientRecord(rec) {
  if (!rec) return rec;
  return {
    ...rec,
    name: rec.name || rec.full_name || null, // alias for legacy frontend
    full_name: rec.full_name || rec.name || null,
  };
}

// ===========================
// GET ALL CLIENTS
// ===========================
export const getClients = async (req, res) => {
  try {
    const { limit, q } = req.query;
    logToFile(`[GetClients] Request from User: ${req.user?.id}, Agency: ${req.user?.agency_id}`);

    if (!req.user?.agency_id) {
      logToFile("[GetClients] Error: Missing agency_id in request user");
      return res.status(400).json({ error: "User has no agency assigned" });
    }

    // --- ADOPT ORPHANED CLIENTS ---
    // If this user created clients before having an agency_id, assign them now.
    try {
      const { error: adoptError } = await supabase
        .from("clients")
        .update({ agency_id: req.user.agency_id })
        .eq("created_by", req.user.id)
        .is("agency_id", null);

      if (adoptError) {
        logToFile(`[GetClients] Client adoption failed: ${adoptError.message}`);
      } else {
        logToFile(`[GetClients] Orphaned clients adopted to agency ${req.user.agency_id}`);
      }
    } catch (adoptErr) {
      logToFile(`[GetClients] Client adoption error: ${adoptErr.message}`);
    }
    // -----------------------------

    let query = supabase
      .from("clients")
      .select("*")
      .eq("agency_id", req.user.agency_id)
      .order("created_at", { ascending: false });

    if (limit) {
      const n = parseInt(limit, 10);
      if (!isNaN(n)) query = query.limit(n);
    }

    if (q) {
      // basic search by full_name or email
      query = query.ilike("full_name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      logToFile(`[GetClients] DB Error: ${error.message}`);
      throw error;
    }

    logToFile(`[GetClients] Success. Found ${data?.length || 0} records.`);

    // Map each record to include `name` alias
    const clients = (data || []).map(mapClientRecord);

    res.json({ success: true, clients });
  } catch (err) {
    logToFile(`[GetClients] Exception: ${err.message}`);
    console.error("Get clients error:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
};

// ===========================
// GET SINGLE CLIENT
// ===========================
export const getClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("clients")
      .select("*, itineraries(*), invoices(*)") // helpful embedding if relationships exist
      .eq("id", id)
      .eq("agency_id", req.user.agency_id)
      .single();

    if (error) throw error;

    res.json({ success: true, client: mapClientRecord(data) });
  } catch (err) {
    console.error("Get client error:", err);
    res.status(500).json({ error: "Failed to fetch client" });
  }
};

// ===========================
// CREATE CLIENT
// ===========================
export const createClient = async (req, res) => {
  try {
    let {
      full_name,
      name,
      email,
      phone,
      interests,
      budget_range,
      notes,
      passport_number,
      date_of_birth,
      nationality,
      address,
      vip_status
    } = req.body;

    // accept both "full_name" and "name" from frontend
    full_name = full_name || name;

    if (!full_name) {
      return res.status(400).json({ error: "Client name is required" });
    }

    // Auto-generate email if missing (to satisfy potential DB NOT NULL or UNIQUE constraints)
    // and to allow "optional" email on frontend.
    let finalEmail = email;
    if (!finalEmail) {
      const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      finalEmail = `no-email-${uniqueSuffix}@triponic.local`;
    }

    const payload = {
      full_name,
      email: finalEmail,
      phone: phone || null,
      passport_number: passport_number || null,
      date_of_birth: date_of_birth || null,
      nationality: nationality || null,
      address: address || null,
      interests: interests || [],
      budget_range: budget_range || null,
      notes: notes || null,
      vip_status: vip_status === true || vip_status === "true" ? true : false,
      created_by: req.user.id,
      agency_id: req.user.agency_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, client: mapClientRecord(data) });
  } catch (err) {
    console.error("Create client error:", err);
    // Return a helpful message for the frontend
    res.status(500).json({ error: "Failed to create client", details: err.message });
  }
};

// ===========================
// BULK CREATE CLIENTS
// ===========================
export const createBulkClients = async (req, res) => {
  try {
    const { clients } = req.body;

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: "No clients provided for import" });
    }

    const payloads = clients.map(c => ({
      full_name: c.name || c.full_name, // Map frontend 'name' to DB 'full_name'
      email: c.email || null,
      phone: c.phone || null,
      notes: c.notes || null,
      // Default fields
      created_by: req.user.id,
      agency_id: req.user.agency_id,
      created_at: new Date().toISOString()
    })).filter(p => p.full_name); // Ensure name exists

    if (payloads.length === 0) {
      return res.status(400).json({ error: "No valid clients found (name is required)" });
    }

    const { data, error } = await supabase
      .from("clients")
      .insert(payloads)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Successfully imported ${data.length} clients`,
      count: data.length
    });
  } catch (err) {
    console.error("Bulk create client error:", err);
    res.status(500).json({ error: "Failed to import clients", details: err.message });
  }
};

// ===========================
// UPDATE CLIENT
// ===========================
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    if (updates.name && !updates.full_name) {
      updates.full_name = updates.name;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .eq("agency_id", req.user.agency_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, client: mapClientRecord(data) });
  } catch (err) {
    console.error("Update client error:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
};

// ===========================
// DELETE CLIENT
// ===========================
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("agency_id", req.user.agency_id);

    if (error) throw error;

    res.json({ success: true, message: "Client deleted" });
  } catch (err) {
    console.error("Delete client error:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
};

// ===========================
// CLIENT STATS (for Dashboard)
// ===========================
export const getClientStats = async (req, res) => {
  try {
    // total clients
    const { data: allClients, error: allErr } = await supabase
      .from("clients")
      .select("id, vip_status, created_at")
      .eq("agency_id", req.user.agency_id);

    if (allErr) throw allErr;

    const total = (allClients || []).length;
    const active = (allClients || []).filter((c) => c.vip_status === true).length;

    // new_this_month: created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = (allClients || []).filter(c => {
      if (!c.created_at) return false;
      const created = new Date(c.created_at);
      return created >= thirtyDaysAgo;
    }).length;

    // AI Stats
    const { count: aiCount, error: aiError } = await supabase
      .from("ai_conversations")
      .select("*", { count: 'exact', head: true })
      .eq("agency_id", req.user.agency_id);

    // Basic placeholders for other dashboard counts (keeps UI stable)
    const stats = {
      clients: {
        total,
        active,
        new_this_month: newThisMonth
      },
      ai: {
        total: aiCount || 0
      },
      itineraries: { total: 0, draft: 0, confirmed: 0 },
      revenue: { total: 0, this_month: 0 },
      bookings: { total: 0, pending: 0 }
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error("Client stats error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};
