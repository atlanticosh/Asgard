'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Store, 
  Gamepad2, 
  User, 
  Sword,
  Shield,
  Zap,
  Crown,
  Building2,
  Users,
  Target,
  Coins,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import './city.css';

export default function CityPage() {
  const { 
    isConnected, 
    player, 
    setCurrentView,
    addXP,
    addCredits
  } = useGameStore();
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [gameEvents, setGameEvents] = useState([
    { id: 1, type: 'trade', title: 'Arbitrage Opportunity', reward: 50, location: 'marketplace' },
    { id: 2, type: 'battle', title: 'Bridge Challenge', reward: 100, location: 'arena' },
    { id: 3, type: 'quest', title: 'Cross-Chain Mastery', reward: 200, location: 'tower' },
  ]);

  const cityBuildings = [
    {
      id: 'plaza',
      name: 'ASGARD PLAZA',
      description: 'The central hub of the digital realm. Survivors gather here to trade information and form alliances.',
      features: ['Marketplace', 'Arena', 'Tower', 'Safe Zone'],
      icon: Map,
      level: 1,
      available: true,
      color: 'text-forest-green'
    },
    {
      id: 'marketplace',
      name: 'DEFI MARKETPLACE',
      description: 'A bustling trading floor where survivors exchange assets across chains. The air crackles with opportunity.',
      features: ['Swap Interface', 'Bridge Terminal', 'Price Feeds', 'Trading Pairs'],
      icon: Store,
      level: 2,
      available: true,
      color: 'text-aged-yellow'
    },
    {
      id: 'arena',
      name: 'SURVIVAL ARENA',
      description: 'Where the strongest traders prove their worth. Only the smartest survive the challenges.',
      features: ['PvP Battles', 'Skill Challenges', 'Leaderboards', 'Rewards'],
      icon: Gamepad2,
      level: 1,
      available: true,
      color: 'text-rust-red'
    },
    {
      id: 'tower',
      name: 'BRIDGE TOWER',
      description: 'The highest point in Asgard. Master the art of cross-chain bridging to ascend.',
      features: ['Bridge Tutorials', 'Advanced Swaps', 'Chain Analytics', 'Mastery Tests'],
      icon: Building2,
      level: 3,
      available: true,
      color: 'text-vintage-brown'
    },
    {
      id: 'factory',
      name: 'CROSS-CHAIN FACTORY',
      description: 'Where new bridges are forged and old ones are maintained. The heart of inter-chain commerce.',
      features: ['Bridge Construction', 'Chain Integration', 'Security Protocols', 'Factory Upgrades'],
      icon: Zap,
      level: 0,
      available: false,
      color: 'text-charcoal'
    },
    {
      id: 'library',
      name: 'KNOWLEDGE LIBRARY',
      description: 'Ancient scrolls and modern protocols coexist. Learn the secrets of DeFi survival.',
      features: ['Trading Guides', 'Bridge Manuals', 'Strategy Books', 'Historical Data'],
      icon: BookOpen,
      level: 0,
      available: false,
      color: 'text-faded-blue'
    },
    {
      id: 'barracks',
      name: 'TRADER BARRACKS',
      description: 'Train your trading skills and prepare for the ultimate survival challenges.',
      features: ['Skill Training', 'Combat Prep', 'Team Formation', 'Strategy Planning'],
      icon: Users,
      level: 0,
      available: false,
      color: 'text-forest-green'
    },
    {
      id: 'treasury',
      name: 'CITY TREASURY',
      description: 'The vault where all city resources are stored and managed.',
      features: ['Resource Storage', 'Tax Collection', 'City Funding', 'Economic Control'],
      icon: Coins,
      level: 0,
      available: false,
      color: 'text-aged-yellow'
    },
    {
      id: 'gate',
      name: 'CITY GATE',
      description: 'The main entrance to Asgard. All travelers must pass through here.',
      features: ['Access Control', 'Security Check', 'Visitor Log', 'Gate Maintenance'],
      icon: Shield,
      level: 0,
      available: false,
      color: 'text-rust-red'
    }
  ];

  const handleBuildingClick = (building: any) => {
    if (!building.available) {
      setModalContent({
        title: 'BUILDING LOCKED',
        content: `This building requires level ${building.level} to unlock. Continue your journey to unlock more of Asgard!`
      });
      setShowModal(true);
      return;
    }

    setSelectedLocation(building);
    setShowSidePanel(true);
    addXP(10);
  };

  const handleEventComplete = (eventId: number) => {
    const event = gameEvents.find(e => e.id === eventId);
    if (event) {
      addXP(event.reward);
      addCredits(event.reward * 2);
      setGameEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const handleCloseSidePanel = () => {
    setShowSidePanel(false);
    setSelectedLocation(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  const handleNavigateToLocation = (locationId: string) => {
    if (locationId === 'marketplace') {
      window.location.href = '/marketplace';
    } else {
      const building = cityBuildings.find(b => b.id === locationId);
      if (building) {
        handleBuildingClick(building);
      }
    }
  };

  const handleExplore = () => {
    if (!selectedLocation) return;
    
    // Generate random exploration events based on location
    const explorationEvents = {
      plaza: [
        { title: 'Found Hidden Passage', reward: 25, description: 'You discovered a secret tunnel leading to ancient DeFi knowledge.' },
        { title: 'Met Fellow Survivor', reward: 30, description: 'A trader shared valuable insights about cross-chain strategies.' },
        { title: 'Found Old Scrolls', reward: 20, description: 'Ancient trading manuals reveal forgotten techniques.' }
      ],
      marketplace: [
        { title: 'Price Arbitrage', reward: 40, description: 'You spotted a price difference and made a quick profit.' },
        { title: 'Network Discovery', reward: 35, description: 'Found a new bridge route with better rates.' },
        { title: 'Trading Opportunity', reward: 30, description: 'Identified a profitable swap opportunity.' }
      ],
      arena: [
        { title: 'Combat Training', reward: 45, description: 'Improved your trading reflexes and strategy.' },
        { title: 'Weapon Upgrade', reward: 35, description: 'Enhanced your trading tools and techniques.' },
        { title: 'Battle Experience', reward: 40, description: 'Gained valuable combat experience.' }
      ],
      tower: [
        { title: 'Bridge Mastery', reward: 50, description: 'Advanced your cross-chain bridging skills.' },
        { title: 'Chain Analysis', reward: 35, description: 'Learned to analyze blockchain networks.' },
        { title: 'Security Protocol', reward: 40, description: 'Mastered advanced security techniques.' }
      ]
    };

    const events = explorationEvents[selectedLocation.id as keyof typeof explorationEvents] || explorationEvents.plaza;
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    setModalContent({
      title: 'EXPLORATION COMPLETE',
      content: `${randomEvent.description} You gained ${randomEvent.reward} XP and ${randomEvent.reward * 2} credits for your discovery!`,
      reward: randomEvent.reward
    });
    
    addXP(randomEvent.reward);
    addCredits(randomEvent.reward * 2);
    setShowModal(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-old-paper flex items-center justify-center">
        <div className="crushed-paper p-8 text-center">
          <h2 className="vintage-subtitle text-2xl mb-4 text-rust-red">ACCESS DENIED</h2>
          <p className="vintage-text mb-6">You must connect your wallet to enter the city.</p>
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
    <div className="city-layout">
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
                ASGARD CITY
              </motion.h1>
              <span className="vintage-subtitle text-sm text-rust-red">
                {selectedLocation ? selectedLocation.name : 'CITY MAP'}
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
                <div className="vintage-stat px-3 py-1">
                  <span className="terminal-text text-xs">
                    {player?.walletAddress ? 
                      `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}` : 
                      '0x6f21...9f8e'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="city-main-content">
          
          <div className="city-map-area">
            <div className="city-map-background"></div>
            
            <div className="city-buildings">
              {cityBuildings.map((building, index) => {
                const IconComponent = building.icon;
                return (
                  <motion.div
                    key={building.id}
                    className={`city-building ${building.available ? 'available' : 'locked'}`}
                    whileHover={{ scale: building.available ? 1.05 : 1 }}
                    onClick={() => handleBuildingClick(building)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <IconComponent className={`city-building-icon ${building.color}`} />
                    <div className="city-building-title">{building.name}</div>
                    <div className="city-building-level">Level {building.level}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div 
            className={`city-side-panel ${showSidePanel ? 'open' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: showSidePanel ? 400 : 0 }}
            transition={{ duration: 0.4 }}
          >
            {showSidePanel && selectedLocation && (
              <div className="city-side-panel-content">
                <div className="city-side-panel-header">
                  <h2 className="city-side-panel-title">{selectedLocation.name}</h2>
                  <button 
                    className="city-side-panel-close"
                    onClick={handleCloseSidePanel}
                  >
                    ×
                  </button>
                </div>

                <div className="city-location-description">
                  {selectedLocation.description}
                </div>

                <div className="city-location-features">
                  <h3>FEATURES</h3>
                  <ul className="city-feature-list">
                    {selectedLocation.features.map((feature: string, index: number) => (
                      <li key={index} className="city-feature-item">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="city-events-section">
                  <h3 className="city-events-title">ACTIVE EVENTS</h3>
                  {gameEvents
                    .filter(event => event.location === selectedLocation.id)
                    .map(event => (
                      <div 
                        key={event.id} 
                        className="city-event-card"
                        onClick={() => handleEventComplete(event.id)}
                      >
                        <div className="city-event-title">{event.title}</div>
                        <div className="city-event-reward">+{event.reward} XP</div>
                        <div className="city-event-location">{event.location}</div>
                      </div>
                    ))}
                </div>

                <div className="city-action-buttons">
                  {selectedLocation.id === 'marketplace' && (
                    <button 
                      className="city-action-button"
                      onClick={() => handleNavigateToLocation('marketplace')}
                    >
                      <Store className="w-4 h-4" />
                      ENTER
                    </button>
                  )}
                  {selectedLocation.id === 'arena' && (
                    <button className="city-action-button">
                      <Sword className="w-4 h-4" />
                      BATTLE
                    </button>
                  )}
                  {selectedLocation.id === 'tower' && (
                    <button className="city-action-button">
                      <Crown className="w-4 h-4" />
                      MASTERY
                    </button>
                  )}
                  <button 
                    className="city-action-button"
                    onClick={handleExplore}
                  >
                    <Target className="w-4 h-4" />
                    EXPLORE
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div 
          className="crushed-paper border-t-4 border-vintage-brown p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div className="vintage-text text-sm text-vintage-brown">
              ASGARD CITY | {selectedLocation ? selectedLocation.name : 'CITY MAP'}
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

      <div className={`city-modal-overlay ${showModal ? 'open' : ''}`} onClick={handleCloseModal}>
        <div className="city-modal" onClick={(e) => e.stopPropagation()}>
          <div className="city-modal-header">
            <h2 className="city-modal-title">{modalContent?.title}</h2>
            <button className="city-modal-close" onClick={handleCloseModal}>
              ×
            </button>
          </div>
          <div className="city-location-description">
            {modalContent?.content}
          </div>
          <div className="city-action-buttons">
            <button className="city-action-button" onClick={handleCloseModal}>
              <ArrowLeft className="w-4 h-4" />
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 