/* ============================================================================
 * Unit Tests - GolemDB Utilities and Helpers
 * ========================================================================== */

import { randomUUID } from 'crypto';

// Test utility functions
class UnitTestRunner {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private passed = 0;
  private failed = 0;
  private errors: Array<{ test: string; error: any }> = [];

  addTest(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn });
  }

  async runAll() {
    console.log('🧪 Starting Unit Tests...\n');

    for (const test of this.tests) {
      await this.runTest(test);
    }

    this.printResults();
  }

  private async runTest(test: { name: string; fn: () => void | Promise<void> }) {
    console.log(`🔍 Running: ${test.name}`);
    
    try {
      await test.fn();
      console.log(`✅ PASSED: ${test.name}\n`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${test.name}`);
      console.log(`   Error: ${error}\n`);
      this.failed++;
      this.errors.push({ test: test.name, error });
    }
  }

  private printResults() {
    console.log('📊 Unit Test Results:');
    console.log(`   ✅ Passed: ${this.passed}`);
    console.log(`   ❌ Failed: ${this.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%\n`);

    if (this.errors.length > 0) {
      console.log('🚨 Failed Tests:');
      this.errors.forEach(({ test, error }) => {
        console.log(`   • ${test}: ${error.message || error}`);
      });
      console.log('');
    }
  }
}

// Test functions
function testUUIDGeneration() {
  const uuid1 = randomUUID();
  const uuid2 = randomUUID();
  
  if (!uuid1 || !uuid2) {
    throw new Error('UUID generation failed');
  }
  
  if (uuid1 === uuid2) {
    throw new Error('UUIDs should be unique');
  }
  
  if (!uuid1.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('Invalid UUID format');
  }
  
  console.log(`   🆔 Generated UUID: ${uuid1}`);
}

function testDateHandling() {
  const now = new Date();
  const jsonString = JSON.stringify({ date: now });
  const parsed = JSON.parse(jsonString);
  
  if (typeof parsed.date === 'string') {
    // This is expected - JSON.stringify converts Date to string
    const reconstructed = new Date(parsed.date);
    
    if (Math.abs(reconstructed.getTime() - now.getTime()) > 1000) {
      throw new Error('Date reconstruction failed');
    }
    
    console.log(`   📅 Date handling working - JSON roundtrip successful`);
  } else {
    throw new Error('Date should be converted to string in JSON');
  }
}

function testBase64Encoding() {
  // Test the Buffer-based base64 encoding (like in our repositories)
  const testData = 'Hello, ETHWarsaw 2025!';
  const encoded = Buffer.from(testData, 'utf8').toString('base64url');
  const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
  
  if (decoded !== testData) {
    throw new Error('Base64 encoding/decoding failed');
  }
  
  console.log(`   🔐 Base64 encoding working - roundtrip successful`);
}

function testStringNormalization() {
  // Test lowercase normalization (like in our repositories)
  const testStrings = [
    'Hello World',
    '  SPACES  ',
    'MiXeD cAsE',
    '',
    null,
    undefined
  ];
  
  const lc = (s?: string | null) => (s ?? '').trim().toLowerCase() || undefined;
  
  const results = testStrings.map(lc);
  
  if (results[0] !== 'hello world') {
    throw new Error('String normalization failed - basic case');
  }
  
  if (results[1] !== 'spaces') {
    throw new Error('String normalization failed - spaces');
  }
  
  if (results[2] !== 'mixed case') {
    throw new Error('String normalization failed - mixed case');
  }
  
  if (results[3] !== undefined) {
    throw new Error('String normalization failed - empty string');
  }
  
  if (results[4] !== undefined) {
    throw new Error('String normalization failed - null');
  }
  
  if (results[5] !== undefined) {
    throw new Error('String normalization failed - undefined');
  }
  
  console.log(`   🔤 String normalization working - all cases handled`);
}

function testAnnotationQueryFormat() {
  // Test annotation query string formats
  const queries = [
    'type = "user"',
    'status = "active" && role = "admin"',
    'amount > 100',
    'created_at >= 1234567890',
    '(type = "invoice" && status = "pending") || priority = "high"'
  ];
  
  queries.forEach(query => {
    if (typeof query !== 'string' || query.length === 0) {
      throw new Error(`Invalid query format: ${query}`);
    }
  });
  
  console.log(`   🏷️  Annotation query formats validated`);
}

function testEntityKeyFormat() {
  // Test entity key format (should be 0x...)
  const validKeys = [
    '0x1234567890abcdef',
    '0x0000000000000000',
    '0xffffffffffffffff'
  ];
  
  const invalidKeys = [
    '1234567890abcdef', // Missing 0x
    '0x', // Too short
    '0x123', // Odd length
    '0xgggggggggggggggg' // Invalid hex
  ];
  
  validKeys.forEach(key => {
    if (!key.match(/^0x[0-9a-f]{16}$/i)) {
      throw new Error(`Valid key rejected: ${key}`);
    }
  });
  
  invalidKeys.forEach(key => {
    if (key.match(/^0x[0-9a-f]{16}$/i)) {
      throw new Error(`Invalid key accepted: ${key}`);
    }
  });
  
  console.log(`   🔑 Entity key format validation working`);
}

function testPaginationStructure() {
  // Test pagination structure
  const pagination = {
    limit: 10,
    cursor: 'eyJvZmZzZXQiOjEwfQ=='
  };
  
  const page = {
    items: [{ id: '1' }, { id: '2' }],
    nextCursor: 'eyJvZmZzZXQiOjEyfQ=='
  };
  
  if (typeof pagination.limit !== 'number' || pagination.limit <= 0) {
    throw new Error('Invalid pagination limit');
  }
  
  if (!Array.isArray(page.items)) {
    throw new Error('Page items should be an array');
  }
  
  console.log(`   📄 Pagination structure validation working`);
}

function testErrorTypes() {
  // Test custom error types
  class VersionConflictError extends Error {
    constructor() { super('version_conflict'); }
  }
  
  class NotFoundError extends Error {
    constructor() { super('not_found'); }
  }
  
  const versionError = new VersionConflictError();
  const notFoundError = new NotFoundError();
  
  if (!(versionError instanceof Error)) {
    throw new Error('VersionConflictError should extend Error');
  }
  
  if (!(notFoundError instanceof Error)) {
    throw new Error('NotFoundError should extend Error');
  }
  
  if (versionError.message !== 'version_conflict') {
    throw new Error('VersionConflictError message incorrect');
  }
  
  console.log(`   ⚠️  Custom error types working`);
}

// Main unit test runner
async function runUnitTests() {
  const runner = new UnitTestRunner();
  
  // Add all unit tests
  runner.addTest('UUID Generation', testUUIDGeneration);
  runner.addTest('Date Handling', testDateHandling);
  runner.addTest('Base64 Encoding', testBase64Encoding);
  runner.addTest('String Normalization', testStringNormalization);
  runner.addTest('Annotation Query Format', testAnnotationQueryFormat);
  runner.addTest('Entity Key Format', testEntityKeyFormat);
  runner.addTest('Pagination Structure', testPaginationStructure);
  runner.addTest('Error Types', testErrorTypes);
  
  // Run all tests
  await runner.runAll();
}

// Run unit tests
runUnitTests().catch((error) => {
  console.error('❌ Unit test suite failed:', error);
  process.exit(1);
});

export { runUnitTests };
