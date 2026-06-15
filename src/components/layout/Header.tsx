import React from 'react';

import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Layout.css';

export default function Header() {
  const { userName, userRole } = useAuth();
  
  // Format role for display: e.g. "Principal" -> "Super Admin" (optional) or just use the exact role
  const displayRole = userRole === 'Principal' ? 'Super Admin' : userRole || 'User';
  // Get initial for avatar
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="top-header glass-panel">
      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search students, teachers..." className="search-input" />
      </div>
      
      <div className="header-actions">
        <button className="icon-btn notification-btn">
          <span className="icon">🔔</span>
          <span className="badge">3</span>
        </button>
        
        <Link to="/dashboard/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="user-profile" style={{ cursor: 'pointer' }}>
            <div className="avatar">{initial}</div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{displayRole}</span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

