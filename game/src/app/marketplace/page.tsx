'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Zap, 
  Shield, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Coins,
  User,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { tradingService } from '@/services/tradingService';

export default function MarketplacePage() {
  const { 
    isConnected, 
    player, 
    setCurrentView,
    addXP,
    addCredits
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState('swap');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFrom, setSwapFrom] = useState('ETH');
  const [swapTo, setSwapTo] = useState('USDC');
  const [isSwapping, setIsSwapping] = useState(false);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeFromChain, setBridgeFromChain] = useState('ethereum');
  const [bridgeToChain, setBridgeToChain] = useState('stellar');
  const [isBridging, setIsBridging] = useState(false);
  const [useRealTrading, setUseRealTrading] = useState(false);
  const [swapQuote, setSwapQuote] = useState<any>(null);

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', price: 2450.32, change: 2.5, icon: '🔵' },
    { symbol: 'XLM', name: 'Stellar Lumens', price: 0.12, change: -1.2, icon: '⭐' },
    { symbol: 'USDC', name: 'USD Coin', price: 1.00, change: 0.0, icon: '💙' },
    { symbol: 'WETH', name: 'Wrapped ETH', price: 2450.32, change: 2.5, icon: '🔵' },
  ];

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) return;
    
    setIsSwapping(true);
    
    try {
      if (useRealTrading) {
        // Real trading with actual wallet
        const fromAddress = player?.walletAddress || '';
        
        // Get swap quote first
        const quote = await tradingService.getSwapQuote(
          swapFrom,
          swapTo,
          swapAmount,
          fromAddress
        );
        
        setSwapQuote(quote);
        
        // Execute the swap
        const swapTx = await tradingService.executeSwap(
          swapFrom,
          swapTo,
          swapAmount,
          fromAddress,
          1 // 1% slippage
        );
        
        // Record transaction in backend
        const response = await fetch('/api/profile/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: fromAddress,
            txHash: swapTx.txHash,
            type: 'swap',
            fromToken: swapFrom,
            toToken: swapTo,
            amount: swapAmount,
            valueUsd: parseFloat(swapAmount) * 1490.20, // Approximate value
            chain: 'ethereum',
            blockNumber: 0, // Will be updated
            gasUsed: swapTx.gasUsed,
            gasPrice: swapTx.gasPrice
          })
        });

        if (response.ok) {
          addXP(25);
          addCredits(50);
          setSwapAmount('');
          setSwapQuote(null);
        }
      } else {
        // Mock trading (existing code)
        const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const estimatedValue = parseFloat(swapAmount) * 1490.20;
        
        const response = await fetch('/api/profile/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: player?.walletAddress || '0x6f21...9f8e',
            txHash: txHash,
            type: 'swap',
            fromToken: swapFrom,
            toToken: swapTo,
            amount: swapAmount,
            valueUsd: estimatedValue,
            chain: 'ethereum',
            blockNumber: Math.floor(Math.random() * 1000000),
            gasUsed: Math.floor(Math.random() * 200000),
            gasPrice: Math.random() * 50
          })
        });

        if (response.ok) {
          addXP(25);
          addCredits(50);
          setSwapAmount('');
        }
      }
    } catch (error) {
      console.error('Error during swap:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return;
    
    setIsBridging(true);
    
    try {
      // Generate a mock transaction hash
      const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Calculate estimated value (mock)
      const estimatedValue = parseFloat(bridgeAmount) * 1.00; // USDC price
      
      // Add transaction to backend
      const response = await fetch('/api/profile/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: player?.walletAddress || '0x6f21...9f8e',
          txHash: txHash,
          type: 'bridge',
          fromToken: 'USDC',
          toToken: 'XLM',
          amount: bridgeAmount,
          valueUsd: estimatedValue,
          chain: 'stellar',
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: Math.floor(Math.random() * 200000),
          gasPrice: Math.random() * 50
        })
      });

      if (response.ok) {
        addXP(50);
        addCredits(100);
        setBridgeAmount('');
      } else {
        console.error('Failed to record transaction');
      }
    } catch (error) {
      console.error('Error during bridge:', error);
    } finally {
      setIsBridging(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-old-paper flex items-center justify-center">
        <div className="crushed-paper p-8 text-center">
          <h2 className="vintage-subtitle text-2xl mb-4 text-rust-red">ACCESS DENIED</h2>
          <p className="vintage-text mb-6">You must connect your wallet to access the marketplace.</p>
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
    <div className="h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 vintage-grid"></div>
      
      {/* Enhanced Coffee Stains */}
      <div className="absolute top-20 left-10 w-40 h-40 opacity-20">
        <div className="w-full h-full bg-coffee-stain rounded-full transform rotate-12"></div>
      </div>
      <div className="absolute bottom-40 right-20 w-32 h-32 opacity-15">
        <div className="w-full h-full bg-coffee-stain rounded-full transform -rotate-45"></div>
      </div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 opacity-10">
        <div className="w-full h-full bg-coffee-stain rounded-full transform rotate-30"></div>
      </div>
      
      {/* Coffee Stains */}
      <div className="absolute top-20 left-10 w-32 h-32 opacity-20">
        <div className="w-full h-full bg-coffee-stain rounded-full transform rotate-12"></div>
      </div>
      <div className="absolute bottom-40 right-20 w-24 h-24 opacity-15">
        <div className="w-full h-full bg-coffee-stain rounded-full transform -rotate-45"></div>
      </div>

      {/* Game Layout */}
      <div className="relative z-10 h-screen flex flex-col">
        
        {/* Top Game Bar */}
        <motion.div 
          className="crushed-paper border-b-4 border-vintage-brown p-4"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = '/city'}
                className="vintage-button px-3 py-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="vintage-title text-2xl">DEFI MARKETPLACE</h1>
              <span className="vintage-subtitle text-sm text-rust-red">
                TRADE & BRIDGE
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xl text-forest-green vintage-text">{player?.level || 1}</div>
                <div className="text-xs text-charcoal vintage-text">LEVEL</div>
              </div>
              <div className="text-center">
                <div className="text-xl text-aged-yellow vintage-text">{player?.xp || 0}</div>
                <div className="text-xs text-charcoal vintage-text">XP</div>
              </div>
              <div className="text-center">
                <div className="text-xl text-rust-red vintage-text">{player?.survivalCredits || 0}</div>
                <div className="text-xs text-charcoal vintage-text">CREDITS</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-vintage-brown" />
              <span className="vintage-text text-sm text-charcoal">
                {player?.username || 'Survivor'}
              </span>
              <div className="vintage-stat px-3 py-1">
                <span className="terminal-text text-xs">
                  {player?.walletAddress ? 
                    `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}` : 
                    '0x0000...0000'
                  }
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Game Area */}
        <div className="flex-1 flex">
          
          {/* Left Sidebar - Market Data */}
          <div className="w-80 bg-old-paper border-r-4 border-vintage-brown p-4 overflow-hidden">
            <h2 className="vintage-subtitle text-lg mb-6 text-vintage-brown">
              MARKET DATA
            </h2>
            
            <div className="space-y-4">
              {tokens.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  className="vintage-stat p-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{token.icon}</span>
                      <span className="vintage-subtitle text-sm text-charcoal">{token.symbol}</span>
                    </div>
                    {token.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-forest-green" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rust-red" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="vintage-text text-sm text-charcoal">${token.price.toFixed(2)}</span>
                    <span className={`vintage-text text-xs ${
                      token.change > 0 ? 'text-forest-green' : 'text-rust-red'
                    }`}>
                      {token.change > 0 ? '+' : ''}{token.change}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trading Stats */}
            <div className="mt-8">
              <h3 className="vintage-subtitle text-sm mb-3 text-vintage-brown">
                TRADING STATS
              </h3>
              <div className="space-y-2">
                <div className="vintage-stat p-3">
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">24h Volume:</span>
                    <span className="vintage-text text-xs text-aged-yellow">$2.4M</span>
                  </div>
                </div>
                <div className="vintage-stat p-3">
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">Active Trades:</span>
                    <span className="vintage-text text-xs text-forest-green">847</span>
                  </div>
                </div>
                <div className="vintage-stat p-3">
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">Bridge Success:</span>
                    <span className="vintage-text text-xs text-forest-green">99.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-hidden">
            
            {/* Trading Mode Toggle */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button 
                  className={`vintage-button px-4 py-2 text-sm ${!useRealTrading ? 'bg-vintage-brown text-crushed-paper' : 'bg-crushed-paper text-vintage-brown'}`}
                  onClick={() => setUseRealTrading(false)}
                >
                  MOCK TRADING
                </button>
                <button 
                  className={`vintage-button px-4 py-2 text-sm ${useRealTrading ? 'bg-vintage-brown text-crushed-paper' : 'bg-crushed-paper text-vintage-brown'}`}
                  onClick={() => setUseRealTrading(true)}
                >
                  REAL TRADING
                </button>
              </div>
              {useRealTrading && (
                <div className="text-xs text-rust-red vintage-text">
                  ⚠️ REAL FUNDS WILL BE USED
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('swap')}
                className={`vintage-button px-6 py-3 ${
                  activeTab === 'swap' ? 'border-2 border-forest-green' : ''
                }`}
              >
                <Zap className="w-5 h-5 inline mr-2" />
                SWAP
              </button>
              <button
                onClick={() => setActiveTab('bridge')}
                className={`vintage-button px-6 py-3 ${
                  activeTab === 'bridge' ? 'border-2 border-forest-green' : ''
                }`}
              >
                <Shield className="w-5 h-5 inline mr-2" />
                BRIDGE
              </button>
            </div>

            {/* Swap Interface */}
            {activeTab === 'swap' && (
              <motion.div 
                className="crushed-paper p-8 coffee-stain"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="vintage-subtitle text-2xl mb-6 text-vintage-brown">
                  1INCH SWAP INTERFACE
                </h2>
                
                <div className="space-y-6">
                  {/* From Token */}
                  <div className="vintage-stat p-6">
                    <label className="vintage-subtitle text-sm mb-2 block text-charcoal">
                      FROM
                    </label>
                    <div className="flex gap-4">
                      <select 
                        value={swapFrom}
                        onChange={(e) => setSwapFrom(e.target.value)}
                        className="vintage-button px-4 py-2 flex-1"
                      >
                        {tokens.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        placeholder="0.0"
                        className="vintage-button px-4 py-2 flex-1"
                      />
                    </div>
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center">
                    <motion.div
                      className="vintage-button p-2"
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </div>

                  {/* To Token */}
                  <div className="vintage-stat p-6">
                    <label className="vintage-subtitle text-sm mb-2 block text-charcoal">
                      TO
                    </label>
                    <div className="flex gap-4">
                      <select 
                        value={swapTo}
                        onChange={(e) => setSwapTo(e.target.value)}
                        className="vintage-button px-4 py-2 flex-1"
                      >
                        {tokens.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={swapAmount ? (parseFloat(swapAmount) * 1.02).toFixed(4) : '0.0'}
                        readOnly
                        className="vintage-button px-4 py-2 flex-1 bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Swap Details */}
                  <div className="vintage-stat p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Rate:</span>
                        <span className="vintage-text text-sm text-aged-yellow">1 {swapFrom} = 1.02 {swapTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Slippage:</span>
                        <span className="vintage-text text-sm text-forest-green">0.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Fee:</span>
                        <span className="vintage-text text-sm text-rust-red">0.3%</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button 
                    onClick={handleSwap}
                    disabled={isSwapping || !swapAmount}
                    className="vintage-button px-8 py-4 text-lg w-full"
                  >
                    {isSwapping ? (
                      <span className="vintage-loading">SWAPPING</span>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 inline mr-2" />
                        SWAP {swapFrom} FOR {swapTo}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Bridge Interface */}
            {activeTab === 'bridge' && (
              <motion.div 
                className="crushed-paper p-8 coffee-stain"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="vintage-subtitle text-2xl mb-6 text-vintage-brown">
                  CROSS-CHAIN BRIDGE
                </h2>
                
                <div className="space-y-6">
                  {/* From Chain */}
                  <div className="vintage-stat p-6">
                    <label className="vintage-subtitle text-sm mb-2 block text-charcoal">
                      FROM CHAIN
                    </label>
                    <div className="flex gap-4">
                      <select 
                        value={bridgeFromChain}
                        onChange={(e) => setBridgeFromChain(e.target.value)}
                        className="vintage-button px-4 py-2 flex-1"
                      >
                        <option value="ethereum">Ethereum</option>
                        <option value="stellar">Stellar</option>
                      </select>
                      <input
                        type="number"
                        value={bridgeAmount}
                        onChange={(e) => setBridgeAmount(e.target.value)}
                        placeholder="0.0"
                        className="vintage-button px-4 py-2 flex-1"
                      />
                    </div>
                  </div>

                  {/* Bridge Arrow */}
                  <div className="flex justify-center">
                    <motion.div
                      className="vintage-button p-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Shield className="w-6 h-6" />
                    </motion.div>
                  </div>

                  {/* To Chain */}
                  <div className="vintage-stat p-6">
                    <label className="vintage-subtitle text-sm mb-2 block text-charcoal">
                      TO CHAIN
                    </label>
                    <div className="flex gap-4">
                      <select 
                        value={bridgeToChain}
                        onChange={(e) => setBridgeToChain(e.target.value)}
                        className="vintage-button px-4 py-2 flex-1"
                      >
                        <option value="stellar">Stellar</option>
                        <option value="ethereum">Ethereum</option>
                      </select>
                      <input
                        type="text"
                        value={bridgeAmount ? bridgeAmount : '0.0'}
                        readOnly
                        className="vintage-button px-4 py-2 flex-1 bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Bridge Details */}
                  <div className="vintage-stat p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Bridge Fee:</span>
                        <span className="vintage-text text-sm text-rust-red">0.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Estimated Time:</span>
                        <span className="vintage-text text-sm text-forest-green">~2 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="vintage-text text-sm text-charcoal">Security:</span>
                        <span className="vintage-text text-sm text-forest-green">HTLC Protected</span>
                      </div>
                    </div>
                  </div>

                  {/* Bridge Button */}
                  <button 
                    onClick={handleBridge}
                    disabled={isBridging || !bridgeAmount}
                    className="vintage-button px-8 py-4 text-lg w-full"
                  >
                    {isBridging ? (
                      <span className="vintage-loading">BRIDGING</span>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 inline mr-2" />
                        BRIDGE TO {bridgeToChain.toUpperCase()}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Market Statistics Section */}
            <motion.div 
              className="mt-6 crushed-paper p-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <h3 className="vintage-subtitle text-xl mb-6 text-center text-vintage-brown">
                MARKET OVERVIEW
              </h3>
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl text-forest-green vintage-text mb-2">$2.4M</div>
                  <div className="text-sm text-charcoal vintage-text">24H VOLUME</div>
                </div>
                <div>
                  <div className="text-3xl text-rust-red vintage-text mb-2">847</div>
                  <div className="text-sm text-charcoal vintage-text">ACTIVE TRADES</div>
                </div>
                <div>
                  <div className="text-3xl text-aged-yellow vintage-text mb-2">99.8%</div>
                  <div className="text-sm text-charcoal vintage-text">SUCCESS RATE</div>
                </div>
                <div>
                  <div className="text-3xl text-vintage-brown vintage-text mb-2">12</div>
                  <div className="text-sm text-charcoal vintage-text">SUPPORTED PAIRS</div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity Section */}
            <motion.div 
              className="mt-4 vintage-stat p-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              <h3 className="vintage-subtitle text-lg mb-4 text-vintage-brown">
                RECENT ACTIVITY
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-crushed-paper border border-vintage-brown">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-forest-green rounded-full"></div>
                    <span className="vintage-text text-sm">ETH → USDC Swap</span>
                  </div>
                  <span className="vintage-text text-sm text-forest-green">+25 XP</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-crushed-paper border border-vintage-brown">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-aged-yellow rounded-full"></div>
                    <span className="vintage-text text-sm">ETH → Stellar Bridge</span>
                  </div>
                  <span className="vintage-text text-sm text-aged-yellow">+50 XP</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-crushed-paper border border-vintage-brown">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-rust-red rounded-full"></div>
                    <span className="vintage-text text-sm">XLM → ETH Bridge</span>
                  </div>
                  <span className="vintage-text text-sm text-rust-red">+50 XP</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Game Bar */}
        <motion.div 
          className="crushed-paper border-t-4 border-vintage-brown p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div className="vintage-text text-sm text-vintage-brown">
              ASGARD MARKETPLACE | 1INCH INTEGRATION | CROSS-CHAIN BRIDGE
            </div>
            <div className="flex items-center gap-4">
              <span className="vintage-text text-sm text-charcoal">
                ⚡ 24h Volume: $2.4M
              </span>
              <span className="vintage-text text-sm text-charcoal">
                🌉 Bridge Success: 99.8%
              </span>
              <span className="vintage-text text-sm text-charcoal">
                💰 Active Trades: 847
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 