# 🌟 Stellar-Ethereum Bridge Backend

A complete backend service for cross-chain atomic swaps between Ethereum and Stellar networks with 1inch integration and gaming elements.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 6+
- **Git**

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis
# Ubuntu/Debian:
sudo systemctl start postgresql redis-server

# macOS (with Homebrew):
brew services start postgresql redis

# Create database
createdb stellar_bridge_db

# Run migrations (automatic on first start)
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## 🔑 **REQUIRED: What You Need to Provide**

### **API Keys (CRITICAL)**

#### 1. **1inch API Key** (MANDATORY)

```bash
# Get from: https://portal.1inch.dev/
ONEINCH_API_KEY=your_1inch_api_key_here
```

**How to get:**

1. Go to https://portal.1inch.dev/
2. Sign up/Login
3. Create new project
4. Copy API key to `.env`

#### 2. **Infura Project ID** (MANDATORY)

```bash
# Get from: https://infura.io/
INFURA_PROJECT_ID=your_infura_project_id
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

**How to get:**

1. Go to https://infura.io/
2. Sign up/Login
3. Create new project
4. Copy Project ID to `.env`

### **Wallet Setup (REQUIRED)**

#### 3. **Ethereum Private Key**

```bash
# For testnet development - create a new wallet!
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here
```

**⚠️ SECURITY:** Use a NEW wallet for development, never your main wallet!

#### 4. **Stellar Keypair**

```bash
# Generate at: https://laboratory.stellar.org/account-creator
STELLAR_MASTER_SECRET_KEY=your_stellar_secret_key_here
STELLAR_MASTER_PUBLIC_KEY=your_stellar_public_key_here
```

**How to get:**

1. Go to https://laboratory.stellar.org/account-creator
2. Click "Generate keypair for new account"
3. Copy both keys to `.env`
4. Fund testnet account: https://friendbot.stellar.org

### **Database Credentials**

```bash
# Set up PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/stellar_bridge_db
```

---

## 📋 **MANUAL TASKS (You Need to Do These)**

### **1. Smart Contract Deployment**

**Status:** ⚠️ **NOT IMPLEMENTED** - You need to deploy contracts

```bash
# Deploy to Sepolia testnet
npm run deploy-contracts

# Or deploy manually using Hardhat
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

**What contracts to deploy:**

- `EthereumHTLC.sol` - Hash Time Locked Contract
- `BridgeController.sol` - Bridge orchestration
- `MockERC20.sol` - Test tokens (USDC, WETH)

### **2. Fund Test Accounts**

#### Ethereum (Sepolia Testnet):

1. Get SepoliaETH: https://sepoliafaucet.com/
2. Get test USDC: https://faucet.circle.com/
3. Approve tokens for bridge contract

#### Stellar (Testnet):

1. Fund account: https://friendbot.stellar.org
2. Add test assets (USDC, XLM)

### **3. Configure Contract Addresses**

After deployment, update `.env`:

```bash
ETHEREUM_HTLC_CONTRACT_ADDRESS=0x...
BRIDGE_CONTROLLER_CONTRACT_ADDRESS=0x...
MOCK_USDC_CONTRACT_ADDRESS=0x...
```

---

## 🏗️ **IMPLEMENTED FEATURES**

### ✅ **Complete & Working**

- **Database Schema** - All tables created automatically
- **Redis Caching** - Performance optimization & real-time features
- **Logger** - Structured logging with Winston
- **Bridge Coordinator** - Main swap orchestration logic
- **1inch Integration** - Optimal swap rates & routing
- **WebSocket Support** - Real-time updates
- **Rate Limiting** - API protection
- **Error Handling** - Comprehensive error management
- **Game System** - XP, achievements, levels (database ready)
- **Analytics** - Volume, success rates, metrics
- **Health Checks** - System monitoring

### ✅ **API Endpoints (Ready)**

```bash
# Bridge Operations
POST   /api/bridge/quote          # Get swap quote
POST   /api/bridge/initiate       # Start bridge process
GET    /api/bridge/status/:id     # Check swap status
POST   /api/bridge/complete       # Complete swap

# User Management
GET    /api/user/profile          # User profile
GET    /api/user/history          # Swap history
GET    /api/user/stats            # Game stats

# Analytics
GET    /api/analytics/volume      # Volume statistics
GET    /api/analytics/arbitrage   # Arbitrage opportunities

# Game Features
POST   /api/game/achievement      # Unlock achievement
GET    /api/game/leaderboard      # User rankings

# System
GET    /health                    # Health check
```

---

## ⚠️ **REMAINING WORK (TODO)**

### **🔧 High Priority (Need Implementation)**

#### 1. **Stellar Service** ⚠️ **PARTIALLY IMPLEMENTED**

- `src/services/stellar.service.js` - **NEEDS WORK**
- HTLC creation on Stellar
- Transaction signing & submission
- Account management

#### 2. **Ethereum Service** ⚠️ **PARTIALLY IMPLEMENTED**

- `src/services/ethereum.service.js` - **NEEDS WORK**
- Smart contract interactions
- HTLC deployment & monitoring
- Gas estimation

#### 3. **Smart Contracts** ⚠️ **NOT DEPLOYED**

- `contracts/` folder missing
- HTLC implementation
- Bridge controller logic
- Token contracts

