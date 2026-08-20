import React, { useEffect, useState, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useReactToPrint } from 'react-to-print';
import './IdCardPrintModal.css';
import '../vendor/VendorHub.css';

interface IdCardPrintModalProps {
  studentId: string;
  onClose: () => void;
}

interface IdCardData {
  studentId: string;
  fullName: string;
  section: string;
  registrationNumber: string;
  validPeriod: string;
  passportUrl: string;
  qrCodeSvg: string;
}

interface SchoolProfile {
  schoolName: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  currentSession: string;
  principalSignatureUrl?: string;
  signatureUrl?: string;
}

export default function IdCardPrintModal({ studentId, onClose }: IdCardPrintModalProps) {
  const [loading, setLoading] = useState(true);
  const [idCardData, setIdCardData] = useState<IdCardData | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: idCardData?.fullName ? `${idCardData.fullName}_ID_Card` : 'ID_Card',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch student ID data
        const idData = await api.get(`/attendance/id-card/${studentId}`);
        setIdCardData(idData);

        // Fetch school profile
        try {
          const profile = await api.get('/setup/school-profile');
          setSchoolProfile(profile);
        } catch (profileErr) {
          setSchoolProfile({
            schoolName: "DOTMOND SCHOOL",
            address: "Happyland Estate, Ajah, Lagos State, Nigeria",
            logoUrl: "",
            primaryColor: "#12386E",
            secondaryColor: "#C4293A",
            currentSession: "2026/2027"
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load ID card data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="id-card-overlay">
        <div className="id-card-modal-content" style={{ alignItems: 'center' }}>
          <h2>Generating Official ID Card...</h2>
        </div>
      </div>
    );
  }

  if (error || !idCardData) {
    return (
      <div className="id-card-overlay">
        <div className="id-card-modal-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  // 1. School Name Single Line Display ("DOTMOND SCHOOL")
  const rawSchoolName = schoolProfile?.schoolName || "DOTMOND SCHOOL";
  const fullSchoolTitle = rawSchoolName.toUpperCase();
  const schoolAddress = schoolProfile?.address || "Happyland Estate, Ajah, Lagos State, Nigeria";
  
  // 2. Active System Academic Session / Calculated Validity Period (e.g. "2026/2027 - 2028/2029")
  const activeSession = idCardData.validPeriod || schoolProfile?.currentSession || "2026/2027";

  // 3. Principal Signature Check
  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

  const formatStudentDisplayName = (rawName: string | undefined | null) => {
    if (!rawName) return 'STUDENT';
    const trimmed = rawName.trim();

    let surname = '';
    let firstAndMiddle = '';

    if (trimmed.includes(',')) {
      const commaParts = trimmed.split(',').map(s => s.trim());
      surname = commaParts[0].toUpperCase();
      firstAndMiddle = commaParts.slice(1).join(' ').trim();
    } else {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      surname = parts[0]?.toUpperCase() || '';
      firstAndMiddle = parts.slice(1).join(' ').trim();
    }

    if (!firstAndMiddle) return surname;

    const restParts = firstAndMiddle.split(/\s+/).filter(Boolean);
    const firstName = restParts[0].toUpperCase();

    if (restParts.length === 1) {
      return `${surname}, ${firstName}`;
    }

    const abbreviatedOthers = restParts.slice(1).map(p => {
      if (p.length <= 2 && p.endsWith('.')) return p.toUpperCase();
      return `${p[0].toUpperCase()}.`;
    }).join(' ');

    return `${surname}, ${firstName} ${abbreviatedOthers}`.trim();
  };

  // Helper to calculate Class range based on validity period years (e.g., "JSS 2" + 2 years -> "JSS 2 - JSS 3")
  const calculateClassRange = (rawClass: string | undefined | null, validPeriodStr: string) => {
    if (!rawClass) return '';
    const trimmedClass = rawClass.trim();

    let durationYears = 1;
    if (validPeriodStr) {
      const parts = validPeriodStr.split(/[-–—]|to/i).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const firstMatch = parts[0].match(/(\d{4})/);
        const secondMatch = parts[parts.length - 1].match(/(\d{4})/);
        if (firstMatch && secondMatch) {
          const startYr = parseInt(firstMatch[1], 10);
          const endYr = parseInt(secondMatch[1], 10);
          if (endYr > startYr) {
            durationYears = endYr - startYr + 1;
          }
        }
      }
    }

    if (durationYears <= 1) {
      return trimmedClass;
    }

    const match = trimmedClass.match(/^([A-Za-z\s]+?)\s*(\d+)$/);
    if (match) {
      const prefix = match[1].trim();
      const startNum = parseInt(match[2], 10);
      const endNum = startNum + durationYears - 1;
      const hasSpace = /\s\d+$/.test(trimmedClass);
      const sep = hasSpace ? ' ' : '';
      return `${prefix}${sep}${startNum} - ${prefix}${sep}${endNum}`;
    }

    return trimmedClass;
  };

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        
        {/* Modal Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }} className="no-print">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#12386E' }}>Print Student ID Card</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: 700, background: '#12386E', border: 'none' }}>
              🖨️ Print Card
            </button>
          </div>
        </div>

        <div className="id-card-preview-area" ref={printRef}>
          
          {/* ================= FRONT SIDE ================= */}
          <div className="id-card-wrapper">
            <div className="card front">

              {/* Header with school details */}
              <div className="head">
                <div className="head-row">
                  <div className="mark-cell">
                    {schoolProfile?.logoUrl ? (
                      <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.38in', height: 'auto', display: 'block' }} />
                    ) : (
                      <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.38in' }}>
                        <defs>
                          <linearGradient id="fFlame1" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#E63946"/><stop offset="100%" stopColor="#F4B740"/></linearGradient>
                          <linearGradient id="fRibbon1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C4293A"/><stop offset="50%" stopColor="#E63946"/><stop offset="100%" stopColor="#C4293A"/></linearGradient>
                        </defs>
                        <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#12386E" strokeWidth="10" strokeLinejoin="round"/>
                        <path d="M250,80 L400,133 L400,298 C400,412 330,472 250,510 C170,472 100,412 100,298 L100,133 Z" fill="none" stroke="#F4B740" strokeWidth="4"/>
                        <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#12386E">
                          <text x="136.7" y="239.7" transform="rotate(-54.0 136.7 239.7)" textAnchor="middle">D</text>
                          <text x="167.7" y="208.7" transform="rotate(-36.0 167.7 208.7)" textAnchor="middle">O</text>
                          <text x="206.7" y="188.9" transform="rotate(-18.0 206.7 188.9)" textAnchor="middle">T</text>
                          <text x="250.0" y="182.0" textAnchor="middle">M</text>
                          <text x="293.3" y="188.9" transform="rotate(18.0 293.3 188.9)" textAnchor="middle">O</text>
                          <text x="332.3" y="208.7" transform="rotate(36.0 332.3 208.7)" textAnchor="middle">N</text>
                          <text x="363.3" y="239.7" transform="rotate(54.0 363.3 239.7)" textAnchor="middle">D</text>
                        </g>
                        <path d="M188,233 Q250,243 312,233" fill="none" stroke="#F4B740" strokeWidth="3"/>
                        <line x1="250" y1="300" x2="250" y2="365" stroke="#12386E" strokeWidth="4"/>
                        <path d="M250,308 C215,290 175,294 152,312 C150,313 150,315 150,317 L150,352 C150,354 152,355 154,354 C177,340 215,338 250,354 Z" fill="#12386E"/>
                        <path d="M250,308 C285,290 325,294 348,312 C350,313 350,315 350,317 L350,352 C350,354 348,355 346,354 C323,340 285,338 250,354 Z" fill="#12386E"/>
                        <path d="M250,204 C238,222 226,238 226,254 C226,272 237,284 250,284 C263,284 274,272 274,254 C274,238 262,222 250,204 Z" fill="url(#fFlame1)"/>
                        <text x="250" y="420" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="23" letterSpacing="5" fill="#12386E">SCHOOL</text>
                        <g>
                          <path d="M40,555 L100,540 L100,600 L40,615 L64,578 Z" fill="#9F1D2C"/>
                          <path d="M460,555 L400,540 L400,600 L460,615 L436,578 Z" fill="#9F1D2C"/>
                          <path d="M95,538 Q250,518 405,538 L405,602 Q250,584 95,602 Z" fill="url(#fRibbon1)"/>
                          <text x="250" y="576" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="16" letterSpacing="0.5" fill="#FFFFFF">STEADY PROGRESS, BRIGHTER FUTURE</text>
                        </g>
                      </svg>
                    )}
                  </div>
                  <div className="text-cell">
                    <div className="word-dotmond">{fullSchoolTitle}</div>
                    <div className="subline-addr">{schoolAddress}</div>
                  </div>
                </div>
              </div>

              <div className="top-divider-row">
                <div className="divider-line"></div>
                <span className="id-pill">STUDENT ID</span>
              </div>

              {/* Large Passport Box */}
              <div className="large-photo-box">
                {idCardData.passportUrl ? (
                  <img src={getFullUrl(idCardData.passportUrl)} alt="Student" className="student-photo-img" />
                ) : (
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="38" r="20" fill="#B9C2CA"/>
                    <path d="M12,98 C12,72 28,58 50,58 C72,58 88,72 88,98 Z" fill="#B9C2CA"/>
                  </svg>
                )}
              </div>

              {/* Slanted Navy Student Name Band */}
              <div className="slanted-name-band">
                <div className="name">{formatStudentDisplayName(idCardData.fullName)}</div>
                <div className="field"><b>Student No:</b> {idCardData.registrationNumber}</div>
                {idCardData.section && (
                  <div className="field">
                    <b>Class:</b> {calculateClassRange(idCardData.section, activeSession)}
                  </div>
                )}
              </div>

              <div className="red-accent-line"></div>

              {/* Red Bordered Footer Strip */}
              <div className="foot-strip">
                <div>VALID</div>
                <div>{activeSession}</div>
              </div>

            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="id-card-wrapper">
            <div className="card back">

              {/* Header */}
              <div className="head">
                <div className="head-row">
                  <div className="mark-cell">
                    {schoolProfile?.logoUrl ? (
                      <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.38in', height: 'auto', display: 'block' }} />
                    ) : (
                      <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.38in' }}>
                        <defs>
                          <linearGradient id="fFlame2" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#E63946"/><stop offset="100%" stopColor="#F4B740"/></linearGradient>
                          <linearGradient id="fRibbon2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C4293A"/><stop offset="50%" stopColor="#E63946"/><stop offset="100%" stopColor="#C4293A"/></linearGradient>
                        </defs>
                        <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#12386E" strokeWidth="10" strokeLinejoin="round"/>
                        <path d="M250,80 L400,133 L400,298 C400,412 330,472 250,510 C170,472 100,412 100,298 L100,133 Z" fill="none" stroke="#F4B740" strokeWidth="4"/>
                        <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#12386E">
                          <text x="136.7" y="239.7" transform="rotate(-54.0 136.7 239.7)" textAnchor="middle">D</text>
                          <text x="167.7" y="208.7" transform="rotate(-36.0 167.7 208.7)" textAnchor="middle">O</text>
                          <text x="206.7" y="188.9" transform="rotate(-18.0 206.7 188.9)" textAnchor="middle">T</text>
                          <text x="250.0" y="182.0" textAnchor="middle">M</text>
                          <text x="293.3" y="188.9" transform="rotate(18.0 293.3 188.9)" textAnchor="middle">O</text>
                          <text x="332.3" y="208.7" transform="rotate(36.0 332.3 208.7)" textAnchor="middle">N</text>
                          <text x="363.3" y="239.7" transform="rotate(54.0 363.3 239.7)" textAnchor="middle">D</text>
                        </g>
                        <path d="M188,233 Q250,243 312,233" fill="none" stroke="#F4B740" strokeWidth="3"/>
                        <line x1="250" y1="300" x2="250" y2="365" stroke="#12386E" strokeWidth="4"/>
                        <path d="M250,308 C215,290 175,294 152,312 C150,313 150,315 150,317 L150,352 C150,354 152,355 154,354 C177,340 215,338 250,354 Z" fill="#12386E"/>
                        <path d="M250,308 C285,290 325,294 348,312 C350,313 350,315 350,317 L350,352 C350,354 348,355 346,354 C323,340 285,338 250,354 Z" fill="#12386E"/>
                        <path d="M250,204 C238,222 226,238 226,254 C226,272 237,284 250,284 C263,284 274,272 274,254 C274,238 262,222 250,204 Z" fill="url(#fFlame2)"/>
                        <text x="250" y="420" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="23" letterSpacing="5" fill="#12386E">SCHOOL</text>
                        <g>
                          <path d="M40,555 L100,540 L100,600 L40,615 L64,578 Z" fill="#9F1D2C"/>
                          <path d="M460,555 L400,540 L400,600 L460,615 L436,578 Z" fill="#9F1D2C"/>
                          <path d="M95,538 Q250,518 405,538 L405,602 Q250,584 95,602 Z" fill="url(#fRibbon2)"/>
                          <text x="250" y="576" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="16" letterSpacing="0.5" fill="#FFFFFF">STEADY PROGRESS, BRIGHTER FUTURE</text>
                        </g>
                      </svg>
                    )}
                  </div>
                  <div className="text-cell">
                    <div className="word-dotmond">DOTMOND SCHOOL</div>
                    <div className="subline">Attendance &amp; Identification System</div>
                  </div>
                </div>
              </div>

              <div className="rule"></div>

              <p className="notice">
                This card is the property of Dotmond Primary &amp; Secondary School. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
              </p>

              <div className="rule"></div>

              {/* Barcode & Gate Scan QR Code Section */}
              <div className="scan-block">
                <div className="scan-label">
                  SCAN TO CLOCK IN
                </div>
                <div className="qr-wrap">
                  <div className="cell">
                    {idCardData.qrCodeSvg && (
                      <img
                        src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                        alt="Student Gate Scan QR Code"
                      />
                    )}
                  </div>
                </div>
                <span className="encoded-pill">
                  ENCODED ID: {idCardData.registrationNumber}
                </span>
              </div>

              {/* Authorised Signature Line */}
              <div className="sig-block">
                {principalSig ? (
                  <img 
                    src={getFullUrl(principalSig)} 
                    alt="Principal Signature" 
                    className="sig-img"
                  />
                ) : null}
                <div className="sig-line-text">
                  Authorised Signature
                </div>
              </div>

              {/* Reduced Compact Footer */}
              <div className="foot-strip compact-back-footer">
                <div>Powered by NEOTRO ATTENDANCE SYSTEM</div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
