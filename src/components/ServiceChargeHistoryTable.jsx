import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function ServiceChargeHistoryTable() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track which feedback cell is currently in "edit" mode
  // Format: { id: rowId, type: 'green' | 'red' }
  const [editingFeedback, setEditingFeedback] = useState(null);

  const debounceTimers = useRef({});
  const clickTimers = useRef({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/service-charges');
        setHistory(data);
      } catch (err) {
        setError('Failed to load service charge history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleAddRow = async () => {
    try {
      const newRow = await apiRequest('/service-charges', { method: 'POST' });
      setHistory(prev => [...prev, newRow]);
    } catch (err) {
      console.error('Failed to add row:', err);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this row?')) return;
    try {
      await apiRequest(`/service-charges/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(row => row.id !== id));
    } catch (err) {
      console.error('Failed to delete row:', err);
    }
  };

  const updateRowInState = (id, updates) => {
    setHistory(prev => prev.map(row => (row.id === id ? { ...row, ...updates } : row)));
  };

  const saveUpdates = async (id, payload) => {
    try {
      await apiRequest(`/service-charges/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to save updates:', err);
    }
  };

  const handleInputChange = (id, field, value) => {
    updateRowInState(id, { [field]: value });

    const timerId = `${id}-${field}`;
    if (debounceTimers.current[timerId]) {
      clearTimeout(debounceTimers.current[timerId]);
    }

    debounceTimers.current[timerId] = setTimeout(() => {
      saveUpdates(id, { [field]: value });
      delete debounceTimers.current[timerId];
    }, 400);
  };

  const handleInputBlur = (id, field, value) => {
    const timerId = `${id}-${field}`;
    if (debounceTimers.current[timerId]) {
      clearTimeout(debounceTimers.current[timerId]);
      delete debounceTimers.current[timerId];
    }
    saveUpdates(id, { [field]: value });
  };

  const handleFeedbackClick = (id, type, currentValue) => {
    if (editingFeedback && editingFeedback.id === id && editingFeedback.type === type) return;

    const timerId = `${id}-${type}`;
    if (clickTimers.current[timerId]) {
      clearTimeout(clickTimers.current[timerId]);
      delete clickTimers.current[timerId];
      setEditingFeedback({ id, type });
    } else {
      clickTimers.current[timerId] = setTimeout(() => {
        const field = type === 'green' ? 'green_count' : 'red_count';
        const newValue = (parseInt(currentValue, 10) || 0) + 1;
        updateRowInState(id, { [field]: newValue });
        saveUpdates(id, { [field]: newValue });
        delete clickTimers.current[timerId];
      }, 250);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (error) return <div className="text-rose-500 p-4">{error}</div>;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mt-6">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Service Charge History</h3>
          <p className="text-xs text-slate-500 mt-1">Track service pricing and customer feedback over time.</p>
        </div>
        {/* Desktop Add Row */}
        <button
          onClick={handleAddRow}
          className="hidden md:flex items-center gap-2 px-3 min-h-[40px] bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-semibold transition-all active:scale-95 touch-manipulation"
        >
          <Plus size={16} />
          Add Row
        </button>
      </div>

      {/* ── DESKTOP TABLE (md+) ───────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4 min-w-[200px]">Service Type</th>
              <th className="py-3 px-4 w-36">Price (Rs.)</th>
              <th className="py-3 px-4 text-center">Customer Feedback</th>
              <th className="py-3 px-4 w-16 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No service charge history yet. Click "Add Row" to start tracking.
                </td>
              </tr>
            ) : (
              history.map((row, idx) => {
                const totalFeedback = (parseInt(row.green_count, 10) || 0) + (parseInt(row.red_count, 10) || 0);
                return (
                  <tr key={row.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={row.service_type || ''}
                        onChange={(e) => handleInputChange(row.id, 'service_type', e.target.value)}
                        onBlur={(e) => handleInputBlur(row.id, 'service_type', e.target.value)}
                        placeholder="e.g. Oil Change, Filter Swap..."
                        inputMode="text"
                        className="w-full bg-slate-900/50 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-200 text-base outline-none transition-all"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.price !== null ? row.price : ''}
                        onChange={(e) => handleInputChange(row.id, 'price', e.target.value)}
                        onBlur={(e) => handleInputBlur(row.id, 'price', e.target.value)}
                        placeholder="0.00"
                        inputMode="decimal"
                        className="w-full bg-slate-900/50 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-200 text-base outline-none transition-all font-mono"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-800 rounded-lg" title="Total Feedback">
                          Total: {totalFeedback}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Green Button */}
                          <div
                            className="flex items-center gap-1.5 px-2 min-h-[40px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-emerald-400 transition-all cursor-pointer select-none"
                            onClick={() => handleFeedbackClick(row.id, 'green', row.green_count)}
                          >
                            <ThumbsUp size={14} />
                            {editingFeedback?.id === row.id && editingFeedback?.type === 'green' ? (
                              <input type="number" autoFocus inputMode="numeric"
                                className="w-12 bg-emerald-900/50 text-emerald-300 text-base outline-none text-center rounded px-1 -mx-1"
                                value={row.green_count !== null ? row.green_count : ''}
                                onChange={(e) => handleInputChange(row.id, 'green_count', e.target.value)}
                                onBlur={(e) => { handleInputBlur(row.id, 'green_count', e.target.value); setEditingFeedback(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span onClick={(e) => { e.stopPropagation(); setEditingFeedback({ id: row.id, type: 'green' }); }} className="font-bold min-w-[1.25rem] text-center">{row.green_count || 0}</span>
                            )}
                          </div>
                          {/* Red Button */}
                          <div
                            className="flex items-center gap-1.5 px-2 min-h-[40px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-rose-400 transition-all cursor-pointer select-none"
                            onClick={() => handleFeedbackClick(row.id, 'red', row.red_count)}
                          >
                            <ThumbsDown size={14} />
                            {editingFeedback?.id === row.id && editingFeedback?.type === 'red' ? (
                              <input type="number" autoFocus inputMode="numeric"
                                className="w-12 bg-rose-900/50 text-rose-300 text-base outline-none text-center rounded px-1 -mx-1"
                                value={row.red_count !== null ? row.red_count : ''}
                                onChange={(e) => handleInputChange(row.id, 'red_count', e.target.value)}
                                onBlur={(e) => { handleInputBlur(row.id, 'red_count', e.target.value); setEditingFeedback(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span onClick={(e) => { e.stopPropagation(); setEditingFeedback({ id: row.id, type: 'red' }); }} className="font-bold min-w-[1.25rem] text-center">{row.red_count || 0}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center mx-auto text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors active:scale-95 touch-manipulation"
                        title="Delete Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD LAYOUT (< md) ─────────────────────────────────────── */}
      <div className="md:hidden">
        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm px-4">
            No service charge history yet. Tap "Add Row" below to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {history.map((row, idx) => {
              const totalFeedback = (parseInt(row.green_count, 10) || 0) + (parseInt(row.red_count, 10) || 0);
              return (
                <div key={row.id} className="p-4 space-y-3">
                  {/* Card Header: index + delete */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">#{idx + 1}</span>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors active:scale-95 touch-manipulation"
                      title="Delete Row"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Service Type</label>
                    <input
                      type="text"
                      value={row.service_type || ''}
                      onChange={(e) => handleInputChange(row.id, 'service_type', e.target.value)}
                      onBlur={(e) => handleInputBlur(row.id, 'service_type', e.target.value)}
                      placeholder="e.g. Oil Change, Filter Swap..."
                      inputMode="text"
                      className="mt-1 w-full bg-slate-900/50 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-200 text-base outline-none transition-all min-h-[48px]"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Price (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.price !== null ? row.price : ''}
                      onChange={(e) => handleInputChange(row.id, 'price', e.target.value)}
                      onBlur={(e) => handleInputBlur(row.id, 'price', e.target.value)}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="mt-1 w-full bg-slate-900/50 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-200 text-base outline-none transition-all font-mono min-h-[48px]"
                    />
                  </div>

                  {/* Feedback */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Feedback</label>
                      <span className="text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-800 rounded-lg">Total: {totalFeedback}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Green feedback */}
                      <div
                        className="flex items-center justify-center gap-2 min-h-[48px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 transition-all cursor-pointer select-none active:scale-95 touch-manipulation"
                        onClick={() => handleFeedbackClick(row.id, 'green', row.green_count)}
                      >
                        <ThumbsUp size={16} />
                        {editingFeedback?.id === row.id && editingFeedback?.type === 'green' ? (
                          <input type="number" autoFocus inputMode="numeric"
                            className="w-14 bg-emerald-900/50 text-emerald-300 text-base outline-none text-center rounded px-1"
                            value={row.green_count !== null ? row.green_count : ''}
                            onChange={(e) => handleInputChange(row.id, 'green_count', e.target.value)}
                            onBlur={(e) => { handleInputBlur(row.id, 'green_count', e.target.value); setEditingFeedback(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-bold text-lg">{row.green_count || 0}</span>
                        )}
                      </div>
                      {/* Red feedback */}
                      <div
                        className="flex items-center justify-center gap-2 min-h-[48px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 transition-all cursor-pointer select-none active:scale-95 touch-manipulation"
                        onClick={() => handleFeedbackClick(row.id, 'red', row.red_count)}
                      >
                        <ThumbsDown size={16} />
                        {editingFeedback?.id === row.id && editingFeedback?.type === 'red' ? (
                          <input type="number" autoFocus inputMode="numeric"
                            className="w-14 bg-rose-900/50 text-rose-300 text-base outline-none text-center rounded px-1"
                            value={row.red_count !== null ? row.red_count : ''}
                            onChange={(e) => handleInputChange(row.id, 'red_count', e.target.value)}
                            onBlur={(e) => { handleInputBlur(row.id, 'red_count', e.target.value); setEditingFeedback(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-bold text-lg">{row.red_count || 0}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile full-width Add Row button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleAddRow}
            className="flex items-center justify-center gap-2 w-full min-h-[52px] bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-base font-semibold transition-all active:scale-95 touch-manipulation"
          >
            <Plus size={20} />
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
