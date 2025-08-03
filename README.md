# Asgard - Cross-Chain Bridge & DeFi Trading Platform

<div align="center">
  <div style="position: relative; display: inline-block;">
    <img src="image.png" alt="Asgard Survival Game Dashboard" width="800" style="border-radius: 12px; margin-bottom: 20px; opacity: 0.4;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background-color: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 8px;">
      <h1 style="font-size: 3.5rem; font-weight: bold; color: #f59e0b; margin: 0; letter-spacing: 2px;">ASGARD</h1>
      <p style="color: #e5e7eb; font-size: 1.1rem; margin: 10px 0 0 0; font-weight: 300;">Cross-Chain Bridge & DeFi Trading Platform</p>
    </div>
  </div>
</div>

Asgard is an immersive survival game where players navigate a post-apocalyptic crypto world where blockchain networks have become isolated islands of civilization. In this treacherous landscape, only the smartest traders and bridge masters can survive and thrive.

Players must master cross-chain asset bridging between Ethereum and Stellar networks, execute strategic DeFi trades, and compete with thousands of other survivors in a race for resources and dominance. The game combines skill-based trading challenges, interactive city exploration, and competitive survival mechanics, all powered by real blockchain technology including Hash Time Locked Contracts (HTLCs) and 1inch protocol integration.

