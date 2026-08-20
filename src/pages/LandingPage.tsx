import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import "./LandingPage.css";

const TESTIMONIALS = [
  {
    text: "Dotmond School has been a blessing to our family. My children have grown in confidence, character, and academic excellence. The teachers genuinely care about every student's progress.",
    name: "Mrs. Funke Adeyemi",
    role: "Parent, Ikeja, Lagos",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80"
  },
  {
    text: "The nurturing environment at Dotmond School is unmatched. The teachers lay strong foundations for our children and it reflects in their outstanding performances.",
    name: "Mr. Chinedu Okafor",
    role: "Parent, Ajah, Lagos",
    img: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&q=80"
  },
  {
    text: "I am amazed at the level of care and academic rigor Dotmond School provides. My son's performance has improved tremendously since joining the school.",
    name: "Mrs. Amina Yusuf",
    role: "Parent, Lekki, Lagos",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80"
  },
  {
    text: "Dotmond School offers more than just education; they offer holistic development. The extra-curricular activities and sports are fantastic.",
    name: "Mr. David Olatunde",
    role: "Parent, VGC, Lagos",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
  },
  {
    text: "We love the safety and security at Dotmond. As parents, having peace of mind while our children are learning is our top priority, and Dotmond delivers.",
    name: "Mrs. Grace Edet",
    role: "Parent, Sangotedo, Lagos",
    img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&q=80"
  }
];

const HERO_IMAGES = [
  "/images/hero-slide-1.jpg",
  "/images/hero-slide-2.jpg",
  "/images/hero-slide-3.png",
  "/images/hero-slide-4.png",
  "/images/hero-slide-5.png",
  "https://dotmondschool.com/wp-content/uploads/2024/02/Dotmond-School-111-900-x-800-px.png"
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

      <section className="lp-hero" id="about">
        <div className="lp-inner lp-hero-content">
          <div className="lp-hero-text">
            <div className="lp-badge">
              ★ Admissions Open for 2026/2027 Session
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
              <button onClick={() => navigate('/apply-admission')} className="lp-btn lp-btn-primary">
                Apply for Admission
              </button>
              <button className="lp-btn lp-btn-outline">
                Schedule a Visit
              </button>
            </div>
          </div>
          <div className="lp-hero-image-wrapper" style={{ position: 'relative', width: '100%', height: '440px', overflow: 'hidden', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' }}>
            {HERO_IMAGES.map((img, index) => (
              <img
                key={index}
                className="lp-hero-img"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  opacity: index === currentHeroSlide ? 1 : 0, 
                  transition: 'opacity 1s ease-in-out',
                  boxShadow: 'none',
                  borderRadius: '0'
                }}
                src={img}
                alt="Dotmond School"
              />
            ))}
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
              <img className="lp-program-img" src="https://dotmondschool.com/wp-content/uploads/2024/02/Dotmond-School-Award-1280-x-853-px-1.png" alt="Primary School" />
              <div className="lp-program-content">
                <span className="lp-badge lp-badge-dark">Ages 6 - 11</span>
                <span className="lp-program-title">Primary School</span>
                <span className="lp-program-desc">Developing strong foundations in literacy, numeracy, science, and critical thinking for confident young minds.</span>
              </div>
            </div>
            <div className="lp-program-card">
              <img className="lp-program-img" src="https://dotmondschool.com/wp-content/uploads/2024/02/Dotmond-School-Award-1280-x-853-px.png" alt="Secondary School" />
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
          <div className="lp-testimonial-container" style={{ minHeight: '320px' }}>
            {TESTIMONIALS.map((t, index) => (
              <div key={index} className={`lp-testimonial-card ${index === currentSlide ? 'active' : ''}`}>
                <span className="lp-quote-mark">&quot;</span>
                <p className="lp-quote-text">{t.text}</p>
                <div className="lp-quote-author">
                  <img className="lp-quote-img" src={t.img} alt="Parent" />
                  <div className="lp-quote-info">
                    <span className="lp-quote-name">{t.name}</span>
                    <span className="lp-quote-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-slideshow-dots">
            {TESTIMONIALS.map((_, index) => (
              <button 
                key={index} 
                className={`lp-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta" id="admissions">
        <div className="lp-inner lp-cta-content">
          <div className="lp-cta-text">
            <h2 className="lp-cta-title">Admissions for 2026/2027 in Progress!</h2>
            <p className="lp-cta-desc">
              Embark on an exciting educational journey with Dotmond
              School as we open the doors to admissions for the 2026/2027 academic session!
            </p>
          </div>
          <div className="lp-btn-group">
            <button onClick={() => navigate('/apply-admission')} className="lp-btn lp-btn-primary">
              Enroll Now
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
              </div>
              <p className="lp-footer-desc">
                At Dotmond Secondary School, we inspire students to dream big and explore the joy of learning. Our nurturing environment fosters curiosity and cultivates well-rounded individuals ready to thrive in the world. Join us and discover the endless possibilities.
              </p>
            </div>
            
            <div className="lp-footer-col">
              <span className="lp-footer-heading">School</span>
              <a href="#about" className="lp-footer-link">About Us</a>
              <a href="#gallery" className="lp-footer-link">Gallery</a>
              <a href="#event" className="lp-footer-link">Event</a>
            </div>

            <div className="lp-footer-col">
              <span className="lp-footer-heading">Get Help</span>
              <a href="/apply-admission" className="lp-footer-link">Register</a>
              <a href="/apply-admission" className="lp-footer-link">Admission</a>
              <a href="#contact" className="lp-footer-link">Contact us</a>
            </div>
            
            <div className="lp-footer-col" style={{ maxWidth: '280px' }}>
              <span className="lp-footer-heading">Contact Us</span>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5" />
                </svg>
                <span>Happyland Estate, Ajah, Lagos State, Nigeria</span>
              </div>
              <div className="lp-footer-contact">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z" />
                </svg>
                <span>+234 816 891 7447, +234 805 140 9106</span>
              </div>
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
