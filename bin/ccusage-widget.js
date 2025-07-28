#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronPath = require('electron');
const appPath = path.join(__dirname, '..');

// Check if running from global install
const isGlobalInstall = __dirname.includes('node_modules');

if (isGlobalInstall) {
  // When installed globally, we need to run electron from the package
  const child = spawn(electronPath, [appPath], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  child.on('close', (code) => {
    process.exit(code);
  });
} else {
  // Running locally
  require('child_process').exec('npm start', {
    cwd: appPath,
    stdio: 'inherit'
  });
}