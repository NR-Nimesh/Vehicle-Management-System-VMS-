import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, History, Package, Briefcase, Menu, X, Car } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Billing', path: '/billing', icon: FileText },
    { name: 'Bill History', path: '/history', icon: History },
    { name: 'Items', path: '/items', icon: Package },
    { name: 'Business Profile', path: '/business-profile', icon: Briefcase },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="glass-panel sticky top-4 z-50 mb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-slate-700/30 rounded-2xl no-print">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-extrabold text-xl tracking-tight transition-colors">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
              <Car size={24} className="text-indigo-400" />
            </div>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AutoDrive VMS
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-2">
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
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 hover:scale-102 border border-transparent'
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 focus:outline-none transition-colors border border-slate-700/20"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden pb-4 pt-2 border-t border-slate-800/65 animate-fadeIn">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
