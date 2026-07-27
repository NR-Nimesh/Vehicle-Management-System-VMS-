import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Pencil, Trash2, Check, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  Pending:         'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Partially Paid':'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  Paid:            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const emptyForm = { customer_name: '', invoice_number: '', amount: '', due_date: '', description: '' };

export default function ReceivableModal({ isOpen, onClose, onUpdated }) {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [payId, setPayId]         = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [deleteId, setDeleteId]   = useState(null);
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [viewId, setViewId]       = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { setRecords(await apiRequest('/receivable')); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isOpen) fetchRecords(); }, [isOpen, fetchRecords]);

  const totalOutstanding = records.filter(r => r.status !== 'Paid').reduce((s, r) => s + parseFloat(r.remaining_amount || 0), 0);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (r) => {
    setForm({ customer_name: r.customer_name, invoice_number: r.invoice_number || '', amount: r.amount, due_date: r.due_date ? r.due_date.slice(0,10) : '', description: r.description || '' });
    setEditId(r.id); setShowForm(true); setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.amount) { setError('Customer name and amount are required.'); return; }
    setBusy(true); setError('');
    try {
      if (editId) {
        await apiRequest(`/receivable/${editId}`, { method: 'PUT', body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      } else {
        await apiRequest('/receivable', { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
      }
      setShowForm(false); setForm(emptyForm); setEditId(null);
      await fetchRecords(); onUpdated?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/receivable/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null); await fetchRecords(); onUpdated?.();
    } catch (err) { setError(err.message); }
  };

  const handlePay = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { setError('Enter a valid payment amount.'); return; }
    setBusy(true); setError('');
    try {
      await apiRequest(`/receivable/${payId}/pay`, { method: 'POST', body: JSON.stringify({ payment_amount: amt }) });
      setPayId(null); setPayAmount('');
      await fetchRecords(); onUpdated?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Users size={18} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Accounts Receivable</h2>
              <p className="text-xs text-orange-400 font-semibold">Outstanding: {fmt(totalOutstanding)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-600/20">
              <Plus size={14} /> Add Receivable
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSave} className="p-5 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">{editId ? 'Edit' : 'Add'} Receivable</h3>
            {error && <p className="text-rose-400 text-xs mb-2 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Customer Name *</label>
                <input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required
                  placeholder="e.g. John Silva"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Invoice # (optional)</label>
                <input value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})}
                  placeholder="INV-0001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Amount (Rs.) *</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-orange-400 font-bold focus:outline-none focus:border-slate-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Optional notes"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={busy}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {busy ? 'Saving...' : editId ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="px-5 py-2 bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Pay Form */}
        {payId && (
          <div className="p-4 border-b border-slate-800 bg-emerald-900/10">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Record Payment</h3>
            {error && <p className="text-rose-400 text-xs mb-2">{error}</p>}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-500 block mb-1">Payment Amount (Rs.)</label>
                <input type="number" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus
                  placeholder="Enter amount received"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-slate-500" />
              </div>
              <button onClick={handlePay} disabled={busy}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <Check size={14} /> Record
              </button>
              <button onClick={() => { setPayId(null); setPayAmount(''); setError(''); }}
                className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteId && (
          <div className="p-4 border-b border-slate-800 bg-rose-900/10">
            <p className="text-rose-400 text-sm font-semibold mb-2">Delete this receivable record? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="px-4 py-1.5 bg-rose-600 text-white text-sm rounded-xl hover:bg-rose-500">Delete</button>
              <button onClick={() => setDeleteId(null)} className="px-4 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left min-w-[750px]">
            <thead className="bg-slate-950/60 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right text-orange-500">Remaining</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr><td colSpan="8" className="py-12 text-center text-slate-600">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="8" className="py-12 text-center text-slate-600">No receivable records yet. Click "Add Receivable" to start.</td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="py-3 px-4 font-medium text-slate-200">{r.customer_name}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{r.invoice_number || '—'}</td>
                  <td className="py-3 px-4 text-right text-slate-300 font-semibold">{fmt(r.amount)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{fmt(r.paid_amount)}</td>
                  <td className="py-3 px-4 text-right text-orange-400 font-bold">{fmt(r.remaining_amount)}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{r.due_date ? new Date(r.due_date).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${STATUS_STYLE[r.status] || STATUS_STYLE.Pending}`}>{r.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status !== 'Paid' && (
                        <button onClick={() => { setPayId(r.id); setPayAmount(''); setShowForm(false); setError(''); }}
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 transition-colors" title="Record Payment">
                          <DollarSign size={13} />
                        </button>
                      )}
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
