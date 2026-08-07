import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { api, API_ROOT } from '../../services/api';
import './Layout.css';

import { useActiveTerm } from '../../hooks/useActiveTerm';

export default function DashboardLayout() {
  const { isAuthenticated, requiresPasswordChange, updateUserInfo } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isHoliday, session, term, resumptionDate } = useActiveTerm();

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/setup/school-profile')
        .then(data => {
          if (data?.logoUrl) {
            const fullLogoUrl = data.logoUrl 
                ? (data.logoUrl.startsWith('http') ? data.logoUrl : `${API_ROOT}${data.logoUrl}`)
                : null;
              setLogoUrl(fullLogoUrl);
          }
        })
        .catch(err => console.error("Could not load school profile", err));

      api.get('/profile')
        .then(data => {
          if (data && updateUserInfo) {
            updateUserInfo({
              avatarUrl: data.avatarUrl,
              firstName: data.firstName,
              lastName: data.lastName,
              title: data.title
            });
          }
        })
        .catch(err => console.error("Could not load user profile", err));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
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
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        {isHoliday && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            color: '#78350F',
            borderBottom: '1px solid #FCD34D',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.84rem',
            fontWeight: 700,
            position: 'relative',
            zIndex: 9
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem' }}>🌴</span>
              <span>
                <strong>SCHOOL OPERATIONAL NOTICE:</strong> School is currently on Holiday / Inter-Term Break.
                {resumptionDate ? ` Resumption date for ${session} (${term}) is ${resumptionDate}.` : ` Preparing for ${session} ${term}.`}
                <span style={{ fontWeight: 500, marginLeft: '0.5rem', opacity: 0.9 }}>
                  (Gate attendance tap-in & daily emails are paused. Online fee setup & payments remain live.)
                </span>
              </span>
            </div>
          </div>
        )}
        <main className="dashboard-content" style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
