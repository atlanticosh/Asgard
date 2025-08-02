import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Player {
  id: string;
  username: string;
  walletAddress: string;
  level: number;
  xp: number;
  survivalCredits: number;
  rank: number;
  daysSurvived: number;
  totalPlayers: number;
  achievements: string[];
  createdAt: Date;
}

export interface GameState {
  // Player state
  player: Player | null;
  isConnected: boolean;
  isLoading: boolean;
  
  // Game state
  currentDay: number;
  totalDays: number;
  gamePhase: 'lobby' | 'playing' | 'eliminated' | 'victory';
  
  // UI state
  currentView: 'home' | 'city' | 'marketplace' | 'bridge' | 'arena' | 'challenges';
  showWalletModal: boolean;
  showTutorial: boolean;
  
  // Actions
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  updatePlayer: (updates: Partial<Player>) => void;
  addXP: (amount: number) => void;
  addCredits: (amount: number) => void;
  setCurrentView: (view: GameState['currentView']) => void;
  toggleWalletModal: () => void;
  toggleTutorial: () => void;
  resetGame: () => void;
}

const initialPlayer: Player = {
  id: '',
  username: '',
  walletAddress: '',
  level: 1,
  xp: 0,
  survivalCredits: 1000,
  rank: 0,
  daysSurvived: 0,
  totalPlayers: 1000,
  achievements: [],
  createdAt: new Date(),
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      player: null,
      isConnected: false,
      isLoading: false,
      currentDay: 1,
      totalDays: 30,
      gamePhase: 'lobby',
      currentView: 'home',
      showWalletModal: false,
      showTutorial: false,

      // Actions
      connectWallet: (address: string) => {
        const username = `CryptoSurvivor_${Math.floor(Math.random() * 1000)}`;
        const player: Player = {
          ...initialPlayer,
          id: `player_${Date.now()}`,
          username,
          walletAddress: address,
          createdAt: new Date(),
        };

        set({
          player,
          isConnected: true,
          gamePhase: 'playing',
          currentView: 'city',
        });
      },

      disconnectWallet: () => {
        set({
          player: null,
          isConnected: false,
          gamePhase: 'lobby',
          currentView: 'home',
        });
      },

      updatePlayer: (updates: Partial<Player>) => {
        const { player } = get();
        if (player) {
          set({
            player: { ...player, ...updates },
          });
        }
      },

      addXP: (amount: number) => {
        const { player } = get();
        if (player) {
          const newXP = player.xp + amount;
          const newLevel = Math.floor(newXP / 100) + 1;
          
          set({
            player: {
              ...player,
              xp: newXP,
              level: newLevel,
            },
          });
        }
      },

      addCredits: (amount: number) => {
        const { player } = get();
        if (player) {
          const newCredits = player.survivalCredits + amount;
          
          set({
            player: {
              ...player,
              survivalCredits: newCredits,
            },
          });
        }
      },

      setCurrentView: (view: GameState['currentView']) => {
        set({ currentView: view });
      },

      toggleWalletModal: () => {
        set((state) => ({ showWalletModal: !state.showWalletModal }));
      },

      toggleTutorial: () => {
        set((state) => ({ showTutorial: !state.showTutorial }));
      },

      resetGame: () => {
        set({
          player: null,
          isConnected: false,
          gamePhase: 'lobby',
          currentView: 'home',
          currentDay: 1,
          showWalletModal: false,
          showTutorial: false,
        });
      },
    }),
    {
      name: 'asgard-game-storage',
      partialize: (state) => ({
        player: state.player,
        isConnected: state.isConnected,
        gamePhase: state.gamePhase,
        currentDay: state.currentDay,
      }),
    }
  )
); 