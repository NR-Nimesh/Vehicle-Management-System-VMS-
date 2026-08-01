import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, History, Package, Briefcase, Menu, X, Car, Users, BookOpen } from 'lucide-react';
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
    { name: 'Cash Book', path: '/cash-book', icon: BookOpen, roles: ['admin'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const brandName = businessProfile?.name || 'AutoDrive VMS';

  return (
    <>
      {/* ── MAIN NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="navbar-root no-print">
        {/* Two-section flex row: LEFT brand | RIGHT nav links or hamburger */}
        <div className="navbar-inner">

          {/* ── LEFT: Logo + Brand Name ─────────────────────────────────────── */}
          <div className="navbar-brand">
            <Link to="/" className="navbar-brand-link">
              <div className="navbar-logo-box">
                <Car size={22} />
              </div>
              <span className="navbar-brand-text" title={brandName}>
                {brandName}
              </span>
            </Link>
          </div>

          {/* ── RIGHT (Desktop ≥1024px): Inline nav links ───────────────────── */}
          <div className="navbar-desktop-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`navbar-link ${active ? 'navbar-link--active' : 'navbar-link--inactive'}`}
                >
                  <Icon size={15} className="navbar-link-icon" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT (Mobile/Tablet <1024px): Hamburger button ─────────────── */}
          <div className="navbar-hamburger">
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              className="navbar-hamburger-btn"
            >
              <Menu size={22} />
            </button>
          </div>

        </div>
      </nav>

      {/* ── DRAWER BACKDROP ─────────────────────────────────────────────────── */}
      <div
        className={`drawer-backdrop ${isOpen ? 'drawer-backdrop--open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── DRAWER PANEL ────────────────────────────────────────────────────── */}
      <div
        className={`drawer-panel ${isOpen ? 'drawer-panel--open' : ''}`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-2 min-w-0">
            <div className="navbar-logo-box">
              <Car size={18} />
            </div>
            <span className="drawer-brand-text" title={brandName}>{brandName}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            className="drawer-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer User Info */}
        <div className="drawer-user-info">
          <p className="drawer-user-label">Signed in as</p>
          <p className="drawer-user-name">{user?.username}</p>
          <span className={`drawer-role-badge ${user?.role === 'admin' ? 'drawer-role-badge--admin' : 'drawer-role-badge--user'}`}>
            {user?.role}
          </span>
        </div>

        {/* Drawer Nav Links */}
        <div className="drawer-nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`drawer-nav-link ${active ? 'drawer-nav-link--active' : 'drawer-nav-link--inactive'}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </div>


      </div>
    </>
  );
}
