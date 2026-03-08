import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendEmail } from '../services/emailService.js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const runPaymentReminders = async () => {
    console.log('[Cron] Checking for Payment Reminders...');

    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    try {
        // 1. Find Invoices that are PENDING and DUE soon or OVERDUE
        // Logic: Due in 3 days OR Due 1 day ago (Overdue)
        // Simplification: Find all 'pending' invoices and check dates in loop

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*, client:clients(*), agency:agencies(*)')
            .eq('status', 'pending');

        if (error) throw error;

        console.log(`[Cron] found ${invoices.length} pending invoices.`);

        for (const invoice of invoices) {
            const dueDate = new Date(invoice.due_date);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Criteria: 
            // 1. Due exactly in 3 days (Warning)
            // 2. Due exactly -1 days (Overdue yesterday)
            // 3. Due exactly -7 days (Seriously overdue)

            let shouldSend = false;
            let type = '';

            if (diffDays === 3) {
                shouldSend = true;
                type = 'upcoming';
            } else if (diffDays === -1) {
                shouldSend = true;
                type = 'overdue_1';
            } else if (diffDays === -7) {
                shouldSend = true;
                type = 'overdue_7';
            }

            if (shouldSend && invoice.client && invoice.client.email) {
                await sendReminderEmail(invoice, type);
            }
        }

    } catch (err) {
        console.error('[Cron] Payment Reminder Error:', err);
    }
};

async function sendReminderEmail(invoice, type) {
    const clientName = invoice.client.full_name;
    const agencyName = invoice.agency?.agency_name || 'Triponic B2B';
    const amount = invoice.total;
    const link = `https://triponic.com/pay/${invoice.id}`; // Mock link

    let subject = '';
    let body = '';

    if (type === 'upcoming') {
        subject = `Reminder: Invoice #${invoice.invoice_number} is due in 3 days`;
        body = `Dear ${clientName},\n\nJust a friendly reminder that invoice #${invoice.invoice_number} for $${amount} is due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nPlease pay here: ${link}\n\nThanks,\n${agencyName}`;
    } else if (type.startsWith('overdue')) {
        subject = `OVERDUE: Invoice #${invoice.invoice_number} is outstanding`;
        body = `Dear ${clientName},\n\nWe noticed that invoice #${invoice.invoice_number} for $${amount} was due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nPlease arrange payment immediately: ${link}\n\nSincerely,\n${agencyName}`;
    }

    // SMTP Config from Agency?
    const smtpConfig = {
        host: invoice.agency?.smtp_host,
        port: invoice.agency?.smtp_port,
        user: invoice.agency?.smtp_user,
        pass: invoice.agency?.smtp_pass,
        fromName: agencyName
    };

    console.log(`[Cron] Sending ${type} reminder to ${invoice.client.email}`);
    await sendEmail(invoice.client.email, subject, body, body.replace(/\n/g, '<br>'), smtpConfig);

    // Log event
    await supabase.from('workflow_events').insert({
        agency_id: invoice.agency_id,
        entity_type: 'invoice',
        entity_id: invoice.id,
        event_type: 'PAYMENT_REMINDER',
        message: `Sent ${type} reminder email.`,
        created_at: new Date().toISOString()
    });
}

// Enable scheduling
export const startPaymentCron = () => {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', runPaymentReminders);
    console.log('[Cron] Payment Reminders scheduled (Daily 09:00).');
};
