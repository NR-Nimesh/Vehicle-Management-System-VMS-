import { useState, useEffect, useRef } from 'react';
import {
  Package, Plus, Pencil, Trash2, X, Check, ChevronLeft,
  Folder, AlertTriangle, Clock, ShieldAlert, CheckCircle2, XCircle,
  Inbox, ClipboardList, ChevronDown, Search
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import useFormFieldNavigation from '../hooks/useFormFieldNavigation';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ServiceChargeHistoryTable from '../components/ServiceChargeHistoryTable';

export default function Items() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  // 2-level view state
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Service Charge section state — item selector below Deletion Requests
  const [serviceChargeItem, setServiceChargeItem] = useState(null);
  const [itemSelectorSearch, setItemSelectorSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete request modal — soft delete (user)
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Admin permanent-delete confirmation modal
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [confirmDirectDelete, setConfirmDirectDelete] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', price: '', stock: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemFormRef = useRef(null);
  useFormFieldNavigation(itemFormRef, showItemForm);

  // ─── Load Data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const promises = [apiRequest('/categories'), apiRequest('/items')];
        if (isAdmin) promises.push(apiRequest('/categories/pending-deletion'));
        const [catsData, itemsData, pendingData] = await Promise.all(promises);
        setCategories(catsData);
        setItems(itemsData);
        if (isAdmin && pendingData) setPendingCategories(pendingData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Could not connect to database. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  // ─── Category Actions ───────────────────────────────────────────────────────
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name cannot be empty.');
      return;
    }
    setSavingCategory(true);
    setCategoryError('');
    try {
      const newCat = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      setCategories(prev => [...prev, newCat]);
      setShowCategoryModal(false);
      setNewCategoryName('');
    } catch (err) {
      const msg = err?.message || 'Failed to save category. Try again.';
      setCategoryError(msg.includes('already exists') ? 'A category with this name already exists.' : msg);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryModalKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveCategory();
    if (e.key === 'Escape') { setShowCategoryModal(false); setNewCategoryName(''); setCategoryError(''); }
  };

  const handleRequestDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await apiRequest(`/categories/${confirmDelete.id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== confirmDelete.id));
      if (selectedCategory === confirmDelete.name) setSelectedCategory(null);
    } catch (err) {
      setError(`Failed to request category deletion: ${err.message}`);
    } finally {
      setConfirmDelete(null);
      setDeletingId(null);
    }
  };

  const handleApproveDelete = async () => {
    if (!confirmApprove) return;
    setProcessingId(confirmApprove.id);
    try {
      await apiRequest(`/categories/${confirmApprove.id}/approve`, { method: 'PATCH' });
      setPendingCategories(prev => prev.filter(c => c.id !== confirmApprove.id));
      setItems(prev => prev.map(i => i.category === confirmApprove.name ? { ...i, category: null } : i));
    } catch (err) {
      console.error('Failed to approve deletion:', err);
    } finally {
      setConfirmApprove(null);
      setProcessingId(null);
    }
  };

  const handleDirectDelete = async () => {
    if (!confirmDirectDelete) return;
    setDeletingId(confirmDirectDelete.id);
    try {
      await apiRequest(`/categories/${confirmDirectDelete.id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== confirmDirectDelete.id));
      setItems(prev => prev.map(i => i.category === confirmDirectDelete.name ? { ...i, category: null } : i));
      if (selectedCategory === confirmDirectDelete.name) setSelectedCategory(null);
    } catch (err) {
      setError(`Failed to delete category: ${err.message}`);
    } finally {
      setConfirmDirectDelete(null);
      setDeletingId(null);
    }
  };

  const handleRejectDelete = async (cat) => {
    setProcessingId(cat.id);
    try {
      const restored = await apiRequest(`/categories/${cat.id}/reject`, { method: 'PATCH' });
      setPendingCategories(prev => prev.filter(c => c.id !== cat.id));
      setCategories(prev => [...prev, restored]);
    } catch (err) {
      console.error('Failed to reject deletion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Item Actions ───────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ code: item.code, name: item.name, price: item.price, stock: item.stock });
    setShowItemForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiRequest(`/items/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(item => item.id !== id));
      if (serviceChargeItem?.id === id) setServiceChargeItem(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code,
      name: form.name,
      category: selectedCategory,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock, 10) || 0
    };
    try {
      if (editingItem) {
        const updated = await apiRequest(`/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setItems(prev => prev.map(item => item.id === editingItem.id ? updated : item));
        if (serviceChargeItem?.id === editingItem.id) setServiceChargeItem(updated);
      } else {
        const newItem = await apiRequest('/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setItems(prev => [newItem, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
    setShowItemForm(false);
    setEditingItem(null);
    setForm({ code: '', name: '', price: '', stock: '' });
  };

  const handleAddItemClick = () => {
    setEditingItem(null);
    setForm({
      code: `PART-${String(items.length + 1).padStart(4, '0')}`,
      name: '',
      price: '',
      stock: ''
    });
    setShowItemForm(true);
  };

  // ─── Derived State ──────────────────────────────────────────────────────────
  const getCategoryItemCount = (catName) => items.filter(i => i.category === catName).length;
  const currentCategoryItems = items.filter(item => item.category === selectedCategory);
  const filteredItems = currentCategoryItems.filter(item =>
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(search.toLowerCase())
  );

  // Items filtered for the service charge item selector dropdown
  const filteredSelectorItems = items.filter(item =>
    (item.name || '').toLowerCase().includes(itemSelectorSearch.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(itemSelectorSearch.toLowerCase())
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-6 px-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            {selectedCategory ? `Items in ${selectedCategory}` : 'Inventory Categories'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {selectedCategory
              ? `Manage inventory, listings, and stock for ${selectedCategory}.`
              : 'Select a category to view and manage its items.'}
          </p>
        </div>

        {selectedCategory ? (
          <div className="flex gap-3">
            <button
              onClick={() => { setSelectedCategory(null); setSearch(''); }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-700"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={handleAddItemClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowCategoryModal(true); setCategoryError(''); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} />
            Category
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <span className="font-semibold">⚠ Error:</span> {error}
        </div>
      )}

      {/* ── VIEW 1: CATEGORY GRID ────────────────────────────────────────────── */}
      {!selectedCategory && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fadeIn">
            {loading ? (
              <div className="col-span-full py-12 flex flex-col items-center gap-3 text-slate-500">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                <Folder className="mx-auto mb-3 opacity-50" size={32} />
                <p>No categories found. Click &quot;+ Category&quot; to create one.</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="glass-panel border-slate-700/50 hover:border-indigo-500/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col overflow-hidden group"
                >
                  <div
                    onClick={() => setSelectedCategory(cat.name)}
                    className="flex flex-col items-center justify-center text-center gap-4 p-6 flex-1 cursor-pointer"
                  >
                    <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-indigo-500/20 transition-colors text-slate-400 group-hover:text-indigo-400">
                      <Folder size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200 text-lg group-hover:text-indigo-300 transition-colors">{cat.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{getCategoryItemCount(cat.name)} items</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800/60 px-4 py-2.5 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdmin) {
                          setConfirmDirectDelete({ id: cat.id, name: cat.name });
                        } else {
                          setConfirmDelete({ id: cat.id, name: cat.name });
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                      title={isAdmin ? 'Permanently Delete Category' : 'Request Category Deletion'}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── ADMIN: Deletion Requests ──────────────────────────────────────── */}
          {isAdmin && (
            <div className="mt-10 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <ShieldAlert size={18} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-200">Deletion Requests</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Review and approve or reject category deletion requests from users.</p>
                </div>
                {pendingCategories.length > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    {pendingCategories.length}
                  </span>
                )}
              </div>

              <div className="glass-panel border-amber-500/10 overflow-hidden">
                {loading ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pendingCategories.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-slate-500">
                    <Inbox size={32} className="opacity-40" />
                    <p className="text-sm">No pending deletion requests.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {pendingCategories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">
                        <div className="p-2 bg-amber-500/10 rounded-xl shrink-0">
                          <Clock size={18} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{cat.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {getCategoryItemCount(cat.name)} items will be deleted if approved
                          </p>
                        </div>
                        <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                          <Clock size={11} />
                          Pending
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRejectDelete(cat)}
                            disabled={processingId === cat.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                          <button
                            onClick={() => setConfirmApprove({ id: cat.id, name: cat.name })}
                            disabled={processingId === cat.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white border border-rose-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={13} />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SERVICE CHARGE HISTORY (below Deletion Requests) ─────────────── */}
          <div className="mt-10 animate-fadeIn">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <ClipboardList size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-200">Service Charge History</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Select an inventory item to view and manage its service charge records.
                </p>
              </div>
            </div>

            {/* Item Selector */}
            <div className="glass-panel p-5 border-indigo-500/10">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Select Item
              </label>
              <div className="relative">
                {/* Trigger button */}
                <button
                  onClick={() => setShowItemDropdown(prev => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-sm transition-all focus:outline-none focus:border-indigo-500"
                >
                  {serviceChargeItem ? (
                    <span className="flex items-center gap-3 text-slate-200">
                      <span className="font-mono text-indigo-400 text-xs px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                        {serviceChargeItem.code}
                      </span>
                      <span className="font-medium">{serviceChargeItem.name}</span>
                      <span className="text-slate-500 text-xs">({serviceChargeItem.category})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">— Choose an item to view service history —</span>
                  )}
                  <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${showItemDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showItemDropdown && (
                  <div className="absolute z-30 top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Search input inside dropdown */}
                    <div className="p-3 border-b border-slate-800">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          autoFocus
                          type="text"
                          value={itemSelectorSearch}
                          onChange={(e) => setItemSelectorSearch(e.target.value)}
                          placeholder="Search items..."
                          className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Item list */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSelectorItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-sm">No items found.</div>
                      ) : (
                        filteredSelectorItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setServiceChargeItem(item);
                              setShowItemDropdown(false);
                              setItemSelectorSearch('');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-800/60 transition-colors ${serviceChargeItem?.id === item.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                          >
                            <span className="font-mono text-indigo-400 text-xs px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded shrink-0">
                              {item.code}
                            </span>
                            <span className="font-medium text-slate-200 flex-1 truncate">{item.name}</span>
                            <span className="text-slate-500 text-xs shrink-0">{item.category}</span>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Clear selection */}
                    {serviceChargeItem && (
                      <div className="p-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setServiceChargeItem(null);
                            setShowItemDropdown(false);
                          }}
                          className="w-full text-xs text-slate-500 hover:text-rose-400 py-1.5 transition-colors"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close dropdown overlay when clicking outside */}
              {showItemDropdown && (
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => { setShowItemDropdown(false); setItemSelectorSearch(''); }}
                />
              )}
            </div>

            {/* Service Charge History Table — only when item selected */}
            {serviceChargeItem ? (
              <ServiceChargeHistoryTable itemId={serviceChargeItem.id} />
            ) : (
              <div className="mt-4 py-12 flex flex-col items-center gap-3 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <ClipboardList size={36} className="opacity-30" />
                <p className="text-sm">Select an item above to view its service charge history.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── VIEW 2: ITEMS LIST ───────────────────────────────────────────────── */}
      {selectedCategory && (
        <div className="glass-panel p-6 flex flex-col gap-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search items by code or name..."
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Stock Quantity</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/15 transition-colors">
                      <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{item.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{item.name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">${Number(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${item.stock < 10 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                            title="Edit Item"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      <Package className="mx-auto mb-3 opacity-50" size={32} />
                      <p>No items found in this category.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredItems.length} of {currentCategoryItems.length} items
          </div>
        </div>
      )}

      {/* ═══════════ MODALS ═══════════ */}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-5">New Category</h3>
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError(''); }}
              onKeyDown={handleCategoryModalKeyDown}
              placeholder="Category Name"
              className="glass-input w-full mb-2"
            />
            {categoryError && (
              <p className="text-rose-400 text-xs mb-4">{categoryError}</p>
            )}
            {!categoryError && <div className="mb-4" />}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCategoryModal(false); setNewCategoryName(''); setCategoryError(''); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={savingCategory || !newCategoryName.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                {savingCategory ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User: Request Deletion Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-400 shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Request Category Deletion?</h3>
                <p className="text-slate-400 text-sm mt-1.5">
                  You are requesting to delete{' '}
                  <span className="text-amber-300 font-semibold">&quot;{confirmDelete.name}&quot;</span>{' '}
                  and its{' '}
                  <span className="font-semibold text-amber-300">{getCategoryItemCount(confirmDelete.name)} items</span>.
                </p>
                <p className="text-slate-500 text-xs mt-2">This request will be sent to an admin for review.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDelete}
                disabled={deletingId === confirmDelete.id}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Clock size={14} />
                {deletingId ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Permanent Delete Confirmation Modal */}
      {(confirmApprove || confirmDirectDelete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 bg-rose-500/15 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Permanently Delete Category?</h3>
                <p className="text-slate-400 text-sm mt-1.5">
                  Are you sure you want to permanently delete{' '}
                  <span className="text-rose-300 font-semibold">
                    &quot;{confirmApprove ? confirmApprove.name : confirmDirectDelete?.name}&quot;
                  </span>{' '}
                  and all its items?
                </p>
                <p className="text-rose-400/80 text-xs font-semibold mt-2">⚠ This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setConfirmApprove(null); setConfirmDirectDelete(null); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-lg hover:bg-slate-800/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove ? handleApproveDelete : handleDirectDelete}
                disabled={(confirmApprove && processingId === confirmApprove.id) || (confirmDirectDelete && deletingId === confirmDirectDelete.id)}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {(processingId || deletingId) ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form ref={itemFormRef} onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Item Code (Auto-generated)</label>
                <input
                  type="text"
                  name="code"
                  readOnly
                  value={form.code}
                  className="glass-input text-sm w-full opacity-60 cursor-not-allowed bg-slate-800/60"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Synthetic Engine Oil"
                  className="glass-input text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    required
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="29.99"
                    className="glass-input text-sm w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    required
                    value={form.stock}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="glass-input text-sm w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowItemForm(false); setEditingItem(null); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
                >
                  <Check size={14} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
