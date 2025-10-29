#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

// Check command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  if (args.includes('--version') || args.includes('-v')) {
    // Show version
    console.log(packageJson.version);
    process.exit(0);
  } else if (args.includes('--help') || args.includes('-h')) {
    // Show help
    console.log(`
🎯 CCUsage Widget v${packageJson.version}
📊 A beautiful macOS desktop widget for Claude Code usage statistics

📖 Usage: ccusage-widget [options]

⚙️  Options:
  -v, --version  Show version number
  -h, --help     Show this help message

🚀 When run without options, launches the widget application.
    `.trim());
    process.exit(0);
  } else {
    // Unknown option
    console.error(`❌ Error: Unknown option '${args[0]}'`);
    console.error('💡 Try ccusage-widget --help for more information.');
    process.exit(1);
  }
}

// No arguments, proceed with normal execution
const appPath = path.join(__dirname, '..');

// Try to find electron
let electronPath;
try {
  // Try to require electron (should work with optionalDependencies)
  electronPath = require('electron');
} catch (e) {
  // Electron not found - this shouldn't happen with optionalDependencies
  // but provide helpful error message just in case
  console.error('❌ Error: Electron module could not be loaded.');
  console.error('');
  console.error('🤔 This might happen if:');
  console.error('  1️⃣  The installation was incomplete');
  console.error('  2️⃣  You are on a platform not supported by Electron');
  console.error('');
  console.error('🔧 Try reinstalling:');
  console.error('  npm uninstall -g ccusage-widget');
  console.error('  npm install -g ccusage-widget');
  console.error('');
  console.error('📦 Or run from source:');
  console.error('  git clone https://github.com/JeongJaeSoon/ccusage-widget');
  console.error('  cd ccusage-widget');
  console.error('  npm install');
  console.error('  npm start');
  process.exit(1);
}

// Check if running from global install
const isGlobalInstall = __dirname.includes('node_modules');

// Show launching message
console.log('🚀 Launching CCUsage Widget in background...');

if (isGlobalInstall) {
  // When installed globally, run electron in detached background mode
  const child = spawn(electronPath, [appPath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env }
  });

  // Unref the child process so parent can exit
  child.unref();

  console.log('✅ CCUsage Widget is running! Check your menu bar.');
  process.exit(0);
} else {
  // Running locally - also run in background
  const child = spawn('npm', ['start'], {
    cwd: appPath,
    detached: true,
    stdio: 'ignore',
    shell: true
  });

  child.unref();
  console.log('✅ CCUsage Widget is running! Check your menu bar.');
  process.exit(0);
}