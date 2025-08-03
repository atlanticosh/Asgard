'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  ArrowLeft,
  Wallet,
  History,
  TrendingUp,
  Coins,
  Shield,
  Settings,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  Activity
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { web3Service, type WalletData, type TokenBalance } from '@/services/web3Service';
import './profile.css';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  icon: string;
  contractAddress: string;
  chain: string;
}

interface Transaction {
  id: string;
  type: 'swap' | 'bridge' | 'transfer' | 'receive';
  fromToken: string;
  toToken: string;
  amount: string;
  value: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  txHash: string;
  chain: string;
}

interface ProfileStats {
  totalValue: number;
  totalTrades: number;
  successRate: number;
  averageTradeSize: number;
  favoriteToken: string;
  totalVolume: number;
}

export default function ProfilePage() {
  const {
    isConnected,
    player,
    setCurrentView
  } = useGameStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalValue: 0,
    totalTrades: 0,
    successRate: 0,
    averageTradeSize: 0,
    favoriteToken: '',
    totalVolume: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [useRealData, setUseRealData] = useState(false);

  useEffect(() => {
    if (isConnected && player?.walletAddress) {
      fetchProfileData();
    }
  }, [isConnected, player?.walletAddress]);

  useEffect(() => {
    if (useRealData && isConnected && player?.walletAddress) {
      fetchRealWalletData();
    }
  }, [useRealData, isConnected, player?.walletAddress]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // Fetch tokens from backend
      const tokensResponse = await fetch(`/api/profile/tokens?address=${player?.walletAddress}`);
      const tokensData = await tokensResponse.json();
      setTokens(tokensData.tokens || []);

      // Fetch transaction history
      const transactionsResponse = await fetch(`/api/profile/transactions?address=${player?.walletAddress}`);
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);

      // Fetch profile stats
      const statsResponse = await fetch(`/api/profile/stats?address=${player?.walletAddress}`);
      const statsData = await statsResponse.json();
      setStats(statsData.stats || {
        totalValue: 0,
        totalTrades: 0,
        successRate: 0,
        averageTradeSize: 0,
        favoriteToken: '',
        totalVolume: 0
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fallback to mock data
      setTokens([
        { symbol: 'ETH', name: 'Ethereum', balance: '2.45', value: 6125.80, change24h: 2.5, icon: '🔵', contractAddress: '0x0000000000000000000000000000000000000000', chain: 'ethereum' },
        { symbol: 'USDC', name: 'USD Coin', balance: '1500.00', value: 1500.00, change24h: 0.0, icon: '💙', contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8', chain: 'ethereum' },
        { symbol: 'XLM', name: 'Stellar Lumens', balance: '5000.00', value: 600.00, change24h: -1.2, icon: '⭐', contractAddress: 'native', chain: 'stellar' }
      ]);
      setTransactions([
        { id: '1', type: 'swap', fromToken: 'ETH', toToken: 'USDC', amount: '1.5', value: 3750.00, status: 'completed', timestamp: '2024-01-15T10:30:00Z', txHash: '0x123...abc', chain: 'ethereum' },
        { id: '2', type: 'bridge', fromToken: 'USDC', toToken: 'XLM', amount: '500', value: 500.00, status: 'completed', timestamp: '2024-01-14T15:45:00Z', txHash: '0x456...def', chain: 'stellar' },
        { id: '3', type: 'swap', fromToken: 'XLM', toToken: 'ETH', amount: '2000', value: 240.00, status: 'pending', timestamp: '2024-01-13T09:20:00Z', txHash: '0x789...ghi', chain: 'stellar' }
      ]);
      setStats({
        totalValue: 8225.80,
        totalTrades: 47,
        successRate: 94.2,
        averageTradeSize: 175.02,
        favoriteToken: 'ETH',
        totalVolume: 8225.80
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealWalletData = async () => {
    if (!player?.walletAddress) return;

    try {
      setIsLoading(true);

      // Connect to wallet and get real data
      const address = await web3Service.connectWallet();
      const data = await web3Service.getWalletData(address);

      setWalletData(data);

      // Convert to our token format
      const realTokens: Token[] = [
        // Add ETH as a token
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: data.ethBalance,
          value: data.ethValue,
          change24h: 0, // Will be fetched separately
          icon: '🔵',
          contractAddress: '0x0000000000000000000000000000000000000000',
          chain: 'ethereum'
        },
        // Add other tokens
        ...data.tokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: token.balance,
          value: token.value,
          change24h: token.change24h,
          icon: token.icon,
          contractAddress: token.contractAddress,
          chain: token.chain
        }))
      ];

      setTokens(realTokens);

      // Update stats with real data
      setStats({
        totalValue: data.totalValue,
        totalTrades: stats.totalTrades, // Keep existing trades
        successRate: stats.successRate, // Keep existing rate
        averageTradeSize: stats.averageTradeSize, // Keep existing
        favoriteToken: realTokens[0]?.symbol || '',
        totalVolume: stats.totalVolume // Keep existing volume
      });

      // Update backend with real token data
      await fetch('/api/profile/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokens: realTokens
        })
      });

    } catch (error) {
      console.error('Error fetching real wallet data:', error);
      // Fallback to mock data
      setUseRealData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (player?.walletAddress) {
      await navigator.clipboard.writeText(player.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-forest-green" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-aged-yellow" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rust-red" />;
      default:
        return <Clock className="w-4 h-4 text-charcoal" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <RefreshCw className="w-4 h-4 text-forest-green" />;
      case 'bridge':
        return <Shield className="w-4 h-4 text-aged-yellow" />;
      case 'transfer':
        return <ArrowLeft className="w-4 h-4 text-rust-red" />;
      case 'receive':
        return <CheckCircle className="w-4 h-4 text-forest-green" />;
      default:
        return <Activity className="w-4 h-4 text-charcoal" />;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-old-paper flex items-center justify-center">
        <div className="crushed-paper p-8 text-center">
          <h2 className="vintage-subtitle text-2xl mb-4 text-rust-red">ACCESS DENIED</h2>
          <p className="vintage-text mb-6">You must connect your wallet to view your profile.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="vintage-button px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-layout">
      <div className="absolute inset-0 vintage-grid"></div>

      <div className="absolute top-20 left-10 w-32 h-32 opacity-20">
        <div className="w-full h-full bg-coffee-stain rounded-full transform rotate-12"></div>
      </div>
      <div className="absolute bottom-40 right-20 w-24 h-24 opacity-15">
        <div className="w-full h-full bg-coffee-stain rounded-full transform -rotate-45"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">

        <motion.div
          className="crushed-paper border-b-4 border-vintage-brown p-4"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="vintage-button px-3 py-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <motion.h1
                className="vintage-title text-2xl flicker"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, type: "spring" }}
              >
                SURVIVOR PROFILE
              </motion.h1>
              <span className="vintage-subtitle text-sm text-rust-red">
                {activeTab.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl text-forest-green vintage-text">{player?.level || 5}</div>
                <div className="text-xs text-charcoal vintage-text">LEVEL</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-aged-yellow vintage-text">{player?.xp || 460}</div>
                <div className="text-xs text-charcoal vintage-text">XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-rust-red vintage-text">{player?.survivalCredits || 1700}</div>
                <div className="text-xs text-charcoal vintage-text">CREDITS</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-vintage-brown" />
                <span className="vintage-text text-sm text-charcoal">
                  {player?.username || 'CryptoSurvivor_168'}
                </span>
                <div className="vintage-stat px-3 py-1 cursor-pointer" onClick={copyAddress}>
                  <span className="terminal-text text-xs">
                    {player?.walletAddress ?
                      `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}` :
                      '0x6f21...9f8e'
                    }
                  </span>
                  {copiedAddress && <CheckCircle className="w-3 h-3 text-forest-green ml-1" />}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="profile-main-content">

          <div className="profile-sidebar">
            <div className="profile-nav">
              <button
                className={`profile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <BarChart3 className="w-5 h-5" />
                <span>OVERVIEW</span>
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'tokens' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokens')}
              >
                <Coins className="w-5 h-5" />
                <span>TOKENS</span>
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History className="w-5 h-5" />
                <span>HISTORY</span>
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <TrendingUp className="w-5 h-5" />
                <span>ANALYTICS</span>
              </button>
            </div>
          </div>

          <div className="profile-content">
            {isLoading ? (
              <div className="profile-loading">
                <RefreshCw className="w-8 h-8 animate-spin text-vintage-brown" />
                <span className="vintage-text text-lg">Loading profile data...</span>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <motion.div
                    className="profile-overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="profile-stats-grid">
                      <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="profile-stat-content">
                          <div className="profile-stat-value">${stats.totalValue.toLocaleString()}</div>
                          <div className="profile-stat-label">TOTAL VALUE</div>
                        </div>
                      </div>

                      <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div className="profile-stat-content">
                          <div className="profile-stat-value">{stats.totalTrades}</div>
                          <div className="profile-stat-label">TOTAL TRADES</div>
                        </div>
                      </div>

                      <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="profile-stat-content">
                          <div className="profile-stat-value">{stats.successRate}%</div>
                          <div className="profile-stat-label">SUCCESS RATE</div>
                        </div>
                      </div>

                      <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="profile-stat-content">
                          <div className="profile-stat-value">${stats.totalVolume.toLocaleString()}</div>
                          <div className="profile-stat-label">TOTAL VOLUME</div>
                        </div>
                      </div>
                    </div>

                    <div className="profile-recent-activity">
                      <h3 className="profile-section-title">RECENT ACTIVITY</h3>
                      <div className="profile-activity-list">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="profile-activity-item">
                            <div className="profile-activity-icon">
                              {getTypeIcon(tx.type)}
                            </div>
                            <div className="profile-activity-content">
                              <div className="profile-activity-title">
                                {tx.type.toUpperCase()}: {tx.fromToken} → {tx.toToken}
                              </div>
                              <div className="profile-activity-details">
                                {tx.amount} {tx.fromToken} • ${tx.value.toFixed(2)}
                              </div>
                            </div>
                            <div className="profile-activity-status">
                              {getStatusIcon(tx.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tokens' && (
                  <motion.div
                    className="profile-tokens"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="profile-tokens-header">
                      <h3 className="profile-section-title">WALLET TOKENS</h3>
                      <div className="flex gap-2">
                        <button
                          className={`profile-toggle-btn ${!useRealData ? 'active' : ''}`}
                          onClick={() => setUseRealData(false)}
                        >
                          MOCK DATA
                        </button>
                        <button
                          className={`profile-toggle-btn ${useRealData ? 'active' : ''}`}
                          onClick={() => setUseRealData(true)}
                        >
                          REAL WALLET
                        </button>
                        <button
                          className="profile-refresh-btn"
                          onClick={useRealData ? fetchRealWalletData : fetchProfileData}
                        >
                          <RefreshCw className="w-4 h-4" />
                          REFRESH
                        </button>
                      </div>
                    </div>

                    <div className="profile-tokens-list">
                      {tokens.map((token) => (
                        <div key={token.symbol} className="profile-token-card">
                          <div className="profile-token-icon">
                            <span className="text-2xl">{token.icon}</span>
                          </div>
                          <div className="profile-token-info">
                            <div className="profile-token-name">
                              <span className="profile-token-symbol">{token.symbol}</span>
                              <span className="profile-token-fullname">{token.name}</span>
                            </div>
                            <div className="profile-token-chain">{token.chain.toUpperCase()}</div>
                          </div>
                          <div className="profile-token-balance">
                            <div className="profile-token-amount">{token.balance}</div>
                            <div className="profile-token-value">${token.value.toFixed(2)}</div>
                          </div>
                          <div className={`profile-token-change ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    className="profile-history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="profile-history-header">
                      <h3 className="profile-section-title">TRANSACTION HISTORY</h3>
                      <div className="profile-history-filters">
                        <select className="profile-filter-select">
                          <option value="all">All Types</option>
                          <option value="swap">Swaps</option>
                          <option value="bridge">Bridges</option>
                          <option value="transfer">Transfers</option>
                        </select>
                        <select className="profile-filter-select">
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    <div className="profile-history-list">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="profile-history-item">
                          <div className="profile-history-icon">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div className="profile-history-content">
                            <div className="profile-history-title">
                              {tx.type.toUpperCase()}: {tx.fromToken} → {tx.toToken}
                            </div>
                            <div className="profile-history-details">
                              <span>{tx.amount} {tx.fromToken}</span>
                              <span>•</span>
                              <span>${tx.value.toFixed(2)}</span>
                              <span>•</span>
                              <span>{tx.chain.toUpperCase()}</span>
                            </div>
                            <div className="profile-history-time">
                              {formatDate(tx.timestamp)}
                            </div>
                          </div>
                          <div className="profile-history-status">
                            {getStatusIcon(tx.status)}
                          </div>
                          <div className="profile-history-actions">
                            <button className="profile-action-btn">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                  <motion.div
                    className="profile-analytics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h3 className="profile-section-title">TRADING ANALYTICS</h3>
                    <div className="profile-analytics-grid">
                      <div className="profile-analytics-card">
                        <h4>TRADING PATTERNS</h4>
                        <div className="profile-analytics-content">
                          <div className="profile-analytics-item">
                            <span>Favorite Token:</span>
                            <span className="profile-analytics-value">{stats.favoriteToken}</span>
                          </div>
                          <div className="profile-analytics-item">
                            <span>Average Trade Size:</span>
                            <span className="profile-analytics-value">${stats.averageTradeSize.toFixed(2)}</span>
                          </div>
                          <div className="profile-analytics-item">
                            <span>Most Active Chain:</span>
                            <span className="profile-analytics-value">Ethereum</span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-analytics-card">
                        <h4>PERFORMANCE METRICS</h4>
                        <div className="profile-analytics-content">
                          <div className="profile-analytics-item">
                            <span>Win Rate:</span>
                            <span className="profile-analytics-value">{stats.successRate}%</span>
                          </div>
                          <div className="profile-analytics-item">
                            <span>Total Volume:</span>
                            <span className="profile-analytics-value">${stats.totalVolume.toLocaleString()}</span>
                          </div>
                          <div className="profile-analytics-item">
                            <span>Portfolio Growth:</span>
                            <span className="profile-analytics-value positive">+12.5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

        <motion.div
          className="crushed-paper border-t-4 border-vintage-brown p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div className="vintage-text text-sm text-vintage-brown">
              SURVIVOR PROFILE | {activeTab.toUpperCase()}
            </div>
            <div className="flex items-center gap-4">
              <span className="vintage-text text-sm text-charcoal">
                💰 Portfolio Value: ${stats.totalValue.toLocaleString()}
              </span>
              <span className="vintage-text text-sm text-charcoal">
                📊 {stats.totalTrades} Total Trades
              </span>
              <span className="vintage-text text-sm text-charcoal">
                ⚡ {stats.successRate}% Success Rate
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 