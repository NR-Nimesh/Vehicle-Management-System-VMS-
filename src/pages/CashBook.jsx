import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Users, CreditCard, Building2,
  Plus, Minus, Search, Filter, ChevronDown, Eye, Pencil, Trash2,
  ShoppingCart, Wrench, Shield, MoreHorizontal, User, Home,
  Fuel, Settings, RefreshCw, Calendar, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { apiRequest } from '../utils/api';
import { useBilling } from '../context/BillingContext';
import AddTransactionModal from '../components/AddTransactionModal';

// ─── Colour palettes ─────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];
const TYPE_BADGE = {
  Income:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Expense:    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  Transfer:   'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  Receivable: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Payable:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};
const PAY_BADGE = {
  Cash:          'bg-emerald-500/10 text-emerald-300',
  Card:          'bg-indigo-500/10 text-indigo-300',
  'Bank Transfer':'bg-sky-500/10 text-sky-300',
  Cheque:        'bg-amber-500/10 text-amber-300',
};

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, subColor = 'text-emerald-400', iconBg, iconColor }) {
  return (
    <div className="glass-panel p-5 flex items-start gap-4 rounded-2xl hover:scale-[1.02] transition-transform">
      <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-extrabold text-slate-100 mt-0.5 truncate">{value}</p>
        <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Category chip ────────────────────────────────────────────────────────────
function CatChip({ icon: Icon, label, color }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border cursor-pointer hover:scale-105 transition-all ${color}`}>
      <Icon size={20} />
      <span className="text-[10px] font-semibold leading-tight text-center">{label}</span>
    </div>
  );
}

// ─── Custom Doughnut label ────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold" style={{ fontSize: 11, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
function getDateRange(period) {
  const now = new Date();
  let start = new Date();
  if (period === 'today') { start.setHours(0, 0, 0, 0); }
  else if (period === 'week') { start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0); }
  else if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
  else if (period === 'year') { start = new Date(now.getFullYear(), 0, 1); }
  else { return null; }
  return { start, end: now };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CashBook() {
  const { bills } = useBilling();

  // Data state
  const [expenses, setExpenses]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);

  // UI state
  const [period, setPeriod]           = useState('month');
  const [filterCat, setFilterCat]     = useState('');
  const [filterPay, setFilterPay]     = useState('');
  const [filterAcc, setFilterAcc]     = useState('');
  const [search, setSearch]           = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [chartView, setChartView]     = useState('bar'); // 'bar' | 'pie'

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalType, setModalType]     = useState('Expense');
  const [editData, setEditData]       = useState(null);

  // Delete confirm
  const [deleteId, setDeleteId]       = useState(null);

  // View detail
  const [viewEntry, setViewEntry]     = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expData, sumData] = await Promise.all([
        apiRequest('/expenses'),
        apiRequest('/expenses/summary'),
      ]);
      setExpenses(expData);
      setSummary(sumData);
    } catch (err) {
      console.error('Cash book fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Build unified ledger from bills + expenses ─────────────────────────────
  const ledger = useMemo(() => {
    const entries = [];

    // Bills → Income rows
    bills.forEach(b => {
      const amt = parseFloat(b.total) || 0;
      if (amt > 0) {
        entries.push({
          id: `bill-${b.id}`,
          isBill: true,
          date: new Date(b.created_at || b.date),
          type: 'Income',
          category: b.pending_amount > 0 ? 'Accounts Receivable' : 'Sales',
          description: `Invoice #${b.invoice_number || b.invoiceNumber} – ${b.customer_name || b.customerName || 'Customer'}`,
          payment_method: 'Cash',
          account: 'Main',
          cashIn: parseFloat(b.paid_amount) || amt,
          cashOut: 0,
          amount: parseFloat(b.paid_amount) || amt,
        });
      }
    });

    // Manual expenses
    expenses.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      const isOut = ['Expense', 'Transfer', 'Payable'].includes(e.type);
      entries.push({
        id: `exp-${e.id}`,
        isBill: false,
        date: new Date(e.date),
        type: e.type || 'Expense',
        category: e.category,
        description: e.description,
        payment_method: e.payment_method || 'Cash',
        account: e.account || 'Main',
        cashIn: isOut ? 0 : amt,
        cashOut: isOut ? amt : 0,
        amount: amt,
        rawId: e.id,
      });
    });

    // Sort by date ascending → compute running balance
    entries.sort((a, b) => a.date - b.date);
    let balance = 0;
    const withBalance = entries.map(e => {
      balance += e.cashIn - e.cashOut;
      return { ...e, balance };
    });
    // Return newest-first
    return withBalance.reverse();
  }, [bills, expenses]);

  // ── Summary computed values ────────────────────────────────────────────────
  const totalBillsIncome = useMemo(
    () => bills.reduce((s, b) => s + (parseFloat(b.paid_amount) || parseFloat(b.total) || 0), 0),
    [bills]
  );
  const totalIncome   = totalBillsIncome + (summary?.manualIncome || 0);
  const totalExpenses = summary?.totalExpenses || 0;
  const cashBalance   = totalIncome - totalExpenses;
  const bankBalance   = summary?.bankBalance || 380000;
  const receivable    = summary?.accountsReceivable || 0;
  const payable       = summary?.accountsPayable || 0;

  // ── Bar chart data (last 5 months) ────────────────────────────────────────
  const barData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const m = d.getMonth(); const y = d.getFullYear();
      const income = ledger
        .filter(e => { const dt = e.date; return dt.getMonth() === m && dt.getFullYear() === y && e.cashIn > 0; })
        .reduce((s, e) => s + e.cashIn, 0);
      const expense = ledger
        .filter(e => { const dt = e.date; return dt.getMonth() === m && dt.getFullYear() === y && e.cashOut > 0; })
        .reduce((s, e) => s + e.cashOut, 0);
      months.push({ month: label, Income: Math.round(income), Expense: Math.round(expense) });
    }
    return months;
  }, [ledger]);

  // ── Pie chart data ────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const cats = {};
    ledger.filter(e => e.cashOut > 0).forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.cashOut;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [ledger]);

  // ── Filtered transactions ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = [...ledger];
    const range = getDateRange(period);
    if (range) {
      rows = rows.filter(e => e.date >= range.start && e.date <= range.end);
    }
    if (dateFrom) rows = rows.filter(e => e.date >= new Date(dateFrom));
    if (dateTo)   rows = rows.filter(e => e.date <= new Date(dateTo + 'T23:59:59'));
    if (filterCat) rows = rows.filter(e => e.category === filterCat);
    if (filterPay) rows = rows.filter(e => e.payment_method === filterPay);
    if (filterAcc) rows = rows.filter(e => e.account === filterAcc);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [ledger, period, dateFrom, dateTo, filterCat, filterPay, filterAcc, search]);

  const allCats = useMemo(() => [...new Set(ledger.map(e => e.category).filter(Boolean))], [ledger]);
  const currentBalance = ledger.length > 0 ? ledger[0].balance : 0;

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
      await fetchAll();
    } catch (err) { console.error('Delete failed', err); }
    setDeleteId(null);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (entry) => {
    setEditData({
      id: entry.rawId,
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      payment_method: entry.payment_method,
      account: entry.account,
      date: entry.date.toISOString(),
    });
    setModalType(entry.type);
    setModalOpen(true);
  };

  // ── Tooltip formatter ─────────────────────────────────────────────────────
  const barTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-xs">
        <p className="text-slate-300 font-bold mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
          <button
            onClick={() => { setModalType('Income'); setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/25 hover:scale-105">
            <Plus size={16} /> Add Income
          </button>
          <button
            onClick={() => { setModalType('Expense'); setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/25 hover:scale-105">
            <Minus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard icon={Wallet} label="Cash Balance" value={fmt(cashBalance)}
          sub="+8.5% from last month" subColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border border-emerald-500/20" iconColor="text-emerald-400" />
        <SummaryCard icon={TrendingUp} label="Total Income" value={fmt(totalIncome)}
          sub="+12.4% from last month" subColor="text-emerald-400"
          iconBg="bg-indigo-500/10 border border-indigo-500/20" iconColor="text-indigo-400" />
        <SummaryCard icon={TrendingDown} label="Total Expenses" value={fmt(totalExpenses)}
          sub="-4.2% from last month" subColor="text-rose-400"
          iconBg="bg-rose-500/10 border border-rose-500/20" iconColor="text-rose-400" />
        <SummaryCard icon={Users} label="Accounts Receivable" value={fmt(receivable)}
          sub={`${summary?.receivableCount || 0} Customers`} subColor="text-orange-400"
          iconBg="bg-orange-500/10 border border-orange-500/20" iconColor="text-orange-400" />
        <SummaryCard icon={CreditCard} label="Accounts Payable" value={fmt(payable)}
          sub={`${summary?.payableCount || 0} Suppliers`} subColor="text-blue-400"
          iconBg="bg-blue-500/10 border border-blue-500/20" iconColor="text-blue-400" />
        <SummaryCard icon={Building2} label="Bank Balance" value={fmt(bankBalance)}
          sub="Main Checking Account" subColor="text-violet-400"
          iconBg="bg-violet-500/10 border border-violet-500/20" iconColor="text-violet-400" />
      </div>

      {/* ── Charts + Category Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_280px] gap-6">

        {/* Bar Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-200 mb-4">Income vs Expense <span className="text-slate-500 font-normal">(Last 5 Months)</span></h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={barTooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="Expense" fill="#ef4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200">Expense by Category <span className="text-slate-500 font-normal">(This Month)</span></h2>
            <button onClick={() => setChartView(v => v === 'bar' ? 'pie' : 'bar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-600 text-slate-400 text-xs hover:border-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw size={12} /> Switch
            </button>
          </div>
          {pieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No expense data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" labelLine={false} label={<CustomPieLabel />}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 min-w-0">
                {pieData.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400 truncate flex-1">{d.name}</span>
                    <span className="text-slate-300 font-semibold shrink-0">{((d.value / pieData.reduce((s,x) => s+x.value, 0)) * 100).toFixed(0)}%</span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-600 pt-1">Total: <span className="text-rose-400 font-semibold">{fmt(pieData.reduce((s,d) => s+d.value, 0))}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Category Panel */}
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          {/* Income Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-400">Income Categories</h3>
              <button className="text-xs text-emerald-400 hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: ShoppingCart, label: 'Sales' },
                { icon: Wrench, label: 'Service Income' },
                { icon: CreditCard, label: 'Advance Payment' },
                { icon: Shield, label: 'Insurance Payment' },
                { icon: MoreHorizontal, label: 'More' },
              ].slice(0, 5).map(({ icon, label }) => (
                <CatChip key={label} icon={icon} label={label}
                  color="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" />
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800" />

          {/* Expense Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-rose-400">Expense Categories</h3>
              <button className="text-xs text-rose-400 hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: User, label: 'Salary' },
                { icon: Home, label: 'Rent' },
                { icon: Fuel, label: 'Fuel' },
                { icon: Settings, label: 'Vehicle Parts' },
                { icon: MoreHorizontal, label: 'More' },
              ].slice(0, 5).map(({ icon, label }) => (
                <CatChip key={label} icon={icon} label={label}
                  color="bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        {/* Period chips */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Filters:</span>
          {[['today','Today'], ['week','This Week'], ['month','This Month'], ['year','This Year']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                period === v
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
              }`}>{l}</button>
          ))}
        </div>

        {/* Dropdowns + Date Range + Search */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category */}
          <div className="relative">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Categories</option>
              {allCats.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Payment method */}
          <div className="relative">
            <select value={filterPay} onChange={e => setFilterPay(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Payment Methods</option>
              {['Cash','Card','Bank Transfer','Cheque'].map(m => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Account */}
          <div className="relative">
            <select value={filterAcc} onChange={e => setFilterAcc(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2 focus:outline-none hover:border-slate-500 cursor-pointer">
              <option value="">All Accounts</option>
              {['Main','Bank','Petty Cash'].map(a => <option key={a}>{a}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-slate-500" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-32" />
            <span className="text-slate-600">–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none w-32" />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="bg-transparent text-sm text-slate-300 focus:outline-none flex-1 placeholder:text-slate-600" />
          </div>

          <button
            onClick={() => { setFilterCat(''); setFilterPay(''); setFilterAcc(''); setSearch(''); setDateFrom(''); setDateTo(''); setPeriod('month'); }}
            className="p-2 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-xl hover:bg-emerald-600/30 transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">{filtered.length} entries · Current Balance: <span className={currentBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{fmt(currentBalance)}</span></p>
          </div>
          <button onClick={fetchAll} className="p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-slate-950/60 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
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
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-600">
                    {loading ? 'Loading transactions...' : 'No transactions found for the selected filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/25 transition-colors group">
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-300 text-xs">
                        {entry.date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                      <span className="text-slate-600 text-[10px] block">
                        {entry.date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </td>
                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${TYPE_BADGE[entry.type] || TYPE_BADGE.Expense}`}>
                        {entry.type}
                      </span>
                    </td>
                    {/* Category */}
                    <td className="py-3 px-4 text-slate-400 text-xs">{entry.category}</td>
                    {/* Description */}
                    <td className="py-3 px-4 text-slate-400 text-xs max-w-[200px] truncate" title={entry.description}>
                      {entry.description || '—'}
                    </td>
                    {/* Payment */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${PAY_BADGE[entry.payment_method] || 'bg-slate-700/50 text-slate-400'}`}>
                        {entry.payment_method}
                      </span>
                    </td>
                    {/* Cash In */}
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400 text-sm">
                      {entry.cashIn > 0 ? `+${Number(entry.cashIn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : <span className="text-slate-700">—</span>}
                    </td>
                    {/* Cash Out */}
                    <td className="py-3 px-4 text-right font-semibold text-rose-400 text-sm">
                      {entry.cashOut > 0 ? `-${Number(entry.cashOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : <span className="text-slate-700">—</span>}
                    </td>
                    {/* Balance */}
                    <td className={`py-3 px-4 text-right font-bold text-sm ${entry.balance >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                      {Number(entry.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewEntry(entry)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors" title="View">
                          <Eye size={13} />
                        </button>
                        {!entry.isBill && (
                          <>
                            <button onClick={() => handleEdit(entry)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteId(entry.rawId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        defaultType={modalType}
        editData={editData}
        onSaved={fetchAll}
      />

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Delete Transaction?</h3>
            <p className="text-slate-400 text-sm mt-2">This action cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-600/20">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detail ── */}
      {viewEntry && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setViewEntry(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100">Transaction Detail</h3>
              <button onClick={() => setViewEntry(null)} className="p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Type', <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${TYPE_BADGE[viewEntry.type] || ''}`}>{viewEntry.type}</span>],
                ['Category', viewEntry.category],
                ['Description', viewEntry.description || '—'],
                ['Date', viewEntry.date.toLocaleString()],
                ['Payment Method', viewEntry.payment_method],
                ['Account', viewEntry.account],
                ['Cash In', viewEntry.cashIn > 0 ? <span className="text-emerald-400 font-bold">{fmt(viewEntry.cashIn)}</span> : '—'],
                ['Cash Out', viewEntry.cashOut > 0 ? <span className="text-rose-400 font-bold">{fmt(viewEntry.cashOut)}</span> : '—'],
                ['Balance After', <span className={viewEntry.balance >= 0 ? 'text-slate-200 font-bold' : 'text-rose-400 font-bold'}>{fmt(viewEntry.balance)}</span>],
              ].map(([k, v]) => (
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
