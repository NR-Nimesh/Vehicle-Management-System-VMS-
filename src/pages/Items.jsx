import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Pencil, Trash2, X, Check, ChevronLeft, Folder, AlertTriangle } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import useFormFieldNavigation from '../hooks/useFormFieldNavigation';
import { apiRequest } from '../utils/api';

export default function Items() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  // View state
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

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
        const [catsData, itemsData] = await Promise.all([
          apiRequest('/categories'),
          apiRequest('/items')
        ]);
        setCategories(catsData);
        setItems(itemsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Could not connect to database. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleDeleteCategoryConfirmed = async () => {
    if (!confirmDelete) return;
    try {
      await apiRequest(`/categories/${confirmDelete.id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== confirmDelete.id));
      // Also remove items from local state
      setItems(prev => prev.filter(i => i.category !== confirmDelete.name));
      if (selectedCategory === confirmDelete.name) setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setConfirmDelete(null);
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

      {/* ── CATEGORY GRID VIEW ─────────────────────────────────────────────── */}
      {!selectedCategory && (
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
                {/* Card Body — clickable */}
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
                {/* Card Footer — Delete button */}
                <div className="border-t border-slate-800/60 px-4 py-2.5 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: cat.id, name: cat.name }); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CATEGORY ITEMS VIEW ────────────────────────────────────────────── */}
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

      {/* Delete Category Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 bg-rose-500/15 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Delete Category?</h3>
                <p className="text-slate-400 text-sm mt-1.5">
                  You are about to delete <span className="text-rose-300 font-semibold">"{confirmDelete.name}"</span>.
                  This will permanently delete the category and <span className="font-semibold text-rose-300">all {getCategoryItemCount(confirmDelete.name)} items</span> inside it.
                  This action cannot be undone.
                </p>
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
                onClick={handleDeleteCategoryConfirmed}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Delete
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
