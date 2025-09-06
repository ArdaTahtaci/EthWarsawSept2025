/* ============================================================================
 * GolemDB Integration Tests - ETHWarsaw 2025
 * ========================================================================== */

import { makeGolemClient } from '../config/golemdb.js';
import { GolemUserRepository } from '../repository/users/user.repository.js';
import { GolemInvoiceRepository } from '../repository/invoices/invoice.js';
import { randomUUID } from 'crypto';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for blockchain operations
const CLEANUP_DELAY = 2000; // 2 seconds delay between operations

interface TestContext {
  client: any;
  userRepo: GolemUserRepository;
  invoiceRepo: GolemInvoiceRepository;
  testUser?: any;
  testInvoice?: any;
}

class TestRunner {
  private tests: Array<{ name: string; fn: (ctx: TestContext) => Promise<void> }> = [];
  private passed = 0;
  private failed = 0;
  private errors: Array<{ test: string; error: any }> = [];

  addTest(name: string, fn: (ctx: TestContext) => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async runAll() {
    console.log('🧪 Starting GolemDB Integration Tests...\n');
    
    // Initialize test context
    const ctx: TestContext = {
      client: await makeGolemClient(),
      userRepo: new GolemUserRepository(await makeGolemClient()),
      invoiceRepo: new GolemInvoiceRepository(await makeGolemClient())
    };

    console.log('✅ Test context initialized\n');

    // Run all tests
    for (const test of this.tests) {
      await this.runTest(test, ctx);
    }

    // Print results
    this.printResults();
  }

  private async runTest(test: { name: string; fn: (ctx: TestContext) => Promise<void> }, ctx: TestContext) {
    console.log(`🔍 Running: ${test.name}`);
    
    try {
      await Promise.race([
        test.fn(ctx),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
      ]);
      
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
    console.log('📊 Test Results:');
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
async function testClientConnection(ctx: TestContext) {
  if (!ctx.client) {
    throw new Error('Client not initialized');
  }
  
  // Test basic client functionality
  const ownerAddress = await ctx.client.getOwnerAddress();
  if (!ownerAddress || !ownerAddress.startsWith('0x')) {
    throw new Error('Invalid owner address returned');
  }
  
  console.log(`   📍 Connected with address: ${ownerAddress}`);
}

async function testUserCreation(ctx: TestContext) {
  const testUserData = {
    civicSub: 'test-user-' + randomUUID(),
    email: 'test@ethwarsaw2025.com',
    emailVerified: true,
    walletAddress: '0x' + randomUUID().replace(/-/g, '').substring(0, 40),
    walletKind: 'ethereum' as const,
    role: 'USER' as const,
    isActive: true,
    kycStatus: 'verified' as const,
    businessName: 'Test Business',
    preferredCurrency: 'USD',
    preferredNetwork: 'ethereum',
    meta: {
      test: true,
      timestamp: Date.now()
    }
  };

  const result = await ctx.userRepo.create(testUserData);
  
  if (!result.entity.id || !result.entity.entityKey) {
    throw new Error('User creation failed - missing ID or entity key');
  }
  
  if (result.entity.email !== testUserData.email) {
    throw new Error('User creation failed - email mismatch');
  }
  
  ctx.testUser = result.entity;
  console.log(`   👤 Created user: ${result.entity.id}`);
  console.log(`   🔑 Entity key: ${result.entity.entityKey}`);
}

async function testUserRetrieval(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not created');
  }

  const retrievedUser = await ctx.userRepo.read(ctx.testUser.id);
  
  if (!retrievedUser) {
    throw new Error('User retrieval failed - user not found');
  }
  
  if (retrievedUser.id !== ctx.testUser.id) {
    throw new Error('User retrieval failed - ID mismatch');
  }
  
  console.log(`   🔍 Retrieved user: ${retrievedUser.id}`);
}

async function testUserQueryByRole(ctx: TestContext) {
  const users = await ctx.userRepo.findByRole('USER', { limit: 10 });
  
  if (!Array.isArray(users.items)) {
    throw new Error('User query failed - invalid response format');
  }
  
  console.log(`   📋 Found ${users.items.length} users with role 'USER'`);
}

async function testUserAnnotationQuery(ctx: TestContext) {
  const verifiedUsers = await ctx.userRepo.queryByAnnotations('kyc_status = "verified"', { limit: 5 });
  
  if (!Array.isArray(verifiedUsers.items)) {
    throw new Error('Annotation query failed - invalid response format');
  }
  
  console.log(`   🏷️  Found ${verifiedUsers.items.length} verified users via annotation query`);
}

async function testInvoiceCreation(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not available for invoice creation');
  }

  const testInvoiceData = {
    userId: ctx.testUser.id,
    number: 'TEST-' + Date.now(),
    amount: '250.00',
    currency: 'USD',
    status: 'PENDING' as const,
    paymentAddress: '0x' + randomUUID().replace(/-/g, '').substring(0, 40),
    network: 'ethereum',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    serviceType: 'Test Service',
    preferredCurrency: 'USD',
    preferredNetwork: 'ethereum',
    meta: {
      test: true,
      timestamp: Date.now()
    }
  };

  const result = await ctx.invoiceRepo.create(testInvoiceData);
  
  if (!result.entity.id || !result.entity.entityKey) {
    throw new Error('Invoice creation failed - missing ID or entity key');
  }
  
  if (result.entity.amount !== testInvoiceData.amount) {
    throw new Error('Invoice creation failed - amount mismatch');
  }
  
  ctx.testInvoice = result.entity;
  console.log(`   📄 Created invoice: ${result.entity.id}`);
  console.log(`   💰 Amount: ${result.entity.amount} ${result.entity.currency}`);
}

async function testInvoiceRetrieval(ctx: TestContext) {
  if (!ctx.testInvoice) {
    throw new Error('Test invoice not created');
  }

  const retrievedInvoice = await ctx.invoiceRepo.read(ctx.testInvoice.id);
  
  if (!retrievedInvoice) {
    throw new Error('Invoice retrieval failed - invoice not found');
  }
  
  if (retrievedInvoice.id !== ctx.testInvoice.id) {
    throw new Error('Invoice retrieval failed - ID mismatch');
  }
  
  console.log(`   🔍 Retrieved invoice: ${retrievedInvoice.id}`);
}

async function testInvoiceQueryByUser(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not available');
  }

  const userInvoices = await ctx.invoiceRepo.listByUser(ctx.testUser.id, { limit: 10 });
  
  if (!Array.isArray(userInvoices.items)) {
    throw new Error('Invoice query failed - invalid response format');
  }
  
  console.log(`   📋 Found ${userInvoices.items.length} invoices for user`);
}

async function testInvoiceAnnotationQuery(ctx: TestContext) {
  const pendingInvoices = await ctx.invoiceRepo.queryByAnnotations('status = "PENDING"', { limit: 5 });
  
  if (!Array.isArray(pendingInvoices.items)) {
    throw new Error('Invoice annotation query failed - invalid response format');
  }
  
  console.log(`   🏷️  Found ${pendingInvoices.items.length} pending invoices via annotation query`);
}

async function testUserUpdate(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not available for update');
  }

