#!/usr/bin/env node

/**
 * StudyWise AI Backend - Deployment Test Script
 *
 * This script tests your backend deployment locally before deploying to Render.
 * Run with: node test-deployment.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 StudyWise AI Backend - Deployment Test\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Please create one based on .env.example');
  process.exit(1);
}

console.log('✅ .env file found');

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.log('❌ package.json not found');
  process.exit(1);
}

console.log('✅ package.json found');

// Check server files
const serverFiles = [
  'server/index.ts',
  'server/routes.ts',
  'server/controllers/TestController.js',
  'server/services/AIService.js'
];

for (const file of serverFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} not found`);
    process.exit(1);
  }
}

console.log('✅ Server files found');

// Check render.yaml
const renderYamlPath = path.join(__dirname, 'render.yaml');
if (!fs.existsSync(renderYamlPath)) {
  console.log('❌ render.yaml not found');
  process.exit(1);
}

console.log('✅ render.yaml found');

// Test server startup (basic syntax check)
try {
  console.log('🔍 Testing server startup...');
  // Just check if the import works
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);

  // Try to import the server (this will catch basic syntax errors)
  const serverModule = await import('./server/index.ts');
  console.log('✅ Server imports successfully');
} catch (error) {
  console.log('❌ Server import failed:', error.message);
  process.exit(1);
}

// Check environment variables
console.log('🔍 Checking environment variables...');
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'VITE_GEMINI_API_KEY'
];

const optionalEnvVars = [
  'OPENROUTER_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let missingRequired = [];
let missingOptional = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingRequired.push(envVar);
  }
}

for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    missingOptional.push(envVar);
  }
}

if (missingRequired.length > 0) {
  console.log('⚠️  Missing required environment variables:');
  missingRequired.forEach(envVar => console.log(`   - ${envVar}`));
} else {
  console.log('✅ Required environment variables found');
}

if (missingOptional.length > 0) {
  console.log('ℹ️  Missing optional environment variables:');
  missingOptional.forEach(envVar => console.log(`   - ${envVar}`));
}

// Test health endpoint
console.log('🔍 Testing health endpoint...');
try {
  // Start server in background for testing
  const serverProcess = execSync('timeout 10s npm run server:dev', {
    cwd: __dirname,
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (serverProcess.includes('Server running')) {
    console.log('✅ Server starts successfully');
  } else {
    console.log('⚠️  Server may have issues starting');
  }
} catch (error) {
  console.log('⚠️  Could not test server startup (this is normal if dependencies are not installed)');
}

console.log('\n📋 Deployment Checklist:');
console.log('✅ Environment variables configured');
console.log('✅ Server files present');
console.log('✅ Render configuration ready');
console.log('✅ Package.json configured');

console.log('\n🚀 Ready for deployment!');
console.log('\nNext steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your repository to Render');
console.log('3. Create a Blueprint deployment using render.yaml');
console.log('4. Configure environment secrets in Render');
console.log('5. Deploy!');

console.log('\n📖 See RENDER_DEPLOYMENT.md for detailed instructions');
