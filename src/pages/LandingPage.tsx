import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { schoolName } = useTenant();

  return (
    <div className="landing-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
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

          <div className="hero-content">
            <h2>Riding on Technology to Build a Better Future</h2>
            <p>
              Embracing innovative technologies to empower the next generation. We provide 
              a dynamic, tech-forward learning environment focused on academic excellence, 
              character development, and future-ready skills.
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
        </div>
      </section>

      {/* 2. Core Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card brand-green">
            <div className="feature-icon">📚</div>
            <h3>Academic Excellence</h3>
            <p>A rigorous academic curriculum that challenges students to think critically and creatively, preparing them for higher education.</p>
          </div>
          <div className="feature-card brand-teal">
            <div className="feature-icon">🌱</div>
            <h3>Holistic Development</h3>
            <p>Nurturing the whole child. Alongside academics, we emphasize sports, arts, and extracurricular activities for well-rounded growth.</p>
          </div>
          <div className="feature-card brand-blue">
            <div className="feature-icon">💡</div>
            <h3>Innovative Teaching</h3>
            <p>Employing the latest educational technologies, interactive smart classrooms, and STEM programs to engage students.</p>
          </div>
          <div className="feature-card brand-dark">
            <div className="feature-icon">🤝</div>
            <h3>Supportive Environment</h3>
            <p>We foster a nurturing community with dedicated counseling, mentorship, and active parental involvement.</p>
          </div>
        </div>
      </section>

      {/* 3. About Innovation Section */}
      <section className="about-section">
        <div className="about-content">
          <h2>What Makes Us Unique?</h2>
          <p>
            We believe that technology is the bridge to the future. What started as a traditional 
            learning environment is now a vibrant, tech-enabled ecosystem. Our classrooms are 
            equipped with digital tools, and our curriculum seamlessly integrates project-based 
            learning with modern software engineering and digital literacy principles. 
          </p>
          <p>
            Currently, thousands of students are benefiting from our holistic, technology-driven 
            approach. Whether through advanced coding clubs, digital arts, or community welfare 
            programmes, our key focus remains constant: Education for the 21st Century.
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
            <div className="logo-placeholder small">{schoolName.substring(0, 2).toUpperCase()}</div>
            <span>{schoolName}</span>
          </div>
          <div className="footer-links">
            <span>© {new Date().getFullYear()} All rights reserved.</span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
