import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import '../finance/Finance.css';
import { useDialog } from '../../../context/DialogContext';


export default function FinanceAssets() {
  const { showAlert } = useDialog();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [principalSigUrl, setPrincipalSigUrl] = useState<string | null>(null);
  const [accountantSigUrl, setAccountantSigUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      const data = await api.get('/finance/setup');
      setLogoUrl(data.schoolLogoUrl);
      setPrincipalSigUrl(data.principalSignatureUrl);
      setAccountantSigUrl(data.accountantSignatureUrl);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assetType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    try {
      const res = await api.post('/finance/setup/upload-asset', formData);
      
      if (assetType === 'logo') setLogoUrl(res.url);
      if (assetType === 'principal-signature') setPrincipalSigUrl(res.url);
      if (assetType === 'accountant-signature') setAccountantSigUrl(res.url);
      
      showAlert('Asset uploaded successfully!');
    } catch (err: any) {
      showAlert('Upload failed: ' + err.message);
    }
  };

  if (loading) return <div className="loading-screen">Loading Assets...</div>;

  return (
    <div className="finance-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Official Assets</h1>
          <p className="page-subtitle">Configure official receipt assets for the school.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem 3rem', maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Official Receipt Assets</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Upload the school logo and authorized signatures to be printed on all official POS receipts.
          </p>
        </div>

        <div className="form-group">
          <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>School Logo</label>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '12px', background: '#f8f9fa', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logoUrl ? <img src={logoUrl.startsWith('http') ? logoUrl : `${API_ROOT}${logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: '2.5rem'}}>🏫</span>}
            </div>
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'logo')} style={{ padding: '0.8rem' }} />
              <small style={{ color: '#666', display: 'block', marginTop: '0.3rem' }}>Recommended: Square PNG/JPG (max 2MB)</small>
            </div>
          </div>
        </div>

        <div className="form-group mt-4">
          <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Principal's Signature</label>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: 140, height: 70, borderRadius: '12px', background: '#f8f9fa', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {principalSigUrl ? <img src={`${API_ROOT}${principalSigUrl}`} alt="Principal Sig" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{color: '#999', fontSize: '0.9rem'}}>No Signature</span>}
            </div>
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'principal-signature')} style={{ padding: '0.8rem' }} />
              <small style={{ color: '#666', display: 'block', marginTop: '0.3rem' }}>Recommended: Transparent PNG (max 1MB)</small>
            </div>
          </div>
        </div>

        <div className="form-group mt-4">
          <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Accountant's Signature</label>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: 140, height: 70, borderRadius: '12px', background: '#f8f9fa', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {accountantSigUrl ? <img src={`${API_ROOT}${accountantSigUrl}`} alt="Accountant Sig" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{color: '#999', fontSize: '0.9rem'}}>No Signature</span>}
            </div>
            <div style={{ flex: 1 }}>
              <input type="file" accept="image/*" className="form-control" onChange={e => handleFileUpload(e, 'accountant-signature')} style={{ padding: '0.8rem' }} />
              <small style={{ color: '#666', display: 'block', marginTop: '0.3rem' }}>Recommended: Transparent PNG (max 1MB)</small>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span>Documents are automatically saved and securely stored upon upload.</span>
        </div>
      </div>
    </div>
  );
}
