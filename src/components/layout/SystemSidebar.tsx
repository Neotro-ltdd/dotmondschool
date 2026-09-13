import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Sliders,
  LogOut,
  ShieldCheck,
  Zap,
  Activity,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SystemLayout.css';

interface SystemSidebarProps {
  isMobileOpen?: boolean;
  closeMobile?: () => void;
}

export default function SystemSidebar({ isMobileOpen, closeMobile }: SystemSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/master-login');
  };

  return (
    <aside className={`system-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo-icon">
          <ShieldCheck size={24} />
        </div>
        <div className="brand-text">
          <h2>Neotro Platform</h2>
          <span className="brand-badge">Control Center</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">PLATFORM MANAGEMENT</div>
        
        <NavLink
          to="/system-admin"
          end
          onClick={closeMobile}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard className="nav-icon" size={19} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/system-admin/schools"
          onClick={closeMobile}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Building2 className="nav-icon" size={19} />
          <span>Provisioned Schools</span>
        </NavLink>

        <NavLink
          to="/system-admin/settings"
          onClick={closeMobile}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Sliders className="nav-icon" size={19} />
          <span>Platform Settings</span>
        </NavLink>

        <div className="nav-section-title" style={{ marginTop: '1.5rem' }}>
          QUICK ACTIONS
        </div>
        <button
          onClick={() => {
            if (closeMobile) closeMobile();
            navigate('/system-admin/schools');
          }}
          className="nav-action-btn"
        >
          <PlusCircle size={17} />
          <span>Provision New Tenant</span>
        </button>
      </nav>

      {/* Footer Status & Logout */}
      <div className="sidebar-footer">
        <div className="system-health-pill">
          <span className="health-dot" />
          <span className="health-text">Systems Operational</span>
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
