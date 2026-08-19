import React, { useEffect, useState, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useReactToPrint } from 'react-to-print';
import '../students/IdCardPrintModal.css';

interface StaffIdCardPrintModalProps {
  staffId: string;
  onClose: () => void;
}

interface StaffIdCardData {
  staffId: string;
  fullName: string;
  title: string;
  designation: string;
  role: string;
  staffCategory: string;
  formattedStaffCode: string;
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

export default function StaffIdCardPrintModal({ staffId, onClose }: StaffIdCardPrintModalProps) {
  const [loading, setLoading] = useState(true);
  const [idCardData, setIdCardData] = useState<StaffIdCardData | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: idCardData?.fullName ? `${idCardData.fullName}_Staff_ID_Card` : 'Staff_ID_Card',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch staff ID card endpoint data
        const idData = await api.get(`/attendance/staff-id-card/${staffId}`);
        setIdCardData(idData);

        // Fetch school profile metadata
        try {
          const profile = await api.get('/setup/school-profile');
          setSchoolProfile(profile);
        } catch {
          setSchoolProfile({
            schoolName: "DOTMOND SCHOOL",
            address: "Happyland Estate, Ajah, Lagos State, Nigeria",
            logoUrl: "",
            primaryColor: "#000080",
            secondaryColor: "#C4293A",
            currentSession: "2026/2027"
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load staff ID card data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [staffId]);

  if (loading) {
    return (
      <div className="id-card-overlay">
        <div className="id-card-modal-content" style={{ alignItems: 'center' }}>
          <h2>Generating Official Staff ID Card...</h2>
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
    const fullUrl = url.startsWith('/') ? `${API_ROOT}${url}` : url;
    return fullUrl.includes('?') ? `${fullUrl}&t=${Date.now()}` : `${fullUrl}?t=${Date.now()}`;
  };

  const rawSchoolName = schoolProfile?.schoolName || "DOTMOND SCHOOL";
  const fullSchoolTitle = rawSchoolName.toUpperCase();
  const schoolAddress = schoolProfile?.address || "Happyland Estate, Ajah, Lagos State, Nigeria";

  // Avatar Fallback URL generator
  const getAvatarFallback = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000080&color=ffffff&size=256`;
  };

  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

  const formatDisplayName = (rawName: string | undefined | null) => {
    if (!rawName) return 'STAFF MEMBER';
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

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        
        {/* Modal Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }} className="no-print">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#000080' }}>Print Staff ID Card</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => handlePrint()} style={{ fontWeight: 700, background: '#000080', border: 'none' }}>
              🖨️ Print Card
            </button>
          </div>
        </div>

        <div className="id-card-preview-area" ref={printRef}>
          
          {/* ================= FRONT SIDE ================= */}
          <div className="id-card-wrapper">
            <div className="card front">

              {/* Header */}
              <div className="head">
                <div className="head-row">
                  <div className="mark-cell">
                    {schoolProfile?.logoUrl ? (
                      <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.45in', height: 'auto', display: 'block' }} />
                    ) : (
                      <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.45in' }}>
                        <defs>
                          <linearGradient id="stfFlame1" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#E63946"/><stop offset="100%" stopColor="#F4B740"/></linearGradient>
                          <linearGradient id="stfRibbon1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C4293A"/><stop offset="50%" stopColor="#E63946"/><stop offset="100%" stopColor="#C4293A"/></linearGradient>
                        </defs>
                        <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#000080" strokeWidth="10" strokeLinejoin="round"/>
                        <path d="M250,80 L400,133 L400,298 C400,412 330,472 250,510 C170,472 100,412 100,298 L100,133 Z" fill="none" stroke="#F4B740" strokeWidth="4"/>
                        <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#000080">
                          <text x="250.0" y="182.0" textAnchor="middle">RMS</text>
                        </g>
                        <text x="250" y="420" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="23" letterSpacing="5" fill="#000080">SCHOOL</text>
                      </svg>
                    )}
                  </div>
                  <div className="text-cell">
                    <div className="word-dotmond" style={{ color: '#000080', fontWeight: 800 }}>{fullSchoolTitle}</div>
                    <div className="subline" style={{ color: '#000080', fontWeight: 600 }}>{schoolAddress}</div>
                  </div>
                </div>
              </div>

              <div className="rule"></div>
              <div className="id-row" style={{ height: '0.22in', padding: '0.02in 0.16in 0' }}>
                <span className="id-pill" style={{ background: '#000080', color: '#FFFFFF', fontSize: '9px', fontWeight: 800, letterSpacing: '1.2px', padding: '4px 12px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                  STAFF ID
                </span>
              </div>

              {/* Bigger Photo Box (1.75in Height) */}
              <div 
                style={{ 
                  height: '1.75in', 
                  maxHeight: '1.75in', 
                  width: 'calc(100% - 0.32in)', 
                  margin: '0.02in auto 0.04in', 
                  border: '2px solid #000080', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  background: '#F1F5F9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  boxSizing: 'border-box'
                }}
              >
                {idCardData.passportUrl ? (
                  <img 
                    src={getFullUrl(idCardData.passportUrl)} 
                    alt={idCardData.fullName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getAvatarFallback(idCardData.fullName);
                    }}
                  />
                ) : (
                  <img 
                    src={getAvatarFallback(idCardData.fullName)} 
                    alt={idCardData.fullName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>

              {/* Staff Details Section (Pushed Down to Bottom of Card, Centered Navy Text) */}
              <div style={{ padding: '0.02in 0.10in 0.08in', background: '#FFFFFF', textAlign: 'center' }}>
                <div style={{ 
                  fontFamily: "Georgia, 'Times New Roman', serif", 
                  fontWeight: 800, 
                  fontSize: '11px', 
                  letterSpacing: '0.2px', 
                  color: '#000080', 
                  textTransform: 'uppercase',
                  margin: '0 0 2px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  {formatDisplayName(idCardData.fullName)}
                </div>
                
                <div style={{ fontSize: '8.5px', color: '#000080', fontWeight: 700, margin: '1px 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {idCardData.designation ? idCardData.designation.toUpperCase() : idCardData.role.toUpperCase()}
                </div>

                <div style={{ margin: '3px 0 0 0' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    background: '#EFF6FF', 
                    border: '1.5px solid #93C5FD', 
                    color: '#000080', 
                    fontWeight: 800, 
                    fontSize: '9px', 
                    padding: '3px 12px', 
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    STAFF ID: {idCardData.formattedStaffCode}
                  </span>
                </div>
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
                      <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.45in', height: 'auto', display: 'block' }} />
                    ) : (
                      <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.45in' }}>
                        <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#000080" strokeWidth="10" strokeLinejoin="round"/>
                        <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#000080">
                          <text x="250.0" y="182.0" textAnchor="middle">RMS</text>
                        </g>
                        <text x="250" y="420" textAnchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="23" letterSpacing="5" fill="#000080">SCHOOL</text>
                      </svg>
                    )}
                  </div>
                  <div className="text-cell">
                    <div className="word-dotmond" style={{ color: '#000080', fontWeight: 800 }}>{fullSchoolTitle}</div>
                    <div className="subline" style={{ color: '#000080', fontWeight: 600 }}>Attendance &amp; Identification System</div>
                  </div>
                </div>
              </div>

              <div className="rule"></div>

              <p className="notice" style={{ color: '#000080', fontWeight: 600 }}>
                This card is the property of {fullSchoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
              </p>

              <div className="rule"></div>

              {/* Barcode & Gate Scan QR Code Section */}
              <div className="scan-block" style={{ height: '1.58in', marginTop: '0.02in', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="scan-label" style={{ color: '#000080', fontSize: '9px', fontWeight: 800, letterSpacing: '1.2px', marginBottom: '4px' }}>
                  SCAN TO CLOCK IN
                </div>
                <div className="qr-wrap" style={{ width: '1.15in', height: '1.15in', padding: '5px', background: '#FFFFFF', border: '2px solid #CBD5E1', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)', display: 'block' }}>
                  <div className="cell" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idCardData.qrCodeSvg && (
                      <img
                        src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                        alt="Staff Gate Scan QR Code"
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                </div>
                <span className="encoded-pill" style={{ background: '#000080', color: '#FFFFFF', fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', padding: '3px 10px', borderRadius: '12px', marginTop: '6px' }}>
                  ENCODED ID: {idCardData.formattedStaffCode}
                </span>
              </div>

              {/* Authorised Signature Line */}
              <div className="sig-block" style={{ margin: '0.02in 0.16in 0', textAlign: 'center', position: 'relative', zIndex: 5 }}>
                {principalSig ? (
                  <img src={getFullUrl(principalSig)} alt="Principal Signature" style={{ height: '0.20in', display: 'block', margin: '0 auto -2px', objectFit: 'contain' }} />
                ) : null}
                <div className="sig-line" style={{ borderTop: '1px solid #000080', width: '100%', margin: '0 auto 2px' }}></div>
                <div style={{ fontSize: '7.5px', color: '#000080', fontWeight: 700, letterSpacing: '0.2px' }}>
                  Signed ....................................................
                </div>
              </div>

              {/* Reduced Compact Footer */}
              <div className="foot-strip compact-back-footer" style={{ height: '0.24in', background: '#000040', borderTop: '2px solid #C4293A' }}>
                <div className="cell" style={{ textAlign: 'center', width: '100%', fontSize: '7.5px', color: '#FFFFFF', padding: '0 4px', lineHeight: 1 }}>
                  Powered by NEOTRO ATTENDANCE SYSTEM
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
