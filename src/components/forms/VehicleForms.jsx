import React, { useState } from 'react';
import { executeTransaction } from '../../utils/web3';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRightLeft, PenTool, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const FormWrapper = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
    <div className="flex items-center space-x-4 mb-8 pb-5 border-b border-slate-100">
      <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-slate-600 mb-2 pl-1">{label}</label>
    <input 
      {...props}
      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-400 font-medium shadow-sm"
    />
  </div>
);

const SubmitButton = ({ txPending, children }) => (
  <button 
    type="submit" 
    disabled={txPending}
    className="w-full mt-6 bg-primary hover:bg-primary-hover text-white font-semibold text-lg px-6 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 flex justify-center items-center h-[58px]"
  >
    {txPending ? (
      <div className="w-6 h-6 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
    ) : (
      children
    )}
  </button>
);

export const RegisterVehicleForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '', model: '', year: '', initialOwner: '', docHash: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      const tx = await executeTransaction('registerVehicle', [formData.vin, formData.model, parseInt(formData.year), formData.initialOwner, formData.docHash], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait(); // Wait for confirmation
      toast.success(<div>Registration Confirmed!<br/><a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="underline text-sm opacity-80 mt-1 block break-all text-primary">View on Etherscan</a></div>, { id: "tx", duration: 5000 });
      setFormData({ vin: '', model: '', year: '', initialOwner: '', docHash: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction Failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Register New Vehicle" icon={ShieldCheck}>
      <form onSubmit={handleSubmit}>
        <Input label="Vehicle Identification Number (VIN)" placeholder="17-character VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <div className="grid grid-cols-2 gap-5">
          <Input label="Model" placeholder="e.g. Tesla Model 3" required onChange={e => setFormData({...formData, model: e.target.value})} value={formData.model} />
          <Input label="Manufacturing Year" type="number" placeholder="2023" required min="1900" max="2030" onChange={e => setFormData({...formData, year: e.target.value})} value={formData.year} />
        </div>
        <Input label="Initial Owner Address" placeholder="0x..." required pattern="^0x[a-fA-F0-9]{40}$" title="Valid Ethereum address starting with 0x" onChange={e => setFormData({...formData, initialOwner: e.target.value})} value={formData.initialOwner} />
        <Input label="Document Hash (IPFS)" placeholder="Qm..." required onChange={e => setFormData({...formData, docHash: e.target.value})} value={formData.docHash} />
        <SubmitButton txPending={loading}>Mint Registration</SubmitButton>
      </form>
    </FormWrapper>
  );
};

export const TransferOwnershipForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '', newOwner: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      const tx = await executeTransaction('transferOwnership', [formData.vin, formData.newOwner], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait();
      toast.success("Ownership Transferred Successfully!", { id: "tx" });
      setFormData({ vin: '', newOwner: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Transfer Failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Transfer Ownership" icon={ArrowRightLeft}>
      <form onSubmit={handleSubmit}>
        <Input label="Vehicle Identification Number (VIN)" placeholder="Enter VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <Input label="New Owner Address" placeholder="0x..." required pattern="^0x[a-fA-F0-9]{40}$" title="Valid Ethereum address starting with 0x" onChange={e => setFormData({...formData, newOwner: e.target.value})} value={formData.newOwner} />
        <SubmitButton txPending={loading}>Transfer Vehicle</SubmitButton>
      </form>
    </FormWrapper>
  );
};

export const AddServiceRecordForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '', description: '', docHash: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      const tx = await executeTransaction('addServiceRecord', [formData.vin, formData.description, formData.docHash], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait();
      toast.success("Service Record Added!", { id: "tx" });
      setFormData({ vin: '', description: '', docHash: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction Failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Add Service Record" icon={PenTool}>
      <form onSubmit={handleSubmit}>
        <Input label="Vehicle Identification Number (VIN)" placeholder="Enter VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <Input label="Service Description" placeholder="e.g. 50k miles transmission fluid change" required onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description} />
        <Input label="Invoice/Receipt Document Hash" placeholder="Qm..." required onChange={e => setFormData({...formData, docHash: e.target.value})} value={formData.docHash} />
        <SubmitButton txPending={loading}>Log Service Record</SubmitButton>
      </form>
    </FormWrapper>
  );
};

export const AddAccidentRecordForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '', description: '', docHash: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      const tx = await executeTransaction('addAccidentRecord', [formData.vin, formData.description, formData.docHash], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait();
      toast.success("Accident Record Added!", { id: "tx" });
      setFormData({ vin: '', description: '', docHash: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction Failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Log Accident/Damage" icon={AlertTriangle}>
      <form onSubmit={handleSubmit}>
        <Input label="Vehicle Identification Number (VIN)" placeholder="Enter VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <Input label="Damage Description" placeholder="e.g. Front bumper collision" required onChange={e => setFormData({...formData, description: e.target.value})} value={formData.description} />
        <Input label="Police/Insurance Document Hash" placeholder="Qm..." required onChange={e => setFormData({...formData, docHash: e.target.value})} value={formData.docHash} />
        <SubmitButton txPending={loading}>Log Incident</SubmitButton>
      </form>
    </FormWrapper>
  );
};

export const AddDocumentForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '', docHash: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      const tx = await executeTransaction('addDocument', [formData.vin, formData.docHash], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait();
      toast.success("Document Added Successfully!", { id: "tx" });
      setFormData({ vin: '', docHash: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Failed to add document", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Add Vehicle Document" icon={FileText}>
      <form onSubmit={handleSubmit}>
        <Input label="Vehicle Identification Number (VIN)" placeholder="Enter VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <Input label="Document Hash (IPFS)" placeholder="Qm..." required onChange={e => setFormData({...formData, docHash: e.target.value})} value={formData.docHash} />
        <SubmitButton txPending={loading}>Add Document</SubmitButton>
      </form>
    </FormWrapper>
  );
};

export const VerifyVehicleForm = ({ account }) => {
  const [formData, setFormData] = useState({ vin: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return toast.error("Connect wallet first");
    setLoading(true);
    try {
      toast.loading("Waiting for MetaMask signature...", { id: "tx" });
      // Based on ABI, verifyVehicle takes only `_vin`
      const tx = await executeTransaction('verifyVehicle', [formData.vin], account);
      toast.success("Transaction Sent!", { id: "tx" });
      await tx.wait();
      toast.success("Vehicle Verified Successfully!", { id: "tx" });
      setFormData({ vin: '' });
    } catch (err) {
      toast.error(err.reason || err.message || "Verification Failed", { id: "tx" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper title="Verify Vehicle" icon={CheckCircle}>
      <form onSubmit={handleSubmit}>
        <p className="text-slate-500 text-sm mb-6">As an Insurance Provider, you can verify a vehicle after inspecting it or its accident history.</p>
        <Input label="Vehicle Identification Number (VIN) to Verify" placeholder="Enter VIN" required onChange={e => setFormData({...formData, vin: e.target.value})} value={formData.vin} />
        <SubmitButton txPending={loading}>Submit Verification</SubmitButton>
      </form>
    </FormWrapper>
  );
};
