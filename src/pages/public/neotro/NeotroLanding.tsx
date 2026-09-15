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
                <button onClick={() => navigate('/apply-admission')} className="nas-btn nas-btn-primary">
                  Apply for Admission <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/schedule-visit')} className="nas-btn nas-btn-outline">
                  Schedule Campus Tour
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

      {/* Sage Green Quick Action Banner */}
      <section className="nas-quick-bar">
        <div className="nas-inner nas-quick-bar-content">
          <a href="/apply-admission" className="nas-quick-item">Apply for Admission</a>
          <div className="nas-quick-divider"></div>
          <a href="/schedule-visit" className="nas-quick-item">Schedule a Visit</a>
          <div className="nas-quick-divider"></div>
          <a href="#features" className="nas-quick-item">Virtual Campus Tour</a>
        </div>
      </section>

      {/* Inspirational Serif Quote Section */}
      <section className="nas-inspirational-quote">
        <div className="nas-inner">
          <h2 className="nas-quote-headline">Striving for Purpose, Wisdom &amp; Distinction</h2>
          <p className="nas-quote-body">
            Neotro Academic System provides an advanced, seamless operational backbone designed for premier educational institutions. We combine strict governance with modern digital innovation so your staff, parents, and learners excel every single day.
          </p>
        </div>
      </section>

      {/* Overlapping Pastel Division Cards */}
      <section id="solutions" className="nas-divisions-section">
        <div className="nas-inner nas-divisions-layout">
          <div className="nas-divisions-cards">
            <div className="nas-division-card card-pink" onClick={() => navigate('/apply-admission')}>
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Early Years &amp; Kindergarten</h3>
                  <span className="nas-division-badge">FOUNDATION STAGE</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">Nurturing creative play, language development, and foundational cognitive milestones in safe spaces.</p>
            </div>

            <div className="nas-division-card card-peach" onClick={() => navigate('/apply-admission')}>
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Primary Academy</h3>
                  <span className="nas-division-badge">GRADES 1 TO 6</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">Empowering young minds with inquiry-based STEM, literacy, mathematics, and moral character building.</p>
            </div>

            <div className="nas-division-card card-white" onClick={() => navigate('/apply-admission')}>
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Secondary College</h3>
                  <span className="nas-division-badge">GRADES 7 TO 12</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">Preparing scholars for WAEC, IGCSE, SATs, and entrance into top global universities.</p>
            </div>

            <div className="nas-division-card card-bluegray" onClick={() => navigate('/apply-admission')}>
              <div className="nas-card-header">
                <div>
                  <h3 className="nas-division-title">Sixth Form &amp; A-Levels</h3>
                  <span className="nas-division-badge">PRE-UNIVERSITY</span>
                </div>
                <div className="nas-card-arrow">→</div>
              </div>
              <p className="nas-division-desc">Specialized university preparation, research mentorship, leadership internships, and global exchange.</p>
            </div>
          </div>

          <div className="nas-divisions-photo-container">
            <img 
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop" 
              alt="Students in Library" 
              className="nas-divisions-main-photo" 
            />
          </div>
        </div>
      </section>

      {/* Organic Wave Divider */}
      <div className="nas-wave-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" fill="#F7FAF7">
          <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* Pillars Section */}
      <section id="features" className="nas-pillars-section">
        <div className="nas-inner">
          <div className="nas-section-header">
            <h2 className="nas-section-title-serif">Shaping Lives of Character &amp; Value</h2>
            <p className="nas-section-subtitle-serif">
              Our holistic framework balances academic rigor with community engagement, wellness, and leadership development.
            </p>
          </div>

          <div className="nas-pillars-grid">
            <div className="nas-pillar-card">
              <div className="nas-pillar-img-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop" 
                  alt="Academic Excellence" 
                  className="nas-pillar-img" 
                />
              </div>
              <h3 className="nas-pillar-title">Digital Academic Governance</h3>
              <p className="nas-pillar-desc">
                Real-time assessment tracking, automated term broadsheet computation, and transparent gradebook verification for total institutional trust.
              </p>
            </div>

            <div className="nas-pillar-card">
              <div className="nas-pillar-img-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop" 
                  alt="Student Security" 
                  className="nas-pillar-img" 
                />
              </div>
              <h3 className="nas-pillar-title">Campus Security &amp; Attendance</h3>
              <p className="nas-pillar-desc">
                Integrated gate scanner terminals with immediate WhatsApp and SMS arrival notifications to keep parents fully informed and pupils safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Emerald Footer */}
      <footer id="security" className="nas-footer">
        <div className="nas-inner">
          <div className="nas-footer-grid">
            <div>
              <h3 className="nas-footer-brand-title">NEOTRO ACADEMIC SYSTEM</h3>
              <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>
                Transforming educational management across Africa through secure cloud technology, real-time analytics, and elegant user experiences.
              </p>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Navigation</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
                <li><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</a></li>
                <li><a href="/apply-admission" style={{ color: 'inherit', textDecoration: 'none' }}>Admissions</a></li>
                <li><a href="/schedule-visit" style={{ color: 'inherit', textDecoration: 'none' }}>Schedule Visit</a></li>
                <li><a href="/neotro-login" style={{ color: 'inherit', textDecoration: 'none' }}>Portal Login</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Support &amp; Contact</h4>
              <p style={{ margin: '0 0 0.5rem 0' }}>Victoria Island, Lagos, Nigeria</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>Email: support@neotro.com</p>
              <p style={{ margin: 0 }}>Phone: +234 (0) 700 NEOTRO</p>
            </div>
          </div>

          <div className="nas-footer-copy">
            &copy; {new Date().getFullYear()} Neotro Academic System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
