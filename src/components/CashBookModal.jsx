import React, { useState, useEffect } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function CashBookModal({ isOpen, onClose, bills }) {
  const [expenses, setExpenses] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Expense Form State
  const [date, setDate] = useState(() => {
    const now = new Date();
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [category, setCategory] = useState('Misc');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Inventory', 'Misc'];

  const fetchExpenses = async () => {
    try {
      const data = await apiRequest('/expenses');
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen, bills]); // Re-run when modal opens or bills change

  const fetchEntries = async () => {
    await fetchExpenses();
  };

  useEffect(() => {
    // Combine bills (Cash In) and expenses (Cash Out)
    const combined = [];
    
    // Bills (Cash In)
    bills.forEach(b => {
      // Use total as the cash in value for completed bills
      const amount = parseFloat(b.total) || 0;
      if (amount > 0) {
        combined.push({
          id: `bill-${b.id}`,
          date: new Date(b.created_at || b.date),
          category: 'Sales Invoice',
          description: `Invoice #${b.invoiceNumber} - ${b.customerName || 'Customer'}`,
          cashIn: amount,
          cashOut: 0
        });
      }
    });

    // Expenses (Cash Out)
    expenses.forEach(e => {
      combined.push({
        id: `exp-${e.id}`,
        date: new Date(e.date),
        category: e.category,
        description: e.description,
        cashIn: 0,
        cashOut: parseFloat(e.amount) || 0
      });
    });

    // Sort by date ascending (oldest first) to calculate running balance
    combined.sort((a, b) => a.date - b.date);

    let runningBalance = 0;
    const ledgerData = combined.map(entry => {
      runningBalance += entry.cashIn;
      runningBalance -= entry.cashOut;
      return { ...entry, balance: runningBalance };
    });

    // Reverse to show newest first
    ledgerData.reverse();
    setLedger(ledgerData);
  }, [bills, expenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('/expenses', 'POST', {
        date,
        category,
        description,
        amount: parseFloat(amount)
      });
      await fetchExpenses();
      
      // Reset form and hide
      setShowAddExpense(false);
      setDescription('');
      setAmount('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDate(now.toISOString().slice(0, 16));
      
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentBalance = ledger.length > 0 ? ledger[0].balance : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-5xl overflow-hidden shadow-2xl border-slate-700 bg-slate-900 rounded-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h2 className="text-xl font-bold text-slate-200">Cash Book Ledger</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time sync with billing & expenses.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Net Balance</span>
              <span className={`text-xl font-extrabold ${currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rs. {currentBalance.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} /> Add Expense / Cash Out
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {showAddExpense && (
            <div className="p-6 bg-slate-900/50 border-b border-slate-800 animate-slideDown">
              <h3 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={16} /> Record Cash Out / Expense
              </h3>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="glass-input text-sm w-full py-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input text-sm w-full py-2"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Amount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="glass-input text-sm w-full py-2 text-rose-400 font-semibold"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description / Notes</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Office supplies"
                      className="glass-input text-sm w-full py-2"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Ledger Table */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase sticky top-0 z-10 shadow-sm border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold text-right text-emerald-400/80">Cash In (Rs.)</th>
                    <th className="py-3 px-4 font-semibold text-right text-rose-400/80">Cash Out (Rs.)</th>
                    <th className="py-3 px-4 font-semibold text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {ledger.length > 0 ? (
                    ledger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                          {entry.date.toLocaleString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            entry.category === 'Sales Invoice' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-slate-700/30 text-slate-300 border border-slate-600'
                          }`}>
                            {entry.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={entry.description}>
                          {entry.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-400">
                          {entry.cashIn > 0 ? `+${entry.cashIn.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-400">
                          {entry.cashOut > 0 ? `-${entry.cashOut.toFixed(2)}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${entry.balance >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                          {entry.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
