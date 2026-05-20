import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  connectWallet, 
  fetchUserRole, 
  executeTransaction,
  initWeb3Auth, 
  connectSocialWallet, 
  disconnectSocialWallet 
} from './utils/web3';
import WalletConnect from './components/WalletConnect';
import NetworkManager from './components/NetworkManager';
import VehicleDashboard from './components/VehicleDashboard';
import { 
  RegisterVehicleForm, 
  TransferOwnershipForm, 
  AddServiceRecordForm, 
  AddAccidentRecordForm,
  AddDocumentForm,
  VerifyVehicleForm
} from './components/forms/VehicleForms';
import { Shield, LayoutDashboard, PlusCircle, ArrowRightLeft, Wrench, AlertTriangle, Link as LinkIcon, HardDrive, FileText, CheckCircle, Car, Globe, Mail, Search, ChevronRight } from 'lucide-react';

const ROLE_MAP = {
  0: 'Public User',
  1: 'Manufacturer',
  2: 'Service Center',
  3: 'Registered User (Owner)',
  4: 'Insurance Provider'
};

const ROLE_COLORS = {
  0: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
  1: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' }, 
  2: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
  3: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
  4: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-600' }
};

const App = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnecting, setIsConnecting] = useState(true);
  const [userRole, setUserRole] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRoleToRegister, setSelectedRoleToRegister] = useState(2);

  useEffect(() => {
    const init = async () => {
      try {
        await initWeb3Auth();
      } catch (err) {
        console.error("Web3Auth init failed", err);
      } finally {
        checkConnection();
      }
    };
    init();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await handleConnect();
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Small timeout to avoid flash if already connected
      setTimeout(() => setIsConnecting(false), 500); 
    }
  };

  const handleConnect = async () => {
    try {
      const { account, balance, chainId } = await connectWallet();
      setAccount(account);
      setBalance(balance);
      setChainId(chainId);
      
      const roleId = await fetchUserRole(account);
      setUserRole(roleId);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to connect to MetaMask");
    }
  };

  const handleSocialConnect = async () => {
    try {
      toast.loading("Opening Login...", { id: "socialLogin" });
      const { account, balance, chainId } = await connectSocialWallet();
      setAccount(account);
      setBalance(balance);
      setChainId(chainId);
      
      const roleId = await fetchUserRole(account);
      setUserRole(roleId);
      toast.success("Logged in successfully!", { id: "socialLogin" });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to connect", { id: "socialLogin" });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSocialWallet();
    } catch (err) {
      console.error(err);
    }
    setAccount('');
    setBalance('0');
    setChainId('');
    setUserRole(0);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) handleDisconnect();
    else handleConnect(); // refresh balance
  };

  const handleRegisterUser = async () => {
    if (!account) return toast.error("Connect wallet first");
    setIsRegistering(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "regTx" });
      const tx = await executeTransaction('registerAsUser', [selectedRoleToRegister], account);
      toast.success("Transaction Sent!", { id: "regTx" });
      await tx.wait();
      toast.success("Registered Successfully!", { id: "regTx" });
      
      // Update role dynamically
      const roleId = await fetchUserRole(account);
      setUserRole(roleId);
    } catch (err) {
      toast.error(err.reason || err.message || "Failed to register", { id: "regTx" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(chainId);
    window.location.reload();
  };

  const getAllNavItems = () => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [0, 1, 2, 3, 4] },
    { id: 'register', label: 'Register Vehicle', icon: PlusCircle, roles: [1] },
    { id: 'transfer', label: 'Transfer Owner', icon: ArrowRightLeft, roles: [3] },
    { id: 'add_document', label: 'Add Document', icon: FileText, roles: [3] },
    { id: 'service', label: 'Service Record', icon: Wrench, roles: [2] },
    { id: 'accident', label: 'Accident Record', icon: AlertTriangle, roles: [2] },
    { id: 'verify', label: 'Verify Vehicle', icon: CheckCircle, roles: [4] },
  ];

  const navItems = getAllNavItems().filter(item => item.roles.includes(userRole));

  if (isConnecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 z-[100] relative">
        <div className="w-12 h-12 border-[4px] border-slate-200 border-t-primary rounded-full animate-spin shadow-md mb-4"></div>
        <div className="text-slate-400 font-medium animate-pulse">Initializing AutoChain...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col font-sans z-10 relative bg-slate-50 overflow-x-hidden">
        <Toaster position="top-right" />
        
        {/* Navbar */}
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shadow-sm">
                 <Shield className="text-primary w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">AutoChain</h1>
                <p className="text-[10px] uppercase text-primary font-bold tracking-widest mt-0.5">Verified Lifecycle</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
               <button 
                 onClick={handleSocialConnect}
                 className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 font-semibold px-4 py-2 rounded-xl transition-all hover:bg-slate-100"
               >
                 <Mail size={18} />
                 <span>Login with Gmail</span>
               </button>
               <button
                 onClick={handleConnect}
                 className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary/30 flex items-center"
               >
                 <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 mr-2" />
                 Connect MetaMask
               </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative isolate pt-14 pb-20 sm:pt-24 sm:pb-32 lg:pb-40">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#93c5fd] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}}></div>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-6">
                Immutable Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">History & Ownership</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 mb-10">
                AutoChain provides a decentralized, transparent, and verified lifecycle for every vehicle. Search any VIN instantly or connect your wallet to manage vehicle records.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-4">
                <button
                  onClick={handleSocialConnect}
                  className="rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all w-full sm:w-auto flex items-center justify-center"
                >
                  <Mail className="w-5 h-5 mr-2" /> Start using Gmail
                </button>
                <div className="text-sm font-semibold leading-6 text-slate-900 flex items-center">
                  or <button onClick={handleConnect} className="ml-2 text-blue-600 hover:text-blue-500 flex items-center">Connect MetaMask <ChevronRight className="w-4 h-4 ml-1" /></button>
                </div>
              </div>
            </div>
            
            {/* Public VIN Search Embedded */}
            <div className="mt-20 max-w-4xl mx-auto">
               <VehicleDashboard />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-600">Secure Network</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to verify a vehicle
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Built on Ethereum testnet to ensure every record is immutable. No centralized party can modify the history of the vehicle.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                      <Globe className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Public Verification
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Anyone can search a vehicle's history using its VIN. View service records, accidents, and ownership chain for free.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                      <Car className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Ownership Transfers
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Securely transfer ownership between wallets. AutoChain tracks every transfer, effectively stopping stolen vehicle sales.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                      <Wrench className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Service & Insurance
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Authorized service centers and insurance providers log immutable accident reports and service history directly to the blockchain.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Shield className="text-blue-500 w-8 h-8" />
              <div>
                <span className="text-xl font-bold text-white tracking-tight">AutoChain</span>
              </div>
            </div>
            <div className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} AutoChain Network. All rights reserved. Built for true decentralization.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col z-10 relative">
      <Toaster position="top-right" />
      
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shadow-sm">
               <Shield className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">AutoChain</h1>
              <p className="text-[10px] uppercase text-primary font-bold tracking-widest mt-0.5">Verified Lifecycle</p>
            </div>
          </div>
          
          <WalletConnect 
            account={account} 
            balance={balance} 
            onConnect={handleConnect} 
            onDisconnect={handleDisconnect} 
          />
        </div>
      </nav>

      <NetworkManager chainId={chainId} />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex">
        {/* Sidebar */}
        <div className="w-64 pr-8 shrink-0 hidden md:block border-r border-slate-200/80">
           <div className={`mb-6 p-4 rounded-2xl border ${ROLE_COLORS[userRole]?.bg || 'bg-slate-50'} ${ROLE_COLORS[userRole]?.border || 'border-slate-200'}`}>
             <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${ROLE_COLORS[userRole]?.text || 'text-slate-500'}`}>Active Role</div>
             <div className="font-semibold text-slate-800 flex items-center mb-3">
               <Shield size={16} className={`${ROLE_COLORS[userRole]?.icon || 'text-slate-400'} mr-2`} />
               {ROLE_MAP[userRole] || 'Public User'}
             </div>
             
             {userRole === 0 && (
               <div className="mt-3 flex flex-col space-y-2">
                 <select 
                   value={selectedRoleToRegister}
                   onChange={(e) => setSelectedRoleToRegister(Number(e.target.value))}
                   className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                 >
                   <option value={1}>Manufacturer</option>
                   <option value={3}>Owner</option>
                   <option value={2}>Service Center</option>
                   <option value={4}>Insurance Provider</option>
                 </select>
                 <button 
                   onClick={handleRegisterUser}
                   disabled={isRegistering}
                   className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center"
                 >
                   {isRegistering ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                      "Register Role"
                   )}
                 </button>
               </div>
             )}
           </div>
           <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4 ml-3">Navigation</div>
           <nav className="space-y-1.5">
             {navItems.map(item => {
               const Icon = item.icon;
               const isActive = activeTab === item.id;
               return (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                     isActive 
                       ? 'bg-white shadow-sm border border-slate-200/60 text-primary font-medium' 
                       : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                   }`}
                 >
                   <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
                   <span>{item.label}</span>
                 </button>
               )
             })}
           </nav>
           
           <div className="mt-12 bg-white/60 p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Network Status</div>
              <div className="flex items-center space-x-2 mt-3">
                 <div className={`w-2 h-2 rounded-full ${chainId ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></div>
                 <span className="text-sm text-slate-600 font-medium">
                   {chainId === 'aa36a7' ? 'Sepolia Testnet' : chainId ? 'Unsupported' : 'Disconnected'}
                 </span>
              </div>
           </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 md:pl-8">
           <div className="max-w-3xl">
              {activeTab === 'dashboard' && <VehicleDashboard />}
              {activeTab === 'register' && userRole === 1 && <RegisterVehicleForm account={account} />}
              {activeTab === 'transfer' && userRole === 3 && <TransferOwnershipForm account={account} />}
              {activeTab === 'add_document' && userRole === 3 && <AddDocumentForm account={account} />}
              {activeTab === 'service' && userRole === 2 && <AddServiceRecordForm account={account} />}
              {activeTab === 'accident' && userRole === 2 && <AddAccidentRecordForm account={account} />}
              {activeTab === 'verify' && userRole === 4 && <VerifyVehicleForm account={account} />}
              {/* Fallback if user bypasses UI menu somehow */}
              {activeTab !== 'dashboard' && !navItems.find(item => item.id === activeTab) && (
                 <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 text-red-600 font-medium">
                   Unauthorized: You do not have permission to view this section.
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
