import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '../context/BillingContext';
import { 
  FileText, History, Package, Briefcase, Plus, 
  TrendingUp, ClipboardList, ShieldAlert, Award, Car 
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { bills, businessProfile, setCurrentEditBill } = useBilling();

  const [stats, setStats] = useState({
    totalSales: 0,
    invoiceCount: 0,
    uniqueVehicles: 0,
    itemsCount: 0
  });

  // Calculate live statistics
  useEffect(() => {
    const total = bills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
    const plates = new Set(bills.map(bill => bill.vehicleNumber?.toUpperCase()).filter(Boolean));
    
    // Fetch items count from API
    const fetchItemCount = async () => {
      try {
        const { apiRequest } = await import('../utils/api.js');
        const items = await apiRequest('/items');
        setStats({
          totalSales: total,
          invoiceCount: bills.length,
          uniqueVehicles: plates.size,
          itemsCount: items.length
        });
      } catch (e) {
        setStats({
          totalSales: total,
          invoiceCount: bills.length,
          uniqueVehicles: plates.size,
          itemsCount: 0
        });
      }
    };
    
    fetchItemCount();
  }, [bills]);

  const handleCreateBillClick = () => {
    setCurrentEditBill(null); // Make sure we aren't carrying over edit states
    navigate('/billing');
  };

  const handleAddItemClick = () => {
    navigate('/items');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Hero Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Vehicle Management Home
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Welcome to your vehicle service workspace. Streamline billing, manage inventory parts, and generate invoice documents.
          </p>
        </div>

        {/* Quick Floating Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAddItemClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-sm font-semibold transition-all shadow"
          >
            <Plus size={16} className="text-slate-400" />
            Add Item
          </button>
          <button
            onClick={handleCreateBillClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:scale-102"
          >
            <FileText size={16} />
            Add Bill
          </button>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Total Sales Revenue</span>
            <span className="text-xl font-extrabold text-slate-150">${stats.totalSales.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <ClipboardList size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Invoices Issued</span>
            <span className="text-xl font-extrabold text-slate-150">{stats.invoiceCount} invoices</span>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Car size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Vehicles Serviced</span>
            <span className="text-xl font-extrabold text-slate-150">{stats.uniqueVehicles} unique plates</span>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Package size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Active Inventory</span>
            <span className="text-xl font-extrabold text-slate-150">{stats.itemsCount} catalog parts</span>
          </div>
        </div>
      </div>

      {/* Grid Dashboard Cards - Required: grid-template-columns: repeat(2, 1fr) */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">WORKSPACE PAGES</h3>
      <div 
        className="grid gap-6" 
        style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        {/* Card 1: Billing Page */}
        <div 
          onClick={handleCreateBillClick}
          className="glass-card p-6 cursor-pointer flex flex-col justify-between group hover:scale-[1.01]"
        >
          <div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <FileText size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
              Billing Panel
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Create a new client invoice, upload base64 vehicle photos, calculate service amounts, and print/download receipts immediately.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300">
            <span>Launch Billing Console</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Card 2: Bill History */}
        <div 
          onClick={() => navigate('/history')}
          className="glass-card p-6 cursor-pointer flex flex-col justify-between group hover:scale-[1.01]"
        >
          <div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <History size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
              Billing History
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Browse invoices list. Perform multi-field search filters, sort records, load receipts for editing, or print/download past documents.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300">
            <span>Open History Archive ({stats.invoiceCount})</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Card 3: Items Inventory */}
        <div 
          onClick={handleAddItemClick}
          className="glass-card p-6 cursor-pointer flex flex-col justify-between group hover:scale-[1.01]"
        >
          <div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Package size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
              Items
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Maintain spare parts inventory listings. Adjust pricing schemas, track parts availability, or log additions/modifications.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300">
            <span>Open Parts Directory ({stats.itemsCount})</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Card 4: Business Profile */}
        <div 
          onClick={() => navigate('/business-profile')}
          className="glass-card p-6 cursor-pointer flex flex-col justify-between group hover:scale-[1.01]"
        >
          <div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Briefcase size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
              Business Profile
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Configure default company information, upload base64 corporate logos, record email/phone metadata, and list tax IDs.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:text-indigo-300">
            <span className="truncate max-w-[200px]">
              {businessProfile.name ? `Profile: ${businessProfile.name}` : 'Setup Profile Defaults'}
            </span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
