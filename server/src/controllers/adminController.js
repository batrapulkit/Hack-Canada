import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../services/emailService.js';
import { getMassEmailTemplate } from '../utils/emailTemplates.js';

// =========================
// GET DASHBOARD STATS
// =========================
export const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Agencies
        const { count: agencyCount, error: agencyError } = await supabase
            .from('agencies')
            .select('*', { count: 'exact', head: true });

        if (agencyError) throw agencyError;

        // 2. Total Itineraries
        const { count: itineraryCount, error: itinError } = await supabase
            .from('itineraries')
            .select('*', { count: 'exact', head: true });

        if (itinError) throw itinError;

        // 3. Total Bookings
        const { count: bookingCount, error: bookingError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (bookingError) throw bookingError;

        // 4. Total Users
        const { count: userCount, error: userError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // 5. Recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: newAgencies, error: newAgencyError } = await supabase
            .from('agencies')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (newAgencyError) throw newAgencyError;

        // 6. Revenue Calculation (MRR)
        // Pricing Logic: Starter ($0), Plus ($49), Pro ($99)
        const PRICING = {
            'agency_starter': 0,
            'agency_plus': 49,
            'agency_pro': 99
        };

        const { data: allAgencies, error: revenueError } = await supabase
            .from('agencies')
            .select('subscription_plan, subscription_status');

        if (revenueError) throw revenueError;

        let mrr = 0;
        const planCounts = {
            'agency_starter': 0,
            'agency_plus': 0,
            'agency_pro': 0
        };
        let activeSubscriptions = 0;

        allAgencies.forEach(a => {
            // Normalize plan name (handle potential nulls or mismatches)
            const plan = a.subscription_plan || 'agency_starter';

            // Count plans regardless of status (for breakdown)
            planCounts[plan] = (planCounts[plan] || 0) + 1;

            // Calculate Revenue only for Active or Trialing (usually)
            // Assuming 'active' is the status for paid.
            if (a.subscription_status === 'active') {
                const price = PRICING[plan] || 0;
                mrr += price;
                if (price > 0) activeSubscriptions++;
            }
        });

        return res.json({
            success: true,
            stats: {
                totalAgencies: agencyCount || 0,
                totalItineraries: itineraryCount || 0,
                totalBookings: bookingCount || 0,
                totalUsers: userCount || 0,
                newAgenciesLast30Days: newAgencies || 0,
                revenue: {
                    mrr,
                    activeSubscriptions,
                    planBreakdown: planCounts
                }
            }
        });
    } catch (err) {
        console.error('Admin Stats Error:', err);
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// =========================
// GET ALL AGENCIES (CRM List)
// =========================
export const getAgencyList = async (req, res) => {
    try {
        // Fetch agencies with a count of their itineraries and users
        // Note: Supabase doesn't support complex count joins easily in one go without raw SQL or RPC.
        // We will do a basic fetch and client-side processing or separate counts if needed.
        // Using a simpler approach: Get all agencies
        // Removing complex 'itineraries' count join that was causing PGRST200 error
        const { data: agencies, error } = await supabase
            .from('agencies')
            .select('*, users(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // If 'users(count)' works, great. If not, we might need to adjust Foreign Key or just start with '*'
        // But users -> agency link should be standard.

        return res.json({
            success: true,
            agencies: agencies
        });
    } catch (err) {
        console.error('Admin Agency List Error:', err);
        // Fallback to simpler query if the above fails (e.g. if users relation also fails)
        try {
            const { data: simpleAgencies, error: simpleError } = await supabase
                .from('agencies')
                .select('*')
                .order('created_at', { ascending: false });

            if (simpleError) throw simpleError;

            return res.json({ success: true, agencies: simpleAgencies });
        } catch (fallbackErr) {
            return res.status(500).json({ error: 'Failed to fetch agencies' });
        }
    }
};

// =========================
// GET AGENCY DETAILS
// =========================
export const getAgencyDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Agency Info
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', id)
            .single();

        if (agencyError) throw agencyError;

        // 2. Users in Agency
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, role, status, created_at') // Removed last_login which doesn't exist
            .eq('agency_id', id);

        if (usersError) throw usersError;

        // 3. Itineraries count (via users)
        // We get all user IDs first
        const userIds = users.map(u => u.id);
        let itineraryCount = 0;

        if (userIds.length > 0) {
            const { count, error: itinError } = await supabase
                .from('itineraries')
                .select('*', { count: 'exact', head: true })
                .in('created_by', userIds);

            if (!itinError) itineraryCount = count;
        }

        return res.json({
            success: true,
            agency: {
                ...agency,
                users,
                stats: {
                    userCount: users.length,
                    itineraryCount
                }
            }
        });
    } catch (err) {
        console.error('Admin Agency Details Error:', err);
        return res.status(500).json({ error: 'Failed to fetch agency details' });
    }
};

export const getAgencyClients = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('agency_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json({ success: true, clients });
    } catch (err) {
        console.error('Admin Agency Clients Error:', err);
        return res.status(500).json({ error: 'Failed to fetch agency clients' });
    }
};

