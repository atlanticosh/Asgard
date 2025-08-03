'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Star,
  Zap,
  Lock,
  Unlock,
  Wallet,
  Activity
} from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { stellarService, type HTLCResult, type StellarBalance } from '@/services/stellarService';
import './stellar.css';

export default function StellarPage() {
  const { isConnected, player, addXP, addCredits } = useGameStore();
  
  // State management
  const [stellarBalance, setStellarBalance] = useState<StellarBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [htlcContracts, setHtlcContracts] = useState<HTLCResult[]>([]);
  const [activeTab, setActiveTab] = useState<'bridge' | 'htlc' | 'balance' | 'test'>('bridge');
  
  // Bridge form state
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeToChain, setBridgeToChain] = useState('ethereum');
  const [bridgeFromToken, setBridgeFromToken] = useState('XLM');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string>('');
  const [bridgeResult, setBridgeResult] = useState<any>(null);
  const [bridgeProgress, setBridgeProgress] = useState<string>('');
  
  // HTLC form state
  const [htlcAmount, setHtlcAmount] = useState('');
  const [htlcParticipant, setHtlcParticipant] = useState('');
  const [htlcAsset, setHtlcAsset] = useState('XLM');
  const [htlcTimelock, setHtlcTimelock] = useState(30);
  const [isCreatingHTLC, setIsCreatingHTLC] = useState(false);
  
  // HTLC management state
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [preimage, setPreimage] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  // Load Stellar balance on component mount
  useEffect(() => {
    if (isConnected) {
      loadStellarBalance();
    }
  }, [isConnected]);

  const loadStellarBalance = async () => {
    try {
      setIsLoading(true);
      const balance = await stellarService.getBalance();
      setStellarBalance(Array.isArray(balance) ? balance : []);
    } catch (error) {
      console.error('Error loading Stellar balance:', error);
      setStellarBalance([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHTLC = async () => {
    if (!htlcAmount || !htlcParticipant || parseFloat(htlcAmount) <= 0) return;
    
    setIsCreatingHTLC(true);
    
    try {
      const contractId = `htlc-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      const htlcParams = stellarService.generateHTLCParams(
        contractId,
        htlcParticipant,
        stellarService.formatXLMAmount(htlcAmount),
        htlcAsset,
        htlcTimelock
      );

      const result = await stellarService.createHTLC(htlcParams);
      
      setHtlcContracts(prev => [...prev, result]);
      setHtlcAmount('');
      setHtlcParticipant('');
      
      addXP(50);
      addCredits(100);
      
      // Record transaction
      await fetch('/api/profile/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: player?.walletAddress || 'stellar-account',
          txHash: result.transactionHash,
          type: 'htlc_create',
          fromToken: htlcAsset,
          toToken: htlcAsset,
          amount: htlcAmount,
          valueUsd: parseFloat(htlcAmount) * 0.12, // Approximate XLM price
          chain: 'stellar',
          blockNumber: 0,
          gasUsed: '0',
          gasPrice: '0'
        })
      });
      
    } catch (error) {
      console.error('Error creating HTLC:', error);
    } finally {
      setIsCreatingHTLC(false);
    }
  };

  const handleWithdrawHTLC = async () => {
    if (!selectedContract || !preimage) return;
    
    setIsWithdrawing(true);
    
    try {
      const result = await stellarService.withdrawHTLC(selectedContract, preimage);
      
      // Update contract status
      setHtlcContracts(prev => 
        prev.map(contract => 
          contract.contractId === selectedContract 
            ? { ...contract, status: 'completed' }
            : contract
        )
      );
      
      setSelectedContract('');
      setPreimage('');
      
      addXP(75);
      addCredits(150);
      
    } catch (error) {
      console.error('Error withdrawing HTLC:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefundHTLC = async () => {
    if (!selectedContract) return;
    
    setIsRefunding(true);
    
    try {
      const result = await stellarService.refundHTLC(selectedContract);
      
      // Update contract status
      setHtlcContracts(prev => 
        prev.map(contract => 
          contract.contractId === selectedContract 
            ? { ...contract, status: 'completed' }
            : contract
        )
      );
      
      setSelectedContract('');
      
      addXP(25);
      addCredits(50);
      
    } catch (error) {
      console.error('Error refunding HTLC:', error);
    } finally {
      setIsRefunding(false);
    }
  };

  const generatePreimage = () => {
    const newPreimage = stellarService.generatePreimage();
    setPreimage(newPreimage);
  };

  const testStellarService = async () => {
    try {
      setIsLoading(true);
      const result = await stellarService.testService();
      console.log('Stellar service test result:', result);
      addXP(10);
      addCredits(20);
    } catch (error) {
      console.error('Error testing Stellar service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pollBridgeStatus = async (txHash: string) => {
    try {
      const response = await fetch(`/api/bridge/status/${txHash}`);
      if (response.ok) {
        const data = await response.json();
        setBridgeProgress(data.progress);
        
        if (data.status === 'completed') {
          setBridgeStatus('Bridge completed successfully!');
          addXP(150);
          addCredits(300);
        } else if (data.status === 'processing') {
          setBridgeStatus('Bridge processing...');
        }
        
        // Continue polling if not completed
        if (data.status !== 'completed') {
          setTimeout(() => pollBridgeStatus(txHash), 5000); // Poll every 5 seconds
        }
      }
    } catch (error) {
      console.error('Error polling bridge status:', error);
    }
  };

  const handleInitiateBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return;
    
    setIsBridging(true);
    setBridgeStatus('Getting bridge quote...');
    setBridgeResult(null);
    
    try {
      // Step 1: Get bridge quote
      const quoteResponse = await fetch('/api/bridge/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: 'stellar',
          toChain: bridgeToChain,
          fromToken: bridgeFromToken,
          amount: bridgeAmount
        })
      });
      
      if (!quoteResponse.ok) {
        throw new Error('Failed to get bridge quote');
      }
      
      const quote = await quoteResponse.json();
      setBridgeStatus('Quote received! Initiating bridge...');
      
      // Step 2: Execute bridge
      const bridgeResponse = await fetch('/api/bridge/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: 'stellar',
          toChain: bridgeToChain,
          fromToken: bridgeFromToken,
          amount: bridgeAmount,
          toAddress: player?.walletAddress || 'stellar-account'
        })
      });
      
      if (!bridgeResponse.ok) {
        throw new Error('Failed to execute bridge');
      }
      
      const result = await bridgeResponse.json();
      setBridgeResult(result);
      setBridgeStatus('Bridge initiated successfully!');
      
      // Start polling for bridge status
      if (result.transaction?.txHash) {
        pollBridgeStatus(result.transaction.txHash);
      }
      
      // Step 3: Record transaction
      await fetch('/api/profile/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: player?.walletAddress || 'stellar-account',
          txHash: result.txHash,
          type: 'bridge',
          fromChain: 'stellar',
          toChain: bridgeToChain,
          fromToken: bridgeFromToken,
          amount: bridgeAmount,
          status: 'pending',
          timestamp: new Date().toISOString()
        })
      });
      
      // Step 4: Award XP and credits
      addXP(100);
      addCredits(200);
      
      // Step 5: Clear form but keep results visible
      setBridgeAmount('');
      // Don't auto-clear status and results - let user see them
      
    } catch (error) {
      console.error('Bridge error:', error);
      setBridgeStatus(`Bridge failed: ${error.message}`);
    } finally {
      setIsBridging(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-old-paper flex items-center justify-center">
        <div className="crushed-paper p-8 text-center">
          <h2 className="vintage-subtitle text-2xl mb-4 text-rust-red">ACCESS DENIED</h2>
          <p className="vintage-text mb-6">You must connect your wallet to access the Stellar bridge.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="vintage-button px-6 py-3"
          >
            <ArrowRight className="w-5 h-5 inline mr-2" />
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stellar-layout">
      {/* Background */}
      <div className="stellar-background"></div>
      
      {/* Game Layout */}
      <div className="stellar-container">
        
        {/* Top Game Bar */}
        <motion.div 
          className="stellar-header"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
        >
          <div className="stellar-header-content">
            <button 
              onClick={() => window.location.href = '/'}
              className="stellar-back-button"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="stellar-title-section">
              <h1 className="stellar-title">
                <Star className="w-6 h-6 inline mr-2" />
                STELLAR CROSS-CHAIN BRIDGE
              </h1>
              <p className="stellar-subtitle">HTLC-Powered Cross-Chain Transfers</p>
            </div>
            
            <div className="stellar-stats">
              <div className="stellar-stat">
                <span className="stellar-stat-label">LEVEL</span>
                <span className="stellar-stat-value">{player?.level || 1}</span>
              </div>
              <div className="stellar-stat">
                <span className="stellar-stat-label">XP</span>
                <span className="stellar-stat-value">{player?.xp || 0}</span>
              </div>
              <div className="stellar-stat">
                <span className="stellar-stat-label">CREDITS</span>
                <span className="stellar-stat-value">{player?.credits || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="stellar-main-content">
          
          {/* Tab Navigation */}
          <div className="stellar-tabs">
            <button
              onClick={() => setActiveTab('bridge')}
              className={`stellar-tab ${activeTab === 'bridge' ? 'active' : ''}`}
            >
              <Zap className="w-4 h-4 mr-2" />
              CROSS-CHAIN BRIDGE
            </button>
            <button
              onClick={() => setActiveTab('htlc')}
              className={`stellar-tab ${activeTab === 'htlc' ? 'active' : ''}`}
            >
              <Lock className="w-4 h-4 mr-2" />
              HTLC CONTRACTS
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`stellar-tab ${activeTab === 'balance' ? 'active' : ''}`}
            >
              <Wallet className="w-4 h-4 mr-2" />
              STELLAR BALANCE
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`stellar-tab ${activeTab === 'test' ? 'active' : ''}`}
            >
              <Activity className="w-4 h-4 mr-2" />
              TEST SERVICE
            </button>
          </div>

          {/* Tab Content */}
          <div className="stellar-content">
            
            {/* Cross-Chain Bridge Tab */}
            {activeTab === 'bridge' && (
              <motion.div 
                className="stellar-tab-content"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="stellar-section-title">
                  <Shield className="w-5 h-5 inline mr-2" />
                  CROSS-CHAIN BRIDGE
                </h2>
                
                <div className="stellar-bridge-form">
                  <div className="stellar-form-group">
                    <label className="stellar-label">FROM CHAIN</label>
                    <div className="stellar-chain-selector">
                      <Star className="w-4 h-4 mr-2" />
                      STELLAR
                    </div>
                  </div>
                  
                  <div className="stellar-form-group">
                    <label className="stellar-label">TO CHAIN</label>
                    <select 
                      value={bridgeToChain}
                      onChange={(e) => setBridgeToChain(e.target.value)}
                      className="stellar-select"
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="bsc">Binance Smart Chain</option>
                      <option value="avalanche">Avalanche</option>
                    </select>
                  </div>
                  
                  <div className="stellar-form-group">
                    <label className="stellar-label">AMOUNT (XLM)</label>
                    <input
                      type="number"
                      value={bridgeAmount}
                      onChange={(e) => setBridgeAmount(e.target.value)}
                      placeholder="0.0"
                      className="stellar-input"
                    />
                  </div>
                  
                  <button 
                    onClick={handleInitiateBridge}
                    disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0 || isBridging}
                    className="stellar-button primary"
                  >
                    {isBridging ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    {isBridging ? 'BRIDGING...' : 'INITIATE BRIDGE'}
                  </button>
                  
                  {/* Bridge Status Display */}
                  {bridgeStatus && (
                    <div className="stellar-bridge-status">
                      <div className="stellar-status-header">
                        <div className="stellar-status-message">
                          {bridgeStatus}
                          {bridgeProgress && (
                            <div className="stellar-progress-bar">
                              <div 
                                className="stellar-progress-fill" 
                                style={{ width: bridgeProgress }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setBridgeStatus('');
                            setBridgeResult(null);
                            setBridgeProgress('');
                          }}
                          className="stellar-clear-button"
                          title="Clear bridge results"
                        >
                          ×
                        </button>
                      </div>
                      {bridgeResult && (
                        <div className="stellar-bridge-result">
                          <div className="stellar-result-item">
                            <span className="stellar-result-label">Transaction Hash:</span>
                            <span className="stellar-result-value">{bridgeResult.transaction?.txHash || bridgeResult.txHash}</span>
                          </div>
                          <div className="stellar-result-item">
                            <span className="stellar-result-label">Estimated Time:</span>
                            <span className="stellar-result-value">{bridgeResult.transaction?.estimatedTime || bridgeResult.estimatedTime}</span>
                          </div>
                          <div className="stellar-result-item">
                            <span className="stellar-result-label">Bridge Fee:</span>
                            <span className="stellar-result-value">{bridgeResult.transaction?.fee || bridgeResult.fee}</span>
                          </div>
                          <div className="stellar-result-item">
                            <span className="stellar-result-label">Protocol:</span>
                            <span className="stellar-result-value">{bridgeResult.transaction?.protocol || bridgeResult.protocol}</span>
                          </div>
                          {bridgeResult.transaction?.contractId && (
                            <div className="stellar-result-item">
                              <span className="stellar-result-label">Contract ID:</span>
                              <span className="stellar-result-value">{bridgeResult.transaction.contractId}</span>
                            </div>
                          )}
                          {bridgeResult.transaction?.blockNumber && (
                            <div className="stellar-result-item">
                              <span className="stellar-result-label">Block Number:</span>
                              <span className="stellar-result-value">{bridgeResult.transaction.blockNumber}</span>
                            </div>
                          )}
                          {bridgeResult.transaction?.gasUsed && (
                            <div className="stellar-result-item">
                              <span className="stellar-result-label">Gas Used:</span>
                              <span className="stellar-result-value">{bridgeResult.transaction.gasUsed}</span>
                            </div>
                          )}
                          {bridgeResult.transaction?.explorers && (
                            <div className="stellar-result-item">
                              <span className="stellar-result-label">Explorer Links:</span>
                              <div className="stellar-explorer-links">
                                <a 
                                  href={bridgeResult.transaction.explorers.stellar} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="stellar-explorer-link"
                                >
                                  Stellar
                                </a>
                                <a 
                                  href={bridgeResult.transaction.explorers.baseSepolia} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="stellar-explorer-link"
                                >
                                  Base Sepolia
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* HTLC Contracts Tab */}
            {activeTab === 'htlc' && (
              <motion.div 
                className="stellar-tab-content"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="stellar-section-title">
                  <Lock className="w-5 h-5 inline mr-2" />
                  HTLC CONTRACTS
                </h2>
                
                {/* Create HTLC Form */}
                <div className="stellar-htlc-form">
                  <h3 className="stellar-subsection-title">Create New HTLC</h3>
                  
                  <div className="stellar-form-row">
                    <div className="stellar-form-group">
                      <label className="stellar-label">AMOUNT</label>
                      <input
                        type="number"
                        value={htlcAmount}
                        onChange={(e) => setHtlcAmount(e.target.value)}
                        placeholder="0.0"
                        className="stellar-input"
                      />
                    </div>
                    
                    <div className="stellar-form-group">
                      <label className="stellar-label">ASSET</label>
                      <select 
                        value={htlcAsset}
                        onChange={(e) => setHtlcAsset(e.target.value)}
                        className="stellar-select"
                      >
                        <option value="XLM">XLM</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="stellar-form-group">
                    <label className="stellar-label">PARTICIPANT ADDRESS</label>
                    <input
                      type="text"
                      value={htlcParticipant}
                      onChange={(e) => setHtlcParticipant(e.target.value)}
                      placeholder="G..."
                      className="stellar-input"
                    />
                  </div>
                  
                  <div className="stellar-form-group">
                    <label className="stellar-label">TIMELOCK (minutes)</label>
                    <input
                      type="number"
                      value={htlcTimelock}
                      onChange={(e) => setHtlcTimelock(parseInt(e.target.value))}
                      min="1"
                      max="1440"
                      className="stellar-input"
                    />
                  </div>
                  
                  <button 
                    onClick={handleCreateHTLC}
                    disabled={!htlcAmount || !htlcParticipant || isCreatingHTLC}
                    className="stellar-button primary"
                  >
                    {isCreatingHTLC ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    CREATE HTLC
                  </button>
                </div>

                {/* HTLC Management */}
                <div className="stellar-htlc-management">
                  <h3 className="stellar-subsection-title">Manage HTLCs</h3>
                  
                  {htlcContracts.length === 0 ? (
                    <p className="stellar-empty-state">No HTLC contracts found</p>
                  ) : (
                    <div className="stellar-htlc-list">
                      {htlcContracts.map((contract) => (
                        <div key={contract.contractId} className="stellar-htlc-item">
                          <div className="stellar-htlc-info">
                            <div className="stellar-htlc-header">
                              <span className="stellar-htlc-id">{contract.contractId}</span>
                              <span className={`stellar-htlc-status ${contract.status}`}>
                                {contract.status === 'pending' && <Clock className="w-3 h-3" />}
                                {contract.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                {contract.status === 'failed' && <XCircle className="w-3 h-3" />}
                                {contract.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="stellar-htlc-details">
                              <span>Amount: {contract.amount} {contract.asset}</span>
                              <span>Participant: {contract.participant}</span>
                            </div>
                          </div>
                          
                          {contract.status === 'pending' && (
                            <div className="stellar-htlc-actions">
                              <button
                                onClick={() => setSelectedContract(contract.contractId)}
                                className="stellar-button secondary"
                              >
                                <Unlock className="w-4 h-4 mr-2" />
                                WITHDRAW
                              </button>
                              <button
                                onClick={() => handleRefundHTLC()}
                                className="stellar-button secondary"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                REFUND
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Withdraw HTLC Modal */}
                {selectedContract && (
                  <div className="stellar-modal-overlay">
                    <div className="stellar-modal">
                      <h3 className="stellar-modal-title">Withdraw HTLC</h3>
                      
                      <div className="stellar-form-group">
                        <label className="stellar-label">PREIMAGE</label>
                        <div className="stellar-preimage-input">
                          <input
                            type="text"
                            value={preimage}
                            onChange={(e) => setPreimage(e.target.value)}
                            placeholder="0x..."
                            className="stellar-input"
                          />
                          <button
                            onClick={generatePreimage}
                            className="stellar-button secondary"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                      
                      <div className="stellar-modal-actions">
                        <button
                          onClick={handleWithdrawHTLC}
                          disabled={!preimage || isWithdrawing}
                          className="stellar-button primary"
                        >
                          {isWithdrawing ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4 mr-2" />
                          )}
                          WITHDRAW
                        </button>
                        <button
                          onClick={() => setSelectedContract('')}
                          className="stellar-button secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stellar Balance Tab */}
            {activeTab === 'balance' && (
              <motion.div 
                className="stellar-tab-content"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="stellar-section-title">
                  <Wallet className="w-5 h-5 inline mr-2" />
                  STELLAR BALANCE
                </h2>
                
                <div className="stellar-account-info">
                  <div className="stellar-account-details">
                    <div className="stellar-account-item">
                      <span className="stellar-account-label">Account Address:</span>
                      <span className="stellar-account-value">GAQL5CSBEPS2JLWPMNYCYXADUBRU3FUHOXL5IAM33EPHL4RHGMCEN6KB</span>
                    </div>
                    <div className="stellar-account-item">
                      <span className="stellar-account-label">Network:</span>
                      <span className="stellar-account-value">Stellar Testnet</span>
                    </div>
                    <div className="stellar-account-item">
                      <span className="stellar-account-label">Explorer:</span>
                      <a 
                        href="https://testnet.stellarchain.io/accounts/GAQL5CSBEPS2JLWPMNYCYXADUBRU3FUHOXL5IAM33EPHL4RHGMCEN6KB" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="stellar-explorer-link"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="stellar-balance-section">
                  <button 
                    onClick={loadStellarBalance}
                    disabled={isLoading}
                    className="stellar-button secondary"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    REFRESH BALANCE
                  </button>
                  
                  {stellarBalance.length === 0 ? (
                    <p className="stellar-empty-state">No balance data available</p>
                  ) : (
                    <div className="stellar-balance-list">
                      {stellarBalance.map((balance, index) => (
                        <div key={index} className="stellar-balance-item">
                          <div className="stellar-balance-asset">
                            <Star className="w-4 h-4 mr-2" />
                            {balance.asset}
                          </div>
                          <div className="stellar-balance-amount">
                            {balance.balance}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Test Service Tab */}
            {activeTab === 'test' && (
              <motion.div 
                className="stellar-tab-content"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="stellar-section-title">
                  <Activity className="w-5 h-5 inline mr-2" />
                  TEST STELLAR SERVICE
                </h2>
                
                <div className="stellar-test-section">
                  <p className="stellar-test-description">
                    Test the Stellar service functionality and earn XP!
                  </p>
                  
                  <button 
                    onClick={testStellarService}
                    disabled={isLoading}
                    className="stellar-button primary"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4 mr-2" />
                    )}
                    RUN SERVICE TEST
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 