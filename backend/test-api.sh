#!/bin/bash

# ETHWarsaw 2025 API Test Script
# Make sure your server is running: npm run dev

BASE_URL="http://localhost:3000"
CIVIC_SUB="demo-sub-123"

echo "🧪 Testing ETHWarsaw 2025 API..."
echo ""

# 1) Health check
echo "1️⃣ Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .
echo ""

# 2) Upsert user (create)
echo "2️⃣ Creating user..."
curl -s -X POST "$BASE_URL/auth/upsert" \
  -H "Content-Type: application/json" \
  -H "x-civic-sub: $CIVIC_SUB" \
  -d '{"email":"influencer@ethwarsaw2025.com"}' | jq .
echo ""

# 3) Get user info
echo "3️⃣ Getting user info..."
curl -s "$BASE_URL/auth/me" -H "x-civic-sub: $CIVIC_SUB" | jq .
echo ""

# 4) Create invoice
echo "4️⃣ Creating invoice..."
curl -s -X POST "$BASE_URL/invoices" \
  -H "Content-Type: application/json" \
  -H "x-civic-sub: $CIVIC_SUB" \
  -d '{
    "amount":"0.01",
    "currencySymbol":"ETH",
    "network":"holesky",
    "paymentAddress":"0x1234567890123456789012345678901234567890",
    "description":"ETHWarsaw 2025 Hackathon Demo"
  }' | jq .
echo ""

# 5) List invoices
echo "5️⃣ Listing invoices..."
curl -s "$BASE_URL/invoices?limit=5" -H "x-civic-sub: $CIVIC_SUB" | jq .
echo ""

# 6) Get wallet info
echo "6️⃣ Getting wallet info..."
curl -s "$BASE_URL/wallet/info" -H "x-civic-sub: $CIVIC_SUB" | jq .
echo ""

echo "✅ API test completed!"
echo ""
echo "💡 To test payment params, use the requestId from the invoice creation:"
echo "curl $BASE_URL/payments/<requestId>/params"
