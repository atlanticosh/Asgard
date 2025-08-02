'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { walletService } from '@/services/walletService';

export default function WalletModal() {
  const { showWalletModal, toggleWalletModal, connectWallet } = useGameStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletInfo = await walletService.connectWallet();
      if (walletInfo) {
        connectWallet(walletInfo.address);
        setSuccess(true);
        setTimeout(() => {
          toggleWalletModal();
          setSuccess(false);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AnimatePresence>
      {showWalletModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleWalletModal}
          />

          {/* Modal */}
          <motion.div
            className="relative crushed-paper p-8 max-w-md w-full coffee-stain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={toggleWalletModal}
              className="absolute top-4 right-4 text-vintage-brown hover:text-rust-red transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="text-center">
              <motion.div
                className="mb-6"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Wallet className="w-16 h-16 mx-auto mb-4 text-vintage-brown" />
                <h2 className="vintage-subtitle text-2xl mb-2 text-vintage-brown">
                  CONNECT WALLET
                </h2>
                <p className="vintage-text text-sm text-charcoal">
                  Connect your wallet to enter ASGARD and begin your survival journey
                </p>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mb-6 p-4 vintage-stat"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center gap-2 text-sm text-rust-red vintage-text">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    className="mb-6 p-4 vintage-stat"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center gap-2 text-sm text-forest-green vintage-text">
                      <CheckCircle className="w-4 h-4" />
                      Wallet connected successfully!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connect Button */}
              <motion.button
                className="vintage-button w-full py-4 text-lg font-bold"
                onClick={handleConnect}
                disabled={isConnecting || success}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <span className="vintage-loading">CONNECTING</span>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    CONNECTED
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 inline mr-2" />
                    CONNECT METAMASK
                  </>
                )}
              </motion.button>

              {/* Requirements */}
              <motion.div
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="vintage-subtitle text-sm mb-3 text-rust-red">
                  REQUIREMENTS:
                </h3>
                <ul className="vintage-text text-xs text-charcoal space-y-1">
                  <li>• MetaMask wallet extension installed</li>
                  <li>• Ethereum network connection</li>
                  <li>• Sufficient ETH for gas fees</li>
                  <li>• Browser with Web3 support</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 