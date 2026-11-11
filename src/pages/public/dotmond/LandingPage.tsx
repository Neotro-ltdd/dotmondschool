import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../../context/TenantContext';
import './LandingPage.css';

const TESTIMONIALS = [
  {
    text: "Dotmond School has been a blessing to our family. My children have grown in confidence, character, and academic excellence. The teachers genuinely care about every student's progress.",
    name: 'Mrs. Funke Adeyemi',
    role: 'Parent, Ikeja, Lagos',
    img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%230F1F5C"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%23FACC15" text-anchor="middle" dominant-baseline="middle">FA</text></svg>',
  },
  {
    text: 'The nurturing environment at Dotmond School is unmatched. The teachers lay strong foundations for our children and it reflects in their outstanding performances.',
    name: 'Mr. Chinedu Okafor',
    role: 'Parent, Ajah, Lagos',
    img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%231E3A8A"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%2360A5FA" text-anchor="middle" dominant-baseline="middle">CO</text></svg>',
  },
  {
    text: "I am amazed at the level of care and academic rigor Dotmond School provides. My son's performance has improved tremendously since joining the school.",
    name: 'Mrs. Amina Yusuf',
    role: 'Parent, Lekki, Lagos',
    img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%23047857"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%236EE7B7" text-anchor="middle" dominant-baseline="middle">AY</text></svg>',
  },
  {
    text: 'Dotmond School offers more than just education; they offer holistic development. The extra-curricular activities and sports are fantastic.',
    name: 'Mr. David Olatunde',
    role: 'Parent, VGC, Lagos',
    img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%23B45309"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%23FDE68A" text-anchor="middle" dominant-baseline="middle">DO</text></svg>',
  },
  {
    text: 'We love the safety and security at Dotmond. As parents, having peace of mind while our children are learning is our top priority, and Dotmond delivers.',
    name: 'Mrs. Grace Edet',
    role: 'Parent, Sangotedo, Lagos',
    img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="%236D28D9"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="%23DDD6FE" text-anchor="middle" dominant-baseline="middle">GE</text></svg>',
  },
];

