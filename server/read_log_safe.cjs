const fs = require('fs');
const path = require('path');

const src = 'e:\\B2B 44\\triponic-b2b\\server\\debug.log';
const dest = 'e:\\B2B 44\\triponic-b2b\\server\\debug_copy.log';

try {
    fs.copyFileSync(src, dest);
    const content = fs.readFileSync(dest, 'utf8');
    const lines = content.split('\n');
    console.log(lines.slice(-30).join('\n'));
} catch (e) {
    console.error(e);
}
