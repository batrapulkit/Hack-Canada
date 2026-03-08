
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBooking() {
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, clients(full_name)')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Latest Booking:", JSON.stringify(bookings[0], null, 2));
    }
}

checkBooking();
