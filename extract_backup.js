// extract_backup.js
// Extracts Truecaller installationId from ADB backup file
// Run: node extract_backup.js

const fs = require('fs');
const zlib = require('zlib');

const backupFile = process.argv[2] || 'D:\\HawkEye\\truecaller_backup.ab';

console.log(`📂 Reading backup file: ${backupFile}`);

try {
    const data = fs.readFileSync(backupFile);
    console.log(`📦 File size: ${data.length} bytes`);

    // ADB backup format: header + zlib compressed tar
    // Header is "ANDROID BACKUP\n" + version + compression + encryption
    const headerEnd = data.indexOf('\n\n') + 2;
    
    // Try to find installationId directly in the raw bytes
    const str = data.toString('latin1');
    
    // Search for installationId pattern
    const patterns = [
        /installationId["\s:>]*([a-zA-Z0-9_\-]{20,})/g,
        /INSTALLATION_ID["\s:>]*([a-zA-Z0-9_\-]{20,})/g,
        /"token">([a-zA-Z0-9_\-]{20,})</g,
        /TOKEN">([a-zA-Z0-9_\-]{20,})</g,
    ];

    let found = false;
    for (const pattern of patterns) {
        const matches = [...str.matchAll(pattern)];
        if (matches.length > 0) {
            console.log('\n✅ Found credentials:');
            matches.forEach(m => {
                console.log(`  ${m[0]}`);
                console.log(`\nTRUECALLER_INSTALLATION_ID=${m[1]}`);
            });
            found = true;
        }
    }

    if (!found) {
        // Try decompressing
        console.log('\n🔄 Trying to decompress...');
        
        // Skip ADB backup header (variable length)
        let offset = 0;
        while (offset < data.length && data[offset] !== 0x78) {
            offset++;
        }
        
        if (offset < data.length) {
            try {
                const compressed = data.slice(offset);
                const decompressed = zlib.inflateSync(compressed);
                const decompStr = decompressed.toString('latin1');
                
                console.log(`✅ Decompressed: ${decompressed.length} bytes`);
                
                for (const pattern of patterns) {
                    const matches = [...decompStr.matchAll(pattern)];
                    if (matches.length > 0) {
                        console.log('\n✅ Found credentials:');
                        matches.forEach(m => {
                            console.log(`\nTRUECALLER_INSTALLATION_ID=${m[1]}`);
                            fs.writeFileSync('truecaller_creds.txt', `TRUECALLER_INSTALLATION_ID=${m[1]}\n`);
                            console.log('Saved to truecaller_creds.txt');
                        });
                        found = true;
                    }
                }
            } catch(e) {
                console.log('Decompress failed:', e.message);
            }
        }
    }

    if (!found) {
        console.log('\n⚠️  Could not find installationId automatically.');
        console.log('Saving raw searchable content to backup_extracted.txt...');
        
        // Save printable content for manual inspection
        const printable = str.replace(/[^\x20-\x7E\n]/g, '.');
        fs.writeFileSync('backup_extracted.txt', printable);
        console.log('Check backup_extracted.txt and search for "installationId" or "TOKEN"');
    }

} catch(e) {
    console.error('❌ Error:', e.message);
    console.log('\nMake sure truecaller_backup.ab is in D:\\HawkEye\\');
}
