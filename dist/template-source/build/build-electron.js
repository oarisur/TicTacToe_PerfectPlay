// build/build-electron.js
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Define paths for source and destination directories
const webBuildDir = path.resolve(__dirname, '../dist/web');
const electronSrcDir = path.resolve(__dirname, '../src/electron');
const appDistDir = path.resolve(__dirname, '../dist/app'); // Final directory for electron-builder

async function buildElectron() {
    console.log('--- 🖥️ Starting Electron Application Source Preparation ---');

    // 1. Execute the Web build process first.
    // The Electron application will load the contents of this web build.
    try {
        console.log('-> Running web build (npm run build:web)...');
        execSync('npm run build:web', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Web build failed. Aborting Electron build preparation.');
        process.exit(1);
    }

    // 2. Prepare the final distribution folder for the Electron application.
    console.log('-> Preparing distribution directory:', appDistDir);
    await fs.emptyDir(appDistDir);
    
    // 3. Copy compiled Web assets (HTML, CSS, JS) into the final app folder.
    console.log('-> Copying web assets into dist/app...');
    await fs.copy(webBuildDir, appDistDir);

    // 4. Copy Electron specific source files (main.js, preload.js, etc.)
    console.log('-> Copying Electron entry files...');
    await fs.copy(electronSrcDir, appDistDir);
    
    // 5. Create a minimal package.json for electron-builder.
    // This stripped-down file is CRITICAL as it defines the application entry point
    // and prevents non-runtime dependencies from being bundled.
    const packageJsonPath = path.join(appDistDir, 'package.json');
    const rootPackage = require('../package.json');
    
    const electronPackage = {
        name: rootPackage.name,
        version: rootPackage.version,
        main: 'main.js', // Defines the Electron main process entry file.
        // Include only necessary runtime dependencies if required.
        dependencies: {} 
    };
    
    await fs.writeJson(packageJsonPath, electronPackage, { spaces: 2 });

    console.log('--- ✅ Electron application source successfully prepared in dist/app ---');
}

buildElectron().catch(err => {
    console.error('❌ FATAL: Electron source preparation failed:', err);
    process.exit(1);
});