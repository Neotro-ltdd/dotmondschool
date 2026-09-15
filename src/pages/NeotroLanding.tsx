import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Award, Users, CreditCard, BarChart3, CheckCircle2, 
  ArrowRight, HelpCircle, MapPin, Edit3, ChevronLeft, ChevronRight 
} from 'lucide-react';
import './NeotroLanding.css';

export default function NeotroLanding() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      title: "Empowering Modern Institutions Across Africa",
      subtitle: "For academic excellence. For institutional integrity.",
      bgImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop"
    },
    {
      title: "Automated Continuous Assessment & Broadsheets",
      subtitle: "Precision grading engine with instant digital signatures.",
      bgImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop"
    },
    {
      title: "Realtime Gate Verification & Parent Alerts",
      subtitle: "Instant barcode scanning with instant WhatsApp & SMS dispatch.",
      bgImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1600&auto=format&fit=crop"
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="neotro-lp-container">
      {/* Floating Left Vertical Action Sidebar */}
      <aside className="nas-floating-sidebar" aria-label="Quick Actions">
        <a href="#solutions" className="nas-sidebar-btn" title="Help & Information">
          <HelpCircle size={20} />
        </a>
        <div className="nas-sidebar-divider"></div>
        <a href="#security" className="nas-sidebar-btn" title="Campus Locations">
          <MapPin size={20} />
        </a>
        <div className="nas-sidebar-divider"></div>
        <a href="/apply-admission" className="nas-sidebar-btn" title="Online Application">
          <Edit3 size={20} />
        </a>
      </aside>

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
            <a href="#features">WHO WE ARE</a>
            <a href="/apply-admission">ADMISSION</a>
            <a href="#solutions">ACADEMICS</a>
            <a href="#security">SYSTEM LIFE</a>
            <a href="#features">SUPPORT</a>
          </nav>

          <button onClick={() => navigate('/neotro-login')} className="nas-btn nas-btn-header">
            Portal Login <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="nas-hero-carousel">
        <div 
          className="nas-carousel-slide" 
          style={{ backgroundImage: `url(${heroSlides[activeSlide].bgImage})` }}
        >
          <div className="nas-carousel-overlay">
            {/* Organic Curved Line SVG Overlay */}
            <svg className="nas-hero-svg-line" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100,100 C300,50 450,300 800,80 C1000,-50 1150,250 1300,150" stroke="#B2CEB6" strokeWidth="2.5" opacity="0.65" />
            </svg>

            <button className="nas-carousel-arrow nas-arrow-left" onClick={prevSlide} aria-label="Previous Slide">
              <ChevronLeft size={28} />
            </button>

            <div className="nas-carousel-caption">
              <h1 className="nas-carousel-title">{heroSlides[activeSlide].title}</h1>
              <p className="nas-carousel-subtitle">{heroSlides[activeSlide].subtitle}</p>
              
              <div className="nas-hero-cta-group">
                <button onClick={() => navigate('/login')} className="nas-btn nas-btn-primary">
                  Access Portal Login <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/apply-admission')} className="nas-btn nas-btn-outline">
                  Apply for Admission
                </button>
              </div>
            </div>

            <button className="nas-carousel-arrow nas-arrow-right" onClick={nextSlide} aria-label="Next Slide">
              <ChevronRight size={28} />
            </button>

            <div className="nas-carousel-dots">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  className={`nas-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Bar (Sage Accent) */}
      <div className="nas-quick-bar">
        <div className="nas-inner nas-quick-bar-content">
          <a href="/apply-admission" className="nas-quick-item">Inquire</a>
          <div className="nas-quick-divider"></div>
          <a href="#solutions" className="nas-quick-item">Schedule Visit</a>
          <div className="nas-quick-divider"></div>
          <a href="/apply-admission" className="nas-quick-item">Apply</a>
        </div>
      </div>

      {/* Inspirational Serif Quote Section */}
      <section className="nas-inspirational-quote">
        <div className="nas-inner">
          <h2 className="nas-quote-headline">
            Giving children the opportunity to grow into who they are...
          </h2>
          <p className="nas-quote-body">
            At Neotro Academic System, every institution is nurtured, celebrated, and emboldened to graduate students with a strong foundation of knowledge, skills, and confidence, ready to excel in higher education and beyond.
          </p>
        </div>
      </section>

      {/* St. Patrick's Style Color-Block Overlapping Divisions Grid */}
      <section id="solutions" className="nas-divisions-section">
        <div className="nas-inner nas-divisions-layout">
          <div className="nas-divisions-cards">
            {/* Dusty Mauve Pink Card */}
            <div className="nas-division-card card-pink">
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Bursary & Financial Division</h3>
                  <span className="nas-division-badge">Term Invoicing & POS Clearance</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">
                Constructive ledger management, automated term fee generation, POS direct payment recording, and instant payment clearance receipts.
              </p>
            </div>

            {/* Warm Soft Peach Card */}
            <div className="nas-division-card card-peach">
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Academics & Continuous Assessment</h3>
                  <span className="nas-division-badge">Broadsheets & Report Cards</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">
                Weighted grade calculations, class broadsheet approvals, student subject positioning, and digital signature PDF report card generation.
              </p>
            </div>

            {/* Clean White Card */}
            <div className="nas-division-card card-white">
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Realtime Gate Attendance</h3>
                  <span className="nas-division-badge">Barcode & ID Scanner</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">
                Instant barcode and ID card verification for students and staff with automated SMS and WhatsApp arrival notifications to parents.
              </p>
            </div>

            {/* Pale Blue-Gray Card */}
            <div className="nas-division-card card-bluegray">
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Online Admissions Portal</h3>
                  <span className="nas-division-badge">Applicant Registration</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">
                Digital application forms, document verification, entrance exam scoring, and automated student profile creation.
              </p>
            </div>
          </div>

          {/* Right Side Featured Photo Grid */}
          <div className="nas-divisions-photo-container">
            <img 
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop" 
              alt="Students in classroom" 
              className="nas-divisions-main-photo"
            />
          </div>
        </div>
      </section>

      {/* Organic Wave Divider SVG */}
      <div className="nas-wave-divider">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,32 C320,96 420,-16 720,48 C1020,112 1120,16 1440,64 L1440,120 L0,120 Z" fill="#F7FAF7" />
          <path d="M-100,20 C300,120 700,-40 1100,80 C1300,140 1500,40 1600,60" stroke="#1B5E4B" strokeWidth="1.5" fill="none" opacity="0.4" />
        </svg>
      </div>

      {/* Pillars Section (Shaping Lives of Value) */}
      <section id="features" className="nas-pillars-section">
        <div className="nas-inner">
          <div className="nas-section-header">
            <h2 className="nas-section-title-serif">Shaping Lives of Value</h2>
            <p className="nas-section-subtitle-serif">
              Pillars of Neotro Academic System that help define and shape our educational community.
            </p>
          </div>

          <div className="nas-pillars-grid">
            <div className="nas-pillar-card">
              <div className="nas-pillar-img-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop" 
                  alt="Students learning together"
                  className="nas-pillar-img" 
                />
              </div>
              <h3 className="nas-pillar-title">Tenant Security & Schema Isolation</h3>
              <p className="nas-pillar-desc">
                Bank-grade database schema isolation guarantees that every school's data, staff records, and financial transactions remain strictly private and protected.
              </p>
            </div>

            <div className="nas-pillar-card">
              <div className="nas-pillar-img-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop" 
                  alt="School assembly and governance"
                  className="nas-pillar-img" 
                />
              </div>
              <h3 className="nas-pillar-title">Multi-Branch Governance</h3>
              <p className="nas-pillar-desc">
                Unified administration for multi-campus institutions with centralized admin overview, branch-level filtering, and granular role permission policies.
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
            <p style={{ maxWidth: '400px', lineHeight: 1.6, color: '#A3B8B0' }}>
              Neotro Academic System (NAS) is an enterprise multi-tenant software solution built by Neotro Technologies to empower schools with world-class academic, administrative, and financial automation.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              <li><a href="/login" style={{ color: '#A3B8B0', textDecoration: 'none' }}>Portal Login</a></li>
              <li><a href="/apply-admission" style={{ color: '#A3B8B0', textDecoration: 'none' }}>Online Admission</a></li>
              <li><a href="#solutions" style={{ color: '#A3B8B0', textDecoration: 'none' }}>Academics & Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Support</h4>
            <p style={{ margin: 0, lineHeight: 1.6, color: '#A3B8B0' }}>
              Engineered by Neotro Technologies<br />
              Cloud Multi-Tenant Infrastructure<br />
              24/7 Dedicated System Monitoring
            </p>
          </div>
        </div>
        <div className="nas-inner nas-footer-copy">
          &copy; {new Date().getFullYear()} Neotro Technologies. All rights reserved. Neotro Academic System is an enterprise education management platform.
        </div>
      </footer>
    </div>
  );
}
