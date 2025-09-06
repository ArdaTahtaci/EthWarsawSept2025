# EthWarsaw 2025 - GolemDB Backend

A TypeScript backend project for ETHWarsaw 2025 hackathon, featuring GolemDB integration for decentralized data storage.

## 🚀 Quick Start

### Prerequisites
- Node.js 20-22
- npm >=10
- ETHWarsaw testnet ETH (get from [faucet](https://ethwarsaw.holesky.golemdb.io/faucet))

### Setup
1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env-variables.txt .env
   # Edit .env with your private key and configuration
   ```

3. **Run the demo:**
   ```bash
   npm run demo
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Core Components
- **GolemDB Integration**: Decentralized blockchain storage
- **User Repository**: Complete CRUD operations for user management
- **Invoice Repository**: Invoice management with blockchain persistence
- **Type Safety**: Full TypeScript support with proper error handling

### Key Features
- ✅ **ETHWarsaw Testnet**: Connected to official GolemDB testnet
- ✅ **Real-time Events**: WebSocket support for live updates
- ✅ **Optimistic Concurrency**: Version-based conflict resolution
- ✅ **Date Normalization**: Proper Date object handling
- ✅ **Buffer Encoding**: Reliable base64 encoding/decoding
- ✅ **Annotation Queries**: Powerful blockchain-native querying

## 🔧 Configuration

### Environment Variables
```env
# ETHWarsaw Testnet (Official)
GOLEMDB_CHAIN_ID=60138453033
GOLEMDB_RPC_URL=https://ethwarsaw.holesky.golemdb.io/rpc
GOLEMDB_WS_URL=wss://ethwarsaw.holesky.golemdb.io/rpc/ws

# Your private key (get test ETH from faucet)
PRIVATE_KEY=0x...
```

### GolemDB Resources
- **Faucet**: https://ethwarsaw.holesky.golemdb.io/faucet
- **Explorer**: https://ethwarsaw.holesky.golemdb.io/explorer
- **Dashboard**: https://ethwarsaw.holesky.golemdb.io/dashboard

## 📚 Usage Examples

### User Management
```typescript
import { GolemUserRepository } from './domains/users/user.repository.js';

const userRepo = new GolemUserRepository(client);

// Create user
const user = await userRepo.create({
  email: 'user@example.com',
  walletAddress: '0x...',
  role: 'USER'
});

// Query users
const verifiedUsers = await userRepo.queryByAnnotations('kyc_status = "verified"');
```

### Invoice Management
```typescript
import { GolemInvoiceRepository } from './domains/invoices/invoice.js';

const invoiceRepo = new GolemInvoiceRepository(client);

// Create invoice
const invoice = await invoiceRepo.create({
  userId: user.id,
  amount: '100.00',
  currency: 'USD',
  status: 'PENDING'
});

// Update status
await invoiceRepo.update(
  { id: invoice.id },
  { status: 'PAID' },
  invoice.version
);
```

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server
- `npm run demo` - Run GolemDB integration demo
- `npm run test` - Run integration tests (requires blockchain)
- `npm run test:unit` - Run unit tests (fast, no blockchain)
- `npm run test:all` - Run all tests
- `npm run build` - Build TypeScript
- `npm start` - Start production server

### Project Structure
```
src/
├── config/          # GolemDB client configuration
├── domains/         # Business logic repositories
│   ├── users/       # User management
│   └── invoices/    # Invoice management
├── types/           # TypeScript type definitions
├── examples/        # Demo and examples
└── server.ts        # Express server entry point
```

## 🧪 Testing

### Quick Test
```bash
# Run unit tests (fast, no blockchain needed)
npm run test:unit

# Run integration tests (requires blockchain connection)
npm run test

# Run all tests
npm run test:all
```

### Test Coverage
- ✅ **Unit Tests**: Data validation, encoding, error handling
- ✅ **Integration Tests**: Full GolemDB operations with real blockchain
- ✅ **Comprehensive**: All CRUD operations and edge cases
- ✅ **Clean**: Automatic test data cleanup

See [Test Documentation](./src/tests/README.md) for detailed information.

## 🎯 Hackathon Ready

This project is optimized for ETHWarsaw 2025 hackathon with:
- **Production-ready code** with proper error handling
- **Real blockchain integration** using GolemDB
- **Type-safe development** with comprehensive TypeScript support
- **Comprehensive test suite** with unit and integration tests
- **Demo included** to verify everything works

## 📖 Documentation

- [GolemDB Getting Started](https://event.golemdb.io/getting-started/ts)
- [ETHWarsaw Testnet](https://ethwarsaw.holesky.golemdb.io/)
- [TypeScript Documentation](./src/types/golemdb.ts)

---

**Built for ETHWarsaw 2025** 🏆