  const updatedUser = await ctx.userRepo.activateUser(
    ctx.testUser.id,
    ctx.testUser.version!
  );
  
  if (!updatedUser.entity.version || updatedUser.entity.version <= ctx.testUser.version!) {
    throw new Error('User update failed - version not incremented');
  }
  
  ctx.testUser = updatedUser.entity; // Update context with new version
  console.log(`   ✏️  Updated user - new version: ${updatedUser.entity.version}`);
}

async function testInvoiceUpdate(ctx: TestContext) {
  if (!ctx.testInvoice) {
    throw new Error('Test invoice not available for update');
  }

  const updatedInvoice = await ctx.invoiceRepo.update(
    { id: ctx.testInvoice.id },
    { 
      status: 'PAID' as const,
      paidAt: new Date()
    },
    ctx.testInvoice.version!
  );
  
  if (!updatedInvoice.entity.version || updatedInvoice.entity.version <= ctx.testInvoice.version!) {
    throw new Error('Invoice update failed - version not incremented');
  }
  
  if (updatedInvoice.entity.status !== 'PAID') {
    throw new Error('Invoice update failed - status not updated');
  }
  
  ctx.testInvoice = updatedInvoice.entity; // Update context with new version
  console.log(`   ✏️  Updated invoice - new version: ${updatedInvoice.entity.version}`);
}

