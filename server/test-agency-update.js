// test-agency-update.js
// Quick script to test agency update directly
import { supabase } from './src/config/supabase.js';

async function testUpdate() {
    const testAgencyId = process.argv[2];

    if (!testAgencyId) {
        console.log('Usage: node test-agency-update.js <agency-id>');
        console.log('\nExample: node test-agency-update.js a47e9d42-7f0d-4ad0-9e91-b06e3765aa19');
        process.exit(1);
    }

    console.log(`\n🔍 Testing agency update for ID: ${testAgencyId}\n`);

    // First, try to read the agency
    console.log('1️⃣ Attempting to read agency...');
    const { data: readData, error: readError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', testAgencyId)
        .single();

    if (readError) {
        console.log('❌ Read failed:', readError.message);
        console.log('Details:', readError);
        return;
    }

    console.log('✅ Agency found:', readData.agency_name);
    console.log('Current subscription_plan:', readData.subscription_plan || 'null');
    console.log('Current subscription_status:', readData.subscription_status || 'null');

    // Now try to update
    console.log('\n2️⃣ Attempting to update agency...');
    const { data: updateData, error: updateError } = await supabase
        .from('agencies')
        .update({
            subscription_plan: 'agency_pro',
            subscription_status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', testAgencyId)
        .select()
        .single();

    if (updateError) {
        console.log('❌ Update failed:', updateError.message);
        console.log('Error code:', updateError.code);
        console.log('Details:', updateError.details);
        console.log('Hint:', updateError.hint);
        console.log('Full error:', JSON.stringify(updateError, null, 2));
        return;
    }

    console.log('✅ Update successful!');
    console.log('New subscription_plan:', updateData.subscription_plan);
    console.log('New subscription_status:', updateData.subscription_status);
}

testUpdate();
