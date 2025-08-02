'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Store, 
  Gamepad2, 
  BarChart3, 
  User, 
  Menu, 
  Sword,
  Shield,
  Zap,
  Crown,
  Building2,
  Users,
  Target,
  Flame,
  Skull,
  Coins,
  Gem,
  Heart,
  Star,
  ArrowLeft
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export default function CityPage() {
  const { 
    isConnected, 
    player, 
    setCurrentView,
    addXP,
    addCredits
  } = useGameStore();
  
  const [currentLocation, setCurrentLocation] = useState('plaza');
  const [showInventory, setShowInventory] = useState(false);
  const [gameEvents, setGameEvents] = useState([
    { id: 1, type: 'trade', title: 'Arbitrage Opportunity', reward: 50, location: 'marketplace' },
    { id: 2, type: 'battle', title: 'Bridge Challenge', reward: 100, location: 'arena' },
    { id: 3, type: 'quest', title: 'Cross-Chain Mastery', reward: 200, location: 'tower' },
  ]);

  const locations = {
    plaza: {
      name: 'ASGARD PLAZA',
      description: 'The central hub of the digital realm. Survivors gather here to trade information and form alliances.',
      features: ['Marketplace', 'Arena', 'Tower', 'Safe Zone']
    },
    marketplace: {
      name: 'DEFI MARKETPLACE',
      description: 'A bustling trading floor where survivors exchange assets across chains. The air crackles with opportunity.',
      features: ['Swap Interface', 'Bridge Terminal', 'Price Feeds', 'Trading Pairs']
    },
    arena: {
      name: 'SURVIVAL ARENA',
      description: 'Where the strongest traders prove their worth. Only the smartest survive the challenges.',
      features: ['PvP Battles', 'Skill Challenges', 'Leaderboards', 'Rewards']
    },
    tower: {
      name: 'BRIDGE TOWER',
      description: 'The highest point in Asgard. Master the art of cross-chain bridging to ascend.',
      features: ['Bridge Tutorials', 'Advanced Swaps', 'Chain Analytics', 'Mastery Tests']
    }
  };

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location);
    addXP(10); // Small XP gain for exploring
  };

  const handleEventComplete = (eventId: number) => {
    const event = gameEvents.find(e => e.id === eventId);
    if (event) {
      addXP(event.reward);
      addCredits(event.reward * 2);
      setGameEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-old-paper flex items-center justify-center">
        <div className="crushed-paper p-8 text-center">
          <h2 className="vintage-subtitle text-2xl mb-4 text-rust-red">ACCESS DENIED</h2>
          <p className="vintage-text mb-6">You must connect your wallet to enter the city.</p>
          <button 
            onClick={() => setCurrentView('home')}
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
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
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentView('home')}
                className="vintage-button px-3 py-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="vintage-title text-2xl">ASGARD CITY</h1>
              <span className="vintage-subtitle text-sm text-rust-red">
                {locations[currentLocation as keyof typeof locations].name}
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
          
          {/* Left Sidebar - Navigation */}
          <div className="w-80 bg-old-paper border-r-4 border-vintage-brown p-6">
            <h2 className="vintage-subtitle text-lg mb-6 text-vintage-brown">
              LOCATIONS
            </h2>
            
            <div className="space-y-4">
              {Object.entries(locations).map(([key, location]) => (
                <motion.button
                  key={key}
                  className={`w-full vintage-stat p-4 text-left hover:scale-105 transition-transform ${
                    currentLocation === key ? 'border-2 border-forest-green' : ''
                  }`}
                  whileHover={{ x: 10 }}
                  onClick={() => handleLocationChange(key)}
                >
                  <div className="flex items-center gap-3">
                    {key === 'plaza' && <Map className="w-6 h-6 text-forest-green" />}
                    {key === 'marketplace' && <Store className="w-6 h-6 text-aged-yellow" />}
                    {key === 'arena' && <Gamepad2 className="w-6 h-6 text-rust-red" />}
                    {key === 'tower' && <Building2 className="w-6 h-6 text-vintage-brown" />}
                    <div>
                      <div className="vintage-subtitle text-sm text-charcoal">{location.name}</div>
                      <div className="vintage-text text-xs text-charcoal">{location.description}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Active Events */}
            <div className="mt-8">
              <h3 className="vintage-subtitle text-sm mb-3 text-vintage-brown">
                ACTIVE EVENTS
              </h3>
              <div className="space-y-2">
                {gameEvents.map(event => (
                  <motion.div 
                    key={event.id}
                    className="vintage-stat p-3 text-xs"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="vintage-text text-charcoal">{event.title}</span>
                      <button 
                        onClick={() => handleEventComplete(event.id)}
                        className="vintage-button px-2 py-1 text-xs"
                      >
                        +{event.reward} XP
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            
            {/* Location Description */}
            <motion.div 
              className="crushed-paper p-8 mb-8 coffee-stain"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="vintage-subtitle text-2xl mb-4 text-vintage-brown">
                {locations[currentLocation as keyof typeof locations].name}
              </h2>
              <p className="vintage-text text-lg leading-relaxed mb-6">
                {locations[currentLocation as keyof typeof locations].description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {locations[currentLocation as keyof typeof locations].features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="vintage-stat p-4 text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="vintage-text text-sm text-charcoal">{feature}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Location-Specific Content */}
            {currentLocation === 'plaza' && (
              <motion.div 
                className="grid grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="crushed-paper p-6 ink-blot">
                  <Users className="w-12 h-12 mb-4 text-forest-green" />
                  <h3 className="vintage-subtitle text-lg mb-2">SURVIVORS ONLINE</h3>
                  <p className="vintage-text text-sm">847 survivors currently in Asgard</p>
                  <div className="mt-4 text-2xl text-forest-green vintage-text">847</div>
                </div>

                <div className="crushed-paper p-6 ink-blot">
                  <Target className="w-12 h-12 mb-4 text-rust-red" />
                  <h3 className="vintage-subtitle text-lg mb-2">DAILY CHALLENGES</h3>
                  <p className="vintage-text text-sm">Complete challenges to earn rewards</p>
                  <div className="mt-4 text-2xl text-rust-red vintage-text">3</div>
                </div>

                <div className="crushed-paper p-6 ink-blot">
                  <Coins className="w-12 h-12 mb-4 text-aged-yellow" />
                  <h3 className="vintage-subtitle text-lg mb-2">TOTAL PRIZE POOL</h3>
                  <p className="vintage-text text-sm">Survive to claim your share</p>
                  <div className="mt-4 text-2xl text-aged-yellow vintage-text">$50K</div>
                </div>

                <div className="crushed-paper p-6 ink-blot">
                  <Flame className="w-12 h-12 mb-4 text-vintage-brown" />
                  <h3 className="vintage-subtitle text-lg mb-2">DAYS REMAINING</h3>
                  <p className="vintage-text text-sm">Time is running out</p>
                  <div className="mt-4 text-2xl text-vintage-brown vintage-text">18</div>
                </div>
              </motion.div>
            )}

            {currentLocation === 'marketplace' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">TRADING INTERFACE</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="vintage-stat p-4 text-center">
                      <div className="text-2xl text-forest-green vintage-text">ETH</div>
                      <div className="text-sm text-charcoal vintage-text">$2,450.32</div>
                    </div>
                    <div className="vintage-stat p-4 text-center">
                      <div className="text-2xl text-aged-yellow vintage-text">XLM</div>
                      <div className="text-sm text-charcoal vintage-text">$0.12</div>
                    </div>
                    <div className="vintage-stat p-4 text-center">
                      <div className="text-2xl text-rust-red vintage-text">USDC</div>
                      <div className="text-sm text-charcoal vintage-text">$1.00</div>
                    </div>
                  </div>
                  <button className="vintage-button px-6 py-3 w-full">
                    <Zap className="w-5 h-5 inline mr-2" />
                    OPEN SWAP INTERFACE
                  </button>
                </div>

                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">BRIDGE TERMINAL</h3>
                  <p className="vintage-text mb-4">Cross-chain bridge between Ethereum and Stellar</p>
                  <button className="vintage-button px-6 py-3 w-full">
                    <Shield className="w-5 h-5 inline mr-2" />
                    INITIATE BRIDGE SWAP
                  </button>
                </div>
              </motion.div>
            )}

            {currentLocation === 'arena' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">BATTLE ARENA</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="vintage-stat p-4 text-center">
                      <Sword className="w-8 h-8 mx-auto mb-2 text-rust-red" />
                      <div className="vintage-text text-sm">PvP BATTLES</div>
                    </div>
                    <div className="vintage-stat p-4 text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 text-forest-green" />
                      <div className="vintage-text text-sm">SKILL CHALLENGES</div>
                    </div>
                  </div>
                  <button className="vintage-button px-6 py-3 w-full">
                    <Gamepad2 className="w-5 h-5 inline mr-2" />
                    ENTER BATTLE
                  </button>
                </div>

                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">LEADERBOARD</h3>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(rank => (
                      <div key={rank} className="flex justify-between items-center vintage-stat p-3">
                        <span className="vintage-text text-sm">#{rank} Survivor_{rank}</span>
                        <span className="vintage-text text-sm text-aged-yellow">{1000 - rank * 50} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentLocation === 'tower' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">BRIDGE MASTERY</h3>
                  <div className="space-y-4">
                    <div className="vintage-stat p-4">
                      <div className="flex justify-between items-center">
                        <span className="vintage-text text-sm">Basic Bridge Tutorial</span>
                        <Star className="w-4 h-4 text-aged-yellow" />
                      </div>
                    </div>
                    <div className="vintage-stat p-4">
                      <div className="flex justify-between items-center">
                        <span className="vintage-text text-sm">Advanced Swaps</span>
                        <Star className="w-4 h-4 text-aged-yellow" />
                      </div>
                    </div>
                    <div className="vintage-stat p-4">
                      <div className="flex justify-between items-center">
                        <span className="vintage-text text-sm">Chain Analytics</span>
                        <Star className="w-4 h-4 text-aged-yellow" />
                      </div>
                    </div>
                  </div>
                  <button className="vintage-button px-6 py-3 w-full mt-4">
                    <Crown className="w-5 h-5 inline mr-2" />
                    START TUTORIAL
                  </button>
                </div>

                <div className="crushed-paper p-6">
                  <h3 className="vintage-subtitle text-xl mb-4 text-vintage-brown">MASTERY TESTS</h3>
                  <p className="vintage-text mb-4">Prove your cross-chain expertise</p>
                  <button className="vintage-button px-6 py-3 w-full">
                    <Target className="w-5 h-5 inline mr-2" />
                    TAKE MASTERY TEST
                  </button>
                </div>
              </motion.div>
            )}
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
              ASGARD CITY | {locations[currentLocation as keyof typeof locations].name}
            </div>
            <div className="flex items-center gap-4">
              <span className="vintage-text text-sm text-charcoal">
                ⚡ {gameEvents.length} Active Events
              </span>
              <span className="vintage-text text-sm text-charcoal">
                🌉 Bridge Mastery Level: {Math.floor((player?.xp || 0) / 100) + 1}
              </span>
              <span className="vintage-text text-sm text-charcoal">
                💰 Daily Rewards: ${Math.floor((player?.survivalCredits || 0) / 10)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 