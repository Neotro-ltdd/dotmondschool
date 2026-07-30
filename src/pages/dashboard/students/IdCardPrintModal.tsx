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
            schoolName: "Your School Name",
            address: "123 Education Way",
            logoUrl: "",
            primaryColor: "#0A192F",
            secondaryColor: "#FACC15",
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

  const pColor = schoolProfile?.primaryColor || '#0A192F';
  const sColor = schoolProfile?.secondaryColor || '#FACC15';

  const getFullUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
          <h2>Print ID Card</h2>
          <div>
            <button className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Print Card
            </button>
          </div>
        </div>

        <div className="id-card-preview-area" ref={printRef} style={{ '--card-primary-color': pColor, '--card-secondary-color': sColor } as React.CSSProperties}>
          
          {/* FRONT */}
          <div className="id-card-wrapper">
            <div className="id-card front-card">
              <div className="front-header">
                {schoolProfile?.logoUrl ? (
                  <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" className="front-logo" />
                ) : (
                  <div className="front-logo-placeholder"></div>
                )}
                <div className="front-header-text">
                  <div className="front-school-title">{schoolProfile?.schoolName?.toUpperCase() || ''}</div>
                  <div className="front-school-subtitle">{schoolProfile?.address || 'Lekki, Lagos, Nigeria'}</div>
                </div>
              </div>
              
              <div className="front-body">
                <div className="portrait-frame">
                  {idCardData.passportUrl ? (
                    <img src={getFullUrl(idCardData.passportUrl)} alt="Student" className="student-photo" />
                  ) : (
                    <div className="student-photo placeholder">NO PHOTO</div>
                  )}
                </div>
              </div>
              
              <div className="front-angled-block">
                <div className="student-name">{idCardData.fullName.toUpperCase()}</div>
                <div className="student-details-grid">
                  <div className="detail-label">ADMISSION NO:</div>
                  <div className="detail-value">{idCardData.registrationNumber}</div>
                  <div className="detail-label">SECTION:</div>
                  <div className="detail-value">{idCardData.section}</div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className="id-card-wrapper">
            <div className="id-card back-card">
              <div className="back-header">
                <div className="back-title">ATTENDANCE SYSTEM</div>
              </div>
              
              <div className="back-body">
                <div className="qr-container-large">
                  <img
                    src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`}
                    alt="Student QR Code"
                  />
                </div>
                
                <div className="scan-instruction-large">SCAN TO CLOCK IN</div>
                
                <div className="encoded-id-pill">
                  {idCardData.registrationNumber}
                </div>
                
                <div className="back-divider-line"></div>
                
                <div className="instruction-text">
                  This card is the property of <strong>{schoolProfile?.schoolName}</strong>.<br/>
                  If found, please return to the school office.<br/>
                  Unauthorised use is strictly prohibited.
                </div>
                
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <div className="signature-label">Authorised Signature</div>
                </div>
              </div>
              
              <div className="back-footer">
                <div className="validity">VALID: {idCardData.validPeriod}</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
