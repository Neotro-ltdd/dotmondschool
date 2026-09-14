import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Award, Users, CreditCard, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import './NeotroLanding.css';

export default function NeotroLanding() {
  const navigate = useNavigate();

  return (
    <div className="neotro-lp-container">
      {/* Header */}
      <header className="nas-header">
        <div className="nas-inner nas-header-content">
          <div className="nas-brand">
            <div className="nas-logo-icon">
              <Shield size={24} />
            </div>
            <div>
              <span className="nas-brand-title">NEOTRO ACADEMIC SYSTEM</span>
              <span className="nas-brand-subtitle">Enterprise Education Management Platform</span>
            </div>
          </div>

          <nav className="nas-nav">
            <a href="#features">Platform Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#security">Security & Isolation</a>
            <a href="/apply-admission">Admissions</a>
          </nav>

          <button onClick={() => navigate('/login')} className="nas-btn nas-btn-primary">
            Portal Login <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Quick Action Bar (Sage Accent) */}
      <div className="nas-quick-bar">
        <div className="nas-inner nas-quick-bar-content">
          <a href="/apply-admission" className="nas-quick-item">Inquire</a>
          <div className="nas-quick-divider"></div>
          <a href="#features" className="nas-quick-item">Schedule Demo</a>
          <div className="nas-quick-divider"></div>
          <a href="/apply-admission" className="nas-quick-item">Online Admission</a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="nas-hero">
        <div className="nas-inner nas-hero-grid">
          <div>
            <div className="nas-hero-badge">
              <Award size={14} /> Official White-Label Enterprise Release
            </div>
            <h1 className="nas-hero-title">
              Empowering Modern <span>Educational Institutions</span> Across Africa
            </h1>
            <p className="nas-hero-desc">
              A complete, unified school management engine designed for academic excellence. Streamline admissions, bursary accounting, continuous assessment broadsheets, and real-time gate attendance.
            </p>
            <div className="nas-hero-actions">
              <button onClick={() => navigate('/login')} className="nas-btn nas-btn-primary">
                Access Demo Portal <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/apply-admission')} className="nas-btn nas-btn-outline">
                Online Admissions
              </button>
            </div>

            <div className="nas-stats-row">
              <div>
                <div className="nas-stat-num">99.9%</div>
                <div className="nas-stat-label">Platform Uptime</div>
              </div>
              <div>
                <div className="nas-stat-num">Multi-Campus</div>
                <div className="nas-stat-label">Tenant Isolation</div>
              </div>
              <div>
                <div className="nas-stat-num">Realtime</div>
                <div className="nas-stat-label">Gate Notifications</div>
              </div>
            </div>
          </div>

          {/* Hero Interactive Preview Card */}
          <div className="nas-hero-preview">
            <div className="nas-preview-card">
              <div className="nas-preview-header">
                <div className="nas-preview-dot-group">
                  <div className="nas-preview-dot"></div>
                  <div className="nas-preview-dot"></div>
                  <div className="nas-preview-dot"></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                  NAS Enterprise Dashboard Preview
                </span>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#1E293B', borderRadius: '8px', borderLeft: '4px solid #0284C7' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Realtime Attendance Feed</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.25rem', color: '#F8FAFC' }}>
                    Student Gate Verification Active
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#38BDF8', marginTop: '0.25rem' }}>
                    ✓ SMS / WhatsApp Alerts Dispatched
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#1E293B', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automated Results Engine</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.25rem', color: '#F8FAFC' }}>
                    Continuous Assessment & Broadsheets
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#34D399', marginTop: '0.25rem' }}>
                    ✓ Class Roster Approval Verified
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#1E293B', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bursary & Financial Ledger</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.25rem', color: '#F8FAFC' }}>
                    POS & Term Fee Invoicing
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#FBBF24', marginTop: '0.25rem' }}>
                    ✓ Automated Receipt Generation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="nas-features">
        <div className="nas-inner">
          <div className="nas-section-header">
            <div className="nas-section-subtitle">Modular Architecture</div>
            <h2 className="nas-section-title">Built for Modern Educational Excellence</h2>
          </div>

          <div className="nas-feature-grid">
            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <BarChart3 size={24} />
              </div>
              <h3 className="nas-feature-title">Smart Broadsheets & Reports</h3>
              <p className="nas-feature-desc">
                Automated continuous assessment calculation, grade weighting, subject positioning, and PDF report card generation with digital signatures.
              </p>
            </div>

            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <Shield size={24} />
              </div>
              <h3 className="nas-feature-title">Gate Attendance System</h3>
              <p className="nas-feature-desc">
                Instant barcode and ID card scanning for students and staff with automatic SMS, Email, and WhatsApp arrival notifications to parents.
              </p>
            </div>

            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <CreditCard size={24} />
              </div>
              <h3 className="nas-feature-title">Bursary & POS Clearance</h3>
              <p className="nas-feature-desc">
                Complete term invoice generation, POS direct payment recording, online proof of payment verification, and automatic financial clearance locks.
              </p>
            </div>

            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <Users size={24} />
              </div>
              <h3 className="nas-feature-title">Parent Hub & Mobile Portal</h3>
              <p className="nas-feature-desc">
                Dedicated parent access portal for monitoring academic progress, checking term reports, viewing attendance timestamps, and managing invoices.
              </p>
            </div>

            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <Award size={24} />
              </div>
              <h3 className="nas-feature-title">Multi-Branch Management</h3>
              <p className="nas-feature-desc">
                Unified governance for multi-campus institutions with centralized admin overview, branch-level filtering, and strict role permission policies.
              </p>
            </div>

            <div className="nas-feature-card">
              <div className="nas-feature-icon">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="nas-feature-title">Strict Tenant Isolation</h3>
              <p className="nas-feature-desc">
                Bank-grade database schema isolation guarantees that every school's data, staff records, and financial transactions remain strictly private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nas-footer">
        <div className="nas-inner nas-footer-grid">
          <div>
            <div className="nas-footer-brand-title">NEOTRO ACADEMIC SYSTEM</div>
            <p style={{ maxWidth: '400px', lineHeight: 1.6 }}>
              Neotro Academic System (NAS) is an enterprise multi-tenant software solution built by Neotro Technologies to empower schools with world-class academic, administrative, and financial automation.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '1rem' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              <li><a href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Portal Login</a></li>
              <li><a href="/apply-admission" style={{ color: 'inherit', textDecoration: 'none' }}>Online Admission</a></li>
              <li><a href="/schedule-visit" style={{ color: 'inherit', textDecoration: 'none' }}>Schedule Visit</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '1rem' }}>Support & Info</h4>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Engineered by Neotro Technologies<br />
              Enterprise Cloud Hosting
            </p>
          </div>
        </div>
        <div className="nas-inner nas-footer-copy">
          &copy; {new Date().getFullYear()} Neotro Technologies. All rights reserved. Neotro Academic System is a registered enterprise software platform.
        </div>
      </footer>
    </div>
  );
}
