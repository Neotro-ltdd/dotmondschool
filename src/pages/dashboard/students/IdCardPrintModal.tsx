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
}

export default function IdCardPrintModal({ studentId, onClose }: IdCardPrintModalProps) {
  const [loading, setLoading] = useState(true);
  const [idCardData, setIdCardData] = useState<IdCardData | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'modern' | 'minimal'>('standard');

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

        // Fetch school profile for colors, logo, and session
        try {
          const profile = await api.get('/setup/school-profile');
          setSchoolProfile(profile);
        } catch (profileErr) {
          // Fallback if profile not found
          setSchoolProfile({
            schoolName: "DOTMOND SCHOOL",
            address: "Happyland Estate, Ajah, Lagos State, Nigeria",
            logoUrl: "",
            primaryColor: "#0C2340",
            secondaryColor: "#8B0000",
            currentSession: "2026 - 2029"
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
          <h2>Generating ID Card...</h2>
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

  const pColor = schoolProfile?.primaryColor || '#0C2340';
  const sColor = schoolProfile?.secondaryColor || '#8B0000';

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  const schoolTitle = schoolProfile?.schoolName ? schoolProfile.schoolName.toUpperCase() : "DOTMOND";
  const schoolSubTitle = "PRIMARY & SECONDARY SCHOOL";
  const schoolAddr = schoolProfile?.address || "Happyland Estate, Ajah, Lagos";

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>Print Student ID Card</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>Official school identification badge & gate barcode pass.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Template:</label>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value as any)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 600, background: '#FFFFFF', color: '#0F172A' }}
              >
                <option value="standard">Dotmond Standard (Classic Vertical)</option>
                <option value="modern">Executive Navy (Modern)</option>
                <option value="minimal">Minimalist Pass</option>
              </select>
            </div>

            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: 700 }}>
              🖨️ Print Card
            </button>
          </div>
        </div>

        <div className={`id-card-preview-area template-${selectedTemplate}`} ref={printRef} style={{ '--card-primary-color': pColor, '--card-secondary-color': sColor } as React.CSSProperties}>
          
          {/* FRONT SIDE */}
          <div className="id-card-wrapper">
            <div className="id-card front-card">
              
              {/* Header */}
              <div className="front-header">
                {schoolProfile?.logoUrl ? (
                  <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" className="front-logo" />
                ) : (
                  <div className="front-logo-placeholder"></div>
                )}
                <div className="front-header-text">
                  <div className="front-school-title">{schoolTitle}</div>
                  <div className="front-school-subtitle">{schoolSubTitle}</div>
                  <div className="front-school-address">{schoolAddr}</div>
                </div>
              </div>
              <div className="front-header-line"></div>
              
              {/* Badge Row */}
              <div className="front-subheader-row">
                <div className="student-id-badge">STUDENT ID</div>
              </div>

              {/* Photo Frame */}
              <div className="front-body">
                <div className="portrait-frame">
                  {idCardData.passportUrl ? (
                    <img src={getFullUrl(idCardData.passportUrl)} alt="Student" className="student-photo" />
                  ) : (
                    <div className="student-photo placeholder">NO PHOTO</div>
                  )}
                </div>
              </div>

              {/* Angled Navy Student Info Banner */}
              <div className="front-angled-block">
                <div className="student-name">{idCardData.fullName.toUpperCase()}</div>
                <div className="student-details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Admission No: </span>
                    <span className="detail-value">{idCardData.registrationNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Section: </span>
                    <span className="detail-value">{idCardData.section || 'Student'}</span>
                  </div>
                </div>
              </div>

              {/* Crimson Red Bar */}
              <div className="front-red-bar"></div>
              
              {/* Validity Footer */}
              <div className="front-footer-strip">
                <span>VALID</span>
                <span>{idCardData.validPeriod || '2026 - 2029'}</span>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="id-card-wrapper">
            <div className="id-card back-card">
              <div className="back-header">
                {schoolProfile?.logoUrl ? (
                  <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" className="back-logo" />
                ) : (
                  <div className="back-logo-placeholder"></div>
                )}
                <div className="back-header-text">
                  <div className="back-school-title">{schoolTitle}</div>
                  <div className="back-school-subtitle">Attendance &amp; Identification System</div>
                </div>
              </div>
              <div className="back-header-line"></div>

              <div className="back-body">
                <div className="instruction-text">
                  This card is the property of {schoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
                </div>
                <div className="back-divider-line"></div>

                <div className="qr-section">
                  <div className="scan-instruction-large">SCAN TO CLOCK IN</div>
                  <div className="qr-container-large">
                    <img
                      src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                      alt="Student QR Code"
                    />
                  </div>
                  <div className="encoded-id-pill">
                    ENCODED ID: {idCardData.registrationNumber}
                  </div>
                </div>

                <div className="signature-section">
                  <div className="signature-line"></div>
                  <div className="signature-label">Authorised Signature</div>
                </div>
              </div>

              <div className="back-footer-bar">
                Powered by NEOTRO ATTENDANCE SYSTEM
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