export const getAgencyLeads = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('agency_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json({ success: true, leads });
    } catch (err) {
        console.error('Admin Agency Leads Error:', err);
        return res.status(500).json({ error: 'Failed to fetch agency leads' });
    }
};

export const getAgencyItineraries = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: itineraries, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('agency_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (itineraries && itineraries.length > 0) {
            const userIds = [...new Set(itineraries.map(i => i.created_by).filter(Boolean))];
            const clientIds = [...new Set(itineraries.map(i => i.client_id).filter(Boolean))];

            const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
            const { data: clients } = await supabase.from('clients').select('id, full_name').in('id', clientIds);

            const userMap = (users || []).reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
            const clientMap = (clients || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

            const enriched = itineraries.map(i => ({
                ...i,
                created_by_user: userMap[i.created_by],
                client: clientMap[i.client_id]
            }));
            return res.json({ success: true, itineraries: enriched });
        }

        return res.json({ success: true, itineraries: [] });
    } catch (err) {
        console.error('Admin Agency Itineraries Error:', err);
        return res.status(500).json({ error: 'Failed to fetch agency itineraries' });
    }
};

export const getAgencyInvoices = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('agency_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (invoices && invoices.length > 0) {
            const clientIds = [...new Set(invoices.map(i => i.client_id).filter(Boolean))];
            const { data: clients } = await supabase.from('clients').select('id, full_name').in('id', clientIds);
            const clientMap = (clients || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

            const enriched = invoices.map(i => ({
                ...i,
                client: clientMap[i.client_id]
            }));
            return res.json({ success: true, invoices: enriched });
        }

        return res.json({ success: true, invoices: [] });
    } catch (err) {
        console.error('Admin Agency Invoices Error:', err);
        return res.status(500).json({ error: 'Failed to fetch agency invoices' });
    }
};

// =========================
// ADMIN CLIENT VIEW
// =========================
export const getAdminClientDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (clientError || !client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Fetch itineraries
        const { data: itineraries } = await supabase
            .from('itineraries')
            .select('*')
            .eq('client_id', id)
            .order('created_at', { ascending: false });

        // Fetch invoices
        const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('client_id', id)
            .order('created_at', { ascending: false });

        return res.json({
            success: true,
            client,
            itineraries: itineraries || [],
            invoices: invoices || []
        });
    } catch (err) {
        console.error('Admin Client Details Error:', err);
        return res.status(500).json({ error: 'Failed to fetch client details' });
    }
};

export const getAdminLeadDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: lead, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        return res.json({ success: true, lead });
    } catch (err) {
        console.error('Admin Lead Details Error:', err);
        return res.status(500).json({ error: 'Failed to fetch lead details' });
    }
};

// =========================
// AGENCY CREDITS
// =========================
export const addAgencyCredits = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;

        console.log(`[Credits] Request received for Agency ${id}, Amount: ${amount}`);

        if (!amount || isNaN(amount)) {
            console.log('[Credits] Invalid amount');
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // 1. Get current balance
        console.log('[Credits] Fetching current agency...');
        const { data: agency, error: fetchError } = await supabase
            .from('agencies')
            .select('id, credits_balance') // Ensure column exists!
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('[Credits] Fetch error:', fetchError);
            throw fetchError;
        }

        const currentBalance = agency.credits_balance || 0;
        const newBalance = currentBalance + Number(amount);
        console.log(`[Credits] Current: ${currentBalance}, New: ${newBalance}`);

        const { data: updatedAgency, error: updateError } = await supabase
            .from('agencies')
            .update({ credits_balance: newBalance })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('[Credits] Update error:', updateError);
            throw updateError;
        }

        console.log(`[Credits] Success! New Balance: ${newBalance}`);
        return res.json({ success: true, newBalance, message: 'Credits added successfully' });

    } catch (err) {
        console.error('Add Credits Error:', err);
        return res.status(500).json({ error: 'Failed to add credits: ' + err.message });
    }
};

