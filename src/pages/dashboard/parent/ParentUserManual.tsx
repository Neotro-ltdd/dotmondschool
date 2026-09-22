import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Users,
  CreditCard,
  UploadCloud,
  FileText,
  TrendingUp,
  ShieldCheck,
  Bell,
  HelpCircle,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
  ArrowRight,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import './ParentUserManual.css';

interface Chapter {
  id: string;
  num: number;
  title: string;
  icon: React.ReactNode;
  tags: string[];
}

const CHAPTERS: Chapter[] = [
  { id: 'ch1', num: 1, title: 'Overview & Ward Selection', icon: <Users size={18} />, tags: ['kids', 'wards', 'profile', 'clearance'] },
  { id: 'ch2', num: 2, title: 'School Fees & Online Payment', icon: <CreditCard size={18} />, tags: ['fees', 'invoice', 'bank', 'pay online'] },
  { id: 'ch3', num: 3, title: 'Uploading Payment Receipts', icon: <UploadCloud size={18} />, tags: ['bank teller', 'receipt', 'proof', 'upload'] },
  { id: 'ch4', num: 4, title: 'Terminal Report Cards & Results', icon: <FileText size={18} />, tags: ['grades', 'report card', 'pdf', 'results'] },
  { id: 'ch5', num: 5, title: 'Academic Performance & Trends', icon: <TrendingUp size={18} />, tags: ['gpa', 'trend', 'analytics', 'strengths'] },
  { id: 'ch6', num: 6, title: 'Gate Attendance & Push Alerts', icon: <ShieldCheck size={18} />, tags: ['attendance', 'gate', 'pwa', 'push alerts'] },
  { id: 'ch7', num: 7, title: 'Frequently Asked Questions (FAQ)', icon: <HelpCircle size={18} />, tags: ['support', 'help', 'faq', 'clearance'] },
];

