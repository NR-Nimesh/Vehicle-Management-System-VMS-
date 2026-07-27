import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Tag, Check, ShoppingCart, Wrench, CreditCard, Shield, User, Home, Fuel, Settings, MoreHorizontal } from 'lucide-react';
import { apiRequest } from '../utils/api';

const ICON_MAP = {
  ShoppingCart, Wrench, CreditCard, Shield, User, Home, Fuel, Settings, Tag, MoreHorizontal
};

const STATUS_COLOR = {
  Pending:        'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Partially Paid':'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  Paid:           'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const DEFAULT_INCOME_CATS = [
  { name: 'Sales', icon: 'ShoppingCart', type: 'Income' },
  { name: 'Service Income', icon: 'Wrench', type: 'Income' },
  { name: 'Advance Payment', icon: 'CreditCard', type: 'Income' },
  { name: 'Insurance Payment', icon: 'Shield', type: 'Income' },
  { name: 'Other Income', icon: 'Tag', type: 'Income' },
];
const DEFAULT_EXPENSE_CATS = [
  { name: 'Salary', icon: 'User', type: 'Expense' },
  { name: 'Rent', icon: 'Home', type: 'Expense' },
  { name: 'Fuel', icon: 'Fuel', type: 'Expense' },
  { name: 'Vehicle Parts', icon: 'Settings', type: 'Expense' },
  { name: 'Repairs', icon: 'Wrench', type: 'Expense' },
  { name: 'Utilities', icon: 'Tag', type: 'Expense' },
  { name: 'Misc', icon: 'Tag', type: 'Expense' },
];

export default function CategoryManageModal({ isOpen, onClose, defaultTab = 'Income' }) {
  const [tab, setTab]           = useState(defaultTab);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [addName, setAddName]   = useState('');
  const [addIcon, setAddIcon]   = useState('Tag');
  const [addBusy, setAddBusy]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError]       = useState('');

  const fetchCats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/expenses/categories');
      // If empty, seed defaults
      if (data.length === 0) {
        await Promise.all([
          ...DEFAULT_INCOME_CATS.map(c => apiRequest('/expenses/categories', { method: 'POST', body: JSON.stringify(c) })),
          ...DEFAULT_EXPENSE_CATS.map(c => apiRequest('/expenses/categories', { method: 'POST', body: JSON.stringify(c) })),
        ]);
        const seeded = await apiRequest('/expenses/categories');
        setCategories(seeded);
      } else {
        setCategories(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) { setTab(defaultTab); fetchCats(); } }, [isOpen, defaultTab]);

  const filtered = categories.filter(c => c.type === tab);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddBusy(true); setError('');
    try {
      await apiRequest('/expenses/categories', { method: 'POST', body: JSON.stringify({ name: addName.trim(), type: tab, icon: addIcon }) });
      setAddName(''); setAddIcon('Tag');
      await fetchCats();
    } catch (err) { setError(err.message); }
    finally { setAddBusy(false); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await apiRequest(`/expenses/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: editName, type: tab, icon: categories.find(c=>c.id===id)?.icon || 'Tag' }) });
      setEditId(null); setEditName('');
      await fetchCats();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/expenses/categories/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      await fetchCats();
    } catch (err) { setError(err.message); }
  };

  if (!isOpen) return null;

  const tabColor = tab === 'Income' ? 'emerald' : 'rose';
  const tabBtnActive = tab === 'Income'
    ? 'bg-emerald-600 text-white border-emerald-500'
    : 'bg-rose-600 text-white border-rose-500';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Tag size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Category Management</h2>
              <p className="text-xs text-slate-400">Add, edit or remove Cash Book categories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-slate-800">
          {['Income', 'Expense'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === t ? (t === 'Income' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500') : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
              {t} Categories
            </button>
          ))}
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">No {tab} categories yet. Add one below.</div>
          ) : (
            filtered.map(cat => {
              const CatIcon = ICON_MAP[cat.icon] || Tag;
              return (
                <div key={cat.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${tab === 'Income' ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/15 hover:border-rose-500/30'}`}>
                  <div className={`p-1.5 rounded-lg ${tab === 'Income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <CatIcon size={14} />
                  </div>
                  {editId === cat.id ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200 focus:outline-none"
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null); }} />
                  ) : (
                    <span className="flex-1 text-slate-200 text-sm font-medium">{cat.name}</span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {editId === cat.id ? (
                      <button onClick={() => handleEdit(cat.id)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors">
                        <Check size={13} />
                      </button>
                    ) : (
                      <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-indigo-400 transition-colors">
                        <Pencil size={13} />
                      </button>
                    )}
                    {deleteId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(cat.id)} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold">Confirm</button>
                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(cat.id)} className="p-1.5 rounded-lg hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Form */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          {error && <p className="text-rose-400 text-xs mb-2">{error}</p>}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input value={addName} onChange={e => setAddName(e.target.value)}
              placeholder={`New ${tab} category name...`}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500 placeholder:text-slate-600" />
            <button type="submit" disabled={addBusy || !addName.trim()}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 ${tab === 'Income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
              <Plus size={14} /> Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