export const getSystemActivity = async (req, res) => {
    try {
        // Mocking an activity feed by combining recent creations
        // In a real system, you'd have an 'audit_logs' or 'activities' table.
        // Here we'll just fetch the 5 newest agencies and 5 newest itineraries.

        const { data: newAgencies } = await supabase
            .from('agencies')
            .select('id, agency_name, created_at, contact_email')
            .order('created_at', { ascending: false })
            .limit(5);

        // We need to fetch itineraries and join with users to know who made them (and their agency)
        // For simplicity, just fetching the itineraries
        const { data: newItineraries } = await supabase
            .from('itineraries')
            .select('id, title, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(5);

        const activities = [
            ...(newAgencies || []).map(a => ({
                type: 'new_agency',
                title: `New Agency Joined: ${a.agency_name}`,
                subtitle: a.contact_email,
                date: a.created_at,
                id: a.id
            })),
            ...(newItineraries || []).map(i => ({
                type: 'new_itinerary',
                title: `New Itinerary Created: ${i.title || 'Untitled Trip'}`,
                subtitle: `User ID: ${i.user_id}`,
                date: i.created_at,
                id: i.id
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.json({
            success: true,
            activities: activities.slice(0, 10) // Return top 10 mixed events
        });
    } catch (err) {
        console.error('Admin Activity Error:', err);
        return res.status(500).json({ error: 'Failed to fetch system activity' });
    }
};

// =========================
// AGENCY MANAGEMENT (CRUD)
// =========================

export const updateAgency = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        console.log('[Admin] Updating agency:', id, 'with:', updates);

        const { data, error } = await supabase
            .from('agencies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Admin] Supabase error:', error);
            throw error;
        }

        console.log('[Admin] Update successful:', data);
        return res.json({ success: true, agency: data });
    } catch (err) {
        console.error('Update Agency Error:', err);
        return res.status(500).json({
            error: 'Failed to update agency',
            details: err.message,
            hint: err.hint || undefined
        });
    }
};

export const deleteAgency = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get all users for this agency to delete them from Auth
        const { data: users } = await supabase.from('users').select('id').eq('agency_id', id);

        if (users && users.length > 0) {
            for (const user of users) {
                // Delete from Supabase Auth
                await supabase.auth.admin.deleteUser(user.id).catch(e => console.error("Auth delete failed", e));
            }
        }

        // 2. Delete Agency (DB Cascade should handle public.users, itineraries etc if generated correctly)
        // If not, we explicitly delete. Let's delete agency.
        const { error } = await supabase.from('agencies').delete().eq('id', id);
        if (error) throw error;

        return res.json({ success: true, message: 'Agency deleted successfully' });
    } catch (err) {
        console.error('Delete Agency Error:', err);
        return res.status(500).json({ error: 'Failed to delete agency' });
    }
};

// =========================
// AGENT MANAGEMENT (God Mode)
// =========================

