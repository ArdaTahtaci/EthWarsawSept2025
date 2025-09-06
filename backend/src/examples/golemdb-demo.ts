/* ============================================================================
 * GolemDB Demo - ETHWarsaw 2025 Integration Example
 * ========================================================================== */

import { makeGolemClient } from '../config/golemdb.js';
import { GolemUserRepository } from '../repository/users/user.repository.js';
import { GolemInvoiceRepository } from '../repository/invoices/invoice.js';
import { randomUUID } from 'crypto';

async function demoGolemDBIntegration() {
  console.log('🚀 Starting GolemDB ETHWarsaw 2025 Demo...\n');

  try {
    // 1. Initialize GolemDB client
    console.log('📡 Connecting to GolemDB...');
    const client = await makeGolemClient();
    console.log('✅ Connected to GolemDB successfully!\n');

    // 2. Initialize repositories
    console.log('🏗️  Initializing repositories...');
    const userRepo = new GolemUserRepository(client);
    const invoiceRepo = new GolemInvoiceRepository(client);
    console.log('✅ Repositories initialized!\n');

    // 3. Create a test user
    console.log('👤 Creating test user...');
    const testUser = await userRepo.create({
      civicSub: 'demo-user-' + randomUUID(),
      email: 'demo@ethwarsaw2025.com',
      emailVerified: true,
      walletAddress: '0x' + randomUUID().replace(/-/g, '').substring(0, 40),
      walletKind: 'ethereum',
      role: 'USER',
      isActive: true,
      kycStatus: 'verified',
      businessName: 'ETHWarsaw 2025 Demo',
      preferredCurrency: 'USD',
      preferredNetwork: 'ethereum',
      meta: {
        source: 'demo',
        hackathon: 'ETHWarsaw 2025'
      }
    });
    console.log(`✅ User created: ${testUser.entity.id}`);
    console.log(`   Entity Key: ${testUser.entity.entityKey}\n`);

    // 4. Create a test invoice
    console.log('📄 Creating test invoice...');
    const testInvoice = await invoiceRepo.create({
      userId: testUser.entity.id,
      number: 'INV-' + Date.now(),
      amount: '100.00',
      currency: 'USD',
      status: 'PENDING',
      paymentAddress: '0x' + randomUUID().replace(/-/g, '').substring(0, 40),
      network: 'ethereum',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      clientName: 'ETHWarsaw 2025',
      clientEmail: 'client@ethwarsaw2025.com',
      serviceType: 'Hackathon Demo',
      preferredCurrency: 'USD',
      preferredNetwork: 'ethereum',
      meta: {
        hackathon: 'ETHWarsaw 2025',
        demo: true
      }
    });
    console.log(`✅ Invoice created: ${testInvoice.entity.id}`);
    console.log(`   Invoice Number: ${testInvoice.entity.number}`);
    console.log(`   Amount: ${testInvoice.entity.amount} ${testInvoice.entity.currency}\n`);

    // 5. Query users by role
    console.log('🔍 Querying users by role...');
    const users = await userRepo.findByRole('USER', { limit: 10 });
    console.log(`✅ Found ${users.items.length} users with role 'USER'\n`);

    // 6. Query invoices by user
    console.log('🔍 Querying invoices by user...');
    const userInvoices = await invoiceRepo.listByUser(testUser.entity.id, { limit: 10 });
    console.log(`✅ Found ${userInvoices.items.length} invoices for user\n`);

    // 7. Update user status
    console.log('✏️  Updating user status...');
    const updatedUser = await userRepo.activateUser(
      testUser.entity.id, 
      testUser.entity.version!
    );
    console.log(`✅ User activated! New version: ${updatedUser.entity.version}\n`);

    // 8. Update invoice status
    console.log('✏️  Updating invoice status...');
    const updatedInvoice = await invoiceRepo.update(
      { id: testInvoice.entity.id },
      { 
        status: 'PAID',
        paidAt: new Date()
      },
      testInvoice.entity.version!
    );
    console.log(`✅ Invoice marked as paid! New version: ${updatedInvoice.entity.version}\n`);

    // 9. Demonstrate annotation queries
    console.log('🔍 Demonstrating annotation queries...');
    const verifiedUsers = await userRepo.queryByAnnotations('kyc_status = "verified"', { limit: 5 });
    console.log(`✅ Found ${verifiedUsers.items.length} verified users via annotation query\n`);

    const pendingInvoices = await invoiceRepo.queryByAnnotations('status = "PENDING"', { limit: 5 });
    console.log(`✅ Found ${pendingInvoices.items.length} pending invoices via annotation query\n`);

    // 10. Clean up demo data
    console.log('🧹 Cleaning up demo data...');
    await userRepo.delete({ id: testUser.entity.id });
    await invoiceRepo.delete({ id: testInvoice.entity.id });
    console.log('✅ Demo data cleaned up!\n');

    console.log('🎉 GolemDB ETHWarsaw 2025 Demo completed successfully!');
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   ✅ GolemDB client connection');
    console.log('   ✅ User repository CRUD operations');
    console.log('   ✅ Invoice repository CRUD operations');
    console.log('   ✅ Annotation-based queries');
    console.log('   ✅ Optimistic concurrency control');
    console.log('   ✅ Date normalization');
    console.log('   ✅ Buffer-based base64 encoding');
    console.log('   ✅ Real blockchain storage');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoGolemDBIntegration();
}

export { demoGolemDBIntegration };
