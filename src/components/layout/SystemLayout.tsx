import React from 'react';
import { Outlet } from 'react-router-dom';
import SystemSidebar from './SystemSidebar';
import './SystemLayout.css';

export default function SystemLayout() {
  return (
    <div className="system-layout">
      <SystemSidebar />
      <div className="system-main">
        <header className="system-header">
          <div className="header-content">
            <h1>Platform Management</h1>
            <div className="user-profile">
              <div className="avatar">SA</div>
              <span>Super Admin</span>
            </div>
          </div>
        </header>
        <main className="system-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
