import { ethers } from 'ethers';
import { VehicleLifecycleABI } from './VehicleLifecycleABI';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const TARGET_CHAIN_ID = '0xaa36a7'; // Sepolia Testnet (11155111)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ""; // Load from .env
const PUBLIC_RPC_URL = 'https://rpc.sepolia.org';

// Web3Auth Setup
const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiIQKQGpQ09oV2QyB1V0z9Z1zTbbpC1g1-tK8";
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: TARGET_CHAIN_ID,
  rpcTarget: PUBLIC_RPC_URL,
  displayName: "Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "SEP",
  tickerName: "Sepolia Ethereum",
};
const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
});

export const initWeb3Auth = async () => {
  try {
    await web3auth.initModal();
  } catch (error) {
    console.error("Error init Web3Auth", error);
  }
};

let activeWeb3AuthUser = null;

export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask is not installed!");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  // Force MetaMask to show the account selection prompt
  await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
  const accounts = await provider.send("eth_requestAccounts", []);
  
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(accounts[0]);
  activeWeb3AuthUser = false; // Using metamask
  
  return {
    account: accounts[0],
    balance: ethers.formatEther(balance),
    chainId: network.chainId.toString(16),
    provider,
  };
};

export const connectSocialWallet = async () => {
  if (!web3auth.connected) {
    await web3auth.connect();
  }
  const provider = new ethers.BrowserProvider(web3auth.provider);
  const signer = await provider.getSigner();
  const accounts = await provider.listAccounts();
  const account = accounts[0].address;
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(account);
  activeWeb3AuthUser = true;
  
  return {
    account,
    balance: ethers.formatEther(balance),
    chainId: network.chainId.toString(16),
  };
}

export const disconnectSocialWallet = async () => {
  if (web3auth.connected) {
    await web3auth.logout();
  }
  activeWeb3AuthUser = null;
}

export const switchNetwork = async () => {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TARGET_CHAIN_ID }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: TARGET_CHAIN_ID,
            chainName: 'Sepolia test network',
            rpcUrls: [PUBLIC_RPC_URL],
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
};

export const getContract = async () => {
  let provider;
  if (activeWeb3AuthUser && web3auth.provider) {
    provider = new ethers.BrowserProvider(web3auth.provider);
  } else if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    throw new Error("No crypto wallet found");
  }
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, VehicleLifecycleABI, signer);
};

export const getReadContract = () => {
  let provider;
  if (activeWeb3AuthUser && web3auth.provider) {
    provider = new ethers.BrowserProvider(web3auth.provider);
  } else if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    provider = new ethers.JsonRpcProvider(PUBLIC_RPC_URL);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, VehicleLifecycleABI, provider);
};

export const executeTransaction = async (functionName, args) => {
  const contract = await getContract();
  if (!contract[functionName]) {
    throw new Error(`Function ${functionName} does not exist on contract`);
  }
  
  try {
    const tx = await contract[functionName](...args);
    return tx;
  } catch (error) {
    console.error("Transaction Error:", error);
    if (error.reason) {
      throw new Error(error.reason);
    }
    throw error;
  }
};

export const fetchUserRole = async (account) => {
  try {
    const contract = getReadContract();
    const roleId = await contract.roles(account);
    console.log("Fetched Role ID:", roleId, "for account:", account);
    return Number(roleId);
  } catch (error) {
    console.error("Error fetching role:", error);
    return 0; // default to None/Public on error
  }
};

export const fetchVehicle = async (vin) => {
  try {
    const trimmedVin = vin.trim();
    console.log("Searching VIN:", trimmedVin);
    const contract = getReadContract();
    const result = await contract.getVehicleBasic(trimmedVin);
    console.log("Contract Result:", result);
    return result;
  } catch (err) {
    console.error("fetchVehicle error:", err);
    throw err;
  }
};

export const fetchHistory = async (vin) => {
  const contract = getReadContract();
  const history = [];
  const trimmedVin = vin.trim();

  try {
    // Run all fetches concurrently
    const [services, accidents, owners] = await Promise.all([
      contract.getServiceRecords(trimmedVin),
      contract.getAccidents(trimmedVin),
      contract.getOwnershipHistory(trimmedVin)
    ]);

    services.forEach(s => {
      history.push({
        type: 'Service',
        timestamp: Number(s.date) * 1000,
        details: s.description,
        docHash: s.documentHash,
        executor: s.serviceCenter,
        txHash: null
      });
    });

    accidents.forEach(a => {
      history.push({
        type: 'Accident',
        timestamp: Number(a.date) * 1000,
        details: a.description,
        docHash: a.documentHash,
        executor: "Service Center / Insurance Auth", 
        txHash: null
      });
    });

    owners.forEach((owner, idx) => {
      if (idx === 0) {
        history.push({
          type: 'Registration',
          timestamp: 0,
          details: `Registered vehicle`,
          docHash: null,
          executor: owner,
          txHash: null
        });
      } else {
        history.push({
          type: 'Transfer',
          timestamp: 0, 
          details: `Ownership transferred`,
          docHash: null,
          executor: owner,
          txHash: null
        });
      }
    });

    history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Error formatting history:", e);
  }

  return history; 
};
