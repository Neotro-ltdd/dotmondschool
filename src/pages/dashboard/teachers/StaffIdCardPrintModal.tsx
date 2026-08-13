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
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  const rawSchoolName = schoolProfile?.schoolName || "DOTMOND SCHOOL";
  const fullSchoolTitle = rawSchoolName.toUpperCase();
  const schoolAddress = schoolProfile?.address || "Happyland Estate, Ajah, Lagos State, Nigeria";

  // Avatar Fallback URL generator
  const getAvatarFallback = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000080&color=ffffff&size=256`;
  };

  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        
        {/* Modal Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }} className="no-print">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#000080' }}>Print Staff ID Card</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#5B6063' }}>
              Standard CR80 2-Sided Portrait Layout (2.125″ × 3.375″). Front &amp; Back.
            </p>
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
                    <div className="word-dotmond">{fullSchoolTitle}</div>
                    <div className="subline">{schoolAddress}</div>
                  </div>
                </div>
              </div>

              <div className="rule"></div>
              <div className="id-row"><span className="id-pill" style={{ background: '#000080' }}>STAFF ID</span></div>

              {/* Photo Box (Strictly Constrained 1.05in Height to fit Name & Role) */}
              <div 
                style={{ 
                  height: '1.05in', 
                  maxHeight: '1.05in', 
                  width: '1.05in', 
                  margin: '0.03in auto', 
                  border: '2px solid #000080', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  background: '#F1F5F9',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
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

              {/* Staff Details Section (White Background, Centered Navy Blue Text) */}
              <div style={{ padding: '0.04in 0.10in 0', background: '#FFFFFF', textAlign: 'center' }}>
                <div style={{ 
                  fontFamily: "Georgia, 'Times New Roman', serif", 
                  fontWeight: 800, 
                  fontSize: '10.5px', 
                  letterSpacing: '0.2px', 
                  color: '#000080', 
                  textTransform: 'uppercase',
                  margin: '0 0 2px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  {idCardData.fullName}
                </div>
                
                <div style={{ fontSize: '8px', color: '#334155', fontWeight: 700, margin: '2px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {idCardData.designation ? idCardData.designation.toUpperCase() : idCardData.role.toUpperCase()}
                </div>

                <div style={{ margin: '3px 0 0 0' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    background: '#EFF6FF', 
                    border: '1px solid #BFDBFE', 
                    color: '#1D4ED8', 
                    fontWeight: 800, 
                    fontSize: '8px', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}>
                    CÓD. ID: {idCardData.formattedStaffCode}
                  </span>
                </div>
              </div>

              {/* Red/Gold Bordered Footer Strip */}
              <div className="foot-strip" style={{ background: '#000040', borderTop: '2px solid #C4293A' }}>
                <div className="cell">VALIDADE</div>
                <div className="cell">{idCardData.validPeriod}</div>
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
                    <div className="word-dotmond">{fullSchoolTitle}</div>
                    <div className="subline">Attendance &amp; Identification System</div>
                  </div>
                </div>
              </div>

              <div className="rule"></div>

              <p className="notice">
                This card is the property of {fullSchoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
              </p>

              <div className="rule"></div>

              {/* Barcode & Gate Scan QR Code Section */}
              <div className="scan-block">
                <div className="scan-label" style={{ color: '#000080' }}>SCAN TO CLOCK IN</div>
                <div className="qr-wrap">
                  <div className="cell">
                    {idCardData.qrCodeSvg && (
                      <img
                        src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                        alt="Staff Gate Scan QR Code"
                      />
                    )}
                  </div>
                </div>
                <span className="encoded-pill" style={{ background: '#000080', color: '#FFFFFF' }}>
                  ENCODED ID: {idCardData.formattedStaffCode}
                </span>
              </div>

              {/* Authorised Signature Line */}
              {principalSig ? (
                <div className="sig">
                  <img src={getFullUrl(principalSig)} alt="Principal Signature" style={{ height: '0.22in', display: 'block', margin: '0 auto 2px' }} />
                  <div className="line"></div>
                  <div className="cap">Authorised Signature</div>
                </div>
              ) : null}

              {/* Footer Strip */}
              <div className="foot-strip" style={{ background: '#000040', borderTop: '2px solid #C4293A' }}>
                <div className="cell" style={{ textAlign: 'center', width: '100%' }}>
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
