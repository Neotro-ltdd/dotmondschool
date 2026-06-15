import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { schoolName } = useTenant();

  return (
    <div className="landing-container">
      {/* Background Image is set via CSS class to ensure optimal loading and styling */}
      <div className="landing-overlay">
        <header className="landing-header">
          <div className="logo-area">
            <div className="logo-placeholder">{schoolName.substring(0, 2).toUpperCase()}</div>
            <h1>{schoolName}</h1>
          </div>
          <nav className="landing-nav">
            <button className="btn btn-outline" onClick={() => navigate('/login')}>
              Portal Login
            </button>
          </nav>
        </header>

        <main className="landing-main">
          <div className="hero-content glass-panel">
            <h2>Empowering the Next Generation</h2>
            <p>
              Welcome to {schoolName}. We provide a world-class education with a focus on 
              academic excellence, character development, and future-ready skills.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                Access School Portal
              </button>
              <button className="btn btn-accent btn-lg" onClick={() => window.open('https://example.com', '_blank')}>
                Admissions
              </button>
            </div>
          </div>
        </main>
        
        <footer className="landing-footer">
          <p>&copy; {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
