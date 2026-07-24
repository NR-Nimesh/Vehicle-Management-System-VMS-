import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function ServiceChargeHistoryTable({ itemId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track which feedback cell is currently in "edit" mode
  // Format: { id: rowId, type: 'green' | 'red' }
  const [editingFeedback, setEditingFeedback] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/items/${itemId}/service-charges`);
        setHistory(data);
      } catch (err) {
        setError('Failed to load service charge history');
      } finally {
        setLoading(false);
      }
    };
    if (itemId) fetchHistory();
  }, [itemId]);

  const handleAddRow = async () => {
    try {
      const newRow = await apiRequest(`/items/${itemId}/service-charges`, { method: 'POST' });
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
      // In a robust app, we might revert the optimistic update here.
    }
  };

  const handleInputChange = (id, field, value) => {
    updateRowInState(id, { [field]: value });
  };

  const handleInputBlur = (id, field, value) => {
    saveUpdates(id, { [field]: value });
  };

  const incrementCount = (id, type, currentValue) => {
    // If we're editing the number manually, don't increment on click
    if (editingFeedback && editingFeedback.id === id && editingFeedback.type === type) return;
    
    const field = type === 'green' ? 'green_count' : 'red_count';
    const newValue = (parseInt(currentValue, 10) || 0) + 1;
    updateRowInState(id, { [field]: newValue });
    saveUpdates(id, { [field]: newValue });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (error) return <div className="text-rose-500 p-4">{error}</div>;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mt-6">
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Service Charge History</h3>
          <p className="text-xs text-slate-500 mt-1">Track service pricing and customer feedback over time.</p>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-semibold transition-all"
        >
          <Plus size={16} />
          Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4 min-w-[200px]">Service Type</th>
              <th className="py-3 px-4 w-32">Price ($)</th>
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
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={row.service_type || ''}
                        onChange={(e) => handleInputChange(row.id, 'service_type', e.target.value)}
                        onBlur={(e) => handleInputBlur(row.id, 'service_type', e.target.value)}
                        placeholder="e.g. Oil Change, Filter Swap..."
                        className="w-full bg-slate-900/50 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-200 outline-none transition-all"
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
                        className="w-full bg-slate-900/50 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-slate-200 outline-none transition-all font-mono"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-center gap-4">
                        {/* Read-Only Total */}
                        <div className="text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-800 rounded-lg" title="Total Feedback">
                          Total: {totalFeedback}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Green Button */}
                          <div 
                            className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-emerald-400 transition-all cursor-pointer select-none"
                            onClick={() => incrementCount(row.id, 'green', row.green_count)}
                            onDoubleClick={() => setEditingFeedback({ id: row.id, type: 'green' })}
                            title="Positive Feedback (Double-click to manually edit)"
                          >
                            <ThumbsUp size={14} />
                            {editingFeedback?.id === row.id && editingFeedback?.type === 'green' ? (
                              <input
                                type="number"
                                autoFocus
                                className="w-12 bg-emerald-900/50 text-emerald-300 outline-none text-center rounded px-1 -mx-1"
                                value={row.green_count || 0}
                                onChange={(e) => handleInputChange(row.id, 'green_count', e.target.value)}
                                onBlur={(e) => {
                                  handleInputBlur(row.id, 'green_count', e.target.value);
                                  setEditingFeedback(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                              />
                            ) : (
                              <span className="font-bold min-w-[1.25rem] text-center">{row.green_count || 0}</span>
                            )}
                          </div>

                          {/* Red Button */}
                          <div 
                            className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-rose-400 transition-all cursor-pointer select-none"
                            onClick={() => incrementCount(row.id, 'red', row.red_count)}
                            onDoubleClick={() => setEditingFeedback({ id: row.id, type: 'red' })}
                            title="Negative Feedback (Double-click to manually edit)"
                          >
                            <ThumbsDown size={14} />
                            {editingFeedback?.id === row.id && editingFeedback?.type === 'red' ? (
                              <input
                                type="number"
                                autoFocus
                                className="w-12 bg-rose-900/50 text-rose-300 outline-none text-center rounded px-1 -mx-1"
                                value={row.red_count || 0}
                                onChange={(e) => handleInputChange(row.id, 'red_count', e.target.value)}
                                onBlur={(e) => {
                                  handleInputBlur(row.id, 'red_count', e.target.value);
                                  setEditingFeedback(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                              />
                            ) : (
                              <span className="font-bold min-w-[1.25rem] text-center">{row.red_count || 0}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
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
    </div>
  );
}
