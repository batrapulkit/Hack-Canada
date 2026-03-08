// server/src/controllers/leadController.js
import { supabase } from '../config/supabase.js';
import { genAI } from '../config/gemini.js';
import { emitEvent, EVENTS } from '../services/automationEngine.js';
import { validateTransition } from '../services/stateMachine.js';

// Create new lead
export const createLead = async (req, res) => {
  try {
    const {
      name,
      full_name,
      email,
      phone,
      company,
      source,
      destination,
      budget,
      budget_range,
      travelers,
      travel_date,
      travel_dates,
      trip_type,
      notes,
      priority,
      assigned_to,
      status
    } = req.body;

    const leadName = full_name || name;
    if (!leadName) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Match actual database schema
    const leadData = {
      full_name: leadName,
      email: email || null,
      phone: phone || null,
      source: source || 'manual',
      destination: destination || null,
      budget: budget ? parseFloat(budget) : null,
      currency: req.body.currency || 'USD',
      travelers: travelers ? parseInt(travelers) : 1,
      travel_dates: travel_dates || travel_date || null,
      notes: notes || null,
      assigned_to: assigned_to || req.user.id,
      created_by: req.user.id,
      agency_id: req.user.agency_id,
      status: status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      lead: data,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead', details: error.message });
  }
};

// Get all leads
export const getLeads = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;

    let query = supabase
      .from('leads')
      .select('*')
      .eq('agency_id', req.user.agency_id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, leads: data || [] });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads', details: error.message });
  }
};

// Get single lead
export const getLead = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (error) throw error;

    if (!data) return res.status(404).json({ error: 'Lead not found' });

    res.json({ success: true, lead: data });

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead', details: error.message });
  }
};

// Update lead
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 1. Get current state for validation
    const { data: current, error: fetchError } = await supabase
      .from('leads')
      .select('status, agency_id, id')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Validate Transition (if status is changing)
    if (updates.status && updates.status !== current.status) {
      try {
        validateTransition('LEAD', current.status, updates.status);
      } catch (validationErr) {
        return res.status(400).json({ error: validationErr.message });
      }
    }

    delete updates.id;
    delete updates.agency_id;
    delete updates.created_at;
    delete updates.created_by;
    // Keep workflow_status sync if passed, or just rely on 'status' mapping
    // If status is updated to 'qualified', we might want to trigger automation

    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .select()
      .single();

    if (error) throw error;

    // 3. Emit Automation Events
    if (updates.status && updates.status !== current.status) {
      if (updates.status === 'qualified') {
        await emitEvent(EVENTS.LEAD.QUALIFIED, {
          agency_id: req.user.agency_id,
          id: id,
          lead_id: id,
          message: 'Lead status changed to Qualified'
        });
      }

      // Generic status change event
      await emitEvent(`LEAD_STATUS_${updates.status.toUpperCase()}`, {
        agency_id: req.user.agency_id,
        id: id,
        lead_id: id,
        message: `Status updated to ${updates.status}`
      });
    }

    res.json({ success: true, lead: data, message: 'Lead updated successfully' });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead', details: error.message });
  }
};

// Delete lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('agency_id', req.user.agency_id);

    if (error) throw error;

    res.json({ success: true, message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead', details: error.message });
  }
};

// Lead statistics
export const getLeadStats = async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, priority, created_at')
      .eq('agency_id', req.user.agency_id);

    if (error) throw error;

    const stats = {
      total: leads.length,
      by_status: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        proposal: leads.filter(l => l.status === 'proposal').length,
        won: leads.filter(l => l.status === 'won').length,
        lost: leads.filter(l => l.status === 'lost').length
      },
      by_priority: {
        low: leads.filter(l => l.priority === 'low').length,
        medium: leads.filter(l => l.priority === 'medium').length,
        high: leads.filter(l => l.priority === 'high').length
      }
    };

    const totalProcessed = stats.by_status.won + stats.by_status.lost;
    stats.conversion_rate = totalProcessed > 0
      ? ((stats.by_status.won / totalProcessed) * 100).toFixed(2)
      : 0;

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch lead statistics', details: error.message });
  }
};

// AI qualification
export const qualifyLead = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (fetchError) throw fetchError;

    const prompt = `
      Analyze this travel lead and provide qualification insights:

      Lead Details:
      Name: ${lead.name}
      Destination: ${lead.destination || 'Not specified'}
      Budget: ${lead.budget_range || 'Not specified'}
      Travel Date: ${lead.travel_date || 'Not specified'}
      Notes: ${lead.notes || 'None'}

      Provide:
      1. Lead Quality Score (1-10)
      2. Qualification Status
      3. Strengths
      4. Concerns
      5. Next Steps
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const qualification = response.text();

    res.json({ success: true, qualification });

  } catch (error) {
    console.error('Error qualifying lead:', error);
    res.status(500).json({ error: 'Failed to qualify lead', details: error.message });
  }
};

// Follow-up suggestions
export const getFollowUpSuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('agency_id', req.user.agency_id)
      .single();

    if (error) throw error;

    const prompt = `
      Create follow-up suggestions for this travel lead:
      Name: ${lead.name}
      Status: ${lead.status}
      Destination: ${lead.destination}

      Provide subject lines, talking points, value props, questions, and timing.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    res.json({ success: true, suggestions });

  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions', details: error.message });
  }
};

// Convert lead → client
export const convertLeadToClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("agency_id", req.user.agency_id)
      .single();

    if (fetchError) throw fetchError;
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert([
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          destination: lead.destination,
          budget_range: lead.budget_range,
          travel_date: lead.travel_date,
          notes: lead.notes,
          agency_id: req.user.agency_id,
          created_by: req.user.id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (clientError) throw clientError;

    await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("agency_id", req.user.agency_id);

    res.json({ success: true, message: "Lead converted to client", client });

  } catch (error) {
    console.error("Error converting lead:", error);
    res.status(500).json({ error: "Failed to convert lead", details: error.message });
  }
};

// AI score endpoint
export const getLeadAIScore = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("agency_id", req.user.agency_id)
      .single();

    if (error) throw error;

    const prompt = `
      Score this travel lead from 1 to 10:

      - Name: ${lead.name}
      - Destination: ${lead.destination}
      - Budget: ${lead.budget_range}
      - Notes: ${lead.notes}

      Respond ONLY with a number 1 to 10.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const output = result.response.text().trim();

    const score = parseInt(output.match(/\d+/)?.[0] || 5);

    res.json({ success: true, score });

  } catch (error) {
    console.error("AI score error:", error);
    res.status(500).json({ error: "Failed to generate AI score", details: error.message });
  }
};
