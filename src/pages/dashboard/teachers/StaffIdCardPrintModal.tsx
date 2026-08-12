import React, { useEffect, useState, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useReactToPrint } from 'react-to-print';
import { Printer, X, ShieldCheck } from 'lucide-react';
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
        const idData = await api.get(`/attendance/staff-id-card/${staffId}`);
        setIdCardData(idData);

        try {
          const profile = await api.get('/setup/school-profile');
          setSchoolProfile(profile);
        } catch {
          setSchoolProfile({
            schoolName: "DOTMOND SCHOOL",
            address: "Happyland Estate, Ajah, Lagos State",
            logoUrl: "",
            primaryColor: "#12386E",
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
        <div className="id-card-modal-content" style={{ alignItems: 'center', padding: '40px' }}>
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

  const primaryColor = schoolProfile?.primaryColor || '#000080';
  const secondaryColor = schoolProfile?.secondaryColor || '#F59E0B';
  const logoUrl = getFullUrl(schoolProfile?.logoUrl);
  const passportUrl = getFullUrl(idCardData.passportUrl);

  return (
    <div className="id-card-overlay">
      <div className="id-card-modal-wrapper" style={{ maxWidth: '540px' }}>
        <div className="id-card-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#000080" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Official Staff Credential</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="id-card-preview-area" style={{ padding: '24px', background: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
          <div ref={printRef} className="printable-card-container">
            {/* Front Card Design matching Client Reference Image */}
            <div 
              className="id-card-front" 
              style={{
                width: '320px',
                minHeight: '500px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                background: '#FFFFFF',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #CBD5E1'
              }}
            >
              {/* Top Header Section */}
              <div style={{ padding: '20px 16px 12px 16px', textAlign: 'center', background: '#FFFFFF' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ height: '42px', objectFit: 'contain', marginBottom: '4px' }} />
                ) : (
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: primaryColor, letterSpacing: '1px' }}>
                    {schoolProfile?.schoolName || 'DOTMOND SCHOOL'}
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  FACULTY & STAFF CREDENTIAL
                </div>
              </div>

              {/* Centered Photo Section with Framed Border */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{
                  width: '135px',
                  height: '145px',
                  borderRadius: '16px',
                  border: `4px solid ${secondaryColor}`,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {passportUrl ? (
                    <img src={passportUrl} alt={idCardData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#94A3B8' }}>
                      {idCardData.fullName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Lower Section (Dark Blue Background) */}
              <div style={{
                flex: 1,
                background: `linear-gradient(180deg, ${primaryColor} 0%, #000040 100%)`,
                padding: '16px 16px 20px 16px',
                color: '#FFFFFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    color: '#FDE047',
                    textTransform: 'uppercase',
                    lineHeight: 1.25
                  }}>
                    {idCardData.fullName}
                  </h2>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', color: '#E2E8F0' }}>
                    {idCardData.designation}
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', width: '80%', margin: '8px auto' }} />
                </div>

                {/* Validity & Staff Code */}
                <div style={{ margin: '4px 0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FDE047', letterSpacing: '0.5px' }}>
                    VALIDADE: {idCardData.validPeriod}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px', color: '#FFFFFF', marginTop: '2px' }}>
                    CÓD. ID: {idCardData.formattedStaffCode}
                  </div>
                </div>

                {/* Embedded High-Res Gate Scan QR Code */}
                {idCardData.qrCodeSvg && (
                  <div style={{
                    background: '#FFFFFF',
                    padding: '6px',
                    borderRadius: '8px',
                    marginTop: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <img 
                      src={`data:image/svg+xml;base64,${idCardData.qrCodeSvg}`} 
                      alt="Gate Tap-In QR" 
                      style={{ width: '68px', height: '68px', display: 'block' }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button 
            className="btn btn-primary" 
            onClick={() => handlePrint()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: primaryColor, color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Printer size={16} /> Print Official ID Card
          </button>
        </div>
      </div>
    </div>
  );
}
