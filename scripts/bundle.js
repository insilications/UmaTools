#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

/**
 * Bundle and code-split JavaScript files for optimal performance
 * This script uses esbuild to:
 * - Bundle JavaScript with minification
 * - Enable code splitting for shared dependencies
 * - Generate source maps for debugging
 */

const isDryRun = process.argv.includes('--dry-run');
const outdir = path.join(__dirname, '..', 'js', 'bundle');

// Ensure output directory exists
if (!isDryRun && !fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

// Main bundler configuration
const buildConfig = {
  entryPoints: [
    // i18n core and page chunks
    path.join(__dirname, '..', 'js', 'i18n-core.js'),
    path.join(__dirname, '..', 'js', 'i18n-pages.js'),
    // Tool-specific entry points for code splitting
    path.join(__dirname, '..', 'js', 'skills.js'),
    path.join(__dirname, '..', 'js', 'hints.js'),
    path.join(__dirname, '..', 'js', 'optimizer.js'),
    path.join(__dirname, '..', 'js', 'calculator.js'),
    path.join(__dirname, '..', 'js', 'deck.js'),
  ],
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: outdir,
  minify: !isDryRun,
  sourcemap: true,
  target: ['es2020', 'safari13'],
  platform: 'browser',
  logLevel: 'info',
  metafile: true,
};

async function bundle() {
  try {
    if (isDryRun) {
      console.log('Dry run mode - would bundle with config:');
      console.log(JSON.stringify(buildConfig, null, 2));
      console.log('\nEntry points:');
      buildConfig.entryPoints.forEach((entry) => {
        const exists = fs.existsSync(entry);
        console.log(`  ${exists ? '✓' : '✗'} ${entry}`);
      });
      return;
    }

    console.log('Building bundles with esbuild...');
    const result = await esbuild.build(buildConfig);

    // Output bundle analysis
    if (result.metafile) {
      const outputs = Object.keys(result.metafile.outputs);
      console.log('\nBundle outputs:');
      outputs.forEach((output) => {
        const stats = fs.statSync(output);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${path.basename(output)}: ${sizeKB} KB`);
      });
    }

    console.log('\n✓ Bundle complete');
  } catch (error) {
    console.error('Bundle failed:', error);
    process.exit(1);
  }
}

// Run bundler
bundle();
