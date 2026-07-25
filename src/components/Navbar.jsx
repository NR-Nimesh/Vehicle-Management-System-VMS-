import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, History, Package, Briefcase, Menu, X, Car, Users, LogOut } from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { businessProfile } = useBilling();
  const { user, logout } = useAuth();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!user) return null;

  const allNavItems = [
    { name: 'Home', path: '/', icon: Home, roles: ['admin'] },
    { name: 'Billing', path: '/billing', icon: FileText, roles: ['admin', 'user'] },
    { name: 'Bill History', path: '/history', icon: History, roles: ['admin'] },
    { name: 'Items', path: '/items', icon: Package, roles: ['admin', 'user'] },
    { name: 'Business Profile', path: '/business-profile', icon: Briefcase, roles: ['admin'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="glass-panel sticky top-4 z-50 mb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-slate-700/30 rounded-2xl no-print">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-extrabold text-xl tracking-tight transition-colors"
            >
              <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 shrink-0">
                <Car size={24} className="text-indigo-400" />
              </div>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate max-w-[140px] sm:max-w-[220px]">
                {businessProfile?.name || 'AutoDrive VMS'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 scale-105 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Mobile hamburger button — 48×48px tap target */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 focus:outline-none transition-colors border border-slate-700/20 active:scale-95 touch-manipulation"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER OVERLAY ──────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-72 max-w-[85vw] bg-slate-900 border-l border-slate-700/50 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/10 p-1.5 rounded-xl border border-indigo-500/20">
              <Car size={20} className="text-indigo-400" />
            </div>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold text-base truncate max-w-[150px]">
              {businessProfile?.name || 'AutoDrive VMS'}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer User Info */}
        <div className="px-5 py-3 border-b border-slate-800/60">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Signed in as</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{user?.username}</p>
          <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            user?.role === 'admin'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {user?.role}
          </span>
        </div>

        {/* Drawer Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 min-h-[52px] rounded-xl text-base font-medium transition-all active:scale-[0.97] touch-manipulation ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 active:bg-slate-700/60'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer — Logout */}
        <div className="px-3 pb-3 border-t border-slate-800/60 pt-3">
          <button
            onClick={() => { setIsOpen(false); logout(); }}
            className="flex items-center gap-3 px-4 min-h-[52px] w-full rounded-xl text-base font-medium transition-all text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 active:scale-[0.97] touch-manipulation text-left"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
