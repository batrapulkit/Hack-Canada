require('dotenv').config();
console.log('Env check:');
Object.keys(process.env).forEach(k => {
    if (k.includes('DB') || k.includes('DATABASE') || k.includes('SUPABASE') || k.includes('URL')) {
        // Mask password if present
        const val = process.env[k];
        const masked = val.length > 10 ? val.substring(0, 5) + '...' : val;
        console.log(`${k}: ${masked}`);
    }
});
