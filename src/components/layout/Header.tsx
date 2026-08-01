import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_ROOT } from '../../services/api';
import './Layout.css';

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { userName, userRole, userAvatar, userTitle } = useAuth();
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [userAvatar]);

  // Format role for display: e.g. "Principal" -> "Super Admin" (optional) or just use the exact role
  const displayRole = userRole === 'Principal' ? 'Super Admin' : userRole || 'User';
  
  const displayUserName = (() => {
    if (userTitle && userTitle.trim()) {
      const titleClean = userTitle.trim();
      const normName = userName.toLowerCase().replace(/[.,]/g, '');
      const normTitle = titleClean.toLowerCase().replace(/[.,]/g, '');
      if (!normName.startsWith(normTitle)) {
        return `${titleClean} ${userName}`;
      }
    }
    return userName;
  })();

  // Get initial for avatar
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const resolveAvatarUrl = (url?: string | null) => {
    if (!url || url === '/images/default-avatar.png') return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = resolveAvatarUrl(userAvatar);

  return (
    <header className="top-header glass-panel">
      <div className="header-search">
        {toggleSidebar && (
          <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
            ☰
          </button>
        )}
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
      </div>
    </header>
  );
}
