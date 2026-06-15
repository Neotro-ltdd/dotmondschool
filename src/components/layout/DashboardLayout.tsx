import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { api, API_ROOT } from '../../services/api';
import './Layout.css';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/setup/school-profile')
        .then(data => {
          if (data?.logoUrl) {
            const url = data.logoUrl.startsWith('http') || data.logoUrl.startsWith('data:') 
              ? data.logoUrl 
              : `${API_ROOT}${data.logoUrl}`;
            setLogoUrl(url);
          }
        })
        .catch(err => console.error("Could not load school profile", err));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main" style={{ position: 'relative' }}>
        {logoUrl && (
          <div 
            className="dashboard-watermark" 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '50vw',
              height: '50vh',
              backgroundImage: `url(${logoUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
              opacity: 0.05,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}
        <Header />
        <main className="dashboard-content" style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
