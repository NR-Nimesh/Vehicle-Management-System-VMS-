import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Users, CreditCard, Building2,
  Plus, Minus, Search, Filter, ChevronDown, Eye, Pencil, Trash2,
  ShoppingCart, Wrench, Shield, User, Home,
  Fuel, Settings, RefreshCw, Calendar, X, Tag
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { apiRequest } from '../utils/api';
import { useBilling } from '../context/BillingContext';
import AddTransactionModal from '../components/AddTransactionModal';
import ReceivableModal from '../components/ReceivableModal';
import PayableModal from '../components/PayableModal';
import CategoryManageModal from '../components/CategoryManageModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const PIE_COLORS   = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#64748b','#06b6d4','#f97316'];
const TYPE_BADGE   = {
  Income:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Expense:    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  Transfer:   'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  Receivable: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Payable:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};
const PAY_BADGE = {
  Cash:            'bg-emerald-500/10 text-emerald-300',
  Card:            'bg-indigo-500/10 text-indigo-300',
  'Bank Transfer': 'bg-sky-500/10 text-sky-300',
  Cheque:          'bg-amber-500/10 text-amber-300',
};
const ICON_MAP = { ShoppingCart, Wrench, CreditCard, Shield, User, Home, Fuel, Settings, Tag };

const fmt = (n) => `Rs. ${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

// ─── Date range helper ────────────────────────────────────────────────────────
function getDateRange(period) {
  const now = new Date();
  if (period === 'today') {
    const s = new Date(); s.setHours(0,0,0,0); return { start: s, end: now };
  }
  if (period === 'week') {
    const s = new Date(); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); return { start: s, end: now };
  }
  if (period === 'month') { return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }; }
  if (period === 'year')  { return { start: new Date(now.getFullYear(), 0, 1), end: now }; }
  return null;
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, subColor='text-emerald-400', iconBg, iconColor, onClick, clickable }) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[130px] transition-all duration-200
        ${clickable ? 'cursor-pointer hover:scale-[1.03] hover:ring-1 hover:ring-white/10' : 'hover:scale-[1.02]'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
          <Icon size={20} className={iconColor} />
        </div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-tight mt-0.5">{label}</p>
      </div>
      <div>
        <p className="text-[1.65rem] font-black text-white leading-tight tracking-tight mt-2">{value}</p>
        <p className={`text-xs mt-1.5 font-semibold ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Category Chip ────────────────────────────────────────────────────────────
function CatChip({ icon: Icon, label, color }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border cursor-pointer hover:scale-105 transition-all ${color}`}>
      <Icon size={18} />
      <span className="text-[9px] font-semibold leading-tight text-center">{label}</span>
    </div>
  );
}

// ─── Custom Pie label ─────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 10, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CashBook() {
  const { bills } = useBilling();

  // Server data
  const [expenses, setExpenses]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [cbCategories, setCbCategories] = useState([]);

  // Filter state
  const [period, setPeriod]     = useState('month');
  const [filterCat, setFilterCat] = useState('');
  const [filterPay, setFilterPay] = useState('');
  const [filterAcc, setFilterAcc] = useState('');
  const [search, setSearch]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  // Chart state
  const [pieMode, setPieMode]     = useState('expense'); // 'expense' | 'income'
  const [pieFading, setPieFading] = useState(false);

  // Modals
  const [txnModal, setTxnModal]   = useState(false);
  const [txnType, setTxnType]     = useState('Expense');
  const [editData, setEditData]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [viewEntry, setViewEntry] = useState(null);
  const [arOpen, setArOpen]       = useState(false);
  const [apOpen, setApOpen]       = useState(false);
  const [catModal, setCatModal]   = useState(false);
  const [catModalTab, setCatModalTab] = useState('Income');

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expData, sumData, catData] = await Promise.all([
        apiRequest('/expenses'),
        apiRequest('/expenses/summary'),
        apiRequest('/expenses/categories'),
      ]);
      setExpenses(expData);
      setSummary(sumData);
      setCbCategories(catData);
    } catch (err) { console.error('CashBook fetch error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 30s auto-poll synchronization
  useEffect(() => {
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Unified ledger ────────────────────────────────────────────────────────
  const ledger = useMemo(() => {
    const entries = [];
    bills.forEach(b => {
      const amt = parseFloat(b.total) || 0;
      if (amt > 0) {
        entries.push({
          id: `bill-${b.id}`, isBill: true,
          date: new Date(b.created_at || b.date),
          type: 'Income',
          category: parseFloat(b.pending_amount) > 0 ? 'Accounts Receivable' : 'Sales',
          description: `Invoice #${b.invoice_number || b.invoiceNumber} – ${b.customer_name || b.customerName || 'Customer'}`,
          payment_method: 'Cash', account: 'Main',
          cashIn: parseFloat(b.paid_amount) || amt, cashOut: 0,
          amount: parseFloat(b.paid_amount) || amt,
        });
      }
    });
    expenses.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      const isOut = ['Expense','Transfer','Payable'].includes(e.type);
      entries.push({
        id: `exp-${e.id}`, isBill: false, rawId: e.id,
        date: new Date(e.date), type: e.type || 'Expense',
        category: e.category, description: e.description,
        payment_method: e.payment_method || 'Cash', account: e.account || 'Main',
        cashIn: isOut ? 0 : amt, cashOut: isOut ? amt : 0, amount: amt,
      });
    });
    entries.sort((a, b) => a.date - b.date);
    let balance = 0;
    const withBal = entries.map(e => { balance += e.cashIn - e.cashOut; return { ...e, balance }; });
    return withBal.reverse();
  }, [bills, expenses]);

  // ── Period-filtered ledger (drives ALL reactive sections) ─────────────────
  const periodFiltered = useMemo(() => {
    const range = getDateRange(period);
    if (!range) return ledger;
    return ledger.filter(e => e.date >= range.start && e.date <= range.end);
  }, [ledger, period]);

  // ── Reactive summary values from filtered data ────────────────────────────
  const filteredIncome   = useMemo(() => periodFiltered.reduce((s,e) => s + e.cashIn,  0), [periodFiltered]);
  const filteredExpenses = useMemo(() => periodFiltered.reduce((s,e) => s + e.cashOut, 0), [periodFiltered]);
  const filteredBalance  = filteredIncome - filteredExpenses;

  // AR / AP always from DB summary (not period-filtered — they're outstanding totals)
  const receivable     = summary?.accountsReceivable || 0;
  const payable        = summary?.accountsPayable || 0;
  const receivableCount = summary?.receivableCount || 0;
  const payableCount   = summary?.payableCount || 0;
  const bankBalance    = summary?.bankBalance || 0;

  // ── Bar chart (period-aware) ───────────────────────────────────────────────
  const barData = useMemo(() => {
    const months = []; const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const m = d.getMonth(); const y = d.getFullYear();
      const src = period === 'year' ? ledger : periodFiltered.length > 0 ? periodFiltered : ledger;
      const inc = src.filter(e => { const dt = e.date; return dt.getMonth()===m && dt.getFullYear()===y && e.cashIn>0; }).reduce((s,e)=>s+e.cashIn,0);
      const exp = src.filter(e => { const dt = e.date; return dt.getMonth()===m && dt.getFullYear()===y && e.cashOut>0; }).reduce((s,e)=>s+e.cashOut,0);
      months.push({ month: label, Income: Math.round(inc), Expense: Math.round(exp) });
    }
    return months;
  }, [ledger, periodFiltered, period]);

  // ── Pie chart data (period-aware, mode-switchable) ─────────────────────────
  const pieData = useMemo(() => {
    const src = periodFiltered.length > 0 ? periodFiltered : ledger;
    const cats = {};
    if (pieMode === 'expense') {
      src.filter(e => e.cashOut > 0).forEach(e => { cats[e.category] = (cats[e.category]||0) + e.cashOut; });
    } else {
      src.filter(e => e.cashIn > 0).forEach(e => { cats[e.category] = (cats[e.category]||0) + e.cashIn; });
    }
    return Object.entries(cats).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a,b)=>b.value-a.value);
  }, [periodFiltered, ledger, pieMode]);

  const pieTotal = pieData.reduce((s,d)=>s+d.value, 0);

  // ── Switch pie mode with fade ─────────────────────────────────────────────
  const switchPieMode = () => {
    setPieFading(true);
    setTimeout(() => { setPieMode(m => m === 'expense' ? 'income' : 'expense'); setPieFading(false); }, 250);
  };

  // ── Full filtered transactions ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...periodFiltered];
    if (dateFrom) rows = rows.filter(e => e.date >= new Date(dateFrom));
    if (dateTo)   rows = rows.filter(e => e.date <= new Date(dateTo+'T23:59:59'));
    if (filterCat) rows = rows.filter(e => e.category === filterCat);
    if (filterPay) rows = rows.filter(e => e.payment_method === filterPay);
    if (filterAcc) rows = rows.filter(e => e.account === filterAcc);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e => e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q));
    }
    return rows;
  }, [periodFiltered, dateFrom, dateTo, filterCat, filterPay, filterAcc, search]);

  const allCats = useMemo(() => [...new Set(ledger.map(e=>e.category).filter(Boolean))], [ledger]);
  const currentBalance = ledger.length > 0 ? ledger[0].balance : 0;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try { await apiRequest(`/expenses/${id}`, { method: 'DELETE' }); await fetchAll(); }
    catch (err) { console.error(err); }
    setDeleteId(null);
  };
  const handleEdit = (entry) => {
    setEditData({ id: entry.rawId, type: entry.type, category: entry.category, description: entry.description, amount: entry.amount, payment_method: entry.payment_method, account: entry.account, date: entry.date.toISOString() });
    setTxnType(entry.type); setTxnModal(true);
  };

  // ── Category panel helpers ────────────────────────────────────────────────
  const incomeCats  = cbCategories.filter(c=>c.type==='Income');
  const expenseCats = cbCategories.filter(c=>c.type==='Expense');

  const openCatModal = (tab) => { setCatModalTab(tab); setCatModal(true); };

  // ── Bar tooltip ───────────────────────────────────────────────────────────
  const barTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-xs">
        <p className="text-slate-300 font-bold mb-2">{label}</p>
        {payload.map(p => <p key={p.name} style={{color:p.color}} className="font-semibold">{p.name}: {fmt(p.value)}</p>)}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1600px] mx-auto py-6 px-4 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
            Cash Book
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track all cash inflows and outflows in your vehicle management system.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setTxnType('Income'); setEditData(null); setTxnModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/25 hover:scale-105">
            <Plus size={16} /> Add Income
          </button>
          <button onClick={() => { setTxnType('Expense'); setEditData(null); setTxnModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/25 hover:scale-105">
            <Minus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* ── Summary Cards (6 equal-height, reactive to period) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard icon={Wallet}    label="Cash Balance"
          value={fmt(filteredBalance)}
          sub={period === 'month' ? 'This Month' : period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Year'}
          subColor={filteredBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          iconBg="bg-emerald-500/10 border border-emerald-500/20" iconColor="text-emerald-400" />

        <SummaryCard icon={TrendingUp} label="Total Income"
          value={fmt(filteredIncome)}
          sub="All income in period" subColor="text-emerald-400"
          iconBg="bg-indigo-500/10 border border-indigo-500/20" iconColor="text-indigo-400" />

        <SummaryCard icon={TrendingDown} label="Total Expenses"
          value={fmt(filteredExpenses)}
          sub="All expenses in period" subColor="text-rose-400"
          iconBg="bg-rose-500/10 border border-rose-500/20" iconColor="text-rose-400" />

        <SummaryCard icon={Users} label="Accounts Receivable"
          value={fmt(receivable)}
          sub={`${receivableCount} outstanding`} subColor="text-orange-400"
          iconBg="bg-orange-500/10 border border-orange-500/20" iconColor="text-orange-400"
          clickable onClick={() => setArOpen(true)} />

        <SummaryCard icon={CreditCard} label="Accounts Payable"
          value={fmt(payable)}
          sub={`${payableCount} outstanding`} subColor="text-blue-400"
          iconBg="bg-blue-500/10 border border-blue-500/20" iconColor="text-blue-400"
          clickable onClick={() => setApOpen(true)} />

        <SummaryCard icon={Building2} label="Bank Balance"
          value={fmt(bankBalance)}
          sub="Main Checking Account" subColor="text-violet-400"
          iconBg="bg-violet-500/10 border border-violet-500/20" iconColor="text-violet-400" />
      </div>

      {/* ── Charts + Category Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_280px] gap-6">

        {/* Bar Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-200 mb-4">
            Income vs Expense <span className="text-slate-500 font-normal">(Last 5 Months)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
              <Tooltip content={barTooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:'#94a3b8'}} />
              <Bar dataKey="Income" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="Expense" fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doughnut Chart with Income/Expense toggle */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200">
              {pieMode === 'expense' ? 'Expense' : 'Income'} by Category{' '}
              <span className="text-slate-500 font-normal">(Period)</span>
            </h2>
            <button onClick={switchPieMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 ${
                pieMode === 'expense'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}>
              <RefreshCw size={12} className={pieFading ? 'animate-spin' : ''} />
              Switch to {pieMode === 'expense' ? 'Income' : 'Expense'}
            </button>
          </div>

          <div style={{ opacity: pieFading ? 0 : 1, transition: 'opacity 0.25s ease' }}>
            {pieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
                No {pieMode} data for this period
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" labelLine={false} label={<PieLabel />}>
                      {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
                  {pieData.slice(0,6).map((d,i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:PIE_COLORS[i%PIE_COLORS.length]}} />
                      <span className="text-slate-400 truncate flex-1">{d.name}</span>
                      <span className="text-slate-300 font-semibold shrink-0">{pieTotal>0?((d.value/pieTotal)*100).toFixed(0):0}%</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-600 pt-1">
                    Total: <span className={pieMode==='expense'?'text-rose-400 font-semibold':'text-emerald-400 font-semibold'}>{fmt(pieTotal)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Panel */}
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          {/* Income Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-400">Income Categories</h3>
              <button onClick={() => openCatModal('Income')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 border border-emerald-500/30 rounded-lg px-2 py-1 hover:bg-emerald-500/10 transition-colors">
                <Plus size={10} /> Category
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {incomeCats.slice(0,3).map(cat => {
                const CatIcon = ICON_MAP[cat.icon] || Tag;
                return (
                  <CatChip key={cat.id} icon={CatIcon} label={cat.name}
                    color="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" />
                );
              })}
              <div onClick={() => openCatModal('Income')}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-slate-700 cursor-pointer hover:scale-105 transition-all bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:border-slate-500">
                <Plus size={16} />
                <span className="text-[9px] font-semibold">More</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800" />

          {/* Expense Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-rose-400">Expense Categories</h3>
              <button onClick={() => openCatModal('Expense')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 border border-rose-500/30 rounded-lg px-2 py-1 hover:bg-rose-500/10 transition-colors">
                <Plus size={10} /> Category
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {expenseCats.slice(0,3).map(cat => {
                const CatIcon = ICON_MAP[cat.icon] || Tag;
                return (
                  <CatChip key={cat.id} icon={CatIcon} label={cat.name}
                    color="bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10" />
                );
              })}
              <div onClick={() => openCatModal('Expense')}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-slate-700 cursor-pointer hover:scale-105 transition-all bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:border-slate-500">
                <Plus size={16} />
                <span className="text-[9px] font-semibold">More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Filters ── */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Filters:</span>
          {[['today','Today'],['week','This Week'],['month','This Month'],['year','This Year']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                period === v
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
              }`}>{l}</button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Category */}
          <div className="relative">
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Categories</option>
              {allCats.map(c=><option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Payment */}
          <div className="relative">
            <select value={filterPay} onChange={e=>setFilterPay(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Payment Methods</option>
              {['Cash','Card','Bank Transfer','Cheque'].map(m=><option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Account */}
          <div className="relative">
            <select value={filterAcc} onChange={e=>setFilterAcc(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Accounts</option>
              {['Main','Bank','Petty Cash'].map(a=><option key={a}>{a}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-slate-500" />
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-32" />
            <span className="text-slate-600">–</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-32" />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions..."
              className="bg-transparent text-sm text-slate-300 focus:outline-none flex-1 placeholder:text-slate-600" />
          </div>

          <button onClick={() => { setFilterCat(''); setFilterPay(''); setFilterAcc(''); setSearch(''); setDateFrom(''); setDateTo(''); setPeriod('month'); }}
            className="p-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-xl hover:bg-emerald-600/30 transition-colors" title="Reset filters">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filtered.length} entries · Balance: <span className={currentBalance>=0?'text-emerald-400 font-bold':'text-rose-400 font-bold'}>{fmt(currentBalance)}</span>
            </p>
          </div>
          <button onClick={fetchAll} className="p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors">
            <RefreshCw size={15} className={loading?'animate-spin':''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-slate-950/60 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right text-emerald-500">Cash In (Rs.)</th>
                <th className="py-3 px-4 font-semibold text-right text-rose-500">Cash Out (Rs.)</th>
                <th className="py-3 px-4 font-semibold text-right">Balance (Rs.)</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="py-16 text-center text-slate-600">
                  {loading ? 'Loading transactions...' : 'No transactions found for the selected filters.'}
                </td></tr>
              ) : filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/25 transition-colors group">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-slate-300 text-xs">{entry.date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
                    <span className="text-slate-600 text-[10px] block">{entry.date.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${TYPE_BADGE[entry.type]||TYPE_BADGE.Expense}`}>{entry.type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{entry.category}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs max-w-[200px] truncate" title={entry.description}>{entry.description||'—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold ${PAY_BADGE[entry.payment_method]||'bg-slate-700/50 text-slate-400'}`}>{entry.payment_method}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-400 text-sm">
                    {entry.cashIn>0 ? `+${Number(entry.cashIn).toLocaleString('en-IN',{minimumFractionDigits:2})}` : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-400 text-sm">
                    {entry.cashOut>0 ? `-${Number(entry.cashOut).toLocaleString('en-IN',{minimumFractionDigits:2})}` : <span className="text-slate-700">—</span>}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold text-sm ${entry.balance>=0?'text-slate-200':'text-rose-400'}`}>
                    {Number(entry.balance).toLocaleString('en-IN',{minimumFractionDigits:2})}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>setViewEntry(entry)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors" title="View"><Eye size={13}/></button>
                      {!entry.isBill && (<>
                        <button onClick={()=>handleEdit(entry)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors" title="Edit"><Pencil size={13}/></button>
                        <button onClick={()=>setDeleteId(entry.rawId)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors" title="Delete"><Trash2 size={13}/></button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddTransactionModal isOpen={txnModal} onClose={()=>{setTxnModal(false);setEditData(null);}}
        defaultType={txnType} editData={editData} onSaved={fetchAll} />

      <ReceivableModal isOpen={arOpen} onClose={()=>setArOpen(false)} onUpdated={fetchAll} />
      <PayableModal    isOpen={apOpen} onClose={()=>setApOpen(false)} onUpdated={fetchAll} />
      <CategoryManageModal isOpen={catModal} onClose={()=>{setCatModal(false);fetchAll();}} defaultTab={catModalTab} />

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Delete Transaction?</h3>
            <p className="text-slate-400 text-sm mt-2">This action cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setDeleteId(null)} className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700">Cancel</button>
              <button onClick={()=>handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail */}
      {viewEntry && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={()=>setViewEntry(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100">Transaction Detail</h3>
              <button onClick={()=>setViewEntry(null)} className="p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800"><X size={16}/></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Type', <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${TYPE_BADGE[viewEntry.type]||''}`}>{viewEntry.type}</span>],
                ['Category', viewEntry.category],
                ['Description', viewEntry.description||'—'],
                ['Date', viewEntry.date.toLocaleString()],
                ['Payment Method', viewEntry.payment_method],
                ['Account', viewEntry.account],
                ['Cash In', viewEntry.cashIn>0 ? <span className="text-emerald-400 font-bold">{fmt(viewEntry.cashIn)}</span> : '—'],
                ['Cash Out', viewEntry.cashOut>0 ? <span className="text-rose-400 font-bold">{fmt(viewEntry.cashOut)}</span> : '—'],
                ['Balance After', <span className={viewEntry.balance>=0?'text-slate-200 font-bold':'text-rose-400 font-bold'}>{fmt(viewEntry.balance)}</span>],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-800 pb-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-300 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
