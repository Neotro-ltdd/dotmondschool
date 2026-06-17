import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tenants, defaultTenantId } from '../config/tenantConfig';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Resolve tenant based on ?school= URL param
  const schoolParam = searchParams.get('school')?.toLowerCase();
  const currentTenant = schoolParam && tenants[schoolParam] ? tenants[schoolParam] : tenants[defaultTenantId];

  // Map tenant colors to CSS variables inline
  const themeStyles = {
    '--indigo': currentTenant.colors.indigo,
    '--indigo-dark': currentTenant.colors.indigoDark,
    '--gold': currentTenant.colors.gold,
    '--gold-dark': currentTenant.colors.goldDark,
    '--sage': currentTenant.colors.sage,
    '--sage-bg': currentTenant.colors.sageBg,
    '--terracotta': currentTenant.colors.terracotta,
    '--terracotta-bg': currentTenant.colors.terracottaBg,
  } as React.CSSProperties;

  return (
    <div className="landing-container" style={themeStyles}>
      <nav className="nav">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-mark" style={{ fontSize: currentTenant.shortName.length > 3 ? '12px' : '15px' }}>
              {currentTenant.shortName}
            </div>
            <div>
              <div className="brand-name">{currentTenant.name}</div>
              <div className="brand-sub">Powered by Neotro SMS</div>
            </div>
          </div>
          <div className="nav-links">
            <a className="nav-link" href="#modules">Modules</a>
            <a className="nav-link" href="#audience">Who it's for</a>
            <a className="nav-link" href="#">Admissions</a>
            <a className="nav-link" href="#">Support</a>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Portal login</button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">Pre-nursery — SS3 · {currentTenant.location}</div>
          <h1 className="display">You'll know the<br />moment they're <em>safely<br />through the gate.</em></h1>
          <p className="lede">Every {currentTenant.shortName} student taps their ID card at the gate. You get an SMS the second they arrive — and another the second they leave. No app to check, no waiting for a phone call.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to my portal</button>
            <a href="#tap-in" className="btn btn-ghost">See how it works</a>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <span className="trust-num">&lt;3s</span>
              <span className="trust-label">From tap to<br />SMS sent</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">2×</span>
              <span className="trust-label">Daily alerts —<br />in and out</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">100%</span>
              <span className="trust-label">Of taps logged<br />to attendance</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-frame">
            <div className="phone-notch"></div>
            <div className="phone-screen">
              <div className="sms-bubble" style={{ animationDelay: '.3s' }}>
                <div className="sms-meta"><span className="sms-from">{currentTenant.name}</span><span className="sms-time">7:42 AM</span></div>
                <p>{currentTenant.studentName} arrived at school safely at 7:42 AM. — {currentTenant.name}</p>
              </div>
              <div className="sms-bubble" style={{ animationDelay: '1.4s' }}>
                <div className="sms-meta"><span className="sms-from">{currentTenant.name}</span><span className="sms-time">3:15 PM</span></div>
                <p>{currentTenant.studentName} left school at 3:15 PM. Have a good evening. — {currentTenant.name}</p>
              </div>
            </div>
          </div>

          <div className="tap-card">
            <div className="tap-card-top">
              <div className="card-id-mark" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{currentTenant.shortName}</div>
              <span>Student ID</span>
            </div>
            <div className="tap-card-photo"></div>
            <p className="tap-card-name">{currentTenant.studentName}</p>
            <span className="tap-card-class">{currentTenant.studentClass}</span>
            <div className="tap-wave">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div className="scribble"><span>Tap.<br />Notified.</span></div>
        </div>
      </section>

      <section className="howit" id="tap-in">
        <div className="howit-inner">
          <div className="section-eyebrow">The selling point</div>
          <h2 className="display">Two taps a day.<br />Two texts to you.</h2>
          <p className="howit-lede">No app to open, no portal to check while you're at work. The school gate does the work — your phone just receives the answer.</p>

          <div className="howit-flow">
            <div className="flow-step">
              <div className="flow-icon icon-indigo">🪪</div>
              <span className="flow-tag">Morning</span>
              <h3>Student taps in</h3>
              <p>{currentTenant.studentName.split(' ')[0]} scans her ID card at the gate scanner on arrival — no queue, no sign-in book.</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon icon-sage">📨</div>
              <span className="flow-tag">Within seconds</span>
              <h3>You get an SMS</h3>
              <p>"{currentTenant.studentName} arrived at school safely at 7:42 AM." Sent straight to the number on file — no app required.</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon icon-gold">🪪</div>
              <span className="flow-tag">Afternoon</span>
              <h3>Student taps out</h3>
              <p>Same card, same scanner, on the way out. The system logs the exact time she left.</p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="flow-icon icon-sage">📨</div>
              <span className="flow-tag">Within seconds</span>
              <h3>A second SMS</h3>
              <p>"{currentTenant.studentName} left school at 3:15 PM." You know she's on her way before she's out of sight.</p>
            </div>
          </div>

          <div className="howit-why">
            <div className="why-item">
              <div className="why-mark">i</div>
              <div>
                <h4>Information</h4>
                <p>Attendance registers itself. No teacher chasing a paper sheet, no end-of-term surprise about how many days were missed.</p>
              </div>
            </div>
            <div className="why-item">
              <div className="why-mark">s</div>
              <div>
                <h4>Security</h4>
                <p>If a card isn't tapped by the usual time, the gap is visible immediately — not discovered hours later.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ledger-section">
        <div className="ledger-inner">
          <div className="ledger-head">
            <h2>And it all still lands in one record</h2>
            <p>Every tap, score, invoice and lesson feeds the same student file — attendance just happens to be the one that texts you.</p>
          </div>
          <div className="ledger-table">
            <div className="ledger-col-head">
              <span>Module</span><span>This term</span><span>Status</span><span>Last updated</span><span>Owner</span>
            </div>
            <div className="ledger-row">
              <div className="ledger-mod">
                <div className="ledger-icon icon-sage" style={{ background: 'rgba(92,131,99,0.18)', color: '#9CC4A2' }}>🗓</div>
                <div><div className="ledger-mod-name">Attendance</div><div className="ledger-mod-tag">AAS · gate scan + SMS</div></div>
              </div>
              <div className="ledger-val">96% avg</div>
              <div><span className="pill pill-good">Live</span></div>
              <div className="ledger-val">9:02 AM</div>
              <div className="ledger-val">Gate scanner</div>
            </div>
            <div className="ledger-row">
              <div className="ledger-mod">
                <div className="ledger-icon icon-indigo" style={{ background: 'rgba(127,119,221,0.18)', color: '#C4BFF2' }}>📊</div>
                <div><div className="ledger-mod-name">Results</div><div className="ledger-mod-tag">RMS</div></div>
              </div>
              <div className="ledger-val">3rd term</div>
              <div><span className="pill pill-good">Published</span></div>
              <div className="ledger-val">Today</div>
              <div className="ledger-val">Class teachers</div>
            </div>
            <div className="ledger-row">
              <div className="ledger-mod">
                <div className="ledger-icon icon-gold" style={{ background: 'rgba(232,163,61,0.18)', color: 'var(--gold)' }}>💳</div>
                <div><div className="ledger-mod-name">Fees</div><div className="ledger-mod-tag">FMS</div></div>
              </div>
              <div className="ledger-val">3rd term</div>
              <div><span className="pill pill-warn">12 pending</span></div>
              <div className="ledger-val">Yesterday</div>
              <div className="ledger-val">Bursary</div>
            </div>
            <div className="ledger-row">
              <div className="ledger-mod">
                <div className="ledger-icon" style={{ background: 'rgba(212,83,126,0.18)', color: '#F0A8C0' }}>📚</div>
                <div><div className="ledger-mod-name">Learning</div><div className="ledger-mod-tag">LMS</div></div>
              </div>
              <div className="ledger-val">14 modules</div>
              <div><span className="pill pill-good">Active</span></div>
              <div className="ledger-val">2 hrs ago</div>
              <div className="ledger-val">Subject staff</div>
            </div>
          </div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-head">
          <div className="section-eyebrow">What's inside</div>
          <h2>Four systems, built<br />to work as one.</h2>
          <p>Each module solves a problem a Nigerian school actually has — not a generic feature checklist.</p>
        </div>

        <div className="module-grid">
          <div className="module-card">
            <span className="module-num">01 / Attendance</span>
            <div className="module-icon icon-sage">🗓</div>
            <h3>Daily Attendance</h3>
            <p>Every tap of a student's ID card at the gate logs the time and fires an SMS to their parent — arrival and departure, automatically.</p>
            <a href="#tap-in" className="module-link">See how a tap becomes a text →</a>
          </div>
          <div className="module-card">
            <span className="module-num">02 / Results</span>
            <div className="module-icon icon-indigo">📊</div>
            <h3>Result Management</h3>
            <p>Teachers enter scores once. The system grades, ranks and compiles report cards for every term, term after term, with no re-typing.</p>
            <a href="#" className="module-link">See a sample result sheet →</a>
          </div>
          <div className="module-card">
            <span className="module-num">03 / Fees</span>
            <div className="module-icon icon-gold">💳</div>
            <h3>Fee Management</h3>
            <p>Invoices go out automatically each term. Part-payments are tracked to the naira, so no parent or bursar loses track of a balance.</p>
            <a href="#" className="module-link">See payment options →</a>
          </div>
          <div className="module-card">
            <span className="module-num">04 / Learning</span>
            <div className="module-icon icon-terra">📚</div>
            <h3>Learning Resources</h3>
            <p>Subject teachers post notes, assignments and class materials to one shared shelf — organised by class, term and subject.</p>
            <a href="#" className="module-link">Browse a class shelf →</a>
          </div>
        </div>
      </section>

      <section className="audience" id="audience">
        <div className="audience-inner">
          <div className="section-head" style={{ marginBottom: '0' }}>
            <div className="section-eyebrow">Who logs in</div>
            <h2>Three people, three<br />reasons to open the portal.</h2>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-tag">Parent</div>
              <h3>Stay close, without<br />visiting the office</h3>
              <ul>
                <li>Get an SMS the second your child taps in, and again when they leave</li>
                <li>Check this term's result the day it's released</li>
                <li>Get an SMS the moment a fee invoice is due</li>
              </ul>
            </div>
            <div className="audience-card">
              <div className="audience-tag">Teacher</div>
              <h3>Less marking admin,<br />more actual teaching</h3>
              <ul>
                <li>Enter scores once — report cards build themselves</li>
                <li>Mark a register in under a minute, from a phone</li>
                <li>Share class notes without a single printout</li>
              </ul>
            </div>
            <div className="audience-card">
              <div className="audience-tag">Administrator</div>
              <h3>One view of every<br />class, term and account</h3>
              <ul>
                <li>See which classes still have unpaid balances</li>
                <li>Approve results before they reach a parent</li>
                <li>Pull enrolment and attendance trends in seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-box">
          <div>
            <h2 className="display">Ready to see your child's record?</h2>
            <p>Parents, staff and students all sign in through the same portal — just with different keys to different rooms.</p>
          </div>
          <div className="cta-actions">
            <button className="btn btn-gold" onClick={() => navigate('/login')}>Log in to the portal</button>
            <a href="#" className="btn" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>Request a school tour</a>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <p>{currentTenant.name}, {currentTenant.location} — system by Neotro Ltd</p>
          <div className="footer-links">
            <a href="#">Admissions</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
