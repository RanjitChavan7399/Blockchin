import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { switchNetwork } from '../utils/web3';

const NetworkManager = ({ chainId }) => {
  const TARGET_CHAIN = 'aa36a7'; // Sepolia chainId without 0x

  if (!chainId || chainId === TARGET_CHAIN || chainId === '0xaa36a7' || chainId === '11155111' || chainId === '0x11155111') {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm mx-6 mt-4">
      <div className="flex items-center space-x-3">
        <AlertCircle size={20} className="text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-red-700">Unsupported Network</h3>
          <p className="text-xs text-red-600/80">Please switch to Sepolia Testnet to continue.</p>
        </div>
      </div>
      <button
        onClick={switchNetwork}
        className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors"
      >
        <RefreshCw size={14} />
        <span>Switch Network</span>
      </button>
    </div>
  );
};

export default NetworkManager;
