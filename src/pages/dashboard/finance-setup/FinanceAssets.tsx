import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import './FinanceAssets.css';
import { useDialog } from '../../../context/DialogContext';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  PenTool,
  Upload,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Printer,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function FinanceAssets() {
  const { showAlert } = useDialog();
  const navigate = useNavigate();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [principalSigUrl, setPrincipalSigUrl] = useState<string | null>(null);
  const [accountantSigUrl, setAccountantSigUrl] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('Dotmond International School');
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      const data = await api.get('/finance/setup');
      setLogoUrl(data.schoolLogoUrl);
      setPrincipalSigUrl(data.principalSignatureUrl);
      setAccountantSigUrl(data.accountantSignatureUrl);

      // Also fetch school profile name
      try {
        const profile = await api.get('/setup/configure-school');
        if (profile?.name) setSchoolName(profile.name);
      } catch (e) {
        // Fallback
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load finance setup assets:', err);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assetType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    setUploadingType(assetType);
    try {
      const res = await api.post('/finance/setup/upload-asset', formData);

      if (assetType === 'logo') setLogoUrl(res.url);
      if (assetType === 'principal-signature') setPrincipalSigUrl(res.url);
      if (assetType === 'accountant-signature') setAccountantSigUrl(res.url);

      showAlert(`Official ${assetType.replace('-', ' ')} updated successfully!`);
    } catch (err: any) {
      showAlert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingType(null);
    }
  };

  const resolveUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_ROOT}${url}`;
  };

  if (loading) {
    return (
      <div className="assets-page-container">
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Loading official receipt assets...
        </div>
      </div>
    );
  }

  return (
    <div className="assets-page-container">
      {/* Page Header */}
      <div className="assets-page-header">
        <div>
          <h1 className="assets-page-title">
            <PenTool size={28} color="#000080" />
            Upload Official Receipt Assets
          </h1>
          <p className="assets-page-subtitle">
            Configure official school logo, principal authorization, and accountant signatures
            printed on payment receipts
          </p>
        </div>
      </div>

      {/* Main Workspace Two-Column Grid */}
      <div className="assets-workspace-grid">
        {/* Left Column: Official Branding & Signature Cards */}
        <div className="assets-card-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              🖊️ Official Authorization Assets
            </h2>
            <span
              style={{
                fontSize: '0.8rem',
                color: '#047857',
                background: '#ECFDF5',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 700,
              }}
            >
              Auto-Saved on Upload
            </span>
          </div>

          {/* Card 1: School Logo */}
          <div className="asset-item-box">
            <div className="asset-preview-frame">
              {logoUrl ? (
                <img src={resolveUrl(logoUrl)!} alt="School Logo" />
              ) : (
                <Building2 size={32} color="#94A3B8" />
              )}
            </div>

            <div className="asset-meta-info">
              <div className="asset-title">School Crest / Logo</div>
              <span className="asset-source-badge profile">🏫 Extracted from School Profile</span>
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                Printed on top-left of all official receipts.
              </span>
            </div>

            <div>
              <label className="asset-upload-btn-label">
                <Upload size={14} />
                {uploadingType === 'logo' ? 'Uploading...' : 'Update Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Card 2: Principal's Signature */}
          <div className="asset-item-box">
            <div className="asset-preview-frame">
              {principalSigUrl ? (
                <img src={resolveUrl(principalSigUrl)!} alt="Principal Signature" />
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                  No Signature
                </span>
              )}
            </div>

            <div className="asset-meta-info">
              <div className="asset-title">Principal's Authorized Signature</div>
              <span className="asset-source-badge profile">
                ✍️ Extracted from Principal Profile
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                Primary institutional authorization stamp.
              </span>
            </div>

            <div>
              <label className="asset-upload-btn-label">
                <Upload size={14} />
                {uploadingType === 'principal-signature' ? 'Uploading...' : 'Update Signature'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'principal-signature')}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Card 3: Accountant's Signature (Accountant Dedicated Workspace) */}
          <div
            className="asset-item-box"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
          >
            <div className="asset-preview-frame" style={{ background: '#FFFFFF' }}>
              {accountantSigUrl ? (
                <img src={resolveUrl(accountantSigUrl)!} alt="Accountant Signature" />
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 700 }}>
                  No Signature
                </span>
              )}
            </div>

            <div className="asset-meta-info">
              <div className="asset-title">Accountant's Signature (Your Signature)</div>
              <span className="asset-source-badge accountant">💼 Accountant Authorization</span>
              <span style={{ fontSize: '0.78rem', color: '#1E40AF', marginTop: '0.15rem' }}>
                Stamped on all payment verification receipts issued by you.
              </span>
            </div>

            <div>
              <label className="asset-upload-btn-label" style={{ background: '#1E40AF' }}>
                <Upload size={14} />
                {uploadingType === 'accountant-signature' ? 'Uploading...' : 'Upload Signature'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'accountant-signature')}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Guidance Banner */}
          <div
            style={{
              background: '#F8FAFC',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              fontSize: '0.85rem',
              color: '#475569',
              display: 'flex',
              gap: '0.65rem',
            }}
          >
            <ShieldCheck size={20} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Transparent PNG Recommended:</strong> For best results on printed receipts,
              upload signatures with transparent backgrounds (max 1MB).
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Printable Receipt Preview */}
        <div className="receipt-preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#0F172A',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={16} color="#000080" /> Live Receipt Authorization Preview
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                background: '#F1F5F9',
                color: '#475569',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontWeight: 700,
              }}
            >
              Official Print Layout
            </span>
          </div>

          <div className="receipt-preview-header">
            {logoUrl ? (
              <img src={resolveUrl(logoUrl)!} alt="School Logo" className="receipt-logo-thumb" />
            ) : (
              <Building2 size={36} color="#000080" />
            )}
            <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{schoolName}</strong>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              OFFICIAL PAYMENT RECEIPT
            </span>
          </div>

          <div className="receipt-preview-body">
            <div className="receipt-preview-row">
              <span>Receipt No:</span>
              <strong style={{ fontFamily: 'monospace' }}>REC-2026-DOTJSS2-8B4D</strong>
            </div>
            <div className="receipt-preview-row">
              <span>Student Name:</span>
              <strong>Mary Agboke (DOTJSS2-002)</strong>
            </div>
            <div className="receipt-preview-row">
              <span>Term / Session:</span>
              <span>2026/2027 - First Term</span>
            </div>
            <div
              className="receipt-preview-row"
              style={{ color: '#047857', fontWeight: 800, fontSize: '0.92rem' }}
            >
              <span>Verified Amount Paid:</span>
              <span>₦90,000.00</span>
            </div>
          </div>

          {/* Stamped Signatures Preview */}
          <div className="receipt-signature-stamps-grid">
            <div className="signature-stamp-box">
              <div className="signature-img-frame">
                {principalSigUrl ? (
                  <img src={resolveUrl(principalSigUrl)!} alt="Principal Stamp" />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                    Pending Signature
                  </span>
                )}
              </div>
              <div className="signature-label">Principal Signature</div>
            </div>

            <div className="signature-stamp-box">
              <div className="signature-img-frame">
                {accountantSigUrl ? (
                  <img src={resolveUrl(accountantSigUrl)!} alt="Accountant Stamp" />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                    Pending Signature
                  </span>
                )}
              </div>
              <div className="signature-label">Accountant Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
