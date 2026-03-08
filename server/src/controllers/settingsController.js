// server/src/controllers/settingsController.js
import { supabase } from '../config/supabase.js';

// Get organization settings
export const getSettings = async (req, res) => {
    try {
        if (!req.user.agency_id) {
            return res.status(400).json({ error: 'User is not linked to an agency' });
        }

        const { data: agency, error } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', req.user.agency_id)
            .single();

        if (error) throw error;
        if (!agency) throw new Error('Agency not found');

        // Return settings from agency record
        const settings = {
            company_name: agency.agency_name || '',
            contact_email: agency.contact_email || '',
            contact_phone: agency.contact_phone || '',
            website: agency.website || '',
            address: agency.address || '',
            logo_url: process.env.COMPANY_LOGO_URL || agency.logo_url || '',
            domain: agency.domain || '',
            industry: agency.industry || '',
            country: agency.country || '',

            // Compliance & Invoice Fields (Top-Level for easy frontend consumption)
            phone: agency.phone || agency.contact_phone || '',
            address_line1: agency.address_line1 || '',
            address_line2: agency.address_line2 || '',
            city: agency.city || '',
            state: agency.state || '',
            zip: agency.zip || '',
            tico_registration_number: agency.tico_registration_number || '',
            invoice_settings: agency.invoice_settings || {},

            // Keep nested structure for backward compatibility if needed, though client seems to use flat
            organization: {
                company_name: agency.agency_name || '',
                contact_email: agency.contact_email || '',
                contact_phone: agency.contact_phone || '',
                website: agency.website || '',
                address: agency.address || '',
                // Detailed Address
                address_line1: agency.address_line1 || '',
                address_line2: agency.address_line2 || '',
                city: agency.city || '',
                state: agency.state || '',
                zip: agency.zip || '',
                country: agency.country || '',
                phone: agency.phone || agency.contact_phone || '',
                tico_registration_number: agency.tico_registration_number || '',

                logo_url: process.env.COMPANY_LOGO_URL || agency.logo_url || '',
                invoice_settings: agency.invoice_settings || {},

                smtp_host: agency.smtp_host || '',
                smtp_port: agency.smtp_port || '',
                smtp_user: agency.smtp_user || ''
                // We typically don't send back the password for security, or send a placeholder
            },
            notifications: {
                email: true,
                usage: true,
                billing: true,
                updates: false
            }
        };

        res.json({ success: true, settings, agency });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
    }
};

// Update organization settings
export const updateSettings = async (req, res) => {
    try {
        const { organization } = req.body;
        console.log("[UPDATE_SETTINGS] Received body:", JSON.stringify(organization, null, 2));

        // Update agency record with organization settings
        if (organization) {
            const updateData = {
                updated_at: new Date().toISOString()
            };

            // Only update fields that exist in the database
            if (organization.company_name !== undefined) updateData.agency_name = organization.company_name;
            if (organization.contact_email !== undefined) updateData.contact_email = organization.contact_email;
            if (organization.contact_phone !== undefined) updateData.contact_phone = organization.contact_phone;
            if (organization.website !== undefined) updateData.website = organization.website;
            if (organization.address !== undefined) updateData.address = organization.address;
            if (organization.logo_url !== undefined) updateData.logo_url = organization.logo_url;

            // Compliance & Detailed Address
            if (organization.phone !== undefined) updateData.phone = organization.phone;
            if (organization.address_line1 !== undefined) updateData.address_line1 = organization.address_line1;
            if (organization.address_line2 !== undefined) updateData.address_line2 = organization.address_line2;
            if (organization.city !== undefined) updateData.city = organization.city;
            if (organization.state !== undefined) updateData.state = organization.state;
            if (organization.zip !== undefined) updateData.zip = organization.zip;
            if (organization.country !== undefined) updateData.country = organization.country;
            if (organization.tico_registration_number !== undefined) updateData.tico_registration_number = organization.tico_registration_number;

            // Invoice Default Settings
            if (organization.invoice_settings !== undefined) updateData.invoice_settings = organization.invoice_settings;

            // SMTP Settings
            if (organization.smtp_host !== undefined) updateData.smtp_host = organization.smtp_host;
            if (organization.smtp_port !== undefined) updateData.smtp_port = organization.smtp_port;
            if (organization.smtp_user !== undefined) updateData.smtp_user = organization.smtp_user;
            if (organization.smtp_pass !== undefined) updateData.smtp_pass = organization.smtp_pass;

            console.log("[UPDATE_SETTINGS] Updating with:", JSON.stringify(updateData, null, 2));

            const { error } = await supabase
                .from('agencies')
                .update(updateData)
                .eq('id', req.user.agency_id);

            if (error) throw error;
        }

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
};
