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
  Menu
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { walletService } from '@/services/walletService';

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
      <div className="relative z-10 h-screen flex flex-col">
        
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
        <div className="flex-1 flex">
          
          {/* Left Sidebar - Game Navigation */}
          <motion.div 
            className="w-80 bg-old-paper border-r-4 border-vintage-brown p-6"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="vintage-subtitle text-lg mb-6 text-vintage-brown">
              GAME MENU
            </h2>
            
            <div className="space-y-4">
              <motion.button
                className="w-full vintage-stat p-4 text-left hover:scale-105 transition-transform"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/city'}
              >
                <div className="flex items-center gap-3">
                  <Map className="w-6 h-6 text-forest-green" />
                  <div>
                    <div className="vintage-subtitle text-sm text-charcoal">CITY</div>
                    <div className="vintage-text text-xs text-charcoal">Explore the digital realm</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="w-full vintage-stat p-4 text-left hover:scale-105 transition-transform"
                whileHover={{ x: 10 }}
                onClick={() => window.location.href = '/marketplace'}
              >
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-aged-yellow" />
                  <div>
                    <div className="vintage-subtitle text-sm text-charcoal">MARKETPLACE</div>
                    <div className="vintage-text text-xs text-charcoal">Trade and bridge assets</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="w-full vintage-stat p-4 text-left hover:scale-105 transition-transform"
                whileHover={{ x: 10 }}
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-6 h-6 text-rust-red" />
                  <div>
                    <div className="vintage-subtitle text-sm text-charcoal">ARENA</div>
                    <div className="vintage-text text-xs text-charcoal">Battle other survivors</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                className="w-full vintage-stat p-4 text-left hover:scale-105 transition-transform"
                whileHover={{ x: 10 }}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-vintage-brown" />
                  <div>
                    <div className="vintage-subtitle text-sm text-charcoal">LEADERBOARD</div>
                    <div className="vintage-text text-xs text-charcoal">View rankings</div>
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Player Stats */}
            {isConnected && player && (
              <motion.div 
                className="mt-8 vintage-stat p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="vintage-subtitle text-sm mb-3 text-vintage-brown">
                  YOUR STATS
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">Level:</span>
                    <span className="vintage-text text-xs text-forest-green">{player.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">XP:</span>
                    <span className="vintage-text text-xs text-aged-yellow">{player.xp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">Credits:</span>
                    <span className="vintage-text text-xs text-rust-red">{player.survivalCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="vintage-text text-xs text-charcoal">Rank:</span>
                    <span className="vintage-text text-xs text-vintage-brown">#{player.rank}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Main Content Area */}
          <div className="flex-1 p-8">
            
            {/* Welcome Section */}
            <motion.div 
              className="crushed-paper p-8 mb-8 coffee-stain"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h2 className="vintage-subtitle text-2xl mb-4 text-vintage-brown">
                WELCOME TO ASGARD
              </h2>
              <p className="vintage-text text-lg leading-relaxed mb-6">
                The crypto world has collapsed into chaos. Multiple blockchain networks are isolated, 
                and resources are scarce. Asgard has become the last refuge for crypto survivors. 
                Only the smartest traders and bridge masters can survive.
              </p>
              
              {!isConnected ? (
                <div className="flex gap-4">
                  <button 
                    onClick={handleConnectWallet}
                    className="vintage-button px-6 py-3 text-lg"
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
                    className="vintage-button px-6 py-3 text-lg"
                  >
                    <Sword className="w-5 h-5 inline mr-2" />
                    ENTER THE CITY
                  </button>
                  <button 
                    className="vintage-button px-6 py-3 text-lg"
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
              className="grid grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.div 
                className="crushed-paper p-6 ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Zap className="w-12 h-12 mb-4 text-rust-red" />
                <h3 className="vintage-subtitle text-lg mb-2">REAL DEFI TRADING</h3>
                <p className="vintage-text text-sm">Trade real assets with 1inch integration</p>
              </motion.div>

              <motion.div 
                className="crushed-paper p-6 ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="w-12 h-12 mb-4 text-forest-green" />
                <h3 className="vintage-subtitle text-lg mb-2">CROSS-CHAIN BRIDGE</h3>
                <p className="vintage-text text-sm">Seamless Ethereum ↔ Stellar swaps</p>
              </motion.div>

              <motion.div 
                className="crushed-paper p-6 ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Gamepad2 className="w-12 h-12 mb-4 text-aged-yellow" />
                <h3 className="vintage-subtitle text-lg mb-2">INTERACTIVE GAMEPLAY</h3>
                <p className="vintage-text text-sm">Skill-based mini-games and challenges</p>
              </motion.div>

              <motion.div 
                className="crushed-paper p-6 ink-blot"
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Crown className="w-12 h-12 mb-4 text-vintage-brown" />
                <h3 className="vintage-subtitle text-lg mb-2">COMPETITIVE SURVIVAL</h3>
                <p className="vintage-text text-sm">Compete with 1,000+ players globally</p>
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