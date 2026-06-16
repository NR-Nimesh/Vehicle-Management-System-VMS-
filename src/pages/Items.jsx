import React, { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, Search, X, Check, ArrowUpDown } from 'lucide-react';

const SEED_ITEMS = [
  { id: '1', code: 'PART-1024', name: 'Synthetic Engine Oil 5W-30', category: 'Lubricants', price: 49.99, stock: 45 },
  { id: '2', code: 'PART-2089', name: 'Premium Semi-Metallic Brake Pads', category: 'Brakes', price: 79.50, stock: 18 },
  { id: '3', code: 'PART-0412', name: 'High-Flow Spin-On Oil Filter', category: 'Filters', price: 14.95, stock: 60 },
  { id: '4', code: 'PART-5591', name: 'All-Season Windshield Wiper Blades', category: 'Accessories', price: 22.99, stock: 32 },
  { id: '5', code: 'PART-8012', name: 'Heavy-Duty 12V Car Battery', category: 'Electrical', price: 129.99, stock: 8 }
];

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form fields
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Lubricants',
    price: '',
    stock: ''
  });

  // Load items
  useEffect(() => {
    const stored = localStorage.getItem('vms_items');
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      setItems(SEED_ITEMS);
      localStorage.setItem('vms_items', JSON.stringify(SEED_ITEMS));
    }
  }, []);

  // Sync to local storage
  const syncItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('vms_items', JSON.stringify(newItems));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      const updated = items.filter(item => item.id !== id);
      syncItems(updated);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const itemPrice = parseFloat(form.price) || 0;
    const itemStock = parseInt(form.stock, 10) || 0;

    if (editingItem) {
      // Update existing
      const updated = items.map(item => 
        item.id === editingItem.id 
          ? { ...item, code: form.code, name: form.name, category: form.category, price: itemPrice, stock: itemStock }
          : item
      );
      syncItems(updated);
    } else {
      // Create new
      const newItem = {
        id: Date.now().toString(),
        code: form.code || `PART-${Math.floor(1000 + Math.random() * 9000)}`,
        name: form.name,
        category: form.category,
        price: itemPrice,
        stock: itemStock
      };
      syncItems([newItem, ...items]);
    }

    // Reset
    setShowForm(false);
    setEditingItem(null);
    setForm({ code: '', name: '', category: 'Lubricants', price: '', stock: '' });
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setForm({
      code: `PART-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Lubricants',
      price: '',
      stock: ''
    });
    setShowForm(true);
  };

  // Filter items
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage auto-parts inventory, item listings, and pricing schemas.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 hover:scale-102"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Grid Layout containing Form and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column - Add/Edit Form Panel */}
        {showForm ? (
          <div className="lg:col-span-1 glass-panel p-6 border-indigo-500/20 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-200">
                {editingItem ? 'Edit Part details' : 'Add New Part'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Item Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={form.code}
                  onChange={handleInputChange}
                  placeholder="e.g. PART-1234"
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Synthetic Engine Oil"
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="glass-input text-sm bg-slate-900"
                >
                  <option value="Lubricants">Lubricants</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Filters">Filters</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="29.99"
                    className="glass-input text-sm"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Stock Qty *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={form.stock}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/10 transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-1 bg-slate-800/25 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center py-12">
            <div className="bg-slate-900/50 p-4 rounded-full border border-slate-700/30 mb-4 text-slate-500">
              <Package size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-300">Operations Console</h3>
            <p className="text-xs text-slate-500 max-w-[240px] mt-2 leading-relaxed">
              Click the 'Add Item' button or edit an existing item to toggle the management console.
            </p>
          </div>
        )}

        {/* Right column - Data Table List Panel */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-6">
          
          {/* Table Search Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by code, item name, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input w-full pl-9 pr-4 text-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/15 transition-colors">
                      <td className="py-3 px-4 font-mono text-indigo-400 text-xs">{item.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">${item.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${item.stock < 10 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20"
                            title="Edit Item"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
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
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No matching items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
            <span>Showing {filteredItems.length} of {items.length} items</span>
            <span>Local Database persistent</span>
          </div>

        </div>

      </div>
    </div>
  );
}