export const createAgencyUser = async (req, res) => {
    try {
        const { id: agencyId } = req.params;
        const { email, password, name, role } = req.body;

        // 1. Create in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create in public.users
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const { data: newUser, error: dbError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email,
                name,
                role: role || 'agent',
                agency_id: agencyId,
                password_hash: hash,
                status: 'active'
            })
            .select()
            .single();

        if (dbError) {
            // Rollback auth creation if DB fails (optional but good practice)
            await supabase.auth.admin.deleteUser(userId);
            throw dbError;
        }

        return res.json({ success: true, user: newUser });
    } catch (err) {
        console.error('Create User Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

export const updateAgencyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, role, password, status } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (role) updates.role = role;
        if (status) updates.status = status;

        // Password update
        if (password) {
            // Update Auth
            const { error: authError } = await supabase.auth.admin.updateUserById(userId, { password });
            if (authError) throw authError;

            // Update Hash
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return res.json({ success: true, user: data });
    } catch (err) {
        console.error('Update User Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

export const deleteAgencyUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete from Auth
        await supabase.auth.admin.deleteUser(userId);

        // Delete from DB (should cascade or be explicit)
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('Delete User Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

// =========================
// REVENUE STATS
// =========================
// --- Admin Leads (Outreach) ---

export const getAdminLeads = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('admin_leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ leads: data });
    } catch (err) {
        console.error('Error fetching admin leads:', err);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

export const createAdminLead = async (req, res) => {
    try {
        const { company_name, contact_name, email, phone, notes } = req.body;

        if (!company_name) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        const { data, error } = await supabase
            .from('admin_leads')
            .insert([{
                company_name,
                contact_name,
                email,
                phone,
                notes,
                status: 'new'
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ lead: data });
    } catch (err) {
        console.error('Error creating admin lead:', err);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

export const updateAdminLead = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // If status is being updated, you might want to track that, but simple update is fine.
        // If notes are added, update last_contacted_at automatically? 
        // Let's just update updated_at for now.

        const { data, error } = await supabase
            .from('admin_leads')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ lead: data });
    } catch (err) {
        console.error('Error updating admin lead:', err);
        res.status(500).json({ error: 'Failed to update lead' });
    }
};

export const deleteAdminLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('admin_leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Lead deleted successfully' });
    } catch (err) {
        console.error('Error deleting admin lead:', err);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
};

export const promoteLeadToAgency = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Lead
        const { data: lead, error: leadError } = await supabase
            .from('admin_leads')
            .select('*')
            .eq('id', id)
            .single();

        if (leadError || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (lead.status === 'closed_won') {
            return res.status(400).json({ error: 'Lead is already converted' });
        }

        // 2. Generate Temp Password (simple 8 chars for now, or use crypto)
        const tempPassword = Math.random().toString(36).slice(-8) + "!Aa1";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 3. Create Agency
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .insert([{
                agency_name: lead.company_name,
                contact_email: lead.email,
                // created_at defaults to now
            }])
            .select()
            .single();

        if (agencyError) throw agencyError;

        // 4. Create User (Super Admin of that agency)
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([{
                agency_id: agency.id,
                email: lead.email,
                name: lead.contact_name || 'Admin',
                password_hash: hashedPassword,
                role: 'admin',
                status: 'active'
            }])
            .select()
            .single();

        if (userError) {
            // Rollback agency creation if user creation fails (manual compensation since no transactions in Supabase JS client easily)
            await supabase.from('agencies').delete().eq('id', agency.id);
            throw userError;
        }

        // 5. Update Lead Status
        await supabase
            .from('admin_leads')
            .update({ status: 'closed_won', updated_at: new Date() })
            .eq('id', id);

        res.json({
            success: true,
            agency,
            user: { email: user.email, tempPassword },
            message: 'Lead promoted to Agency successfully'
        });

    } catch (err) {
        console.error('Error promoting lead:', err);
        res.status(500).json({ error: 'Failed to promote lead: ' + err.message });
    }
};

export const bulkCreateAdminLeads = async (req, res) => {
    try {
        const { leads } = req.body; // Expects array of { company_name, ... }

        if (!leads || !Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ error: 'No leads provided or invalid format' });
        }

        // Validate basic requirement (Company Name)
        const validLeads = leads.filter(l => l.company_name).map(l => ({
            company_name: l.company_name,
            contact_name: l.contact_name || null,
            email: l.email || null,
            phone: l.phone || null,
            notes: l.notes || 'Imported via CSV',
            status: 'new'
        }));

        if (validLeads.length === 0) {
            return res.status(400).json({ error: 'No valid leads found (Company Name is required)' });
        }

        const { data, error } = await supabase
            .from('admin_leads')
            .insert(validLeads)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            count: data.length,
            message: `Successfully imported ${data.length} leads`
        });

    } catch (err) {
        console.error('Error importing leads:', err);
        res.status(500).json({ error: 'Failed to import leads' });
    }
};

// =========================
// ADMIN SETTINGS & TEAM
// =========================
export const getAdminTeam = async (req, res) => {
    try {
        const { data: admins, error } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('role', 'super_admin')
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ admins });
    } catch (err) {
        console.error('Error fetching admin team:', err);
        res.status(500).json({ error: 'Failed to fetch admin team' });
    }
};

export const createAdminUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, Email and Password are required' });
        }

        // Check if user exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email,
                name,
                password_hash: hashedPassword,
                role: 'super_admin',
                status: 'active'
            }])
            .select('id, name, email, created_at')
            .single();

        if (error) throw error;

        res.json({ success: true, admin: newUser, message: 'Super Admin created successfully' });

    } catch (err) {
        console.error('Error creating admin:', err);
        res.status(500).json({ error: 'Failed to create admin' });
    }
};

