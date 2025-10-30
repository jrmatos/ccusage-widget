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

// Try to find electron in multiple ways
let electronPath;
let electronFound = false;

// Method 1: Try to require electron directly
try {
  electronPath = require('electron');
  electronFound = true;
} catch (e) {
  // Continue to next method
}

// Method 2: Try to find electron in the package's node_modules
if (!electronFound) {
  const possiblePaths = [
    path.join(appPath, 'node_modules', 'electron', 'cli.js'),
    path.join(appPath, 'node_modules', '.bin', 'electron'),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      electronPath = possiblePath;
      electronFound = true;
      break;
    }
  }
}

// Method 3: Try using npx to run electron
if (!electronFound) {
  // Check if electron is available via npx
  const { execSync } = require('child_process');
  try {
    execSync('npx --no-install electron --version', { stdio: 'ignore' });
    electronPath = 'npx';
    electronFound = true;
  } catch (e) {
    // npx electron not available
  }
}

if (!electronFound) {
  console.error('❌ Error: Electron module could not be loaded.');
  console.error('');
  console.error('🤔 This might happen if:');
  console.error('  1️⃣  Electron is not installed (it\'s an optional dependency)');
  console.error('  2️⃣  You are on a platform not supported by Electron');
  console.error('');
  console.error('🔧 Try one of these solutions:');
  console.error('');
  console.error('📦 Option 1: Install electron globally first:');
  console.error('  pnpm add -g electron@28');
  console.error('  pnpm add -g ccusage-widget');
  console.error('');
  console.error('📦 Option 2: Run from source:');
  console.error('  git clone https://github.com/JeongJaeSoon/ccusage-widget');
  console.error('  cd ccusage-widget');
  console.error('  pnpm install');
  console.error('  pnpm start');
  process.exit(1);
}

// Check if running from global install
const isGlobalInstall = __dirname.includes('node_modules');

// Show launching message
console.log('🚀 Launching CCUsage Widget in background...');

if (isGlobalInstall) {
  // When installed globally, run electron in detached background mode
  let child;

  if (electronPath === 'npx') {
    // Use npx to run electron
    child = spawn('npx', ['--no-install', 'electron', appPath], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
      shell: true
    });
  } else {
    // Use direct electron path
    child = spawn(electronPath, [appPath], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env }
    });
  }

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