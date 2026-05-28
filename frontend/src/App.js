import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import './App.css';

// Components
import Navigation from './components/Navigation';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import TouristDashboard from './pages/TouristDashboard';
import GuideListing from './pages/GuideListing';
import GuideDetail from './pages/GuideDetail';
import GuideDashboard from './pages/GuideDashboard';
import LoginPage from './pages/LoginPage';
import TouristMap from './pages/TouristMap';
import AiTourismAssistant from './pages/AiTourismAssistant';
import Jharkhand360View from './pages/Jharkhand360View';
import GiveFeedback from './pages/GiveFeedback';

// Contract ABIs
import GuideRegistryABI from './contracts/GuideRegistry.json';
import SoulboundNFTABI from './contracts/SoulboundNFT.json';
import PaymentTokenABI from './contracts/PaymentToken.json';
import PaymentSystemABI from './contracts/PaymentSystem.json';

// Layout component that renders Navigation and page content
function Layout({ children, account, connectWallet, loginDemo, loginAdminDemo, loginGuideDemo, logout, isAdmin, isGuide }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <>
      <Navigation 
        account={account} 
        connectWallet={connectWallet} 
        loginDemo={loginDemo} 
        loginAdminDemo={loginAdminDemo}
        loginGuideDemo={loginGuideDemo}
        logout={logout}
        isAdmin={isAdmin} 
        isGuide={isGuide}
      />
      <div style={{ paddingTop: isHomePage ? '0' : '80px' }}>
        {children}
      </div>
    </>
  );
}

function App() {
  // State variables
  const [initialLoading, setInitialLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuide, setIsGuide] = useState(false);
  const [contracts, setContracts] = useState({
    guideRegistry: null,
    soulboundNFT: null,
    paymentToken: null,
    paymentSystem: null
  });
  const [contractAddresses, setContractAddresses] = useState({
    guideRegistry: process.env.REACT_APP_GUIDE_REGISTRY_ADDRESS || '',
    soulboundNFT: process.env.REACT_APP_SOULBOUND_NFT_ADDRESS || '',
    paymentToken: process.env.REACT_APP_PAYMENT_TOKEN_ADDRESS || '',
    paymentSystem: process.env.REACT_APP_PAYMENT_SYSTEM_ADDRESS || ''
  });

  // Initial Preloader Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setInitialLoading(false), 600); // Wait for fade out CSS transition
    }, 3800); // Increased loader duration by 2 seconds (3.8s total)
    return () => clearTimeout(timer);
  }, []);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setAccount(account);

        // Create ethers provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const signer = await provider.getSigner();
        setSigner(signer);

        // Initialize contracts
        initializeContracts(provider, signer);

        // Check if user is admin
        checkAdminStatus(account);

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } else {
        alert('MetaMask is not installed. Please install it to use this app.');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  // Demo Login (bypass MetaMask)
  const loginDemo = () => {
    setAccount('0xDemoTourist1234567890abcdef1234567890abc');
    setIsAdmin(false);
    setIsGuide(false);
  };

  // Demo Admin Login
  const loginAdminDemo = () => {
    setAccount('0xDemoAdmin1234567890abcdef1234567890abcde');
    setIsAdmin(true);
    setIsGuide(false);
  };

  // Demo Guide Login
  const loginGuideDemo = () => {
    setAccount('0xDemoGuide1234567890abcdef1234567890abcdef');
    setIsAdmin(false);
    setIsGuide(true);
  };

  // Logout
  const logout = () => {
    setAccount(null);
    setIsAdmin(false);
    setIsGuide(false);
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAccount(null);
      setSigner(null);
      setIsAdmin(false);
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      checkAdminStatus(accounts[0]);
      initializeContracts(provider);
    }
  };

  // Initialize contract instances
  const initializeContracts = async (provider, signer) => {
    try {
      if (!provider || !Object.values(contractAddresses).every(addr => addr)) {
        return;
      }

      const guideRegistry = new ethers.Contract(
        contractAddresses.guideRegistry,
        GuideRegistryABI.abi,
        signer || provider
      );

      const soulboundNFT = new ethers.Contract(
        contractAddresses.soulboundNFT,
        SoulboundNFTABI.abi,
        signer || provider
      );

      const paymentToken = new ethers.Contract(
        contractAddresses.paymentToken,
        PaymentTokenABI.abi,
        signer || provider
      );

      const paymentSystem = new ethers.Contract(
        contractAddresses.paymentSystem,
        PaymentSystemABI.abi,
        signer || provider
      );

      setContracts({
        guideRegistry,
        soulboundNFT,
        paymentToken,
        paymentSystem
      });
    } catch (error) {
      console.error('Error initializing contracts:', error);
    }
  };

  // Check if the current account is the admin (owner of contracts)
  const checkAdminStatus = async (account) => {
    try {
      if (!account || !contracts.guideRegistry) {
        setIsAdmin(false);
        return;
      }

      const owner = await contracts.guideRegistry.owner();
      setIsAdmin(owner.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Connect wallet on initial load
  useEffect(() => {
    connectWallet();

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <Router>
      <div className="App">
        {/* GLOBAL PRELOADER */}
        {initialLoading && (
          <div className={`jh-global-loader ${fadeOut ? 'fade-out' : ''}`}>
            {/* Animated Transparent Bubbles */}
            <ul className="jh-bubbles">
              <li></li><li></li><li></li><li></li><li></li>
              <li></li><li></li><li></li><li></li><li></li>
            </ul>
            <div className="jh-loader-content">
              <div className="jh-premium-loader">
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
                <span className="loader-text">NexteraX</span>
              </div>
              <h2>Jharkhand Tourism</h2>
              <p>Discover the undiscovered...</p>
            </div>
          </div>
        )}

        <Layout 
          account={account} 
          connectWallet={connectWallet} 
          loginDemo={loginDemo} 
          loginAdminDemo={loginAdminDemo}
          loginGuideDemo={loginGuideDemo}
          logout={logout}
          isAdmin={isAdmin}
          isGuide={isGuide}
        >
          <Routes>
            <Route path="/login" element={<div className="container mt-4"><LoginPage /></div>} />
            <Route path="/" element={<Home account={account} connectWallet={connectWallet} />} />
            <Route 
              path="/admin" 
              element={
                <div className="container mt-4">
                  <AdminDashboard 
                    account={account} 
                    isAdmin={isAdmin} 
                    contracts={contracts} 
                  />
                </div>
              } 
            />
            <Route 
              path="/tourist" 
              element={
                <div className="container mt-4">
                  <TouristDashboard 
                    account={account} 
                    contracts={contracts} 
                  />
                </div>
              } 
            />
            <Route 
              path="/guides" 
              element={
                <div className="container mt-4">
                  <GuideListing 
                    account={account} 
                    contracts={contracts} 
                  />
                </div>
              } 
            />
            <Route 
              path="/guide/:address" 
              element={
                <div className="container mt-4">
                  <GuideDetail 
                    account={account} 
                    contracts={contracts} 
                  />
                </div>
              } 
            />
            <Route path="/map" element={<div className="container mt-4"><TouristMap /></div>} />
            <Route path="/ai-assistant" element={<AiTourismAssistant />} />
            <Route path="/jharkhand360" element={<div className="container mt-4"><Jharkhand360View /></div>} />
            <Route path="/feedback" element={<div className="container mt-4"><GiveFeedback /></div>} />
            <Route 
              path="/guide-dashboard" 
              element={
                <div className="container mt-4">
                  <GuideDashboard account={account} isGuide={isGuide} />
                </div>
              } 
            />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;