export const deleteAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;

        if (id === requesterId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .eq('role', 'super_admin'); // Ensure we only delete admins via this route

        if (error) throw error;

        res.json({ success: true, message: 'Admin user deleted' });

    } catch (err) {
        console.error('Error deleting admin:', err);
        res.status(500).json({ error: 'Failed to delete admin' });
    }
};

export const updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // 1. Verify current password
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // 2. Update to new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
};
// Existing Revenue Stats...
export const getRevenueStats = async (req, res) => {
    try {
        // Calculate MRR based on active agencies and their plans
        // Pricing constants (hardcoded for now, can be in DB)
        const PRICING = {
            'free': 0,
            'starter': 49,
            'pro': 99,
            'agency': 199,
            'agency_plus': 299
        };

        const { data: agencies, error } = await supabase
            .from('agencies')
            .select('subscription_plan, subscription_status');

        if (error) throw error;

        let mrr = 0;
        const planCounts = {};

        agencies.forEach(a => {
            if (a.subscription_status === 'active') {
                const plan = a.subscription_plan || 'free';
                const price = PRICING[plan] || 0;
                mrr += price;
                planCounts[plan] = (planCounts[plan] || 0) + 1;
            }
        });

        return res.json({
            success: true,
            revenue: {
                mrr,
                planBreakdown: planCounts
            }
        });
    } catch (err) {
        console.error('Revenue Stats Error:', err);
        return res.status(500).json({ error: 'Failed to fetch revenue' });
    }
};


// =========================
// MASS EMAIL
// =========================

export const sendMassEmail = async (req, res) => {
    try {
        const { recipients, subject, content, smtpConfig } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'Recipients list is required' });
        }

        if (!subject || !content) {
            return res.status(400).json({ error: 'Subject and content are required' });
        }

        const html = getMassEmailTemplate(content, subject);

        // Use provided config or fetch from system settings if not provided
        let config = smtpConfig;

        if (!config || !config.user) {
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'smtp_config')
                .single();

            if (settings?.value) {
                config = settings.value;
            }
        }

        const results = await Promise.allSettled(recipients.map(async (recipient) => {
            // Handle both object {name, email} and string "email"
            let email, name;
            if (typeof recipient === 'string') {
                email = recipient;
                name = '';
            } else {
                email = recipient.email;
                name = recipient.name;
            }

            const to = email ? email.trim() : '';
            if (!to) return null;

            // Personalize content and subject
            const displayName = name || 'Partner';
            const personalizedSubject = subject.replace(/\[Name\]/g, displayName);
            const personalizedContent = content.replace(/\[Name\]/g, displayName);

            const html = getMassEmailTemplate(personalizedContent, personalizedSubject);

            return sendEmail(to, personalizedSubject, personalizedContent, html, config);
        }));

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const failures = results
            .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
            .map(r => {
                if (r.status === 'rejected') return r.reason?.message || 'Unknown error';
                return r.value?.error || 'Failed to send';
            });

        const failureCount = failures.length;

        return res.json({
            success: true,
            message: 'Emails sent: ' + successCount + ' successful, ' + failureCount + ' failed',
            details: {
                total: recipients.length,
                successful: successCount,
                failed: failureCount,
                errors: failures // Return specific errors
            }
        });

    } catch (err) {
        console.error('Mass Email Error:', err);
        return res.status(500).json({ error: 'Failed to send mass emails' });
    }
};

// =========================
// SYSTEM SETTINGS
// =========================

export const getSystemSettings = async (req, res) => {
    try {
        const { keys } = req.query;
        let query = supabase.from('system_settings').select('key, value, description');

        if (keys) {
            const keyList = keys.split(',');
            query = query.in('key', keyList);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform to object for easier frontend usage if single key or map
        const settingsMap = {};
        data.forEach(item => {
            settingsMap[item.key] = item.value;
        });

        res.json({ success: true, settings: settingsMap });

    } catch (err) {
        console.error('Get Settings Error:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSystemSettings = async (req, res) => {
    try {
        const { key, value } = req.body;
        const userId = req.user.userId;

        if (!key || value === undefined) {
            return res.status(400).json({ error: 'Key and Value are required' });
        }

        const { data, error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date(),
                updated_by: userId
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, setting: data, message: 'Setting updated' });

    } catch (err) {
        console.error('Update Settings Error:', err);
        res.status(500).json({ error: 'Failed to update setting' });
    }
};
