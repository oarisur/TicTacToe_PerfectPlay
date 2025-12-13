// build/build-template.js
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver'); 

// Define paths for the temporary source directory and the final output ZIP file.
const templateDir = path.resolve(__dirname, '../dist/template-source');
const outputZip = path.resolve(__dirname, '../releases/tictactoe-template.zip');

/**
 * Creates a clean ZIP archive of the project source code for use as a template.
 */
async function buildTemplate() {
    console.log('--- 🎁 Starting Template Source Package Creation ---');

    // 1. Prepare the temporary staging directory.
    console.log('-> Clearing staging directory:', templateDir);
    await fs.emptyDir(templateDir);

    // 2. Define files and folders to include in the template.
    const includes = [
        '.gitignore', 
        'LICENSE', 
        'package.json', 
        'README.md', 
        'build', 
        'src',
        '.github' 
    ];
    console.log('-> Copying essential source files and configuration...');

    // 3. Copy source files into the staging directory.
    for (const item of includes) {
        // Copy each item from the project root to the template staging directory.
        await fs.copy(path.resolve(__dirname, '..', item), path.join(templateDir, item)).catch(() => {
            // Error handler for missing optional files (e.g., if LICENSE is missing, log a warning).
            console.warn(`⚠️ Warning: Could not find or copy optional item: ${item}`);
        });
    }

    // 4. Remove heavy or unnecessary files/folders from the template copy.
    // This ensures the template is clean and ready for immediate use without large dependencies.
    console.log('-> Removing distribution artifacts and node_modules...');
    await fs.remove(path.join(templateDir, 'node_modules')); 
    await fs.remove(path.join(templateDir, 'dist')); 

    // 5. Create ZIP archive using archiver.
    console.log('-> Creating final ZIP archive:', outputZip);
    await fs.ensureDir(path.resolve(__dirname, '../releases')); // Ensure output folder exists
    
    // Setup streams for archival.
    const output = fs.createWriteStream(outputZip);
    // Use 'zip' format with maximum compression level (9).
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Event listener for completion and file size reporting.
    output.on('close', () => {
        console.log(`\n--- ✅ Template ZIP created: ${Math.round(archive.pointer() / 1024)} KB total size ---`);
    });

    // Event listener for archival errors.
    archive.on('error', (err) => {
        console.error('❌ Archiver error:', err.message);
        throw err;
    });

    // Pipe the archive data to the file stream.
    archive.pipe(output);
    
    // Append the contents of the staging directory, placing them inside a
    // root folder named 'TicTacToe_PerfectPlay_Template' within the ZIP.
    archive.directory(templateDir, 'TicTacToe_PerfectPlay_Template');
    
    // Finalize the archive (ensures all files are appended and streams are closed).
    archive.finalize();
}

buildTemplate().catch(err => {
    console.error('❌ FATAL: Template build failed:', err);
    process.exit(1);
});