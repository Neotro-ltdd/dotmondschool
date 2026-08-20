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
            <div className="card staff-card front">
              <div className="card-header">
                {schoolProfile?.logoUrl ? (
                  <img src={getFullUrl(schoolProfile.logoUrl)} alt="School Logo" />
                ) : (
                  <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px' }}>
                    <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#0B2545" strokeWidth="10"/>
                    <g font-family="Georgia,serif" font-weight="700" font-size="40" fill="#0B2545"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                  </svg>
                )}
                <div>
                  <div className="school-name">{fullSchoolTitle}</div>
                  <div className="school-addr">{schoolAddress}</div>
                </div>
              </div>

              <div className="accent-rule"></div>
              <div className="id-tag">STAFF IDENTIFICATION</div>

              <div className="large-photo-box">
                {idCardData.passportUrl ? (
                  <img 
                    src={getFullUrl(idCardData.passportUrl)} 
                    alt={idCardData.fullName} 
                    className="student-photo-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getAvatarFallback(idCardData.fullName);
                    }}
                  />
                ) : (
                  <img 
                    src={getAvatarFallback(idCardData.fullName)} 
                    alt={idCardData.fullName} 
                    className="student-photo-img"
                  />
                )}
              </div>

              <div className="name-block">
                <div className="name">{formatDisplayName(idCardData.fullName)}</div>
                <div className="name-underline"></div>
                <div className="meta-row"><span className="lbl">ROLE:</span>{(idCardData.designation || idCardData.role || 'Teacher').toUpperCase()}</div>
                <div className="meta-row"><span className="lbl">STAFF ID:</span>{idCardData.formattedStaffCode}</div>
                <div className="bottom-accent-rule"></div>
                <div className="bottom-school-watermark">{fullSchoolTitle}</div>
              </div>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="id-card-wrapper">
            <div className="card staff-card back">
              <div className="card-header">
                {schoolProfile?.logoUrl ? (
                  <img src={getFullUrl(schoolProfile.logoUrl)} alt="School Logo" />
                ) : (
                  <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '32px' }}>
                    <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#0B2545" strokeWidth="10"/>
                    <g font-family="Georgia,serif" font-weight="700" font-size="40" fill="#0B2545"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                  </svg>
                )}
                <div>
                  <div className="school-name">{fullSchoolTitle}</div>
                  <div className="school-addr">Attendance &amp; Identification System</div>
                </div>
              </div>

              <div className="accent-rule"></div>

              <div className="back-body">
                <p className="owner-text">This card is the property of {fullSchoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.</p>
              </div>

              <div className="scan-label">SCAN TO CLOCK IN</div>
              <div className="qr-wrap">
                <div className="qr-box">
                  {idCardData.qrCodeSvg && (
                    <img
                      src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                      alt="Staff Gate Scan QR Code"
                    />
                  )}
                </div>
              </div>
              <div className="encoded-id">ID: <b>{idCardData.formattedStaffCode}</b></div>

              <div className="sig-line">Authorised Signature</div>

              <div className="back-footer">POWERED BY NEOTRO ATTENDANCE SYSTEM</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
