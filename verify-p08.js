#!/usr/bin/env node

/**
 * P08 Verification Script
 * Checks that all test files and configurations are present
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  // Test configs
  'vitest.config.ts',
  'vitest.integration.config.ts',
  'playwright.config.ts',
  
  // Test setup
  'tests/setup.ts',
  'tests/integration/setup.ts',
  
  // Unit tests
  'src/lib/utils.test.ts',
  
  // Integration tests
  'tests/integration/delivered-idempotency.test.ts',
  'tests/integration/snapshot-integrity.test.ts',
  'tests/integration/cancel-rule.test.ts',
  'tests/integration/return-window.test.ts',
  'tests/integration/replacement-link.test.ts',
  
  // E2E tests
  'tests/e2e/checkout-flow.spec.ts',
  'tests/e2e/warranty-generation.spec.ts',
  'tests/e2e/return-replacement.spec.ts',
  
  // Documentation
  'TEST_REPORT.md',
  'TESTING.md',
  'P08_SUMMARY.md',
];

const requiredScripts = [
  'test',
  'test:watch',
  'test:integration',
  'test:e2e',
  'test:e2e:ui',
];

console.log('🔍 P08 Verification\n');
console.log('='.repeat(60));

// Check files
console.log('\n📁 Checking required files...\n');
let filesOk = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, file));
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) filesOk = false;
}

// Check package.json scripts
console.log('\n📜 Checking package.json scripts...\n');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
let scriptsOk = true;
for (const script of requiredScripts) {
  const exists = packageJson.scripts && packageJson.scripts[script];
  const status = exists ? '✅' : '❌';
  console.log(`${status} npm run ${script}`);
  if (!exists) scriptsOk = false;
}

// Check dependencies
console.log('\n📦 Checking test dependencies...\n');
const requiredDevDeps = [
  '@playwright/test',
  '@testing-library/jest-dom',
  '@testing-library/react',
  '@vitejs/plugin-react',
  'jsdom',
  'vitest',
];

let depsOk = true;
for (const dep of requiredDevDeps) {
  const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
  const status = exists ? '✅' : '❌';
  const version = exists ? packageJson.devDependencies[dep] : 'missing';
  console.log(`${status} ${dep}@${version}`);
  if (!exists) depsOk = false;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');

const allOk = filesOk && scriptsOk && depsOk;

console.log(`Files:        ${filesOk ? '✅ All present' : '❌ Missing files'}`);
console.log(`Scripts:      ${scriptsOk ? '✅ All configured' : '❌ Missing scripts'}`);
console.log(`Dependencies: ${depsOk ? '✅ All installed' : '❌ Missing deps'}`);

console.log('\n' + '='.repeat(60));

if (allOk) {
  console.log('\n🎉 P08 VERIFICATION PASSED!\n');
  console.log('All test files, scripts, and dependencies are in place.');
  console.log('\nTo run tests:');
  console.log('  npm test                  # Unit tests');
  console.log('  npm run test:integration  # Integration tests');
  console.log('  npm run test:e2e          # E2E tests\n');
  process.exit(0);
} else {
  console.log('\n❌ P08 VERIFICATION FAILED!\n');
  console.log('Some required files or configurations are missing.');
  console.log('Please check the output above for details.\n');
  process.exit(1);
}
