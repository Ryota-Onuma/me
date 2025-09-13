#!/usr/bin/env node

/**
 * Publish Guard Script
 * Prevents accidental publishing of this local-only VS Code extension
 */

const fs = require('fs');
const path = require('path');

const BLOCKED_COMMANDS = [
  'vsce publish',
  'npm publish',
  'yarn publish',
  'pnpm publish'
];

function checkPublishAttempt() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.private !== true) {
      console.error('❌ ERROR: package.json must have "private": true');
      process.exit(1);
    }

    if (!packageJson.description.includes('DO NOT PUBLISH')) {
      console.error('❌ ERROR: Missing publish warning in description');
      process.exit(1);
    }

    console.log('✅ Publish guard checks passed');

  } catch (error) {
    console.error('❌ ERROR: Failed to read package.json:', error.message);
    process.exit(1);
  }
}

function blockPublish() {
  const args = process.argv.slice(2).join(' ');

  for (const blockedCmd of BLOCKED_COMMANDS) {
    if (args.includes(blockedCmd.split(' ')[1])) {
      console.error('🚫 PUBLISH BLOCKED!');
      console.error('This extension is for LOCAL USE ONLY.');
      console.error('Publishing to marketplace is NOT ALLOWED.');
      console.error('');
      console.error('If you need to package for local distribution, use:');
      console.error('  npm run package');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  checkPublishAttempt();
  blockPublish();
}

module.exports = { checkPublishAttempt, blockPublish };