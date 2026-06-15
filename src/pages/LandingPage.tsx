import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  // The system landing page shouldn't show a specific school name until provisioned/logged in.
  const platformName = "Neotro SMS";

  return (
    <div className="landing-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <header className="landing-header">
            <div className="logo-area">
              <div className="logo-placeholder">NS</div>
              <h1>{platformName}</h1>
            </div>
            <nav className="landing-nav">
              <button className="btn btn-outline" onClick={() => navigate('/login')}>
                Portal Login
              </button>
            </nav>
          </header>

          <div className="hero-content">
            <h2>Riding on Technology to Build a Better Future</h2>
            <p>
              Empower your educational institution with our comprehensive School Management System. 
              We provide dynamic, tech-forward software solutions designed to streamline administration, 
              enhance academic tracking, and foster a future-ready learning environment across your entire school.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                Access School Portal
              </button>
              <button className="btn btn-accent btn-lg" onClick={() => window.open('https://example.com', '_blank')}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card brand-indigo">
            <div className="feature-icon">📈</div>
            <h3>RMS - Result Management System</h3>
            <p>Seamlessly track student progress, automate complex grading systems, and generate comprehensive report cards with zero hassle.</p>
          </div>
          <div className="feature-card brand-blue">
            <div className="feature-icon">⏱️</div>
            <h3>AAS - Automated Attendance System</h3>
            <p>Digitize daily attendance for both students and staff. Get real-time alerts, export detailed logs, and monitor punctuality effortlessly.</p>
          </div>
          <div className="feature-card brand-violet">
            <div className="feature-icon">💳</div>
            <h3>FMS - Fee Management System</h3>
            <p>Automate fee collection, send out digital invoices, track pending payments, and manage institutional finances securely.</p>
          </div>
          <div className="feature-card brand-slate">
            <div className="feature-icon">👩‍🏫</div>
            <h3>LMS - Learning Management System</h3>
            <p>Empower teachers with a platform to share resources, assign digital homework, and engage with students outside the classroom.</p>
          </div>
        </div>
      </section>

      {/* 3. About Innovation Section */}
      <section className="about-section">
        <div className="about-content">
          <h2>Transforming Education with Technology</h2>
          <p>
            We believe that technology is the bridge to the future of education. What used to be 
            a tedious, paper-heavy administrative process is now a vibrant, tech-enabled ecosystem. 
            Neotro SMS covers the entire school hierarchy—from principals and admins to teachers, students, and parents.
          </p>
          <p>
            Currently, numerous institutions rely on our holistic, technology-driven suite of modules 
            to reduce overhead and focus on what truly matters: student success. Embrace the 
            digital transformation and prepare your school for the 21st Century.
          </p>
          <button className="btn btn-outline dark-outline" onClick={() => window.open('https://example.com', '_blank')}>
            READ MORE
          </button>
        </div>
        <div className="about-images">
          <div className="img-grid">
            <div className="img-box img-1"></div>
            <div className="img-box img-2"></div>
            <div className="img-box img-3"></div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-placeholder small">NS</div>
            <span>{platformName}</span>
          </div>
          <div className="footer-links">
            <span>© Neotro Ltd 2026. All rights reserved.</span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