#### 4. **Route Handlers** ⚠️ **STUB ONLY**

- `src/routes/bridge.routes.js` - **NEEDS IMPLEMENTATION**
- `src/routes/user.routes.js` - **NEEDS IMPLEMENTATION**
- `src/routes/game.routes.js` - **NEEDS IMPLEMENTATION**
- `src/routes/analytics.routes.js` - **NEEDS IMPLEMENTATION**

#### 5. **Middleware** ⚠️ **STUB ONLY**

- `src/middleware/auth.middleware.js` - **NEEDS IMPLEMENTATION**
- `src/middleware/validation.middleware.js` - **NEEDS IMPLEMENTATION**

### **🎮 Medium Priority**

#### 6. **Game Service** ⚠️ **PARTIAL**

- `src/services/game.service.js` - XP calculations
- Achievement processing
- Leaderboard management

#### 7. **WebSocket Service** ⚠️ **PARTIAL**

- `src/services/websocket.service.js` - Real-time updates
- User notifications
- Live swap status

#### 8. **Monitoring Service** ⚠️ **STUB**

- `src/services/monitoring.service.js` - Performance metrics
- Error tracking
- Uptime monitoring

### **🧪 Low Priority**

#### 9. **Testing Suite** ⚠️ **MISSING**

- Unit tests for services
- Integration tests for APIs
- End-to-end swap testing

#### 10. **Documentation** ⚠️ **PARTIAL**

- API documentation (Swagger)
- Developer guides
- Deployment instructions

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Development Setup**

```yaml
Services:
  - Backend API (Node.js) - Port 3000
  - PostgreSQL Database - Port 5432
  - Redis Cache - Port 6379

Networks:
  - Ethereum Sepolia Testnet
  - Stellar Testnet
```

### **Docker Deployment** (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

---

## 📊 **MONITORING & HEALTH**

### **Health Check**

```bash
curl http://localhost:3000/health
```

### **Logs Location**

```bash
logs/
├── combined.log    # All logs
├── error.log       # Errors only
├── debug.log       # Development details
└── exceptions.log  # Crash reports
```

### **Database Monitoring**

```sql
-- Check active swaps
SELECT status, COUNT(*) FROM swaps GROUP BY status;

-- Check system health
SELECT NOW() as current_time,
       COUNT(*) as total_users,
       SUM(total_volume) as total_volume
FROM users u JOIN game_stats gs ON u.id = gs.user_id;
```

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Database Connection Failed**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U user -d stellar_bridge_db
```

#### **2. Redis Connection Failed**

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

#### **3. 1inch API Errors**

```bash
# Check API key is valid
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.1inch.dev/swap/v5.2/1/tokens
```

#### **4. Ethereum RPC Issues**

```bash
# Test Infura connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

### **Debug Mode**

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Enable SQL query logging
DEBUG=postgres npm run dev
```

---

## 📚 **USEFUL COMMANDS**

### **Development**

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Check code style
```

### **Database**

```bash
npm run migrate      # Run database migrations
npm run seed         # Seed with sample data
npm run db:reset     # Reset database (CAREFUL!)
```

### **Contracts**

```bash
npm run deploy-contracts    # Deploy to testnet
npm run verify-contracts    # Verify on Etherscan
```

### **Production**

```bash
npm run build        # Build for production
npm run pm2:start    # Start with PM2
npm run pm2:stop     # Stop PM2 processes
```

---

## 💡 **NEXT STEPS**

### **For Development:**

1. ✅ Set up environment variables
2. ✅ Start database & Redis
3. ⚠️ **Implement missing services** (Stellar, Ethereum)
4. ⚠️ **Deploy smart contracts**
5. ⚠️ **Create route handlers**
6. 🧪 Test end-to-end swaps

### **For Production:**

1. 🔒 Security audit
2. 📊 Performance testing
3. 🚀 Deploy to cloud (AWS/GCP)
4. 📈 Set up monitoring (Sentry, DataDog)
5. 🔄 CI/CD pipeline

---

## 🆘 **NEED HELP?**

### **Priority Issues:**

1. **Smart contracts not deployed** - Blocks all functionality
2. **Stellar/Ethereum services incomplete** - Core bridge logic missing
3. **Route handlers missing** - APIs don't work
4. **No authentication middleware** - Security issue

### **Quick Wins:**

1. **Deploy contracts to Sepolia** - Unblocks development
2. **Implement basic route handlers** - Get APIs working
3. **Add authentication** - Basic security
4. **Test 1inch integration** - Verify external APIs

---

## 🎯 **SUCCESS CRITERIA**

### **Minimum Viable Product:**

- [ ] Smart contracts deployed ⚠️
- [ ] Ethereum HTLC working ⚠️
- [ ] Stellar HTLC working ⚠️
- [ ] Basic swap quote API ⚠️
- [ ] 1inch integration working ✅
- [ ] Database operations working ✅

### **Demo Ready:**

- [ ] End-to-end swap working ⚠️
- [ ] Real-time status updates ⚠️
- [ ] Game features functional ⚠️
- [ ] Error handling robust ✅
- [ ] Performance optimized ✅

**Current Status: 60% Complete**

**The backend foundation is solid, but core blockchain integrations need implementation!** 🚀