As survivors progress through levels, they unlock advanced trading strategies, build their portfolio across multiple chains, and compete for the ultimate prize in this ultimate DeFi survival challenge.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Features](#core-features)
   - [1inch Protocol Integration](#1inch-protocol-integration)
   - [Stellar Network Integration](#stellar-network-integration)
   - [Cross-Chain Bridge](#cross-chain-bridge-ethereum--stellar)
   - [User Management](#user-management)
3. [Technical Stack](#technical-stack)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Blockchain Infrastructure](#blockchain-infrastructure)
4. [Smart Contracts](#smart-contracts)
   - [EthereumHTLC Contract](#ethereumhtlc-contract)
5. [API Endpoints](#api-endpoints)
   - [Bridge Operations](#bridge-operations)
   - [Trading Operations](#trading-operations)
   - [Stellar Operations](#stellar-operations)
   - [Profile Management](#profile-management)
6. [Cross-Chain Bridge Workflow](#cross-chain-bridge-workflow)
7. [Bridge Security Model](#bridge-security-model)
8. [DeFi Integration](#defi-integration)
   - [1inch Protocol Integration](#1inch-protocol-integration-1)
   - [Supported Tokens](#supported-tokens-base-sepolia)
9. [Environment Configuration](#environment-configuration)
   - [Required Environment Variables](#required-environment-variables)
10. [Performance Optimization](#performance-optimization)
    - [Frontend](#frontend-1)
    - [Backend](#backend-1)
    - [Blockchain](#blockchain)
11. [Future Enhancements](#future-enhancements)
    - [Planned Features](#planned-features)
    - [Technical Improvements](#technical-improvements)

## Architecture Overview

The application follows a microservices architecture with a clear separation between frontend, backend, and blockchain layers. The system enables trustless cross-chain asset transfers and DeFi trading operations.

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js App] --> B[Home Page]
        A --> C[Marketplace]
        A --> D[City Game]
        A --> E[Profile Dashboard]
        A --> F[Stellar Bridge]
    end

    subgraph "Backend Layer"
        G[Express.js API] --> H[Trading Service]
        G --> I[Bridge Service]
        G --> J[Profile Service]
        G --> K[Stellar Service]
        G --> L[HTLC Service]
    end

    subgraph "Blockchain Layer"
        M[Base Sepolia] --> N[HTLC Contract]
        M --> O[1inch Protocol]
        P[Stellar Testnet] --> Q[Stellar HTLC]
    end

    A --> G
    H --> O
    L --> N
    K --> Q
```

## Core Features

### 1inch Protocol Integration

The platform leverages 1inch's aggregation protocol to provide users with the best possible swap rates across multiple decentralized exchanges. This integration ensures optimal routing, gas optimization, and slippage protection for all DeFi trading operations.

- **Aggregated liquidity** from multiple DEXs on Base Sepolia
- **Optimal routing** for best swap rates and minimal slippage
- **Gas optimization** for cost-effective transactions
- **Real-time price feeds** and market data
- **Slippage protection** to prevent MEV attacks

### Stellar Network Integration

Built specifically for the Stellar track of ETHGlobal Unite, the platform provides seamless integration with the Stellar network for cross-chain operations.

- **Stellar HTLC implementation** for trustless cross-chain transfers
- **Real-time balance monitoring** on Stellar testnet
- **Stellar SDK integration** for native network operations
- **Cross-chain transaction tracking** between Ethereum and Stellar

### Cross-Chain Bridge (Ethereum ↔ Stellar)

- **Hash Time Locked Contracts (HTLCs)** on both Ethereum and Stellar networks
- **Trustless asset transfers** using cryptographic commitments
- **Real-time status tracking** with transaction monitoring
- **Automatic refund mechanisms** for failed transfers

### User Management

- **Wallet integration** with MetaMask
- **Transaction history** and analytics
- **Portfolio tracking** across multiple chains
- **Real-time balance monitoring**

## Technical Stack

### Frontend

- **Next.js 14** with App Router
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Ethers.js** for Web3 interactions

### Backend

- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **Ethers.js** for Ethereum interactions
- **Stellar SDK** for Stellar network operations
- **1inch API** for DeFi trading

### Blockchain Infrastructure

- **Base Sepolia** testnet for Ethereum operations
- **Stellar Testnet** for Stellar operations
- **Hardhat** for smart contract development
- **Remix IDE** for contract deployment

## Smart Contracts

### EthereumHTLC Contract

Deployed on Base Sepolia at `0x7f6C37352861DDf144fE2B6d140E053729a0Cb6C`

**Key Functions:**

- `newContractETH()` - Create HTLC for native ETH
- `newContract()` - Create HTLC for ERC20 tokens
- `withdraw()` - Withdraw funds using preimage
- `refund()` - Refund after timelock expiration

**Security Features:**

- Reentrancy protection
- Timelock constraints (1-48 hours)
- Fee collection mechanism (0.1%)
- Emergency stop functionality

## API Endpoints

### Bridge Operations

```
POST /api/bridge/quote - Get bridge quote
POST /api/bridge/initiate - Initiate cross-chain bridge
GET /api/bridge/status/:txHash - Get bridge status
```

### Trading Operations

```
GET /api/trading/quote - Get swap quote
POST /api/trading/swap - Execute token swap
GET /api/trading/tokens - Get supported tokens
GET /api/trading/prices - Get token prices
```

### Stellar Operations

```
GET /api/stellar/balance - Get Stellar account balance
POST /api/stellar/htlc - Create Stellar HTLC
GET /api/stellar/health - Health check
```

### Profile Management

```
GET /api/profile/tokens - Get user tokens
GET /api/profile/transactions - Get transaction history
GET /api/profile/stats - Get user statistics
```

## Cross-Chain Bridge Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant E as Ethereum HTLC
    participant S as Stellar HTLC

    U->>F: Initiate Bridge
    F->>B: Request Bridge Quote
    B->>F: Return Quote
    F->>B: Execute Bridge
    B->>E: Create HTLC (Lock ETH)
    E->>B: HTLC Created
    B->>S: Create HTLC (Lock XLM)
    S->>B: HTLC Created
    B->>F: Bridge Status Update
    F->>U: Bridge Complete
```

## Bridge Security Model

The cross-chain bridge implements a trustless security model using HTLCs:

1. **Commit Phase**: Funds are locked on both chains with cryptographic hashes
2. **Reveal Phase**: Preimage revelation unlocks funds on destination chain
3. **Refund Phase**: Automatic refund if timelock expires without completion

**Security Guarantees:**

- No trusted intermediaries required
- Atomic execution (all-or-nothing)
- Cryptographic verification of transfers
- Time-bound operations with automatic refunds

## DeFi Integration

### 1inch Protocol Integration

- **Aggregated liquidity** from multiple DEXs
- **Optimal routing** for best swap rates
- **Gas optimization** for cost-effective transactions
- **Slippage protection** to prevent MEV attacks

### Supported Tokens (Base Sepolia)

- ETH (native)
- WETH, USDC, DAI, USDT
- LINK, WBTC, USDbC, cbETH

## Environment Configuration

### Required Environment Variables

```bash
# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.base.org
ETHEREUM_PRIVATE_KEY=your_private_key
HTLC_CONTRACT_ADDRESS=0x7f6C37352861DDf144fE2B6d140E053729a0Cb6C

# Stellar Configuration
STELLAR_SECRET_KEY=your_stellar_secret
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# DeFi Integration
ONEINCH_API_KEY=your_1inch_api_key
ONEINCH_BASE_URL=https://api.1inch.dev

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unite
```

## Performance Optimization

### Frontend

- Code splitting and lazy loading
- Optimized bundle size
- Caching strategies
- Real-time updates via WebSocket

### Backend

- Database query optimization
- Connection pooling
- Caching layer
- Rate limiting

### Blockchain

- Gas optimization
- Batch transactions
- Event indexing
- Transaction monitoring

## Future Enhancements

### Planned Features

**Multi-Chain Support**: The platform will expand beyond Ethereum and Stellar to include major blockchain networks such as Polygon, Binance Smart Chain, and Avalanche. This expansion will enable users to bridge assets across a wider ecosystem of blockchains, providing greater flexibility and access to diverse DeFi protocols and liquidity pools.

**Advanced DeFi Strategies**: Future iterations will implement sophisticated DeFi strategies including yield farming, liquidity provision, and automated portfolio rebalancing. These features will leverage the existing 1inch integration to optimize yield generation while maintaining the security and trustless nature of the platform.

**Cross-Chain NFT Bridging**: A significant enhancement will be the ability to bridge non-fungible tokens (NFTs) across different blockchain networks. This will involve implementing specialized smart contracts that can handle the unique properties of NFTs while maintaining their metadata and ownership information during cross-chain transfers.

### Technical Improvements

**Layer 2 Scaling Solutions**: Integration with Layer 2 scaling solutions such as Optimistic Rollups and ZK-Rollups will significantly reduce gas costs and improve transaction throughput. This will involve deploying smart contracts on Layer 2 networks and implementing cross-layer communication protocols.

**Zero-Knowledge Proofs**: Implementation of zero-knowledge proofs will enhance privacy and security by allowing users to prove transaction validity without revealing sensitive information. This will be particularly valuable for cross-chain transfers involving private or sensitive data.
