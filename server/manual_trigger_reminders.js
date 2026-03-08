import { runPaymentReminders } from './src/cron/paymentReminders.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("--> Manually Triggering Payment Reminders...");
runPaymentReminders()
    .then(() => console.log("--> Done. Check your console logs above for 'Sent reminder'."))
    .catch(err => console.error("Error:", err));