export default function ParentUserManual() {
  const { schoolName } = useTenant();
  const [activeChapter, setActiveChapter] = useState<string>('ch1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleTagClick = (tag: string) => {
    setActiveTagFilter(tag);
    if (tag === 'all') return;
    const matchedCh = CHAPTERS.find((c) => c.tags.includes(tag));
    if (matchedCh) {
      setActiveChapter(matchedCh.id);
      const element = document.getElementById(matchedCh.id);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLightbox = (url: string, title: string) => {
    setLightboxImage({ url, title });
  };

  const scrollToChapter = (id: string) => {
    setActiveChapter(id);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="manual-container">
      {/* Top Banner */}
      <div className="manual-header-banner">
        <div className="manual-header-title">
          <BookOpen size={28} /> Parent Portal User Guide & Manual
        </div>
        <div className="manual-header-subtitle">
          Welcome to the step-by-step visual documentation guide for parents and guardians. Learn how to view student profiles, manage school fee payments, upload bank teller slips, print terminal report cards, track gate attendance, and receive real-time push alerts.
        </div>

        {/* Search Input Bar */}
        <div className="manual-search-wrapper">
          <div className="manual-search-input-box">
            <Search size={18} />
            <input
              type="text"
              className="manual-search-input"
              placeholder="Search guide by feature or keyword (e.g. upload teller, print result, fees, gate log)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Tags */}
        <div className="manual-quick-tags">
          <button
            className={`manual-tag-btn ${activeTagFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleTagClick('all')}
          >
            All Guide Topics
          </button>
          <button
            className={`manual-tag-btn ${activeTagFilter === 'wards' ? 'active' : ''}`}
            onClick={() => handleTagClick('wards')}
          >
            👨‍👧‍👦 Ward Selection
          </button>
          <button
            className={`manual-tag-btn ${activeTagFilter === 'fees' ? 'active' : ''}`}
            onClick={() => handleTagClick('fees')}
          >
            💳 School Fees & Bank Details
          </button>
          <button
            className={`manual-tag-btn ${activeTagFilter === 'receipt' ? 'active' : ''}`}
            onClick={() => handleTagClick('receipt')}
          >
            📤 Upload Payment Proof
          </button>
          <button
            className={`manual-tag-btn ${activeTagFilter === 'report card' ? 'active' : ''}`}
            onClick={() => handleTagClick('report card')}
          >
            📜 Report Cards
          </button>
          <button
            className={`manual-tag-btn ${activeTagFilter === 'gate' ? 'active' : ''}`}
            onClick={() => handleTagClick('gate')}
          >
            🚪 Gate Timestamps & Notifications
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="manual-main-grid">
        {/* Sticky Index Sidebar */}
        <aside className="manual-sticky-sidebar">
          <div className="manual-nav-title">CHAPTER INDEX</div>
          <ul className="manual-nav-list">
            {CHAPTERS.map((ch) => (
              <li key={ch.id}>
                <button
                  className={`manual-nav-item-btn ${activeChapter === ch.id ? 'active' : ''}`}
                  onClick={() => scrollToChapter(ch.id)}
                >
                  <span className="nav-chapter-num">{ch.num}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content Body */}
        <main className="manual-content-body">
          {/* CHAPTER 1 */}
          <section id="ch1" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 1</span>
              <h2 className="chapter-title">Overview & Accessing Wards ("My Kids")</h2>
            </div>

            <p className="manual-text-block">
              When logging into the Parent Portal, you can navigate to the <strong>"My Kids"</strong> page from the left sidebar. This displays official student cards for all children registered under your parent profile.
            </p>

            <div className="manual-callout tip">
              <Lightbulb className="callout-icon" size={20} />
              <div>
                <strong>Accessing Your Child's Portal:</strong> Locate the <strong>PARENT PORTAL</strong> section on the left sidebar and click <strong>"My Kids"</strong>. Click <strong>"Open Student Portal →"</strong> on your child's card to access their detailed fee receipts, report cards, and attendance logs.
              </div>
            </div>

            {/* Live Interactive Manual Sample Preview Card (Anonymized: No Real Student Name or Photo) */}
            <div className="manual-screenshot-card">
              <div className="screenshot-browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot red"></span>
                  <span className="browser-dot yellow"></span>
                  <span className="browser-dot green"></span>
                </div>
                <span className="screenshot-caption-title">{schoolName || 'Dotmond'} Parent Portal - Interactive Interface Preview</span>
              </div>
              
              <div style={{ padding: '1.5rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. Hero Banner Sample */}
                <div className="parent-hero-banner" style={{ marginBottom: 0, padding: '1.75rem 2rem' }}>
                  <div className="parent-hero-header">
                    <div className="parent-hero-info">
                      <div className="parent-hero-eyebrow">
                        <Sparkles size={14} className="eyebrow-icon" />
                        <span>PARENT & GUARDIAN PORTAL</span>
                      </div>
                      <h1 className="parent-hero-title" style={{ fontSize: '1.5rem' }}>
                        Good morning, Parent / Guardian
                      </h1>
                      <p className="parent-hero-subtitle" style={{ fontSize: '0.88rem' }}>
                        Review your children's real-time continuous assessment scores, terminal broadsheets, daily gate attendance logs, and itemized tuition clearance.
                      </p>
                    </div>

                    <div className="parent-hero-pills">
                      <div className="parent-hero-pill">
                        <Calendar size={14} />
                        <span>2026/2027 Session &bull; First Term</span>
                      </div>
                      <div className="parent-hero-pill">
                        <Users size={14} />
                        <span>1 Enrolled Ward</span>
                      </div>
                      <div className="parent-hero-pill live-indicator">
                        <span className="pulse-dot"></span>
                        <span>Portal Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Push Notifications Control Bar Sample */}
                <div className="push-toggle-container" style={{ margin: 0 }}>
                  <div className="push-toggle-header">
                    <div className="push-toggle-info">
                      <div className="push-icon-wrapper active">
                        <Bell size={20} />
                      </div>
                      <div className="push-title-block">
                        <h4>Push Notifications</h4>
                        <p>Alerts active for Results, Attendance & Invoices</p>
                      </div>
                    </div>
                  </div>
                  <div className="push-action-row">
                    <button className="push-btn-primary push-btn-active" style={{ cursor: 'default' }}>
                      <CheckCircle size={15} /> Push Alerts Enabled
                    </button>
                  </div>
                </div>

                {/* 3. Anonymized Glass Student Profile Card Sample */}
                <div style={{ maxWidth: '420px' }}>
                  <div className="child-card glass-student-card">
                    <div className="glass-card-top-row">
                      {/* Generic Initial Avatar - No real student face image */}
                      <div className="glass-avatar-container">
                        <div className="glass-avatar-initials">SN</div>
                      </div>

                      <div className="glass-student-info">
                        <div className="glass-student-header">
                          <h3 className="glass-student-name">
                            Student Name
                          </h3>
                          <span className="glass-active-tag">
                            <span className="pulse-indicator"></span> Active
                          </span>
                        </div>

                        <div className="glass-meta-line">
                          <span className="glass-meta-label">Class:</span>
                          <span className="glass-meta-val">Junior Secondary JSS 2</span>
                        </div>

                        <div className="glass-meta-line">
                          <span className="glass-meta-label">Reg No:</span>
                          <span className="glass-meta-val">DOTJSS2-002</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card-divider" />

                    <div className="glass-status-container">
                      <div className="glass-status-box">
                        <span className="glass-status-title">TUITION CLEARANCE</span>
                        <span className="child-clearance-pill pending">
                          <AlertTriangle size={12} /> Pending
                        </span>
                      </div>

                      <div className="glass-status-box text-right">
                        <span className="glass-status-title">TERM REPORT</span>
                        <span className="glass-report-val metric-amber">
                          Restricted
                        </span>
                      </div>
                    </div>

                    <div className="glass-card-footer">
                      <button type="button" className="btn-open-portal" style={{ cursor: 'default' }}>
                        <span>Open Student Portal</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="manual-steps-list">
              <div className="manual-step-item">
                <div className="step-num-badge">1</div>
                <div>
                  <div className="step-content-title">Click "My Kids" on Left Sidebar</div>
                  <div className="step-content-desc">
                    In the left navigation sidebar under <strong>PARENT PORTAL</strong>, click <strong>"My Kids"</strong> to view your children's official school cards.
                  </div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">2</div>
                <div>
                  <div className="step-content-title">Inspect Student Details & Status Badges</div>
                  <div className="step-content-desc">
                    Each card displays your child's student passport avatar, full name, class level (e.g. <em>Junior Secondary JSS 2</em>), unique ID number (e.g. <em>DOTJSS2-002</em>), <strong>Tuition Clearance</strong> status (<em>Pending/Cleared</em>), and <strong>Term Report</strong> status (<em>Restricted/Unlocked</em>).
                  </div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">3</div>
                <div>
                  <div className="step-content-title">Click "Open Student Portal →"</div>
                  <div className="step-content-desc">
                    Click the <strong>"Open Student Portal →"</strong> button at the bottom of the card to enter the full student dashboard for fee payments, report cards, and attendance registers.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CHAPTER 2 */}
          <section id="ch2" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 2</span>
              <h2 className="chapter-title">School Fees & Online Payment Hub</h2>
            </div>

            <p className="manual-text-block">
              The <strong>Fees Tab</strong> allows parents to inspect the exact itemized financial bill for the current academic session and term. You can view total amount billed, amount paid, outstanding balance, and official bank transfer details.
            </p>

            {/* Screenshot Card */}
            <div className="manual-screenshot-card">
              <div className="screenshot-browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot red"></span>
                  <span className="browser-dot yellow"></span>
                  <span className="browser-dot green"></span>
                </div>
                <span className="screenshot-caption-title">Itemized Fee Invoice Breakdown & Bank Details</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_fee_breakdown.jpg', 'School Fees Invoice Breakdown & Bank Account Details')}
              >
                <img
                  src="/manual/parent_fee_breakdown.jpg"
                  alt="Fee Breakdown View"
                  className="manual-screenshot-img"
                />
                <div className="screenshot-zoom-overlay">
                  <Maximize2 size={20} /> Click to expand full screenshot
                </div>
              </div>
            </div>

            <div className="manual-callout important">
              <Info className="callout-icon" size={20} />
              <div>
                <strong>Payment Methods Supported:</strong>
                <br />• <strong>Online Card Payment:</strong> Instant automated credit/debit card processing (Paystack/Flutterwave).
                <br />• <strong>Direct Wire Transfer / Bank Deposit:</strong> Transfer directly into the school's designated bank account listed on the invoice right sidebar.
              </div>
            </div>
          </section>

          {/* CHAPTER 3 */}
          <section id="ch3" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 3</span>
              <h2 className="chapter-title">Uploading Proof of Payment (Bank Teller / Receipt Slip)</h2>
            </div>

            <p className="manual-text-block">
              When you click on the <strong>Upload Bank Invoice / Proof</strong> sub-tab (or click the <strong>Upload Bank Proof</strong> button from your fee summary), you can view the official school bank account details, make your transfer, and submit your receipt for verification.
            </p>

            {/* Form Step-by-Step Instructions */}
            <div className="manual-steps-list">
              <div className="manual-step-item">
                <div className="step-num-badge">1</div>
                <div>
                  <div className="step-content-title">View Official Bank Account Details</div>
                  <div className="step-content-desc">Inspect the school's official bank name (FCMB), account name (DOTMOND SCHOOL), and click <strong>Copy</strong> next to the 10-digit account number (3455888011) to make your mobile transfer or bank deposit.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">2</div>
                <div>
                  <div className="step-content-title">Include Student Reg Ref in Narration</div>
                  <div className="step-content-desc">Always include your child's unique registration reference (e.g. <code>DOTJSS2-002</code>) in your bank transaction narration for fast automated audit clearance.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">3</div>
                <div>
                  <div className="step-content-title">Fill Depositor Full Name</div>
                  <div className="step-content-desc">Type the full name as printed on your bank transfer receipt or paper teller slip.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">4</div>
                <div>
                  <div className="step-content-title">Enter Bank Reference & Amount Paid (₦)</div>
                  <div className="step-content-desc">Enter your bank reference/teller number (e.g. <code>TRF/2026/84920</code>) and the exact amount deposited (e.g. <code>150000</code>).</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">5</div>
                <div>
                  <div className="step-content-title">Upload Transfer Receipt Image / PDF</div>
                  <div className="step-content-desc">Drag and drop or click to upload a clear image/PDF of your payment receipt (Supports JPG, PNG, WEBP, or PDF up to 10MB).</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">6</div>
                <div>
                  <div className="step-content-title">Click "Submit Payment Proof for Verification"</div>
                  <div className="step-content-desc">Submit your payment proof to the bursary audit queue. You can track verification status in your <strong>Payment History & Receipts</strong> sub-tab.</div>
                </div>
              </div>
            </div>

            {/* Screenshot Card */}
            <div className="manual-screenshot-card">
              <div className="screenshot-browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot red"></span>
                  <span className="browser-dot yellow"></span>
                  <span className="browser-dot green"></span>
                </div>
                <span className="screenshot-caption-title">Official Bank Account Details & Submit Payment Proof View</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_proof_upload_form.jpg', 'Official Bank Account Details & Submit Payment Proof View')}
              >
                <img
                  src="/manual/parent_proof_upload_form.jpg"
                  alt="Upload Bank Invoice and Submit Payment Proof View"
                  className="manual-screenshot-img"
                />
                <div className="screenshot-zoom-overlay">
                  <Maximize2 size={20} /> Click to expand full screenshot
                </div>
              </div>
            </div>
          </section>

          {/* CHAPTER 4 */}
          <section id="ch4" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 4</span>
              <h2 className="chapter-title">Accessing & Printing Terminal Report Cards</h2>
            </div>

            <p className="manual-text-block">
              Under the <strong>Academics Tab</strong>, parents can inspect official student broadsheet result cards for any academic term and session.
            </p>

            {/* Screenshot Card */}
            <div className="manual-screenshot-card">
              <div className="screenshot-browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot red"></span>
                  <span className="browser-dot yellow"></span>
                  <span className="browser-dot green"></span>
                </div>
                <span className="screenshot-caption-title">Student Terminal Report Card & Download PDF View</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_report_card_view.jpg', 'Terminal Report Card & Official Stamp View')}
              >
                <img
                  src="/manual/parent_report_card_view.jpg"
                  alt="Report Card View"
                  className="manual-screenshot-img"
                />
                <div className="screenshot-zoom-overlay">
                  <Maximize2 size={20} /> Click to expand full screenshot
                </div>
              </div>
            </div>

            <div className="manual-callout warning">
              <AlertTriangle className="callout-icon" size={20} />
              <div>
                <strong>Notice on Financial Clearance:</strong> If school fees for the active term are pending, the report card viewer will prompt financial clearance. Once your payment receipt is verified by the accountant, the result sheet unlocks automatically.
              </div>
            </div>
          </section>

          {/* CHAPTER 5 */}
          <section id="ch5" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 5</span>
              <h2 className="chapter-title">Academic Performance Trends & Analytics</h2>
            </div>

            <p className="manual-text-block">
              The <strong>Academic Trend</strong> sub-tab provides intuitive graphs visualizing your ward's GPA progress over multiple academic terms. You can review subject strengths, continuous assessment averages, and class percentile rankings.
            </p>

            {/* Screenshot Card */}
            <div className="manual-screenshot-card">
              <div className="screenshot-browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot red"></span>
                  <span className="browser-dot yellow"></span>
                  <span className="browser-dot green"></span>
                </div>
                <span className="screenshot-caption-title">GPA Trajectory & Subject Analysis Graph</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_academic_trend.jpg', 'Academic Trend Trajectory Graph')}
              >
                <img
                  src="/manual/parent_academic_trend.jpg"
                  alt="Academic Trend Graph"
                  className="manual-screenshot-img"
                />
                <div className="screenshot-zoom-overlay">
                  <Maximize2 size={20} /> Click to expand full screenshot
                </div>
              </div>
            </div>
          </section>

          {/* CHAPTER 6 */}
          <section id="ch6" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 6</span>
              <h2 className="chapter-title">Gate Attendance & Real-Time Mobile Push Alerts</h2>
            </div>

            <p className="manual-text-block">
              The school gate system uses automated RFID/barcode turnstiles. Whenever your child scans into campus in the morning or exits at dismissal, exact timestamps are recorded.
            </p>

            {/* Grid of Two Screenshots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Gate Log Screenshot */}
              <div className="manual-screenshot-card">
                <div className="screenshot-browser-bar">
                  <div className="browser-dots">
                    <span className="browser-dot red"></span>
                    <span className="browser-dot yellow"></span>
                    <span className="browser-dot green"></span>
                  </div>
                  <span className="screenshot-caption-title">Daily Gate Attendance Log</span>
                </div>
                <div
                  className="screenshot-image-wrapper"
                  onClick={() => openLightbox('/manual/parent_gate_attendance.jpg', 'Student Gate Attendance Timestamps')}
                >
                  <img
                    src="/manual/parent_gate_attendance.jpg"
                    alt="Gate Attendance"
                    className="manual-screenshot-img"
                  />
                  <div className="screenshot-zoom-overlay">
                    <Maximize2 size={18} /> Expand
                  </div>
                </div>
              </div>

              {/* Push Notification Screenshot */}
              <div className="manual-screenshot-card">
                <div className="screenshot-browser-bar">
                  <div className="browser-dots">
                    <span className="browser-dot red"></span>
                    <span className="browser-dot yellow"></span>
                    <span className="browser-dot green"></span>
                  </div>
                  <span className="screenshot-caption-title">PWA Push Alert Controls</span>
                </div>
                <div
                  className="screenshot-image-wrapper"
                  onClick={() => openLightbox('/manual/parent_push_notifications.jpg', 'Push Notification Alert Toggles')}
                >
                  <img
                    src="/manual/parent_push_notifications.jpg"
                    alt="Push Notification Controls"
                    className="manual-screenshot-img"
                  />
                  <div className="screenshot-zoom-overlay">
                    <Maximize2 size={18} /> Expand
                  </div>
                </div>
              </div>
            </div>

            <div className="manual-callout tip">
              <Bell className="callout-icon" size={20} />
              <div>
                <strong>Enabling Instant Phone Notifications:</strong> Click the <strong>"Enable Push Notifications"</strong> toggle on your mobile browser (PWA) to receive instant arrival & departure sound alerts directly on your smartphone screen.
              </div>
            </div>
          </section>

          {/* CHAPTER 7 - FAQ */}
          <section id="ch7" className="manual-chapter-card">
            <div className="manual-chapter-header">
              <span className="chapter-badge">CHAPTER 7</span>
              <h2 className="chapter-title">Frequently Asked Questions (FAQ)</h2>
            </div>

            <div className="manual-faq-list">
              {[
                {
                  q: 'How long does bank teller verification take after uploading?',
                  a: 'Payment receipt verification is conducted by the school bursary team during business hours (Mon-Fri, 8:00 AM - 4:00 PM). Turnaround time is typically within 1 to 3 hours.',
                },
                {
                  q: 'Can I pay school fees in installments?',
                  a: 'Yes! The school supports partial payment installment options. When uploading proof of payment, enter the exact amount transferred. Your balance on the fee breakdown will auto-update accordingly.',
                },
                {
                  q: 'What should I do if my child\'s name or details are incorrect?',
                  a: 'Please contact the school administrative desk via the support channel or inform the form teacher to update the central student record.',
                },
                {
                  q: 'How do I save a PDF copy of my child\'s report card to my smartphone?',
                  a: 'Open the Academics tab -> Terminal Report Card -> click the blue "Download PDF" or "Print Report" button. You can choose "Save as PDF" on both iOS and Android devices.',
                },
              ].map((faq, idx) => (
                <div key={idx} className={`faq-item-card ${openFaqIndex === idx ? 'open' : ''}`}>
                  <button
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    {openFaqIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="faq-answer-box">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="manual-lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <div className="manual-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span className="lightbox-title">{lightboxImage.title}</span>
              <button className="lightbox-close-btn" onClick={() => setLightboxImage(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="lightbox-img-body">
              <img src={lightboxImage.url} alt={lightboxImage.title} className="lightbox-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
