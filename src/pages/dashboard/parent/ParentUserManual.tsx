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
} from 'lucide-react';
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
              <h2 className="chapter-title">Overview & Managing Wards (My Kids)</h2>
            </div>

            <p className="manual-text-block">
              When logging into the Parent Portal, your home dashboard displays a consolidated view of all children and wards registered under your parent account. You can easily view registration numbers, assigned classes, passport photographs, and financial clearance badges.
            </p>

            <div className="manual-callout tip">
              <Lightbulb className="callout-icon" size={20} />
              <div>
                <strong>Pro-Tip:</strong> If you have multiple children attending the school, click on any child's card to switch the active workspace context to that specific student.
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
                <span className="screenshot-caption-title">Parent Portal - Student Profile Cards View</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_overview_kids.jpg', 'Parent Portal - Student Selector & Overview Page')}
              >
                <img
                  src="/manual/parent_overview_kids.jpg"
                  alt="Student Selector View"
                  className="manual-screenshot-img"
                />
                <div className="screenshot-zoom-overlay">
                  <Maximize2 size={20} /> Click to expand full screenshot
                </div>
              </div>
            </div>

            <div className="manual-steps-list">
              <div className="manual-step-item">
                <div className="step-num-badge">1</div>
                <div>
                  <div className="step-content-title">Select Child Profile</div>
                  <div className="step-content-desc">
                    Click the <strong>"View Profile"</strong> or <strong>"Go to Dashboard"</strong> button under your child's card.
                  </div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">2</div>
                <div>
                  <div className="step-content-title">Check Financial Clearance Badge</div>
                  <div className="step-content-desc">
                    A green <strong>"Paid / Cleared"</strong> badge indicates all compulsory term fees are settled. A red or yellow badge alerts you of outstanding invoices requiring attention.
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
              If you made a bank transfer or over-the-counter deposit at a bank branch, you must submit your transaction receipt slip through the portal for instant verification by the bursary team.
            </p>

            {/* Form Step-by-Step Instructions */}
            <div className="manual-steps-list">
              <div className="manual-step-item">
                <div className="step-num-badge">1</div>
                <div>
                  <div className="step-content-title">Select Invoice</div>
                  <div className="step-content-desc">Choose the pending school fee invoice you are paying for from the dropdown menu.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">2</div>
                <div>
                  <div className="step-content-title">Enter Bank Reference / Teller Number</div>
                  <div className="step-content-desc">Type the unique transaction reference number, bank teller code, or transfer session ID printed on your bank slip.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">3</div>
                <div>
                  <div className="step-content-title">Input Amount Paid & Payment Method</div>
                  <div className="step-content-desc">Specify the exact monetary amount deposited into the school bank account and select Bank Transfer or Teller Deposit.</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">4</div>
                <div>
                  <div className="step-content-title">Attach Receipt Photo / Document</div>
                  <div className="step-content-desc">Upload a clear camera photo or PDF scan of your bank teller slip or bank app transfer screenshot (Max file size: 5MB).</div>
                </div>
              </div>
              <div className="manual-step-item">
                <div className="step-num-badge">5</div>
                <div>
                  <div className="step-content-title">Click "Submit Payment Proof"</div>
                  <div className="step-content-desc">Your upload will immediately enter the bursary review queue. You can track verification status (Pending, Verified, Rejected) in your Payment History tab.</div>
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
                <span className="screenshot-caption-title">Proof of Payment Upload Modal Form</span>
              </div>
              <div
                className="screenshot-image-wrapper"
                onClick={() => openLightbox('/manual/parent_proof_upload_form.jpg', 'Upload Proof of Payment Form Modal')}
              >
                <img
                  src="/manual/parent_proof_upload_form.jpg"
                  alt="Proof Upload Form"
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
