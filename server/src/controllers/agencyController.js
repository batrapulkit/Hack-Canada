// server/src/controllers/agencyController.js
import { supabase } from "../config/supabase.js";

// Get agency details
export const getAgency = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", req.user.agency_id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      agency: data
    });
  } catch (error) {
    console.error("Error fetching agency:", error);
    res.status(500).json({
      error: "Failed to fetch agency details",
      details: error.message
    });
  }
};

// Update agency
export const updateAgency = async (req, res) => {
  try {
    const updates = req.body;

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from("agencies")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.user.agency_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      agency: data,
      message: "Agency updated successfully"
    });
  } catch (error) {
    console.error("Error updating agency:", error);
    res.status(500).json({
      error: "Failed to update agency",
      details: error.message
    });
  }
};

// Upload branding asset (logo or letterhead)
export const uploadBrandingAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { type } = req.body; // 'logo' or 'letterhead'
    const agencyId = req.user.agency_id;
    const file = req.file;
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${type}-${agencyId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase storage
    // Using 'agency-logos' bucket for both for now, or could create 'branding-assets'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("agency-logos")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicURL } = supabase.storage
      .from("agency-logos")
      .getPublicUrl(fileName);

    const finalUrl = publicURL.publicUrl;

    // Update DB based on type
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (type === 'logo') {
      updates.logo_url = finalUrl;
    } else if (type === 'letterhead') {
      // Need to fetch current invoice_settings first to merge? 
      // Or just use jsonb_set logic if possible. 
      // For simplicity, let's fetch, merge, update.
      const { data: currentAgency } = await supabase
        .from('agencies')
        .select('invoice_settings')
        .eq('id', agencyId)
        .single();

      const currentSettings = currentAgency?.invoice_settings || {};
      updates.invoice_settings = {
        ...currentSettings,
        backgroundImageUrl: finalUrl
      };
    } else {
      return res.status(400).json({ error: "Invalid asset type" });
    }

    const { data: updatedAgency, error: updateError } = await supabase
      .from("agencies")
      .update(updates)
      .eq("id", agencyId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `${type} uploaded successfully`,
      url: finalUrl,
      agency: updatedAgency
    });
  } catch (error) {
    console.error("Error uploading asset:", error);
    res.status(500).json({
      error: "Failed to upload asset",
      details: error.message
    });
  }
};

// Get agency stats
export const getAgencyStats = async (req, res) => {
  try {
    const agencyId = req.user.agency_id;

    const [clients, itineraries, leads, bookings, users] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact" }).eq("agency_id", agencyId),
      supabase.from("itineraries").select("id", { count: "exact" }).eq("agency_id", agencyId),
      supabase.from("leads").select("id", { count: "exact" }).eq("agency_id", agencyId),
      supabase.from("bookings").select("id", { count: "exact" }).eq("agency_id", agencyId),
      supabase.from("users").select("id", { count: "exact" }).eq("agency_id", agencyId)
    ]);

    res.json({
      success: true,
      stats: {
        clients: clients.count || 0,
        itineraries: itineraries.count || 0,
        leads: leads.count || 0,
        bookings: bookings.count || 0,
        team_members: users.count || 0
      }
    });
  } catch (error) {
    console.error("Error fetching agency stats:", error);
    res.status(500).json({
      error: "Failed to fetch agency statistics",
      details: error.message
    });
  }
};

// Get agency team members
export const getTeamMembers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, status, created_at")
      .eq("agency_id", req.user.agency_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      team_members: data || []
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({
      error: "Failed to fetch team members",
      details: error.message
    });
  }
};
