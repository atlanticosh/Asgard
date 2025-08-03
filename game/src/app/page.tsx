'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Users, 
  Trophy, 
  Play, 
  Settings, 
  Info,
  Wallet,
  Gamepad2,
  Crown,
  Target,
  TrendingUp,
  Skull,
  Flame,
  Sword,
  Map,
  Store,
  BarChart3,
  User,
  LogOut,
  Menu,
  Star
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { walletService } from '@/services/walletService';
import './home.css';

export default function HomePage() {
  const { 
    isConnected, 
    player, 
    connectWallet, 
    setCurrentView,
    showWalletModal,
    toggleWalletModal 
  } = useGameStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');

  // Typewriter effect
  useEffect(() => {
    const text = "ASGARD";
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setTypewriterText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const walletInfo = await walletService.connectWallet();
      if (walletInfo) {
        connectWallet(walletInfo.address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayGame = () => {
    if (isConnected) {
      setCurrentView('city');
    } else {
      handleConnectWallet();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Vintage Grid Background */}
      <div className="absolute inset-0 vintage-grid"></div>
      
      {/* Coffee Stains */}
      <div className="absolute top-20 left-10 w-32 h-32 opacity-20">
        <div className="w-full h-full bg-coffee-stain rounded-full transform rotate-12"></div>
      </div>
      <div className="absolute bottom-40 right-20 w-24 h-24 opacity-15">
        <div className="w-full h-full bg-coffee-stain rounded-full transform -rotate-45"></div>
      </div>

      {/* Game Layout */}
      <div className="relative z-10 home-layout">
        
        {/* Top Game Bar */}
        <motion.div 
          className="crushed-paper border-b-4 border-vintage-brown p-4"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-between items-center">
            {/* Game Title */}
            <div className="flex items-center gap-4">
              <motion.h1 
                className="vintage-title text-3xl flicker"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, type: "spring" }}
              >
                {typewriterText}
              </motion.h1>
              <span className="vintage-subtitle text-sm text-rust-red">
                SURVIVAL GAME
              </span>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl text-forest-green vintage-text">847</div>
                <div className="text-xs text-charcoal vintage-text">SURVIVORS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-rust-red vintage-text">12</div>
                <div className="text-xs text-charcoal vintage-text">DAYS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-aged-yellow vintage-text">$50K</div>
                <div className="text-xs text-charcoal vintage-text">PRIZE</div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {isConnected ? (
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
                  <button 
                    onClick={() => setShowMainMenu(!showMainMenu)}
                    className="vintage-button px-3 py-1 text-xs"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleConnectWallet}
                  className="vintage-button px-4 py-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="vintage-loading">CONNECTING</span>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 inline mr-2" />
                      CONNECT
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Game Area */}
        <div className="home-main-content">
          
          {/* Left Sidebar - Game Navigation */}
          <motion.div 
            className="home-sidebar"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="vintage-subtitle text-lg mb-6 text-vintage-brown">
              GAME MENU
            </h2>
            
            <div className="home-nav-menu">
              <motion.button
                className="home-nav-item"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/city'}
              >
                <div className="flex items-center gap-3">
                  <Map className="home-nav-icon text-forest-green" />
                  <div>
                    <div className="home-nav-title">CITY</div>
                    <div className="home-nav-description">Explore the digital realm</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="home-nav-item"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/marketplace'}
              >
                <div className="flex items-center gap-3">
                  <Store className="home-nav-icon text-aged-yellow" />
                  <div>
                    <div className="home-nav-title">MARKETPLACE</div>
                    <div className="home-nav-description">Trade and bridge assets</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="home-nav-item"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/stellar'}
              >
                <div className="flex items-center gap-3">
                  <Star className="home-nav-icon text-blue-400" />
                  <div>
                    <div className="home-nav-title">STELLAR BRIDGE</div>
                    <div className="home-nav-description">HTLC Cross-Chain Transfers</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="home-nav-item"
                whileHover={{ x: 10 }}
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="home-nav-icon text-rust-red" />
                  <div>
                    <div className="home-nav-title">ARENA</div>
                    <div className="home-nav-description">Battle other survivors</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="home-nav-item"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/profile'}
              >
                <div className="flex items-center gap-3">
                  <User className="home-nav-icon text-vintage-brown" />
                  <div>
                    <div className="home-nav-title">PROFILE</div>
                    <div className="home-nav-description">View your dashboard</div>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Player Stats */}
            {isConnected && player && (
              <motion.div 
                className="home-player-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="home-stats-title">
                  YOUR STATS
                </h3>
                <div className="space-y-2">
                  <div className="home-stats-row">
                    <span className="home-stats-label">Level:</span>
                    <span className="home-stats-value level">{player.level}</span>
                  </div>
                  <div className="home-stats-row">
                    <span className="home-stats-label">XP:</span>
                    <span className="home-stats-value xp">{player.xp}</span>
                  </div>
                  <div className="home-stats-row">
                    <span className="home-stats-label">Credits:</span>
                    <span className="home-stats-value credits">{player.survivalCredits}</span>
                  </div>
                  <div className="home-stats-row">
                    <span className="home-stats-label">Rank:</span>
                    <span className="home-stats-value rank">#{player.rank}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Main Content Area */}
          <div className="home-content-area">
            
            {/* Welcome Section */}
            <motion.div 
              className="home-welcome coffee-stain"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h2 className="home-welcome-title">
                WELCOME TO ASGARD
              </h2>
              <p className="home-welcome-text">
                The crypto world has collapsed into chaos. Multiple blockchain networks are isolated, 
                and resources are scarce. Asgard has become the last refuge for crypto survivors. 
                Only the smartest traders and bridge masters can survive.
              </p>
              <p className="home-welcome-text text-charcoal">
                Navigate through treacherous markets, master cross-chain bridging, and compete with thousands 
                of survivors in this ultimate DeFi survival challenge.
              </p>
              
              {!isConnected ? (
                <div className="flex gap-4">
                  <button 
                    onClick={handleConnectWallet}
                    className="home-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="vintage-loading">CONNECTING</span>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 inline mr-2" />
                        CONNECT WALLET TO START
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={() => window.location.href = '/city'}
                    className="home-button"
                  >
                    <Sword className="w-5 h-5 inline mr-2" />
                    ENTER THE CITY
                  </button>
                  <button 
                    className="home-button"
                    style={{ 
                      background: 'linear-gradient(45deg, #c0392b, #8b4513)',
                      borderColor: '#1a1a1a'
                    }}
                  >
                    <Trophy className="w-5 h-5 inline mr-2" />
                    VIEW LEADERBOARD
                  </button>
                </div>
              )}
            </motion.div>

            {/* Game Features Grid */}
            <motion.div 
              className="home-features-grid"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.div 
                className="home-feature-card ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Zap className="home-feature-icon text-rust-red" />
                <h3 className="home-feature-title">REAL DEFI TRADING</h3>
                <p className="home-feature-description">Trade real assets with 1inch integration</p>
              </motion.div>

              <motion.div 
                className="home-feature-card ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="home-feature-icon text-forest-green" />
                <h3 className="home-feature-title">CROSS-CHAIN BRIDGE</h3>
                <p className="home-feature-description">Seamless Ethereum ↔ Stellar swaps</p>
              </motion.div>

              <motion.div 
                className="home-feature-card ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Gamepad2 className="home-feature-icon text-aged-yellow" />
                <h3 className="home-feature-title">INTERACTIVE GAMEPLAY</h3>
                <p className="home-feature-description">Skill-based mini-games and challenges</p>
              </motion.div>

              <motion.div 
                className="home-feature-card ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Crown className="home-feature-icon text-vintage-brown" />
                <h3 className="home-feature-title">COMPETITIVE SURVIVAL</h3>
                <p className="home-feature-description">Compete with 1,000+ players globally</p>
              </motion.div>
            </motion.div>

            {/* Additional Game Info Section */}
            <motion.div 
              className="home-game-info"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.div 
                className="home-info-card"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Target className="home-info-icon text-rust-red" />
                <h3 className="home-info-title">DAILY CHALLENGES</h3>
                <p className="home-info-description">Complete daily trading challenges to earn XP and credits</p>
                <div className="home-info-value">3/5</div>
                <div className="home-info-label">COMPLETED TODAY</div>
              </motion.div>

              <motion.div 
                className="home-info-card"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Flame className="home-info-icon text-aged-yellow" />
                <h3 className="home-info-title">STREAK BONUS</h3>
                <p className="home-info-description">Maintain daily activity for bonus rewards</p>
                <div className="home-info-value">7</div>
                <div className="home-info-label">DAY STREAK</div>
              </motion.div>

              <motion.div 
                className="home-info-card"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Skull className="home-info-icon text-vintage-brown" />
                <h3 className="home-info-title">SURVIVAL RANK</h3>
                <p className="home-info-description">Your position among all survivors</p>
                <div className="home-info-value">#847</div>
                <div className="home-info-label">TOP 10%</div>
              </motion.div>
            </motion.div>


          </div>
        </div>

        {/* Bottom Game Bar */}
        <motion.div 
          className="crushed-paper border-t-4 border-vintage-brown p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <div className="vintage-text text-sm text-vintage-brown">
              ASGARD - THE DEFI SURVIVAL GAME | ETHGLOBAL UNITE 2024
            </div>
            <div className="flex items-center gap-4">
              <span className="vintage-text text-sm text-charcoal">
                ⚡ 30-Day Challenge
              </span>
              <span className="vintage-text text-sm text-charcoal">
                🌉 Cross-Chain Mastery
              </span>
              <span className="vintage-text text-sm text-charcoal">
                💰 $50K Prize Pool
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 