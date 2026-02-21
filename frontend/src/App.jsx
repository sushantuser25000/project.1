import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import LoginForm from './components/LoginForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import Documents from './components/Documents.jsx';
import VerifyPage from './components/VerifyPage.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function registerUser(string memory _username) public",
  "function getUserInfo(address _userAddress) public view returns (address, string, uint256, bool)",
  "function getMyInfo() public view returns (address, string, uint256, bool)",
  "function isRegistered(address) public view returns (bool)",
  "function addDocument(string memory _docType, string memory _fileName, string memory _ipfsHash, bytes32 _contentHash, string memory _verificationId) public",
  "function getUserDocuments(address _userAddress) public view returns (tuple(uint256 id, string docType, string fileName, string ipfsHash, bytes32 contentHash, string verificationId, uint256 uploadedAt)[])",
  "function verifyByHash(bytes32 _hash) public view returns (bool verified, address owner, string memory fileName, string memory docType, string memory verificationId, uint256 uploadedAt)",
  "function verifyById(string memory _verificationId) public view returns (bool verified, address owner, string memory fileName, string memory docType, bytes32 contentHash, uint256 uploadedAt)",
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [view, setView] = useState('landing'); // 'landing', 'login', 'register', 'admin-login', 'admin-dashboard'
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if we're on the verify page
  const isVerifyPage = window.location.pathname.startsWith('/verify');

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('eth_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setUserInfo(authData.user);
      setIsAuthenticated(true);

      // Reinitialize provider and signer
      if (authData.privateKey) {
        initializeWeb3(authData.privateKey);
      }
    }
  }, []);

  const initializeWeb3 = async (privateKey) => {
    try {
      const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
      const ethProvider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, ethProvider);

      setProvider(ethProvider);
      setSigner(wallet);

      if (CONTRACT_ADDRESS) {
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          wallet
        );
        setContract(contractInstance);

        // Verify registration status on this specific contract
        const registered = await contractInstance.isRegistered(wallet.address);
        if (!registered && isAuthenticated) {
          console.log("Session desync: User not registered on this contract. Logging out...");
          handleLogout();
          setError("Session expired or contract redeployed. Please register again.");
        }
      }
    } catch (err) {
      console.error('Web3 initialization error:', err);
    }
  };

  const handleLogin = async (privateKey) => {
    setLoading(true);
    setError('');

    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      const address = wallet.address;

      // Get nonce from server
      const nonceResponse = await fetch(`${API_URL}/api/auth/nonce/${address}`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
      });
      const nonceData = await nonceResponse.json();

      if (!nonceData.success) {
        throw new Error('Failed to get nonce');
      }

      // Sign the nonce
      const signature = await wallet.signMessage(nonceData.nonce);

      // Verify signature with backend
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({
          message: nonceData.nonce,
          signature,
          address
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success || !verifyData.verified) {
        throw new Error('Signature verification failed');
      }

      if (!verifyData.registered) {
        setError('Account not registered. Please register first.');
        setShowRegister(true);
        setLoading(false);
        return;
      }

      // Save auth data
      const authData = {
        user: verifyData.user,
        privateKey: privateKey,
        timestamp: Date.now()
      };

      localStorage.setItem('eth_auth', JSON.stringify(authData));
      setUserInfo(verifyData.user);
      setIsAdmin(false);
      setIsAuthenticated(true);
      setView('dashboard');

      // Initialize Web3
      await initializeWeb3(privateKey);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (privateKey) => {
    setLoading(true);
    setError('');
    try {
      const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
      const ethProvider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, ethProvider);

      const orgAddress = import.meta.env.VITE_ORG_REGISTRY_ADDRESS;
      if (orgAddress) {
        const orgContract = new ethers.Contract(
          orgAddress,
          ["function organizations(address) public view returns (string, address, bool, uint256)"],
          ethProvider
        );
        const orgInfo = await orgContract.organizations(wallet.address);
        if (!orgInfo[2]) {
          throw new Error("Address is not an authorized organization.");
        }
      }

      setIsAdmin(true);
      setUserInfo({ address: wallet.address, username: 'ACEM Admin' });
      setIsAuthenticated(true);
      setView('admin-dashboard');
      initializeWeb3(privateKey);
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email, username) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ email, username })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Return success data to the form component
      return data;

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      throw err; // Re-throw so form knows it failed
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eth_auth');
    setIsAuthenticated(false);
    setUserInfo(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔐 Secure Doc Ledger</h1>
        <div className="header-actions">
          <button onClick={() => setView('landing')} className="nav-btn">🏠 Home</button>
          <button onClick={() => setView('verify')} className="nav-btn">🔍 Verify</button>
          {isAuthenticated && (
            <div className="user-info-header">
              <span>👤 {userInfo.username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          )}
        </div>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {view === 'landing' && !isAuthenticated && (
          <div className="landing-page">
            <div className="landing-blocks">
              <div className="landing-card" onClick={() => setView('login')}>
                <div className="icon">🔑</div>
                <h2>User Login</h2>
                <p>Access your personal document vault and upload new credentials.</p>
                <button className="landing-btn">Open Vault</button>
              </div>
              <div className="landing-card" onClick={() => setView('verify')}>
                <div className="icon">🔍</div>
                <h2>Verify Document</h2>
                <p>Publicly verify any document ledger entry without logging in.</p>
                <button className="landing-btn">Verify Now</button>
              </div>
            </div>
            <div className="landing-footer">
              <p>Don't have an account? <span className="link" onClick={() => setView('register')}>Sign Up Now</span></p>
              <p className="admin-link" onClick={() => setView('admin-login')}>🔐 Organization access</p>
            </div>
          </div>
        )}

        {view === 'verify' && (
          <VerifyPage />
        )}

        {view === 'login' && !isAuthenticated && (
          <LoginForm
            onLogin={handleLogin}
            loading={loading}
            onShowRegister={() => setView('register')}
          />
        )}

        {view === 'register' && !isAuthenticated && (
          <RegisterForm
            onRegister={handleRegister}
            loading={loading}
            onBack={() => setView('landing')}
          />
        )}

        {view === 'admin-login' && !isAuthenticated && (
          <LoginForm
            onLogin={handleAdminLogin}
            loading={loading}
            title="Organization Admin Login"
          />
        )}

        {isAuthenticated && isAdmin && view === 'admin-dashboard' && (
          <AdminDashboard
            account={userInfo.address}
            onLogout={handleLogout}
          />
        )}

        {isAuthenticated && !isAdmin && (
          <div className="authenticated-view">
            <div className="nav-tabs">
              <button
                className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setCurrentTab('dashboard'); setView('dashboard'); }}
              >
                🏠 Dashboard
              </button>
              <button
                className={`nav-tab ${currentTab === 'documents' ? 'active' : ''}`}
                onClick={() => { setCurrentTab('documents'); setView('dashboard'); }}
              >
                📂 Documents
              </button>
            </div>

            {currentTab === 'dashboard' ? (
              <Dashboard
                userInfo={userInfo}
                contract={contract}
                signer={signer}
              />
            ) : (
              <Documents
                contract={contract}
                account={userInfo.address}
                signer={signer}
              />
            )}
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Private Ethereum Network with PoA</p>
        <p className="network-info">
          {CONTRACT_ADDRESS ? `Contract: ${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}` : 'Contract not configured'}
        </p>
      </footer>
    </div>
  );
}

export default App;
