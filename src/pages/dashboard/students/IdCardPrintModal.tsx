import React, { useEffect, useState, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useReactToPrint } from 'react-to-print';
import { useTenant } from '../../../context/TenantContext';
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

export default function IdCardPrintModal({ studentId, onClose }: IdCardPrintModalProps) {
  const {
    schoolName: tenantSchoolName,
    logoUrl: tenantLogoUrl,
    primaryColor: tenantPrimaryColor,
    secondaryColor: tenantSecondaryColor,
    idCardTemplate,
  } = useTenant();

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
            schoolName: tenantSchoolName || 'RMS SCHOOL',
            address: 'Happyland Estate, Ajah, Lagos State, Nigeria',
            logoUrl: tenantLogoUrl || '',
            primaryColor: tenantPrimaryColor || '#12386E',
            secondaryColor: tenantSecondaryColor || '#C4293A',
            currentSession: '2026/2027',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ID card data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, tenantSchoolName, tenantLogoUrl, tenantPrimaryColor, tenantSecondaryColor]);

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
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  const rawSchoolName = tenantSchoolName || schoolProfile?.schoolName || 'RMS SCHOOL';
  const fullSchoolTitle = rawSchoolName.toUpperCase();
  const schoolAddress =
    idCardData?.branchAddress ||
    schoolProfile?.address ||
    'Happyland Estate, Ajah, Lagos State, Nigeria';

  const activeSession = idCardData.validPeriod || schoolProfile?.currentSession || '2026/2027';
  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

  const activePrimary = tenantPrimaryColor || schoolProfile?.primaryColor || '#12386E';
  const activeSecondary = tenantSecondaryColor || schoolProfile?.secondaryColor || '#C4293A';
  const activeLogoUrl = tenantLogoUrl || schoolProfile?.logoUrl || '';

  const renderLogo = (size: string = '0.38in') => {
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

  const formatStudentDisplayName = (rawName: string | undefined | null) => {
    if (!rawName) return 'STUDENT';
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

  const calculateClassRange = (rawClass: string | undefined | null, validPeriodStr: string) => {
    if (!rawClass) return '';
    const trimmedClass = rawClass.trim();

    let durationYears = 1;
    if (validPeriodStr) {
      const parts = validPeriodStr
        .split(/[-–—]|to/i)
        .map((s) => s.trim())
        .filter(Boolean);
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

  const rawTemplate = idCardTemplate || 'Vertical CR80';
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
              Print Student ID Card
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
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
              className={`card front ${isLandscape ? 'landscape' : isSquare ? 'square' : ''}`}
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
                        <img src={getFullUrl(idCardData.passportUrl)} alt="Student" />
                      ) : (
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="38" r="20" fill="#B9C2CA" />
                          <path d="M12,98 C12,72 28,58 50,58 C72,58 88,72 88,98 Z" fill="#B9C2CA" />
                        </svg>
                      )}
                    </div>
                    <span className="landscape-id-pill" style={{ backgroundColor: activeSecondary }}>STUDENT ID</span>
                  </div>

                  <div className="landscape-right-col">
                    <div className="landscape-header">
                      {renderLogo('0.24in')}
                      <div>
                        <div className="landscape-school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                        <div className="landscape-school-addr">{schoolAddress}</div>
                      </div>
                    </div>

                    <div className="landscape-name" style={{ color: activePrimary }}>{formatStudentDisplayName(idCardData.fullName)}</div>
                    <div className="landscape-rule" style={{ backgroundColor: activeSecondary }}></div>

                    <div className="landscape-meta-row">
                      <span className="lbl">STUDENT NO:</span> {idCardData.registrationNumber}
                    </div>
                    {idCardData.section && (
                      <div className="landscape-meta-row">
                        <span className="lbl">CLASS:</span> {calculateClassRange(idCardData.section, activeSession)}
                      </div>
                    )}

                    <div className="landscape-foot-strip">
                      <span>VALID</span>
                      <b style={{ color: activePrimary }}>{activeSession}</b>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Header with school details */}
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {renderLogo('0.38in')}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                        <div className="subline-addr" style={{ color: activePrimary }}>{schoolAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="top-divider-row">
                    <div className="divider-line"></div>
                    <span className="id-pill" style={{ backgroundColor: activePrimary }}>STUDENT ID</span>
                  </div>

                  {/* Large Passport Box */}
                  <div className="large-photo-box" style={{ borderColor: activeSecondary }}>
                    {idCardData.passportUrl ? (
                      <img
                        src={getFullUrl(idCardData.passportUrl)}
                        alt="Student"
                        className="student-photo-img"
                      />
                    ) : (
                      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="38" r="20" fill="#B9C2CA" />
                        <path d="M12,98 C12,72 28,58 50,58 C72,58 88,72 88,98 Z" fill="#B9C2CA" />
                      </svg>
                    )}
                  </div>

                  {/* Slanted Student Name Band */}
                  <div className="slanted-name-band" style={{ backgroundColor: activePrimary }}>
                    <div className="name">{formatStudentDisplayName(idCardData.fullName)}</div>
                    <div className="field">
                      <b>Student No:</b> {idCardData.registrationNumber}
                    </div>
                    {idCardData.section && (
                      <div className="field">
                        <b>Class:</b> {calculateClassRange(idCardData.section, activeSession)}
                      </div>
                    )}
                  </div>

                  <div className="red-accent-line" style={{ backgroundColor: activeSecondary }}></div>

                  {/* Footer Strip */}
                  <div className="foot-strip" style={{ backgroundColor: activePrimary }}>
                    <div>VALID</div>
                    <div>{activeSession}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="id-card-wrapper" style={isLandscape ? { width: '3.375in', height: '2.125in', minWidth: '3.375in', minHeight: '2.125in' } : undefined}>
            <div
              className={`card back ${isLandscape ? 'landscape' : isSquare ? 'square' : ''}`}
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
                      {renderLogo('0.20in')}
                      <div className="landscape-school-name" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                    </div>

                    <p className="landscape-owner-text">
                      This card is official identification & attendance badge for {fullSchoolTitle}. If found, please return to the school office.
                    </p>

                    <div className="landscape-sig-block">
                      {principalSig && (
                        <img src={getFullUrl(principalSig)} alt="Signature" className="landscape-sig-img" />
                      )}
                      <div className="landscape-sig-text" style={{ color: activePrimary, borderColor: activePrimary }}>Principal Signature</div>
                    </div>
                  </div>

                  <div className="landscape-right-col-back">
                    <div className="landscape-scan-label" style={{ color: activePrimary }}>ATTENDANCE QR</div>
                    <div className="landscape-qr-box">
                      {idCardData.qrCodeSvg && (
                        <img
                          src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                          alt="Student Gate Scan QR Code"
                        />
                      )}
                    </div>
                    <div className="landscape-encoded-id" style={{ color: activePrimary }}>
                      REG: <b>{idCardData.registrationNumber}</b>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Header */}
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {renderLogo('0.38in')}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond" style={{ color: activePrimary }}>{fullSchoolTitle}</div>
                        <div className="subline" style={{ color: activePrimary }}>{schoolAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rule" style={{ backgroundColor: activePrimary }}></div>

                  <div className="notice">
                    This card is official identification & attendance badge for {fullSchoolTitle}.
                    If found, please return to the school office.
                  </div>

                  <div className="scan-block">
                    <div className="scan-label" style={{ color: activePrimary }}>ATTENDANCE QR</div>
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
                    <div className="encoded-pill">{idCardData.registrationNumber}</div>
                  </div>

                  <div className="sig-block">
                    {principalSig && (
                      <img
                        src={getFullUrl(principalSig)}
                        alt="Principal Signature"
                        className="sig-img"
                      />
                    )}
                    <div className="sig-line-text" style={{ color: activePrimary, borderColor: activePrimary }}>Principal Signature</div>
                  </div>

                  <div className="compact-back-footer" style={{ backgroundColor: activePrimary }}>{fullSchoolTitle}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
