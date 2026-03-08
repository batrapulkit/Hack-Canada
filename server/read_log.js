const fs = require('fs');
const path = require('path');

const filePath = 'e:\\B2B 44\\triponic-b2b\\server\\debug.log';

try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const readSize = Math.min(4096, size);
    const buffer = Buffer.alloc(readSize);

    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, size - readSize);
    fs.closeSync(fd);

    console.log(buffer.toString());
} catch (e) {
    console.error(e);
}
