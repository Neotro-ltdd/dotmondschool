import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { API_ROOT } from '../../services/api';
import { formatDisplayName } from '../../utils/nameFormatter';
import './Layout.css';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { userName, userRole, userAvatar, userTitle, availableRoles, setActiveRole, logout } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [userAvatar]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayRole = (userRole === 'Director' || userRole === 'Principal') ? 'Director' : userRole || 'User';
  
  const displayUserName = formatDisplayName(userTitle, userName);

  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const resolveAvatarUrl = (url?: string | null) => {
    if (!url || url === '/images/default-avatar.png') return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = resolveAvatarUrl(userAvatar);

  return (
    <header className="top-header glass-panel">
      <div className="header-left">
        {toggleSidebar && (
          <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
            ☰
          </button>
        )}
      </div>
      
      <div className="header-actions">
        {/* Developer / SuperAdmin Role Switcher Dropdown */}
        {availableRoles && availableRoles.length > 1 && (
          <div className="role-switcher-box" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', whiteSpace: 'nowrap' }}>⚡ View Role:</span>
            <select
              value={userRole || ''}
              onChange={(e) => setActiveRole(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="SuperAdmin">👑 SuperAdmin (All Sidebars)</option>
              <option value="Director">🏛️ Director (Executive)</option>
              <option value="Admin">⚙️ Admin (Operations)</option>
              <option value="Accountant">💰 Accountant (Finance)</option>
              <option value="Teacher">👩‍🏫 Class Teacher (Form)</option>
              <option value="SubjectTeacher">📚 Subject Teacher</option>
              <option value="Vendor">🏷️ Vendor (Printing)</option>
              <option value="Parent">👪 Parent Portal</option>
            </select>
          </div>
        )}

        <button className="icon-btn notification-btn" title="Notifications">
          <span className="icon">🔔</span>
          <span className="badge">3</span>
        </button>

        {/* Dark / Light Theme Mode Switcher beside Profile */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme mode"
        >
          {isDarkMode ? (
            <Sun size={19} className="theme-icon sun" />
          ) : (
            <Moon size={19} className="theme-icon moon" />
          )}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/dashboard/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="user-profile" style={{ cursor: 'pointer' }}>
              {avatarUrl && !imgError ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  onError={() => setImgError(true)}
                  className="avatar" 
                  style={{ objectFit: 'cover', width: '40px', height: '40px', borderRadius: '50%' }} 
                />
              ) : (
                <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initial}</div>
              )}
              <div className="user-info">
                <span className="user-name">{displayUserName}</span>
                <span className="user-role">{displayRole}</span>
              </div>
            </div>
          </Link>
          <button 
            onClick={handleLogout} 
            title="Log out" 
            className="icon-btn logout-header-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
