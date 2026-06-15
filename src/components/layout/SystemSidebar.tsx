import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SystemLayout.css';

export default function SystemSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/master-login');
  };

  return (
    <aside className="system-sidebar">
      <div className="sidebar-header">
        <h2>Neotro</h2>
        <p>System Admin</p>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/system-admin" 
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">📊</span>
          Overview
        </NavLink>
        
        <NavLink 
          to="/system-admin/schools" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="icon">🏫</span>
          Provisioned Schools
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span className="icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
