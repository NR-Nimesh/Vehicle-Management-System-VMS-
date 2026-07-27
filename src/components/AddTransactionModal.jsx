import React, { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { apiRequest } from '../utils/api';

const INCOME_CATEGORIES  = ['Sales', 'Service Income', 'Advance Payment', 'Insurance Payment', 'Other Income'];
const EXPENSE_CATEGORIES = ['Salary', 'Rent', 'Fuel', 'Vehicle Parts', 'Repairs', 'Utilities', 'Misc'];
const TRANSFER_CATEGORIES = ['Bank Deposit', 'Bank Withdrawal', 'Internal Transfer'];
const RECEIVABLE_CATEGORIES = ['Accounts Receivable'];
const PAYABLE_CATEGORIES   = ['Accounts Payable'];

const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Cheque'];
const ACCOUNTS        = ['Main', 'Bank', 'Petty Cash'];

const TYPE_CONFIG = {
  Income:     { label: 'Income',     color: 'emerald', icon: TrendingUp,    cats: INCOME_CATEGORIES },
  Expense:    { label: 'Expense',    color: 'rose',    icon: TrendingDown,  cats: EXPENSE_CATEGORIES },
  Transfer:   { label: 'Transfer',   color: 'violet',  icon: ArrowLeftRight,cats: TRANSFER_CATEGORIES },
  Receivable: { label: 'Receivable', color: 'orange',  icon: TrendingUp,    cats: RECEIVABLE_CATEGORIES },
  Payable:    { label: 'Payable',    color: 'blue',    icon: TrendingDown,  cats: PAYABLE_CATEGORIES },
};

const now = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function AddTransactionModal({ isOpen, onClose, defaultType = 'Expense', onSaved, editData = null }) {
  const [type, setType]                   = useState(defaultType);
  const [category, setCategory]           = useState('');
  const [description, setDescription]     = useState('');
  const [amount, setAmount]               = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [account, setAccount]             = useState('Main');
  const [date, setDate]                   = useState(now());
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (editData) {
      setType(editData.type || defaultType);
      setCategory(editData.category || '');
      setDescription(editData.description || '');
      setAmount(String(editData.amount || ''));
      setPaymentMethod(editData.payment_method || 'Cash');
      setAccount(editData.account || 'Main');
      const d = new Date(editData.date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDate(d.toISOString().slice(0, 16));
    } else {
      setType(defaultType);
      setCategory('');
      setDescription('');
      setAmount('');
      setPaymentMethod('Cash');
      setAccount('Main');
      setDate(now());
    }
    setError('');
  }, [editData, defaultType, isOpen]);

  // Auto-set first category when type changes
  useEffect(() => {
    const cats = TYPE_CONFIG[type]?.cats || [];
    setCategory(cats[0] || '');
  }, [type]);

  if (!isOpen) return null;

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Expense;
  const Icon = cfg.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setSubmitting(true); setError('');
    try {
      const payload = {
        date, category, description,
        amount: parseFloat(amount),
        type, payment_method: paymentMethod, account
      };
      if (editData?.id) {
        await apiRequest(`/expenses/${editData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest('/expenses', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' },
    rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    btn: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' },
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-400',  btn: 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/20' },
    orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  btn: 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' },
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' },
  };
  const c = colorMap[cfg.color];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-800 ${c.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${c.bg} border ${c.border}`}>
              <Icon size={18} className={c.text} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {editData ? 'Edit' : 'Add'} {cfg.label}
              </h2>
              <p className="text-xs text-slate-400">{editData ? 'Update transaction details' : 'Record a new transaction'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector */}
          {!editData && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Transaction Type</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(TYPE_CONFIG).map(([t, config]) => {
                  const TIcon = config.icon;
                  const tc = colorMap[config.color];
                  return (
                    <button key={t} type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        type === t ? `${tc.bg} ${tc.border} ${tc.text}` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}>
                      <TIcon size={13} />{config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Date & Time</label>
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500">
                {(TYPE_CONFIG[type]?.cats || []).map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. July office rent payment"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500 placeholder:text-slate-600" />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Amount (Rs.)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
              placeholder="0.00"
              className={`w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-slate-500 ${c.text} placeholder:text-slate-600`} />
          </div>

          {/* Payment Method & Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500">
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Account</label>
              <select value={account} onChange={e => setAccount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500">
                {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${c.btn}`}>
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : (
                <><Plus size={15} />{editData ? 'Update' : 'Save'} {cfg.label}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
