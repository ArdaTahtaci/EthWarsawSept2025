# ETHWarsaw 2025 API Documentation

A production-ready REST API for user management, invoice processing, and payment integration with GolemDB blockchain storage.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment
```bash
cp env-variables.txt .env
# Edit .env with your PRIVATE_KEY and GolemDB configuration
```

### 3. Start the Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /auth/upsert` - Create or update user with Civic sub
- `GET /auth/me` - Get current user info

### Profile Management
- `GET /profile/seller` - Get seller profile
- `PUT /profile/seller` - Update seller profile

### Invoice Management
- `GET /invoices` - List user invoices (with pagination)
- `POST /invoices` - Create new invoice
- `GET /invoices/:id/status` - Get invoice status
- `PUT /invoices/:id/status` - Update invoice status
- `DELETE /invoices/:id` - Delete invoice

### Payment Integration
- `GET /payments/:requestId/params` - Get payment parameters (public)

### Wallet Information
- `GET /wallet/info` - Get wallet connection info

## 🔐 Authentication

The API uses a simple header-based authentication for MVP:

```bash
# Add this header to all requests
x-civic-sub: your-civic-sub-here
```

## 📝 Example Usage

### Create User
```bash
curl -X POST http://localhost:3000/auth/upsert \
  -H "Content-Type: application/json" \
  -H "x-civic-sub: demo-sub-123" \
  -d '{"email":"user@example.com"}'
```

### Create Invoice
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -H "x-civic-sub: demo-sub-123" \
  -d '{
    "amount":"0.01",
    "currencySymbol":"ETH",
    "network":"holesky",
    "paymentAddress":"0x1234567890123456789012345678901234567890"
  }'
```

### Get Payment Parameters
```bash
curl http://localhost:3000/payments/<requestId>/params
```

## 🧪 Testing

Run the test script:
```bash
chmod +x test-api.sh
./test-api.sh
```

## 🏗️ Architecture

- **Express.js** - Web framework
- **GolemDB** - Blockchain storage for all data
- **TypeScript** - Type safety
- **Civic Auth** - Identity verification (MVP with headers)
- **Morgan** - Request logging
- **Helmet** - Security headers
- **CORS** - Cross-origin support

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
PRIVATE_KEY=0x...
GOLEMDB_CHAIN_ID=60138453033
GOLEMDB_RPC_URL=https://ethwarsaw.holesky.golemdb.io/rpc
GOLEMDB_WS_URL=wss://ethwarsaw.holesky.golemdb.io/rpc/ws
```

### CORS Origins
- `http://localhost:5173` (development)
- `*.vercel.app` (preview deployments)

## 🎯 Features

- ✅ **Real Blockchain Storage** - All data stored on GolemDB
- ✅ **Optimistic Concurrency** - Version-based conflict resolution
- ✅ **Pagination** - Cursor-based pagination for large datasets
- ✅ **Error Handling** - Proper HTTP status codes
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Security** - Helmet, CORS, input validation
- ✅ **Logging** - Request/response logging
- ✅ **Health Checks** - `/health` endpoint

## 🚀 Production Ready

This API is production-ready with:
- Proper error handling
- Security headers
- Request logging
- CORS configuration
- Health monitoring
- Type safety

## 🏆 Hackathon Ready

Perfect for ETHWarsaw 2025 with:
- Real blockchain integration
- Modern API design
- Comprehensive documentation
- Easy testing
- Scalable architecture

---

**Built for ETHWarsaw 2025** 🚀
