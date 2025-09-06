# GolemDB Test Suite - ETHWarsaw 2025

This directory contains comprehensive tests for the GolemDB integration.

## 🧪 Test Files

### 1. `unit.test.ts` - Unit Tests
Tests individual utility functions and data structures without blockchain interaction.

**What it tests:**
- UUID generation
- Date handling and normalization
- Base64 encoding/decoding
- String normalization
- Annotation query formats
- Entity key validation
- Pagination structures
- Custom error types

**Run with:**
```bash
npm run test:unit
```

### 2. `golemdb.test.ts` - Integration Tests
Tests the full GolemDB integration with real blockchain operations.

**What it tests:**
- Client connection to ETHWarsaw testnet
- User repository CRUD operations
- Invoice repository CRUD operations
- Annotation-based queries
- Optimistic concurrency control
- Date normalization in practice
- Pagination functionality
- Error handling
- Data cleanup

**Run with:**
```bash
npm run test
```

## 🚀 Running Tests

### Prerequisites
1. **Environment Setup:**
   ```bash
   cp env-variables.txt .env
   # Edit .env with your PRIVATE_KEY
   ```

2. **Get Test ETH:**
   - Visit: https://ethwarsaw.holesky.golemdb.io/faucet
   - Get test ETH for your wallet

### Test Commands

```bash
# Run unit tests only (fast, no blockchain)
npm run test:unit

# Run integration tests (requires blockchain connection)
npm run test

# Run all tests
npm run test:all
```

## 📊 Test Coverage

### Unit Tests Coverage
- ✅ **Data Validation**: UUID, dates, strings, entity keys
- ✅ **Encoding/Decoding**: Base64, JSON serialization
- ✅ **Query Formats**: Annotation query syntax
- ✅ **Error Handling**: Custom error types
- ✅ **Data Structures**: Pagination, filters

### Integration Tests Coverage
- ✅ **Client Connection**: GolemDB client initialization
- ✅ **User Management**: Create, read, update, delete users
- ✅ **Invoice Management**: Create, read, update, delete invoices
- ✅ **Query Operations**: Role-based and annotation queries
- ✅ **Concurrency Control**: Optimistic locking
- ✅ **Data Persistence**: Blockchain storage verification
- ✅ **Cleanup**: Proper test data removal

## 🔧 Test Configuration

### Timeouts
- **Integration Tests**: 30 seconds per test
- **Unit Tests**: No timeout (should be fast)

### Test Data
- All tests use unique identifiers (UUIDs)
- Test data is automatically cleaned up
- No conflicts with existing data

### Error Handling
- Tests verify proper error types
- Optimistic concurrency failures are expected
- Network timeouts are handled gracefully

## 📝 Test Output

### Success Example
```
🧪 Starting GolemDB Integration Tests...

🔍 Running: Client Connection
✅ PASSED: Client Connection

🔍 Running: User Creation
   👤 Created user: 123e4567-e89b-12d3-a456-426614174000
   🔑 Entity key: 0x1234567890abcdef
✅ PASSED: User Creation

📊 Test Results:
   ✅ Passed: 15
   ❌ Failed: 0
   📈 Success Rate: 100%
```

### Failure Example
```
🔍 Running: User Creation
❌ FAILED: User Creation
   Error: User creation failed - missing ID or entity key

📊 Test Results:
   ✅ Passed: 14
   ❌ Failed: 1
   📈 Success Rate: 93%

🚨 Failed Tests:
   • User Creation: User creation failed - missing ID or entity key
```

## 🐛 Troubleshooting

### Common Issues

1. **"Client not initialized"**
   - Check your `.env` file
   - Verify `PRIVATE_KEY` is set
   - Ensure you have test ETH

2. **"Test timeout"**
   - Check internet connection
   - Verify ETHWarsaw testnet is accessible
   - Try running tests again

3. **"Version conflict"**
   - This is expected for optimistic concurrency tests
   - Indicates the feature is working correctly

4. **"User not found"**
   - Test data cleanup may have failed
   - Run tests again (they create fresh data)

### Debug Mode
To see more detailed output, you can modify the test files to add more console.log statements.

## 🎯 Test Strategy

### Why These Tests?
1. **Unit Tests**: Verify core functionality without blockchain dependency
2. **Integration Tests**: Verify real blockchain operations
3. **Comprehensive Coverage**: All CRUD operations and edge cases
4. **Real Data**: Tests use actual blockchain storage
5. **Cleanup**: No test data pollution

### Test Philosophy
- **Fail Fast**: Tests stop on first failure
- **Isolated**: Each test is independent
- **Realistic**: Uses real blockchain operations
- **Comprehensive**: Covers happy path and error cases
- **Clean**: Automatic cleanup of test data

## 🏆 Success Criteria

A successful test run should show:
- ✅ 100% pass rate for unit tests
- ✅ 100% pass rate for integration tests
- ✅ All test data cleaned up
- ✅ No blockchain pollution
- ✅ All features working correctly

---

**Ready for ETHWarsaw 2025!** 🚀
