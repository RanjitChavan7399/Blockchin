import React, { useState } from 'react';
import { Search, Car, User, Calendar, Activity, Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { fetchVehicle, fetchHistory } from '../utils/web3';
import HistoryModule from './HistoryModule';

const VehicleDashboard = () => {
  const [searchVin, setSearchVin] = useState('');
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanVin = searchVin.trim();
    if (!cleanVin) return;
    
    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    try {
      const v = await fetchVehicle(cleanVin);
      // v signature: [vin, model, year, owner, accidentCount, verified]
      
      // If the VIN returned from the contract is empty, the vehicle does not exist
      if (!v || !v[0] || v[0] === "") { 
        setVehicle(null);
      } else {
        const h = await fetchHistory(cleanVin);
        const ownerCount = h.filter(record => record.type === 'Registration' || record.type === 'Transfer').length;
        
        setVehicle({
          vin: v[0],
          model: v[1],
          year: Number(v[2]),
          currentOwner: v[3],
          ownershipCount: ownerCount > 0 ? ownerCount : 1, // Fallback to 1 if history isn't populated
          accidentCount: Number(v[4]),
          verified: v[5]
        });
        setHistory(h);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setVehicle(null);
      setErrorMsg(err.reason || err.message || "Failed to fetch data from the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[100px] -z-10"></div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <div className="p-2.5 bg-primary/10 rounded-xl mr-3">
             <Search className="text-primary" size={24} strokeWidth={2.5} />
          </div>
          Vehicle Search & History
        </h2>
        <form onSubmit={handleSearch} className="flex space-x-4">
          <input 
            type="text" 
            placeholder="Enter VIN to search..."
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-400 font-medium"
            value={searchVin}
            onChange={(e) => setSearchVin(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-primary/30 flex items-center h-[58px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Search'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-[4px] border-slate-100 border-t-primary rounded-full animate-spin shadow-sm"></div>
          <p className="text-slate-500 mt-5 font-medium tracking-wide animate-pulse">Querying Blockchain Records...</p>
        </div>
      ) : errorMsg ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-red-50/50 rounded-3xl border border-red-100 shadow-sm">
          <div className="bg-red-100 p-4 rounded-full mb-4">
             <Info size={40} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-700">Error Fetching Vehicle Data</h3>
          <p className="text-red-500 mt-2 text-center max-w-sm">{errorMsg}</p>
        </div>
      ) : searched && !vehicle ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
             <Info size={40} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Vehicle Not Found</h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm">There is no vehicle like this registered on the network. Make sure the VIN is entered correctly.</p>
        </div>
      ) : vehicle ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Info Card */}
          <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 border-b border-slate-100 relative">
              {vehicle.verified ? (
                <div className="absolute top-5 right-5 bg-green-50 text-green-600 text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center border border-green-200 uppercase tracking-wider">
                  <ShieldCheck size={14} className="mr-1.5" /> VERIFIED
                </div>
              ) : (
                <div className="absolute top-5 right-5 bg-yellow-50 text-yellow-600 text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center border border-yellow-200 uppercase tracking-wider">
                  <Info size={14} className="mr-1.5" /> UNVERIFIED
                </div>
              )}
              <div className="bg-white p-4 rounded-2xl w-max shadow-sm border border-slate-100 mb-5">
                 <Car size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">{vehicle.year} {vehicle.model}</h3>
              <p className="text-slate-500 font-mono text-sm mt-1.5 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">{vehicle.vin}</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-start">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 mr-4 mt-0.5 border border-slate-100"><User size={20} /></div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Owner</div>
                  <div className="text-sm text-slate-700 break-all font-mono font-medium leading-relaxed">{vehicle.currentOwner}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-start">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-primary mr-3 border border-slate-100"><Activity size={20} /></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Owners</div>
                    <div className="text-2xl font-bold text-slate-800">{vehicle.ownershipCount}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2.5 bg-red-50 rounded-xl text-red-500 mr-3 border border-red-100"><AlertTriangle size={20} /></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accidents</div>
                    <div className="text-2xl font-bold text-slate-800">{vehicle.accidentCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* History Timeline */}
          <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-h-[400px]">
             <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                <div className="p-2.5 bg-slate-50 rounded-xl mr-3 border border-slate-100">
                   <Calendar className="text-slate-500" size={20} />
                </div>
                Immutable Timeline
             </h3>
             <HistoryModule history={history} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VehicleDashboard;
