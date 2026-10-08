import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SystemSidebar from './SystemSidebar';
import { ShieldCheck, Menu, X, ChevronRight } from 'lucide-react';
import './SystemLayout.css';

export default function SystemLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('/schools/')) return 'School Details & Subscription';
    if (location.pathname.includes('/schools')) return 'Provisioned Schools';
    if (location.pathname.includes('/settings')) return 'Platform Settings';
    return 'Overview';
  };

  return (
    <div className="system-layout min-h-[100dvh]">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="system-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <SystemSidebar isMobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />

      <div className="system-main min-h-[100dvh]">
        {/* Sticky Header Bar */}
        <header className="system-header pt-[env(safe-area-inset-top)]">
          <div className="header-left">
            <button
              className="mobile-toggle-btn min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <main className="system-content pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
