// build/build-web.js
const fs = require('fs-extra');
const path = require('path');
const rollup = require('rollup');
const { execSync } = require('child_process'); // <- New: to run the PostCSS CLI
// Rollup plugins for production optimization:
const terser = require('@rollup/plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');

// Define paths for source files and the final output directory.
const distDir = path.resolve(__dirname, '../dist/web');
const srcDir = path.resolve(__dirname, '../src');

/**
 * Compiles and minifies Tailwind CSS using PostCSS.
 */
function buildCSS() {
    console.log('-> Compiling and minifying Tailwind CSS...');
    // We use a conceptual input CSS file (styles.css in src/css) that imports Tailwind.
    // The output is written back to the same path (or a temp one) before copying to dist.
    try {
        // Run the PostCSS CLI to process the CSS.
        execSync(`npx postcss ${path.join(srcDir, 'css/styles.css')} --config ./postcss.config.js -o ${path.join(srcDir, 'css/styles.css')}`, { stdio: 'pipe' });
        // NOTE: If you are using a minifier plugin in PostCSS, this step is enough.
        // For a simple setup, the Tailwind compilation and pruning is the primary goal.
        console.log('✅ CSS compiled and tree-shaken.');
    } catch (error) {
        console.error('❌ CSS build failed:', error.message);
        throw error;
    }
}

/**
 * Executes the production build for the web application and PWA assets.
 */
async function buildWeb() {
    console.log('--- 📦 Starting Web/PWA Production Build ---');

    // 1. Clean the previous distribution folder.
    console.log('-> Cleaning distribution directory:', distDir);
    await fs.emptyDir(distDir);
    
    // 2. Build CSS FIRST (must happen before assets are copied)
    buildCSS(); // <- NEW STEP

    // 3. Bundle and Minify JavaScript modules using Rollup.
    console.log('-> Bundling and minifying JavaScript...');
    const bundle = await rollup.rollup({
        input: path.join(srcDir, 'js/main.js'),
        plugins: [
            // resolve: Locates and includes third-party modules from node_modules.
            resolve.default(), 
            // terser: Minifies the final JavaScript bundle size for production.
            terser.default() 
        ]
    });

    await bundle.write({
        file: path.join(distDir, 'app.bundle.js'),
        // format: 'iife' (Immediately Invoked Function Expression) is ideal for a 
        // single script file loaded via a <script> tag.
        format: 'iife', 
        sourcemap: false
    });

    console.log('✅ JavaScript bundled and minified into app.bundle.js.');

    // 4. Copy static assets and PWA configuration files.
    // NOTE: This now copies the newly compiled src/css/styles.css
    const assetsToCopy = [
        'css', 
        'assets', // Includes image, sound, and icon files
        'manifest.json', // Required for PWA features and app store packaging
        'sw.js', // Service Worker script for offline capabilities
        'index.html' // The main HTML file (will be modified in the next step)
    ];
    
    for (const asset of assetsToCopy) {
        await fs.copy(path.join(srcDir, asset), path.join(distDir, asset)).catch((err) => {
            if (asset !== 'index.html') console.warn(`⚠️ Warning: Failed to copy asset "${asset}":`, err.message);
        });
    }
    
    // 5. Update index.html to reference the bundled, production script.
    console.log('-> Updating index.html script reference...');
    let indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
    
    // Remove the development module import (js/main.js) and the Tailwind CDN
    indexHtml = indexHtml
        // Remove the inline <style> block and replace with the bundled script reference
        .replace(/<script\s+src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<style>/s, '') // Remove CDN script and opening <style>
        .replace(/<\/style>\s*<\/head>/s, '</head>') // Remove closing </style> and replace </head>
        .replace(/<script\s+type="module"\s+src="js\/main\.js"><\/script>/, 
                 '<script src="./app.bundle.js"></script>'); // Replace main module import

    await fs.writeFile(path.join(distDir, 'index.html'), indexHtml);

    console.log('--- ✅ Web/PWA build successfully completed in dist/web ---');
}

buildWeb().catch(err => {
    console.error('❌ FATAL: Web build failed:', err);
    process.exit(1);
});