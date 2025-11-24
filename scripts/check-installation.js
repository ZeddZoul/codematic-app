#!/usr/bin/env node
/**
 * Simple script to check GitHub App installation status
 */

require('dotenv').config({ path: '.env.local' });

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
const currentInstallationId = process.env.GITHUB_APP_INSTALLATION_ID;

console.log('🔍 Checking GitHub App Configuration...\n');

if (!appId) {
  console.error('❌ GITHUB_APP_ID is not set in .env.local');
  process.exit(1);
}

if (!privateKey) {
  console.error('❌ GITHUB_APP_PRIVATE_KEY is not set in .env.local');
  process.exit(1);
}

console.log(`✓ App ID: ${appId}`);
console.log(`✓ Private Key: ${privateKey.substring(0, 50)}...`);
console.log(`✓ Current Installation ID: ${currentInstallationId || 'Not set'}\n`);

console.log('💡 To find your correct installation ID:');
console.log('   1. Visit: https://github.com/settings/in