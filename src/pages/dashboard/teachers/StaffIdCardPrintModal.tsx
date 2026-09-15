import React, { useEffect, useState, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useReactToPrint } from 'react-to-print';
import { useTenant } from '../../../context/TenantContext';
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
  branchName?: string;
  branchAddress?: string;
}

interface SchoolProfile {
  schoolName: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  currentSession: string;
  idCardTemplate?: string;
  principalSignatureUrl?: string;
  signatureUrl?: string;
}

export default function StaffIdCardPrintModal({ staffId, onClose }: StaffIdCardPrintModalProps) {
  const {
    schoolName: tenantSchoolName,
    logoUrl: tenantLogoUrl,
    primaryColor: tenantPrimaryColor,
    secondaryColor: tenantSecondaryColor,
    idCardTemplate: tenantIdCardTemplate,
  } = useTenant();

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
            schoolName: tenantSchoolName || 'RMS SCHOOL',
            address: 'Happyland Estate, Ajah, Lagos State, Nigeria',
            logoUrl: tenantLogoUrl || '',
            primaryColor: tenantPrimaryColor || '#0b2545',
            secondaryColor: tenantSecondaryColor || '#9f1d2c',
            currentSession: '2026/2027',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load staff ID card data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [staffId, tenantSchoolName, tenantLogoUrl, tenantPrimaryColor, tenantSecondaryColor]);

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
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return '';
    const fullUrl = url.startsWith('/') ? `${API_ROOT}${url}` : url;
    return fullUrl.includes('?') ? `${fullUrl}&t=${Date.now()}` : `${fullUrl}?t=${Date.now()}`;
  };

  const rawSchoolName = tenantSchoolName || schoolProfile?.schoolName || 'RMS SCHOOL';
  const fullSchoolTitle = rawSchoolName.toUpperCase();
  const schoolAddress =
    idCardData?.branchAddress ||
    schoolProfile?.address ||
    'Happyland Estate, Ajah, Lagos State, Nigeria';

  const activePrimary = tenantPrimaryColor || schoolProfile?.primaryColor || '#0b2545';
  const activeSecondary = tenantSecondaryColor || schoolProfile?.secondaryColor || '#9f1d2c';
  const activeLogoUrl = tenantLogoUrl || schoolProfile?.logoUrl || '';

  const renderLogo = (size: string = '0.42in') => {
    if (activeLogoUrl) {
      return <img src={getFullUrl(activeLogoUrl)} alt="School Logo" style={{ width: size, height: 'auto', objectFit: 'contain' }} />;
    }
    return (
      <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: size }}>
        <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke={activePrimary} strokeWidth="10" />
        <g fontFamily="Georgia,serif" fontWeight="700" fontSize="40" fill={activePrimary}>
          <text x="250" y="182" textAnchor="middle">RMS</text>
        </g>
      </svg>
    );
  };

  // Avatar Fallback URL generator
  const getAvatarFallback = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000080&color=ffffff&size=256`;
  };

  const renderSchoolAddress = (addr: string) => {
    if (!addr) return null;
    if (addr.includes('Happyland Estate, Ajah')) {
      return (
        <>
          <div>Happyland Estate, Ajah</div>
          <div>Lagos State, Nigeria</div>
        </>
      );
    }
    const parts = addr.split(',');
    if (parts.length >= 2) {
      const middleIndex = Math.ceil(parts.length / 2);
      const line1 = parts.slice(0, middleIndex).join(',').trim();
      const line2 = parts.slice(middleIndex).join(',').trim();
      return (
        <>
          <div>{line1}</div>
          <div>{line2}</div>
        </>
      );
    }
    return <div>{addr}</div>;
  };

  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

  const formatDisplayName = (rawName: string | undefined | null) => {
    if (!rawName) return 'STAFF MEMBER';
    const trimmed = rawName.trim();
    let surname = '';
    let firstAndMiddle = '';

    if (trimmed.includes(',')) {
      const commaParts = trimmed.split(',').map((s) => s.trim());
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

    const abbreviatedOthers = restParts
      .slice(1)
      .map((p) => {
        if (p.length <= 2 && p.endsWith('.')) return p.toUpperCase();
        return `${p[0].toUpperCase()}.`;
      })
      .join(' ');

    return `${surname}, ${firstName} ${abbreviatedOthers}`.trim();
  };

  const rawTemplate = tenantIdCardTemplate || schoolProfile?.idCardTemplate || (schoolProfile as any)?.IdCardTemplate || 'Vertical CR80';
  const isLandscape = rawTemplate.toLowerCase().includes('landscape') || rawTemplate.toLowerCase().includes('horizontal');
  const isSquare = rawTemplate.toLowerCase().includes('square');

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        {/* Modal Controls Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
          className="no-print"
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: activePrimary }}>
              Print Staff ID Card
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handlePrint()}
              style={{ fontWeight: 700, background: activePrimary, border: 'none' }}
            >
              🖨️ Print Card
            </button>
          </div>
        </div>

        <div className="id-card-preview-area flex flex-col md:flex-row gap-8 justify-center items-center" ref={printRef}>
          {/* ================= FRONT SIDE ================= */}
          <div className="id-card-wrapper" style={isLandscape ? { width: '3.375in', height: '2.125in', minWidth: '3.375in', minHeight: '2.125in' } : undefined}>
            <div
              className={`card staff-card front ${isLandscape ? 'landscape' : isSquare ? 'square' : ''}`}
              style={
                isLandscape
                  ? {
                      width: '3.375in',
                      height: '2.125in',
                      minWidth: '3.375in',
                      minHeight: '2.125in',
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      borderRadius: '0.12in',
                      background: '#ffffff',
                      boxShadow: '0 10px 24px rgba(11, 37, 69, 0.2)',
                    }
                  : undefined
              }
            >
              {isLandscape ? (
                <>
                  <div className="landscape-left-col" style={{ backgroundColor: activePrimary }}>
                    <div className="landscape-photo-box" style={{ borderColor: activeSecondary }}>
                      {idCardData.passportUrl ? (
                        <img
                          src={getFullUrl(idCardData.passportUrl)}
                          alt={idCardData.fullName}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getAvatarFallback(idCardData.fullName);
                          }}
                        />
                      ) : (
                        <img src={getAvatarFallback(idCardData.fullName)} alt={idCardData.fullName} />
                      )}
                    </div>
                    <div className="landscape-id-pill" style={{ backgroundColor: activeSecondary }}>STAFF ID</div>
                  </div>

                  <div className="landscape-right-col">
                    <div className="landscape-header">
                      {renderLogo('0.35in')}
                      <div>
                        <div className="landscape-school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                        <div className="landscape-school-addr">{renderSchoolAddress(schoolAddress)}</div>
                      </div>
                    </div>

                    <div className="landscape-name" style={{ color: activePrimary }}>{formatDisplayName(idCardData.fullName)}</div>
                    <div className="landscape-rule" style={{ backgroundColor: activeSecondary }}></div>

                    <div className="landscape-meta-row">
                      <span className="lbl">ROLE:</span> {(idCardData.designation || idCardData.role || 'Teacher').toUpperCase()}
                    </div>
                    <div className="landscape-meta-row">
                      <span className="lbl">STAFF ID:</span> {idCardData.formattedStaffCode}
                    </div>

                    <div className="landscape-foot-strip">
                      <span>OFFICIAL BADGE</span>
                      <b style={{ color: activePrimary }}>{fullSchoolTitle}</b>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="card-header">
                    {renderLogo('0.42in')}
                    <div>
                      <div className="school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                    </div>
                  </div>

                  <div className="accent-rule" style={{ backgroundColor: activeSecondary }}></div>
                  <div className="id-tag" style={{ color: activePrimary }}>STAFF IDENTIFICATION</div>

                  <div className="large-photo-box" style={{ borderColor: activeSecondary }}>
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
                    <div className="name" style={{ color: activePrimary }}>{formatDisplayName(idCardData.fullName)}</div>
                    <div className="name-underline" style={{ backgroundColor: activeSecondary }}></div>
                    <div className="meta-row" style={{ color: activePrimary }}>
                      <span className="lbl" style={{ color: activePrimary }}>ROLE:</span>
                      {(idCardData.designation || idCardData.role || 'Teacher').toUpperCase()}
                    </div>
                    <div className="meta-row" style={{ color: activePrimary }}>
                      <span className="lbl" style={{ color: activePrimary }}>STAFF ID:</span>
                      {idCardData.formattedStaffCode}
                    </div>
                    <div className="bottom-accent-rule" style={{ backgroundColor: activeSecondary }}></div>
                    <div className="bottom-school-watermark" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="id-card-wrapper" style={isLandscape ? { width: '3.375in', height: '2.125in', minWidth: '3.375in', minHeight: '2.125in' } : undefined}>
            <div
              className={`card staff-card back ${isLandscape ? 'landscape' : isSquare ? 'square' : ''}`}
              style={
                isLandscape
                  ? {
                      width: '3.375in',
                      height: '2.125in',
                      minWidth: '3.375in',
                      minHeight: '2.125in',
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      borderRadius: '0.12in',
                      background: '#ffffff',
                      boxShadow: '0 10px 24px rgba(11, 37, 69, 0.2)',
                    }
                  : undefined
              }
            >
              {isLandscape ? (
                <>
                  <div className="landscape-left-col-back">
                    <div className="landscape-header">
                      {renderLogo('0.25in')}
                      <div className="landscape-school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                    </div>

                    <p className="landscape-owner-text">
                      This card is the property of {fullSchoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
                    </p>

                    <div className="landscape-sig-block">
                      {principalSig && (
                        <img src={getFullUrl(principalSig)} alt="Signature" className="landscape-sig-img" />
                      )}
                      <div className="landscape-sig-text" style={{ color: activePrimary, borderColor: activePrimary }}>Authorised Signature</div>
                    </div>
                  </div>

                  <div className="landscape-right-col-back">
                    <div className="landscape-scan-label" style={{ color: activePrimary }}>SCAN TO CLOCK IN</div>
                    <div className="landscape-qr-box">
                      {idCardData.qrCodeSvg && (
                        <img
                          src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                          alt="Staff Gate Scan QR Code"
                        />
                      )}
                    </div>
                    <div className="landscape-encoded-id" style={{ color: activePrimary }}>
                      ID: <b>{idCardData.formattedStaffCode}</b>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="card-header">
                    {renderLogo('0.42in')}
                    <div>
                      <div className="school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                      <div className="school-addr" style={{ color: activePrimary }}>{renderSchoolAddress(schoolAddress)}</div>
                    </div>
                  </div>

                  <div className="accent-rule" style={{ backgroundColor: activeSecondary }}></div>

                  <div className="back-body">
                    <p className="owner-text" style={{ color: activePrimary }}>
                      This card is the property of {fullSchoolTitle}. If found, please return to the
                      school office. Unauthorised use of this card is strictly prohibited.
                    </p>
                  </div>

                  <div className="scan-label" style={{ color: activePrimary }}>SCAN TO CLOCK IN</div>
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
                  <div className="encoded-id" style={{ color: activePrimary }}>
                    ID: <b>{idCardData.formattedStaffCode}</b>
                  </div>

                  <div className="sig-block">
                    {principalSig && (
                      <img
                        src={getFullUrl(principalSig)}
                        alt="Principal Signature"
                        className="sig-img"
                      />
                    )}
                    <div className="sig-line-text" style={{ color: activePrimary, borderColor: activePrimary }}>Authorised Signature</div>
                  </div>

                  <div className="back-footer" style={{ borderTopColor: activeSecondary, color: activePrimary }}>POWERED BY NEOTRO ATTENDANCE SYSTEM</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

