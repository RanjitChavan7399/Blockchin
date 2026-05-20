import React from 'react';
import { Tag, MapPin, Search } from 'lucide-react';

const HistoryModule = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-slate-400 h-full">
        <div className="bg-slate-50 p-5 rounded-full mb-4">
           <Search className="w-10 h-10 opacity-40 text-slate-500" />
        </div>
        <p className="font-medium text-slate-600">No history records found for this vehicle.</p>
        <p className="text-sm mt-1.5 opacity-80">This might be the first registration.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 pb-4">
      {history.map((record, idx) => (
        <div key={idx} className="relative">
          {/* Timeline Dot */}
          <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-white border-[3px] border-primary ring-4 ring-primary/10 z-10" />
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center
                ${record.type === 'Registration' ? 'bg-green-50 text-green-600 border border-green-200' : ''}
                ${record.type === 'Transfer' ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}
                ${record.type === 'Service' ? 'bg-purple-50 text-purple-600 border border-purple-200' : ''}
                ${record.type === 'Accident' ? 'bg-red-50 text-red-600 border border-red-200' : ''}
              `}>
                <Tag size={12} className="mr-1.5 opacity-80" strokeWidth={2.5} />
                {record.type}
              </span>
              <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded">
                {new Date(record.timestamp).toLocaleString()}
              </span>
            </div>
            
            <p className="text-slate-700 mt-4 text-[15px] font-medium leading-relaxed">{record.details}</p>
            
            {record.docHash && (
              <div className="mt-4 flex items-center space-x-2 bg-slate-50 py-2 px-3 rounded-lg w-max border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IPFS Doc:</span>
                <a href={`https://ipfs.io/ipfs/${record.docHash}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:text-primary-hover font-mono break-all truncate max-w-[200px] inline-block font-semibold">
                  {record.docHash}
                </a>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 flex space-x-6">
              <div className="flex-1">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Executor</span>
                 <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{record.executor}</span>
              </div>
              {record.txHash && (
                <div className="flex-1">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Transaction Hash</span>
                   <a href={`https://sepolia.etherscan.io/tx/${record.txHash}`} className="text-xs font-mono text-primary hover:underline font-semibold" target="_blank" rel="noreferrer">
                    {record.txHash.substring(0,10)}...{record.txHash.substring(record.txHash.length - 8)}
                   </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )).reverse()}
    </div>
  );
};

export default HistoryModule;
