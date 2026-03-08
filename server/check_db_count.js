import { supabase } from './src/config/supabase.js';

async function checkData() {
    const { count: resortCount, error: rError } = await supabase
        .from('resorts')
        .select('*', { count: 'exact', head: true });

    if (rError) console.error('Resort Error:', rError);
    else console.log(`Total Resorts: ${resortCount}`);

    const { count: pkgCount, error: pError } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true });

    if (pError) console.error('Package Error:', pError);
    else console.log(`Total Packages: ${pkgCount}`);
}

checkData();
