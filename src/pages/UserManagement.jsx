import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Users, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(''); // don't show existing password
    setRole(user.role);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const body = { username, role };
        if (password) body.password = password; // Only send if changed
        
        await apiRequest(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      } else {
        if (!password) {
          throw new Error('Password is required for new users');
        }
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify({ username, password, role })
        });
      }
      
      setShowModal(false);
      fetchUsers(); // Refresh list
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiRequest(`/users/${id}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users size={24} className="text-indigo-400" />
            User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage admin and user access to the system.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
          {error}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-700/60">
                <th className="py-4 px-6 text-slate-300 font-semibold">ID</th>
                <th className="py-4 px-6 text-slate-300 font-semibold">Username</th>
                <th className="py-4 px-6 text-slate-300 font-semibold">Role</th>
                <th className="py-4 px-6 text-slate-300 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-slate-400">#{user.id}</td>
                  <td className="py-4 px-6 font-medium text-slate-200">{user.username}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-100">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Password {editingUser && <span className="text-slate-500 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="glass-input w-full"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
