import { forceSync } from './src/cron/pnrSync.js';

console.log("Forcing PNR Sync...");
forceSync().then(() => {
    console.log("Sync triggered. Check logs above.");
    process.exit(0);
}).catch(err => {
    console.error("Sync failed:", err);
    process.exit(1);
});