const HERO_IMAGES = [
  '/images/hero-slide-1.jpg',
  '/images/hero-slide-2.jpg',
  '/images/hero-slide-3.png',
  '/images/hero-slide-4.png',
  '/images/hero-slide-5.png',
  'https://dotmondschool.com/wp-content/uploads/2024/02/Dotmond-School-111-900-x-800-px.png',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { logoUrl, schoolName } = useTenant();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const heroTimer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, []);

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
            <a href="/apply-admission">Admissions</a>
            <a href="#contact">Contact</a>
          </nav>
          <button onClick={() => navigate('/login')} className="lp-btn lp-btn-primary">
            Portal Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-inner lp-hero-content">
          <div className="lp-hero-text">
            <span className="lp-badge">EXCELLENCE IN EDUCATION</span>
            <h1 className="lp-title">Nurturing Tomorrow's Leaders Today</h1>
            <p className="lp-subtitle">
              At Dotmond School, we empower students to achieve academic brilliance, cultivate strong moral values, and discover their full potential in a safe, inspiring environment.
            </p>
            <div className="lp-btn-group">
              <button onClick={() => navigate('/apply-admission')} className="lp-btn lp-btn-primary">
                Apply for Admission
              </button>
              <button onClick={() => navigate('/schedule-visit')} className="lp-btn lp-btn-outline">
                Schedule a Visit
              </button>
            </div>
          </div>
          <div className="lp-hero-image-wrapper">
            <img
              src={HERO_IMAGES[currentHeroSlide]}
              alt="Dotmond Campus Life"
              className="lp-hero-img"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="lp-stats">
        <div className="lp-inner lp-stats-grid">
          <div className="lp-stat-item">
            <span className="lp-stat-number highlight">100%</span>
            <span className="lp-stat-label">Pass Rate in National Exams</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">15+</span>
            <span className="lp-stat-label">Years of Educational Leadership</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number highlight">25:1</span>
            <span className="lp-stat-label">Student-to-Teacher Ratio</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">50+</span>
            <span className="lp-stat-label">Extra-Curricular Clubs</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="lp-features">
        <div className="lp-inner">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">WHY CHOOSE DOTMOND</span>
            <h2 className="lp-section-title">A Foundation for Lifelong Success</h2>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feature-card primary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
              </div>
              <h3 className="lp-feature-title">Academic Rigor</h3>
              <p className="lp-feature-desc">Integrated British and Nigerian curricula designed to foster critical thinking and global competitiveness.</p>
            </div>

            <div className="lp-feature-card secondary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <line x1="7" y1="8" x2="17" y2="8"/>
                  <line x1="7" y1="12" x2="13" y2="12"/>
                </svg>
              </div>
              <h3 className="lp-feature-title">Modern STEM Labs</h3>
              <p className="lp-feature-desc">State-of-the-art ICT centers, robotics laboratories, and science facilities for practical discovery.</p>
            </div>

            <div className="lp-feature-card primary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3 className="lp-feature-title">Dedicated Educators</h3>
              <p className="lp-feature-desc">Passionate, certified teachers committed to personalized mentoring and emotional well-being.</p>
            </div>

            <div className="lp-feature-card secondary">
              <div className="lp-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="lp-feature-title">Safe Environment</h3>
              <p className="lp-feature-desc">24/7 CCTV monitoring, gate access control, and dedicated medical facilities on campus.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="academics" className="lp-programs">
        <div className="lp-inner">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">OUR ACADEMIC DIVISIONS</span>
            <h2 className="lp-section-title">Tailored Learning Paths for Every Stage</h2>
          </div>
          <div className="lp-programs-grid">
            <div className="lp-program-card">
              <img
                src="/images/hero-slide-2.jpg"
                alt="Early Years & Nursery"
                className="lp-program-img"
              />
              <div className="lp-program-content">
                <h3 className="lp-program-title">Early Years &amp; Nursery</h3>
                <p className="lp-program-desc">Fostering curiosity, sensory discovery, and foundational literacy in a warm, play-based environment.</p>
              </div>
            </div>

            <div className="lp-program-card">
              <img
                src="/images/hero-slide-1.jpg"
                alt="Primary School"
                className="lp-program-img"
              />
              <div className="lp-program-content">
                <h3 className="lp-program-title">Primary School</h3>
                <p className="lp-program-desc">Building core competencies in mathematics, science, literacy, and creative arts with interactive technology.</p>
              </div>
            </div>

            <div className="lp-program-card">
              <img
                src="/images/hero-slide-3.png"
                alt="Secondary College"
                className="lp-program-img"
              />
              <div className="lp-program-content">
                <h3 className="lp-program-title">Secondary College</h3>
                <p className="lp-program-desc">Preparing students for WAEC, NECO, IGCSE, and top global university placements with rigorous academic tracks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="lp-testimonial">
        <div className="lp-inner">
          <div className="lp-section-header">
            <span className="lp-section-subtitle">WHAT PARENTS SAY</span>
            <h2 className="lp-section-title">Trusted by Hundreds of Families</h2>
          </div>
          <div className="lp-testimonial-container">
            {TESTIMONIALS.map((t, index) => (
              <div
                key={index}
                className={`lp-testimonial-card ${index === currentSlide ? 'active' : ''}`}
              >
                <div className="lp-quote-mark">“</div>
                <p className="lp-quote-text">{t.text}</p>
                <div className="lp-quote-author">
                  <img src={t.img} alt={t.name} className="lp-quote-img" />
                  <div className="lp-quote-info">
                    <span className="lp-quote-name">{t.name}</span>
                    <span className="lp-quote-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-slideshow-dots">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                className={`lp-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="lp-cta">
        <div className="lp-inner lp-cta-content">
          <div className="lp-cta-text">
            <h2 className="lp-cta-title">Ready to Join the Dotmond Family?</h2>
            <p className="lp-cta-desc">
              Admissions are currently open for the upcoming academic session. Take the first step towards a bright future for your child today.
            </p>
          </div>
          <div className="lp-btn-group">
            <button onClick={() => navigate('/apply-admission')} className="lp-btn lp-btn-primary">
              Apply Now
            </button>
            <button onClick={() => navigate('/schedule-visit')} className="lp-btn lp-btn-outline">
              Book a Tour
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
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
                    </svg>
                  </div>
                )}
                <span className="lp-footer-title">{schoolName || 'Dotmond School'}</span>
              </div>
              <p className="lp-footer-desc">
                Nurturing academic excellence, moral leadership, and creative innovation for students across Nigeria.
              </p>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Quick Links</h4>
              <a href="#about" className="lp-footer-link">About Us</a>
              <a href="#academics" className="lp-footer-link">Academics</a>
              <a href="/apply-admission" className="lp-footer-link">Admissions</a>
              <a href="/login" className="lp-footer-link">Portal Login</a>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Contact Us</h4>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Dotmond School Campus, Victoria Island / Ajah, Lagos, Nigeria</span>
              </div>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <span>+234 (0) 803 000 0000 / info@dotmondschool.com</span>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>&copy; {new Date().getFullYear()} Dotmond School. All rights reserved.</span>
            <span>Powered by RMS Enterprise Management</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
