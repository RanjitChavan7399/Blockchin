import React from 'react';
import { Wallet, LogOut } from 'lucide-react';

const WalletConnect = ({ account, balance, onConnect, onDisconnect }) => {
  return (
    <div className="flex items-center space-x-4">
      {account ? (
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 pr-4 shadow-sm">
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-sm text-slate-600 font-medium mr-3 shadow-inner">
            {Number(balance).toFixed(4)} MATIC
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"></div>
            <span className="text-sm font-medium text-slate-700">
              {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </span>
          </div>
          <button 
            onClick={onDisconnect}
            className="ml-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Disconnect"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95"
        >
          <Wallet size={18} />
          <span>Connect</span>
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