async function testOptimisticConcurrency(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not available for concurrency test');
  }

  try {
    // Try to update with wrong version (should fail)
    await ctx.userRepo.update(
      { id: ctx.testUser.id },
      { businessName: 'Should Fail' },
      ctx.testUser.version! - 1 // Wrong version
    );
    throw new Error('Optimistic concurrency test failed - should have thrown error');
  } catch (error) {
    if (error instanceof Error && error.message.includes('version')) {
      console.log(`   🔒 Optimistic concurrency working - rejected stale update`);
    } else {
      throw error;
    }
  }
}

async function testDateNormalization(ctx: TestContext) {
  if (!ctx.testUser) {
    throw new Error('Test user not available for date test');
  }

  const user = await ctx.userRepo.read(ctx.testUser.id);
  
  if (!user) {
    throw new Error('User not found for date test');
  }
  
  // Check if dates are proper Date objects
  if (user.createdAt && !(user.createdAt instanceof Date)) {
    throw new Error('Date normalization failed - createdAt is not a Date object');
  }
  
  if (user.updatedAt && !(user.updatedAt instanceof Date)) {
    throw new Error('Date normalization failed - updatedAt is not a Date object');
  }
  
  console.log(`   📅 Date normalization working - dates are proper Date objects`);
}

async function testPagination(ctx: TestContext) {
  // Test pagination with small limit
  const page1 = await ctx.userRepo.readMany({}, { limit: 1 });
  
  if (!page1.items || page1.items.length > 1) {
    throw new Error('Pagination test failed - limit not respected');
  }
  
  console.log(`   📄 Pagination working - returned ${page1.items.length} items with limit 1`);
}

async function testCleanup(ctx: TestContext) {
  console.log('🧹 Cleaning up test data...');
  
  if (ctx.testInvoice) {
    await ctx.invoiceRepo.delete({ id: ctx.testInvoice.id });
    console.log(`   🗑️  Deleted test invoice: ${ctx.testInvoice.id}`);
  }
  
  if (ctx.testUser) {
    await ctx.userRepo.delete({ id: ctx.testUser.id });
    console.log(`   🗑️  Deleted test user: ${ctx.testUser.id}`);
  }
  
  console.log('   ✅ Cleanup completed');
}

// Main test runner
async function runTests() {
  const runner = new TestRunner();
  
  // Add all tests
  runner.addTest('Client Connection', testClientConnection);
  runner.addTest('User Creation', testUserCreation);
  runner.addTest('User Retrieval', testUserRetrieval);
  runner.addTest('User Query by Role', testUserQueryByRole);
  runner.addTest('User Annotation Query', testUserAnnotationQuery);
  runner.addTest('Invoice Creation', testInvoiceCreation);
  runner.addTest('Invoice Retrieval', testInvoiceRetrieval);
  runner.addTest('Invoice Query by User', testInvoiceQueryByUser);
  runner.addTest('Invoice Annotation Query', testInvoiceAnnotationQuery);
  runner.addTest('User Update', testUserUpdate);
  runner.addTest('Invoice Update', testInvoiceUpdate);
  runner.addTest('Optimistic Concurrency', testOptimisticConcurrency);
  runner.addTest('Date Normalization', testDateNormalization);
  runner.addTest('Pagination', testPagination);
  runner.addTest('Cleanup', testCleanup);
  
  // Run all tests
  await runner.runAll();
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

export { runTests };
