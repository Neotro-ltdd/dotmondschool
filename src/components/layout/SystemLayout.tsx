import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SystemSidebar from './SystemSidebar';
import { ShieldCheck, Plus, Menu, X, Bell, ChevronRight, User } from 'lucide-react';
import './SystemLayout.css';

export default function SystemLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('/schools/')) return 'School Details & Subscription';
    if (location.pathname.includes('/schools')) return 'Provisioned Schools';
    if (location.pathname.includes('/settings')) return 'Platform Settings';
    return 'Overview';
  };

  return (
    <div className="system-layout">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="system-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <SystemSidebar isMobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />

      <div className="system-main">
        {/* Sticky Header Bar */}
        <header className="system-header">
          <div className="header-left">
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="header-breadcrumb">
              <span className="bc-root">Platform Admin</span>
              <ChevronRight size={14} className="bc-separator" />
              <span className="bc-current">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="header-right">
            <button
              onClick={() => navigate('/system-admin/schools')}
              className="header-provision-btn"
            >
              <Plus size={16} />
              <span className="btn-text">Provision School</span>
            </button>

            <div className="user-profile-badge">
              <div className="avatar-circle">
                <ShieldCheck size={18} />
              </div>
              <div className="user-meta">
                <span className="user-name">Super Admin</span>
                <span className="user-role">Platform Root</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="system-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
