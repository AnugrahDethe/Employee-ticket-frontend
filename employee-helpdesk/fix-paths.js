const fs = require('fs');
const path = require('path');

const myAppDir = path.join(__dirname, 'mobile', 'app');
const srcAppDir = path.join(__dirname, 'mobile', 'src', 'app');

// Ensure src/app exists
if (!fs.existsSync(srcAppDir)) {
    fs.mkdirSync(srcAppDir, { recursive: true });
}

// Delete existing starter files in src/app
const starterFiles = fs.readdirSync(srcAppDir);
for (const file of starterFiles) {
    fs.unlinkSync(path.join(srcAppDir, file));
}

// Move files and fix imports
if (fs.existsSync(myAppDir)) {
    const files = fs.readdirSync(myAppDir);
    for (const file of files) {
        const srcFile = path.join(myAppDir, file);
        const destFile = path.join(srcAppDir, file);
        
        // Read content
        let content = fs.readFileSync(srcFile, 'utf8');
        
        // Fix imports from '../src/...' to '../...'
        content = content.replace(/\.\.\/src\//g, '../');
        
        // Write to new location
        fs.writeFileSync(destFile, content);
        
        // Delete old file
        fs.unlinkSync(srcFile);
        
        console.log(`Moved & patched: ${file}`);
    }
    
    // Remove old app dir
    try {
        fs.rmdirSync(myAppDir);
    } catch(e) {
        // Ignore if not empty
    }
}
console.log('Done!');
