import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Award, Users, CreditCard, BarChart3, CheckCircle2, 
  ArrowRight, HelpCircle, MapPin, Edit3, ChevronLeft, ChevronRight,
  Search, X, Calendar, Globe, BookOpen, Sparkles, Heart, Compass,
  GraduationCap, School, Video, ExternalLink, Menu
} from 'lucide-react';
import './NeotroLanding.css';

interface VoiceModalContent {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export default function NeotroLanding() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeDivision, setActiveDivision] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVoiceModal, setActiveVoiceModal] = useState<VoiceModalContent | null>(null);

  const heroSlides = [
    {
      headingLead: "Be",
      headingHighlight: "Infinitely",
      headingEnd: "You",
      subtext: "For who you are. For who you will become.",
      bgImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1800&auto=format&fit=crop"
    },
    {
      headingLead: "Shine",
      headingHighlight: "Infinitely",
      headingEnd: "Brighter",
      subtext: "For your passions. For your potential.",
      bgImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1800&auto=format&fit=crop"
    },
    {
      headingLead: "Grow",
      headingHighlight: "Infinitely",
      headingEnd: "Stronger",
      subtext: "For your moral compass. For your greater purpose.",
      bgImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800&auto=format&fit=crop"
    },
    {
      headingLead: "Care",
      headingHighlight: "Infinitely",
      headingEnd: "More",
      subtext: "For your community. For your world.",
      bgImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1800&auto=format&fit=crop"
    }
  ];

  // Autoplay hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const divisionData = [
    {
      title: "Early Childhood Division",
      subtitle: "Nursery 1 – Nursery 2",
      desc: "Constructive play, rich conversation, and meaningful experiences provide the foundation for learning in our Early Childhood Division.",
      image: "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1200&auto=format&fit=crop",
      badgeColor: "#E2BDC0"
    },
    {
      title: "Lower Primary",
      subtitle: "Kindergarten – Primary 3",
      desc: "Inquiry-based experiences allow our Lower Primary students to internalize structure while engaging deeply with academic exploration.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop",
      badgeColor: "#FDE3B2"
    },
    {
      title: "Basic Education",
      subtitle: "Primary 4 – Primary 5",
      desc: "An exciting stage as students develop a deeper capacity for abstract thinking, critical analysis, and greater independence.",
      image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop",
      badgeColor: "#FFFFFF"
    },
    {
      title: "Middle School",
      subtitle: "JSS 1 – JSS 3",
      desc: "Junior Secondary represents a time of tremendous transition for these young scholars—intellectually, socially, emotionally, and morally.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
      badgeColor: "#D0E3E5"
    },
    {
      title: "High School",
      subtitle: "SS 1 – SS 3",
      desc: "Preparing scholars for WAEC, NECO, IGCSE, SATs, and entrance into top global universities with specialized academic rigor and leadership.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
      badgeColor: "#E2BDC0"
    }
  ];

  const featureModules = [
    {
      title: "Gate Security & Attendance",
      badge: "REAL-TIME ALERTS",
      desc: "Instant barcode & RFID gate verification terminal with automatic WhatsApp & SMS arrival/departure notifications sent directly to parents.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop",
      icon: <Shield size={20} color="#B2CEB6" />,
      tag: "Gate Terminal & SMS"
    },
    {
      title: "Result & Broadsheet Engine",
      badge: "AUTOMATED GRADING",
      desc: "Instant continuous assessment (CA) computation, term broadsheets, digital principal signature authorization, and downloadable PDF report cards.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
      icon: <BarChart3 size={20} color="#B2CEB6" />,
      tag: "CA & Report Cards"
    },
    {
      title: "Cashless Fee Portal",
      badge: "ONLINE PAYMENTS",
      desc: "Seamless online tuition payment gateway, automated invoice generation, digital receipt dispatch, and real-time revenue analytics per student.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
      icon: <CreditCard size={20} color="#B2CEB6" />,
      tag: "Tuition & Receipts"
    },
    {
      title: "Student Profile & Clearances",
      badge: "LIFECYCLE MANAGEMENT",
      desc: "Comprehensive student profile records, ID card printing, automated exit clearance approvals, disciplinary logs, and parent communication portal.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
      icon: <Users size={20} color="#B2CEB6" />,
      tag: "Profiles & Clearances"
    }
  ];

  const voiceBoxes = [
    {
      title: "Student-Centered Approach",
      subtitle: "Personalized Growth & Agency",
      description: "Student-centered learning puts the individual learner's desire to make meaning out of the wider world at the very heart of the work we do.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Inquiry-Based Learning",
      subtitle: "The Tools to Succeed",
      description: "We consider project and inquiry-based learning essential to motivating our students to remain inspired, curious, and analytical.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Design & Collaboration Lab",
      subtitle: "Innovation & Problem Solving",
      description: "Crossing the threshold of the Design & Collaboration Lab allows students to focus on appropriate risk-taking—testing and iterating approaches that result in successful problem-solving.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Exceptional Literacy",
      subtitle: "Critical Insight & Expression",
      description: "We encourage our students to collaborate in transforming information into insights that lead to creative, sometimes ingenious, solutions.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="neotro-lp-container">
      {/* Floating Left Vertical Dock (St. Patrick's Sidebar) */}
      <aside className="nas-floating-sidebar" aria-label="Quick Navigation">
        <a href="#solutions" className="nas-sidebar-btn" title="Academic Programs">
          <BookOpen size={20} />
        </a>
        <div className="nas-sidebar-divider"></div>
        <a href="#stats" className="nas-sidebar-btn" title="School Overview">
          <School size={20} />
        </a>
        <div className="nas-sidebar-divider"></div>
        <button onClick={() => navigate('/apply-admission')} className="nas-sidebar-btn" title="Apply Online">
          <Edit3 size={20} />
        </button>
      </aside>

      {/* Header Navigation Header */}
      <header className="nas-header-wrapper">
        {/* Main Navigation Header */}
        <div className="nas-main-header">
          <div className="nas-inner nas-main-header-content">
            <div className="nas-brand-block" onClick={() => navigate('/')}>
              <div className="nas-seal">
                <Shield size={28} color="#FFFFFF" />
              </div>
              <div className="nas-brand-titles">
                <span className="nas-brand-name">Neotro Academy</span>
                <span className="nas-brand-sub">ENTERPRISE ACADEMIC SYSTEM &bull; EXCELLENCE &amp; INTEGRITY</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="nas-desktop-nav">
              <a href="#who-we-are">Who We Are</a>
              <a href="/apply-admission">Admission</a>
              <a href="#academics">Academics</a>
              <a href="#student-life">Student Life</a>
              <a href="#support">Support</a>
            </nav>

            <div className="nas-header-ctas">
              <button onClick={() => navigate('/apply-admission')} className="nas-cta-link btn-inquire">
                Inquire
              </button>
              <button onClick={() => navigate('/schedule-visit')} className="nas-cta-link btn-visit">
                Visit
              </button>
              <button onClick={() => navigate('/apply-admission')} className="nas-cta-link btn-apply">
                Apply
              </button>
              <button onClick={() => navigate('/neotro-login')} className="nas-cta-link btn-login">
                Portal Login <ArrowRight size={14} />
              </button>
              <button 
                className="nas-mobile-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="nas-mobile-menu-drawer">
            <nav className="nas-mobile-nav-list">
              <a href="#who-we-are" onClick={() => setMobileMenuOpen(false)}>Who We Are</a>
              <a href="/apply-admission" onClick={() => setMobileMenuOpen(false)}>Admission</a>
              <a href="#academics" onClick={() => setMobileMenuOpen(false)}>Academics</a>
              <a href="#student-life" onClick={() => setMobileMenuOpen(false)}>Student Life</a>
              <a href="#support" onClick={() => setMobileMenuOpen(false)}>Support</a>
              <a href="/neotro-login" className="mobile-login-link" onClick={() => setMobileMenuOpen(false)}>
                Portal Login
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Carousel Section */}
      <section className="nas-hero-carousel">
        <div 
          className="nas-carousel-slide" 
          style={{ backgroundImage: `url(${heroSlides[activeSlide].bgImage})` }}
        >
          <div className="nas-carousel-overlay">
            {/* Animated SVG Path Overlay */}
            <svg className="nas-hero-svg-line" viewBox="0 0 1440 220" fill="none" preserveAspectRatio="none">
              <path 
                d="M-31.5 -30.9C-18.7 37.3 82.6 69.6 168.1 88.3C400.5 139 636.7 86.5 870.4 71.8C1078 58.7 1289.9 90.8 1453.9 181.7" 
                stroke="#B2CEB6" 
                strokeWidth="2.5" 
                opacity="0.85" 
              />
            </svg>

            <button className="nas-carousel-arrow nas-arrow-left" onClick={prevSlide} aria-label="Previous Slide">
              <ChevronLeft size={32} />
            </button>

            <div className="nas-carousel-caption">
              <h1 className="nas-carousel-title">
                <strong>{heroSlides[activeSlide].headingLead} </strong>
                <span className="infinite-text">{heroSlides[activeSlide].headingHighlight} </span>
                <strong>{heroSlides[activeSlide].headingEnd}</strong>
              </h1>
              <p className="nas-carousel-subtitle">{heroSlides[activeSlide].subtext}</p>
              
              <div className="nas-hero-cta-group">
                <button onClick={() => navigate('/apply-admission')} className="nas-btn nas-btn-primary">
                  Inquire Now <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/schedule-visit')} className="nas-btn nas-btn-outline">
                  Schedule Campus Tour
                </button>
              </div>
            </div>

            <button className="nas-carousel-arrow nas-arrow-right" onClick={nextSlide} aria-label="Next Slide">
              <ChevronRight size={32} />
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

      {/* Quick Action Sage Green Ribbon */}
      <section className="nas-quick-bar">
        <div className="nas-inner nas-quick-bar-content">
          <a href="/apply-admission" className="nas-quick-item">Inquire Online</a>
          <div className="nas-quick-divider"></div>
          <a href="/schedule-visit" className="nas-quick-item">Book Campus Visit</a>
          <div className="nas-quick-divider"></div>
          <a href="/apply-admission" className="nas-quick-item">Apply for Admission</a>
        </div>
      </section>

      {/* Inspirational Intro Quote Block */}
      <section id="who-we-are" className="nas-home-panel-1">
        <div className="nas-inner">
          <h2 className="nas-panel-quote-title">
            Creating Endless Possibilities for the Modern Academic Sector...
          </h2>
          <p className="nas-panel-quote-body">
            Neotro Academic System creates limitless possibilities for premier educational institutions—from automated digital gate attendance and instant WhatsApp/SMS parent alerts, to real-time continuous assessment, automated term broadsheet generation, digital principal signatures, cashless fee portal management, and seamless exit clearances. Built with strict enterprise governance and modern cloud architecture, Neotro empowers school administrators, teachers, parents, and students to achieve operational excellence every single day.
          </p>
        </div>
      </section>

      {/* Animated SVG Curve Line 1 */}
      <div className="nas-line-animated line-one">
        <svg viewBox="0 0 1440 188" fill="none">
          <path 
            className="line-one-path" 
            d="M-31.5 -30.9316C-18.7009 37.3734 82.6924 69.6456 168.187 88.3116C400.571 139.045 636.755 86.5339 870.44 71.8336C1078.03 58.7743 1289.91 90.8414 1453.9 181.71C1457.5 183.692 1461.1 185.675 1464.7 187.727" 
            stroke="#155D4F" 
            strokeWidth="2" 
          />
        </svg>
      </div>

      {/* Division Cards Layout (Panel 2) */}
      <section id="academics" className="nas-home-panel-2">
        <div className="nas-inner nas-panel-2-layout">
          <div className="nas-panel-2-text-container">
            {divisionData.map((division, idx) => (
              <div 
                key={idx}
                className={`nas-panel-2-text-box ${activeDivision === idx ? 'active-box' : ''}`}
                onClick={() => setActiveDivision(idx)}
              >
                <div className="box-header">
                  <h3 className="box-title">{division.title}</h3>
                  <span className="box-badge">{division.subtitle}</span>
                </div>
                <div className="box-body">
                  <p>{division.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="nas-panel-2-image-container">
            <div className="nas-image-frame">
              <img 
                src={divisionData[activeDivision].image} 
                alt={divisionData[activeDivision].title} 
                className="nas-division-featured-photo"
              />
              <div className="nas-image-caption">
                <h4>{divisionData[activeDivision].title}</h4>
                <p>{divisionData[activeDivision].subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated SVG Curve Line 2 */}
      <div className="nas-line-animated line-two">
        <svg viewBox="0 0 1440 258" fill="none">
          <path 
            className="line-two-path" 
            d="M1444 -118C1477 -47 1443.8 47.4 1373.6 82.2C1327.8 104.9 1273.5 103.1 1223.8 91.3C1174.1 79.6 1127.1 58.6 1078.2 44C1007.4 22.8 932.5 14.9 858.8 20.9C825.3 23.6 789.4 30.5 766.4 55.1C743.5 79.7 743.5 126.9 773.9 141.4C781.8 145.2 791.1 146.3 799.4 143.5C808.8 140.4 816.1 132.5 820.1 123.4C836 87.6 798.8 46.5 759.8 43C720.8 39.5 684.2 60.5 650.7 80.8C547.5 143.4 442.4 207.6 324.8 235C207.2 262.4 72.8 246.9 -16 165.2" 
            stroke="#155D4F" 
            strokeWidth="2" 
          />
        </svg>
      </div>

      {/* Feature Modules Section */}
      <section id="solutions" className="nas-home-panel-3">
        <div className="nas-inner text-center">
          <h2 className="nas-pillars-main-title">Enterprise System Modules</h2>
          <p className="nas-pillars-main-sub">
            Powerful features engineered for modern Nigerian schools and academic institutions.
          </p>
        </div>
      </section>

      <section className="nas-home-panel-4">
        <div className="nas-inner nas-pillars-grid-container">
          {featureModules.map((module, idx) => (
            <div key={idx} className="nas-mission-box">
              <div className="mission-box-header">
                <div className="module-header-top">
                  {module.icon}
                  <span className="module-badge">{module.badge}</span>
                </div>
                <h3>{module.title}</h3>
              </div>
              <div className="mission-box-img-wrapper">
                <img src={module.image} alt={module.title} />
              </div>
              <div className="mission-box-footer">
                <p>{module.desc}</p>
                <div className="module-tag-bar">
                  <span className="module-tag">&bull; {module.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Animated SVG Curve Line 3 */}
      <div className="nas-line-animated line-three">
        <svg viewBox="0 0 1440 356" fill="none">
          <path 
            className="line-three-path" 
            d="M-16.5151 -72C-23.5157 -29.7695 -5.04196 13.6506 23.7382 43.5886C52.5185 73.5266 90.4383 91.5688 128.747 105.051C337.015 178.211 563.95 129.834 783.691 128.644C831.918 128.446 880.922 130.627 926.037 148.074C1008.68 180.193 1068.97 259.698 1152.78 288.446C1179.03 297.368 1208 300.937 1234.26 291.618C1260.51 282.3 1283.26 258.31 1286.37 229.165C1287.93 214.493 1282.87 197.442 1269.84 192.089C1253.9 185.546 1235.62 202.796 1235.62 221.036C1235.42 239.078 1248.65 254.741 1264.01 262.87C1279.37 270.8 1296.68 272.981 1313.6 276.154C1386.33 289.636 1461.78 333.056 1482 408" 
            stroke="#155D4F" 
            strokeWidth="2" 
          />
        </svg>
      </div>

      {/* Educational Foundations Spotlight (Panel 7 & Panel 8) */}
      <section id="student-life" className="nas-home-panel-7">
        <div className="nas-inner text-center">
          <h2 className="nas-foundation-title">Laying The Foundations For Success</h2>
          <p className="nas-foundation-sub">
            Prioritizing student-centered learning and empowering students to pursue their unique interests and strengths in an environment where individual aspirations drive academic growth.
          </p>
        </div>
      </section>

      <section className="nas-home-panel-8">
        <div className="nas-inner nas-voices-grid">
          {voiceBoxes.map((box, idx) => (
            <div 
              key={idx} 
              className="nas-voice-card"
              onClick={() => setActiveVoiceModal(box)}
            >
              <div className="voice-card-header">
                <h3>{box.title}</h3>
                <span className="voice-card-sub">{box.subtitle}</span>
              </div>
              <div className="voice-card-img-wrapper">
                <img src={box.image} alt={box.title} />
              </div>
              <div className="voice-card-body">
                <p>{box.description}</p>
                <span className="read-more-btn">Read Spotlight &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voice Spotlight Detail Modal */}
      {activeVoiceModal && (
        <div className="nas-modal-overlay" onClick={() => setActiveVoiceModal(null)}>
          <div className="nas-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="nas-modal-close" onClick={() => setActiveVoiceModal(null)}>
              <X size={24} />
            </button>
            <div className="nas-modal-hero">
              <img src={activeVoiceModal.image} alt={activeVoiceModal.title} />
            </div>
            <div className="nas-modal-body">
              <span className="nas-modal-badge">{activeVoiceModal.subtitle}</span>
              <h2>{activeVoiceModal.title}</h2>
              <p>{activeVoiceModal.description}</p>
              <div className="nas-modal-footer">
                <button onClick={() => navigate('/apply-admission')} className="nas-btn nas-btn-primary">
                  Learn More in Admissions &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Culture & Statistics Section */}
      <section id="stats" className="nas-community-section">
        <div className="nas-inner">
          <div className="nas-community-header">
            <h2 className="nas-pillars-main-title">A Culture of Academic Distinction &amp; Integrity</h2>
            <p className="nas-community-body">
              Neotro Academy is committed to academic excellence, moral discipline, and technological innovation. We partner with parents and dedicated educators across Nigeria to nurture confident, high-achieving scholars equipped to excel in WAEC, NECO, IGCSE, JAMB, and top global university admissions.
            </p>
          </div>

          <div className="nas-infographic-grid">
            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <Award size={32} color="#155D4F" />
              </div>
              <span className="stat-number">98%+</span>
              <h4 className="stat-label">WAEC &amp; NECO Credit Pass Rate</h4>
            </div>

            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <Shield size={32} color="#155D4F" />
              </div>
              <span className="stat-number">100%</span>
              <h4 className="stat-label">Digital Gate Security &amp; Instant SMS</h4>
            </div>

            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <Users size={32} color="#155D4F" />
              </div>
              <span className="stat-number">15</span>
              <h4 className="stat-label">students in an average class</h4>
            </div>

            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <BarChart3 size={32} color="#155D4F" />
              </div>
              <span className="stat-number">100%</span>
              <h4 className="stat-label">Automated Broadsheets &amp; Digital Portals</h4>
            </div>

            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <GraduationCap size={32} color="#155D4F" />
              </div>
              <span className="stat-number">12+</span>
              <h4 className="stat-label">Co-Curricular Clubs &amp; Sports Teams</h4>
            </div>

            <div className="nas-stat-card">
              <div className="stat-icon-wrapper">
                <CheckCircle2 size={32} color="#155D4F" />
              </div>
              <span className="stat-number">10:1</span>
              <h4 className="stat-label">student-to-teacher ratio</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section (Dark Emerald Banner) */}
      <footer id="support" className="nas-footer">
        <div className="nas-footer-cta-strip">
          <div className="nas-inner nas-footer-cta-content">
            <a href="/apply-admission" className="foot-cta-item">Inquire</a>
            <a href="/schedule-visit" className="foot-cta-item">Visit</a>
            <a href="/apply-admission" className="foot-cta-item">Apply</a>
          </div>
        </div>

        <div className="nas-inner nas-footer-main">
          <div className="nas-footer-top-grid">
            <div className="nas-footer-col footer-logo-col">
              <div className="footer-logo-box">
                <Shield size={36} color="#B2CEB6" />
                <h3>Neotro Academy</h3>
                <p>ENTERPRISE EDUCATION MANAGEMENT SYSTEM</p>
              </div>
              <p className="footer-school-desc">
                Premier independent co-educational institution committed to academic distinction and holistic student development.
              </p>
            </div>

            <div className="nas-footer-col">
              <h4>Campus Location</h4>
              <p>Victoria Island Campus</p>
              <p>Lagos State, Nigeria</p>
              <p>Email: info@neotroacademy.com</p>
              <p>P: +234 (0) 700 NEOTRO</p>
            </div>

            <div className="nas-footer-col">
              <h4>Quick Links</h4>
              <p><a href="#who-we-are" style={{ color: 'inherit', textDecoration: 'none' }}>Who We Are</a></p>
              <p><a href="#academics" style={{ color: 'inherit', textDecoration: 'none' }}>Academics &amp; Divisions</a></p>
              <p><a href="/apply-admission" style={{ color: 'inherit', textDecoration: 'none' }}>Online Admissions</a></p>
              <p><a href="/schedule-visit" style={{ color: 'inherit', textDecoration: 'none' }}>Schedule Campus Visit</a></p>
              <p><a href="/neotro-login" style={{ color: 'inherit', textDecoration: 'none' }}>Portal Login</a></p>
            </div>

            <div className="nas-footer-col">
              <h4>Connect with us</h4>
              <div className="footer-social-icons">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://vimeo.com" target="_blank" rel="noreferrer" title="Vimeo">
                  <Video size={20} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="nas-footer-bottom-bar">
            <div className="footer-tagline">
              Seeing <span className="infinite-text">Infinite Value</span> in Every Child
            </div>
            
            <div className="footer-utility-links">
              <a href="#who-we-are">Who We Are</a>
              <a href="#academics">Academics</a>
              <a href="/apply-admission">Admissions</a>
              <a href="/neotro-login">Portal Login</a>
            </div>
          </div>

          <div className="nas-footer-copyright">
            &copy; {new Date().getFullYear()} Neotro Academy. Powered by Neotro Engine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
