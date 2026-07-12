import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const { logoUrl, schoolName } = useTenant();

  return (
    <div className="lp-container">
      <header className="lp-header">
        <div className="lp-inner lp-header-content">
          <div className="lp-brand">
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className="lp-logo-img" />
            ) : (
              <div className="lp-logo-fallback">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 2.18 7 3.12V11c0 4.67-3.13 9.06-7 10.2-3.87-1.14-7-5.53-7-10.2V6.3z" />
                  <path d="M12 6 8 8v3c0 2.5 1.7 4.8 4 5.5 2.3-.7 4-3 4-5.5V8z" />
                </svg>
              </div>
            )}
            <div className="lp-brand-text">
              <span className="lp-brand-title">DOTMOND</span>
              <span className="lp-brand-subtitle">PRIMARY &amp; SECONDARY SCHOOL</span>
            </div>
          </div>
          <nav className="lp-nav">
            <a href="#about">About</a>
            <a href="#academics">Academics</a>
            <a href="#admissions">Admissions</a>
            <a href="#contact">Contact</a>
          </nav>
          <button onClick={() => navigate('/login')} className="lp-btn lp-btn-primary">
            Portal Login
          </button>
        </div>
      </header>

      <section className="lp-hero" id="about">
        <div className="lp-inner lp-hero-content">
          <div className="lp-hero-text">
            <div className="lp-badge">
              ★ Admissions Open for 2025/2026 Session
            </div>
            <h1 className="lp-title">
              Steady Progress and Brightness Future
            </h1>
            <p className="lp-subtitle">
              Nurturing young minds from ages 3 to 18. Our caring teachers provide the
              best start in nursery, lay strong foundations in primary, and empower
              success in secondary. Join us for a journey of growth and achievement.
            </p>
            <div className="lp-btn-group">
              <button onClick={() => navigate('/login')} className="lp-btn lp-btn-primary">
                Apply for Admission
              </button>
              <button className="lp-btn lp-btn-outline">
                Schedule a Visit
              </button>
            </div>
          </div>
          <div className="lp-hero-image-wrapper">
            <img
              className="lp-hero-img"
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80"
              alt="School Campus"
            />
          </div>
        </div>
      </section>

      <section className="lp-stats">
        <div className="lp-inner lp-stats-grid">
          <div className="lp-stat-item">
            <span className="lp-stat-number">15+</span>
            <span className="lp-stat-label">Years of Excellence</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">2,500+</span>
            <span className="lp-stat-label">Happy Students</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">120</span>
            <span className="lp-stat-label">Dedicated Teachers</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number highlight">97%</span>
            <span className="lp-stat-label">Exam Success Rate</span>
          </div>
        </div>
      </section>

      <section className="lp-features" id="why-us">
        <div className="lp-inner">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">ABOUT US</span>
            <h2 className="lp-section-title">Discover Dotmond School</h2>
            <p className="lp-subtitle" style={{ marginBottom: 0 }}>
              Learn more about our philosophy, history, achievements, and commitment to your child's safety.
            </p>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feature-card primary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4" />
                </svg>
              </div>
              <span className="lp-feature-title">Our Philosophy</span>
              <span className="lp-feature-desc">Dotmond School believes in providing a nurturing and stimulating environment that fosters the holistic development of each child.</span>
            </div>
            <div className="lp-feature-card secondary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 3 2 9l10 6 10-6zm0 13.5L4 11v6l8 4.5 8-4.5v-6z" />
                </svg>
              </div>
              <span className="lp-feature-title">Our History</span>
              <span className="lp-feature-desc">Founded on September 2, 2010. Despite humble beginnings, with support from our parents and the grace of God, we have steadily improved our facilities over time.</span>
            </div>
            <div className="lp-feature-card primary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2 4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.62z" />
                </svg>
              </div>
              <span className="lp-feature-title">Our Achievements</span>
              <span className="lp-feature-desc">We have consistently excelled, winning first place in numerous competitions. Our SS3 students have achieved remarkable success with an approximately 80% pass rate.</span>
            </div>
            <div className="lp-feature-card secondary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z" />
                </svg>
              </div>
              <span className="lp-feature-title">Health &amp; Safety</span>
              <span className="lp-feature-desc">The safety and well-being of our students are our top priorities. Parents are encouraged to actively engage with our safety policies.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-programs" id="academics">
        <div className="lp-inner">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">OUR PROGRAMS</span>
            <h2 className="lp-section-title">Academic Programs for Every Stage</h2>
          </div>
          <div className="lp-programs-grid">
            <div className="lp-program-card">
              <img className="lp-program-img" src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80" alt="Early Years" />
              <div className="lp-program-content">
                <span className="lp-badge">Ages 2 - 5</span>
                <span className="lp-program-title">Nursery &amp; Early Years</span>
                <span className="lp-program-desc">A fun and nurturing environment where young learners explore, play, and build the foundation for lifelong curiosity.</span>
              </div>
            </div>
            <div className="lp-program-card">
              <img className="lp-program-img" src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80" alt="Primary School" />
              <div className="lp-program-content">
                <span className="lp-badge lp-badge-dark">Ages 6 - 11</span>
                <span className="lp-program-title">Primary School</span>
                <span className="lp-program-desc">Developing strong foundations in literacy, numeracy, science, and critical thinking for confident young minds.</span>
              </div>
            </div>
            <div className="lp-program-card">
              <img className="lp-program-img" src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80" alt="Secondary School" />
              <div className="lp-program-content">
                <span className="lp-badge">Ages 12 - 17</span>
                <span className="lp-program-title">Secondary School</span>
                <span className="lp-program-desc">Preparing students for WAEC, NECO, and university entrance with academic excellence, discipline, and integrity.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-testimonial">
        <div className="lp-inner">
          <div className="lp-testimonial-card">
            <span className="lp-quote-mark">&quot;</span>
            <p className="lp-quote-text">
              Dotmond School has been a blessing to our family. My children have
              grown in confidence, character, and academic excellence. The
              teachers genuinely care about every student's progress.
            </p>
            <div className="lp-quote-author">
              <img className="lp-quote-img" src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80" alt="Parent" />
              <div className="lp-quote-info">
                <span className="lp-quote-name">Mrs. Funke Adeyemi</span>
                <span className="lp-quote-role">Parent, Ikeja, Lagos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta" id="admissions">
        <div className="lp-inner lp-cta-content">
          <div className="lp-cta-text">
            <h2 className="lp-cta-title">Enroll Your Child at Dotmond School</h2>
            <p className="lp-cta-desc">
              Admissions for the 2025/2026 academic session are now open. Spaces
              are limited — take the first step toward your child's brighter
              future today.
            </p>
          </div>
          <div className="lp-btn-group">
            <button onClick={() => navigate('/login')} className="lp-btn lp-btn-primary">
              Start Application
            </button>
            <button className="lp-btn lp-btn-outline">
              Call Us
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-footer" id="contact">
        <div className="lp-inner">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                {logoUrl ? (
                  <img src={logoUrl} alt={schoolName} className="lp-logo-img" />
                ) : (
                  <div className="lp-logo-fallback">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 2.18 7 3.12V11c0 4.67-3.13 9.06-7 10.2-3.87-1.14-7-5.53-7-10.2V6.3z" />
                      <path d="M12 6 8 8v3c0 2.5 1.7 4.8 4 5.5 2.3-.7 4-3 4-5.5V8z" />
                    </svg>
                  </div>
                )}
                <span className="lp-footer-title">Dotmond School</span>
              </div>
              <p className="lp-footer-desc">
                Steady progress and a brighter future through quality education,
                strong values, and a caring community.
              </p>
            </div>
            
            <div className="lp-footer-col">
              <span className="lp-footer-heading">Quick Links</span>
              <span className="lp-footer-link">About Us</span>
              <span className="lp-footer-link">Academics</span>
              <span className="lp-footer-link">Admissions</span>
              <span className="lp-footer-link">Gallery</span>
            </div>

            <div className="lp-footer-col">
              <span className="lp-footer-heading">Contact Us</span>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5" />
                </svg>
                <span>12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</span>
              </div>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z" />
                </svg>
                <span>+234 812 345 6789</span>
              </div>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4-8 5-8-5V6l8 5 8-5z" />
                </svg>
                <span>info@dotmondschool.edu.ng</span>
              </div>
            </div>

            <div className="lp-footer-col">
              <span className="lp-footer-heading">School Hours</span>
              <span className="lp-footer-desc">Monday - Friday</span>
              <span className="lp-footer-desc">7:30 AM - 3:30 PM</span>
              <span className="lp-footer-desc">After-school clubs until 5:00 PM</span>
            </div>
          </div>
          
          <div className="lp-footer-bottom">
            <span>© 2025 Dotmond Primary &amp; Secondary School. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
