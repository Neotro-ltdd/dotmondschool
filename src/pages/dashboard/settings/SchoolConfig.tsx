import React, { useState, useEffect } from 'react';
import { api, API_ROOT, ApiError } from '../../../services/api';
import './SchoolConfig.css';
import { useDialog } from '../../../context/DialogContext';
import { 
  Building2, 
  Mail, 
  Palette, 
  FileCheck, 
  Upload, 
  Save, 
  ExternalLink, 
  FileText, 
  CreditCard, 
  Receipt 
} from 'lucide-react';

export default function SchoolConfig() {
  const { showAlert } = useDialog();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // Form State (Academic Settings Removed as requested)
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    motto: '',
    officialEmail: '',
    principalEmail: '',
    principalFirstName: '',
    principalLastName: '',
    principalPhoneNumber: '',
    primaryColor: '#000080',
    secondaryColor: '#B0D6F5',
    idCardTemplate: 'Vertical CR80',
    receiptTemplate: 'Thermal POS Print',
    resultTemplate: 'Standard Classic Grid'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/setup/school-profile');
        setIsUpdateMode(true);
        setCurrentLogoUrl(data.logoUrl);
        setFormData(prev => ({
          ...prev,
          schoolName: data.schoolName || '',
          address: data.address || '',
          motto: data.motto || '',
          officialEmail: data.officialEmail || '',
          primaryColor: data.primaryColor || '#000080',
          secondaryColor: data.secondaryColor || '#B0D6F5',
          idCardTemplate: data.idCardTemplate || 'Vertical CR80',
          receiptTemplate: data.receiptTemplate || 'Thermal POS Print',
          resultTemplate: data.resultTemplate || 'Standard Classic Grid'
        }));
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 404) {
          setIsUpdateMode(false);
        } else {
          setError("Failed to load existing school configuration.");
        }
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    } else {
      setter(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value.toString());
    });

    if (logoFile) {
      payload.append('Logo', logoFile);
    }
    if (signatureFile) {
      payload.append('PrincipalSignature', signatureFile);
    }

    try {
      if (isUpdateMode) {
        await api.put('/setup/school-profile', payload);
        setSuccess("School configuration updated successfully.");
      } else {
        await api.post('/setup/configure-school', payload);
        setSuccess("School configuration saved successfully.");
        setIsUpdateMode(true); 
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.data?.errors) {
          const errorMessages = Object.values(err.data.errors).flat().join(', ');
          setError(`Validation Error: ${errorMessages}`);
        } else {
          setError(err.message || "An error occurred while saving the configuration.");
        }
      } else {
        setError("Failed to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="school-page-container" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
        Fetching school configuration profile...
      </div>
    );
  }

  return (
    <div className="school-page-container">
      {/* Page Header */}
      <div className="school-page-header">
        <div>
          <h1 className="school-page-title">
            <Building2 size={28} color="#000080" />
            School Identity & Settings
          </h1>
          <p className="school-page-subtitle">Configure institutional branding, official contact details, digital signatures, and document templates</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="school-metrics-grid">
        <div className="school-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Institutional Name</span>
            <span className="metric-number">{formData.schoolName || 'Not Configured'}</span>
          </div>
          <div className="metric-icon-badge identity">
            <Building2 size={24} />
          </div>
        </div>

        <div className="school-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Official Email</span>
            <span className="metric-number" style={{ fontSize: '1.05rem', wordBreak: 'break-all' }}>
              {formData.officialEmail || 'Not Configured'}
            </span>
          </div>
          <div className="metric-icon-badge contact">
            <Mail size={24} />
          </div>
        </div>

        <div className="school-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Brand Palette</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: formData.primaryColor, border: '1px solid #CBD5E1' }} title="Primary" />
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: formData.secondaryColor, border: '1px solid #CBD5E1' }} title="Secondary" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginLeft: '0.2rem' }}>
                {formData.primaryColor}
              </span>
            </div>
          </div>
          <div className="metric-icon-badge brand">
            <Palette size={24} />
          </div>
        </div>

        <div className="school-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Principal Signature</span>
            <span className="metric-number" style={{ fontSize: '1.1rem', color: '#047857' }}>
              {signatureFile || isUpdateMode ? 'Signature Linked' : 'Upload Needed'}
            </span>
          </div>
          <div className="metric-icon-badge signature">
            <FileCheck size={24} />
          </div>
        </div>
      </div>

      {success && <div className="alert-success" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>{success}</div>}
      {error && <div className="alert-error" style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Two-Column Workspace Layout */}
        <div className="school-workspace-grid">
          {/* Left Column: School Profile & Identity */}
          <div className="school-card-wrapper">
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              🏫 Core School Profile
            </h2>

            <div className="school-input-group">
              <label>School Name *</label>
              <input type="text" className="select-filter-input" name="schoolName" value={formData.schoolName} onChange={handleChange} required placeholder="e.g. Dotmond International School" />
            </div>

            <div className="school-input-group">
              <label>Motto / Slogan</label>
              <input type="text" className="select-filter-input" name="motto" value={formData.motto} onChange={handleChange} placeholder="e.g. Excellence in Character & Knowledge" />
            </div>

            <div className="school-input-group">
              <label>Official Contact Email *</label>
              <input type="email" className="select-filter-input" name="officialEmail" value={formData.officialEmail} onChange={handleChange} required placeholder="e.g. info@school.edu.ng" />
            </div>

            <div className="school-input-group">
              <label>Physical Campus Address *</label>
              <input type="text" className="select-filter-input" name="address" value={formData.address} onChange={handleChange} required placeholder="e.g. 12 Educational Drive, Victoria Island, Lagos" />
            </div>

            <div className="school-input-group">
              <label>School Logo Badge {currentLogoUrl && "(Upload new file to replace)"}</label>
              {currentLogoUrl && !logoFile && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <img src={currentLogoUrl.startsWith('http') ? currentLogoUrl : `${API_ROOT}${currentLogoUrl}`} alt="Current Logo" style={{ maxHeight: '60px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '4px' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile)} className="select-filter-input" />
            </div>

            {/* Principal Signature */}
            {isUpdateMode && (
              <div className="school-input-group" style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <label>Principal Digital Signature</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSignatureFile)} className="select-filter-input" style={{ flex: 1 }} />
                  <button 
                    type="button" 
                    className="btn-add-rule"
                    onClick={async () => {
                      if (!signatureFile) { showAlert("Please select a signature image file first."); return; }
                      try {
                        const sigPayload = new FormData();
                        sigPayload.append('file', signatureFile);
                        await api.post('/setup/upload-signature', sigPayload);
                        showAlert("Signature uploaded successfully.");
                        setSignatureFile(null);
                      } catch (err: any) {
                        showAlert("Failed to upload signature: " + err.message);
                      }
                    }}
                  >
                    <Upload size={15} /> Upload Signature
                  </button>
                </div>
              </div>
            )}

            {/* Brand Colors */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>🎨 Brand Identity Palette</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="school-input-group">
                  <label>Primary Brand Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ width: '42px', height: '42px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <input type="text" className="select-filter-input" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ flex: 1 }} />
                  </div>
                </div>

                <div className="school-input-group">
                  <label>Secondary Accent Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} style={{ width: '42px', height: '42px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <input type="text" className="select-filter-input" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Templates & Document Customization */}
          <div className="school-card-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                📄 Document & Card Templates
              </h2>
              <a href="/dashboard/operations/template-gallery" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#000080', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ExternalLink size={14} /> Full Gallery
              </a>
            </div>

            {/* ID Card Template */}
            <div className="school-input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} /> ID Card Layout Template
              </label>
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.idCardTemplate === 'Vertical CR80' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Vertical CR80'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id"><div className="mini-mock-id-h" /><div className="mini-mock-id-p" /><div className="mini-mock-id-f" /></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Vertical CR80</div>
                    <div className="template-visual-desc">Standard lanyard clip</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.idCardTemplate === 'Landscape Lanyard' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Landscape Lanyard'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id-land"><div className="mini-mock-id-land-l"><div className="mini-mock-id-land-p" /></div></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Landscape</div>
                    <div className="template-visual-desc">Wider corporate badge</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.idCardTemplate === 'Square Badge' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Square Badge'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id-sq"><div className="mini-mock-id-sq-p" /></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Square Badge</div>
                    <div className="template-visual-desc">Modern compact layout</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Template */}
            <div className="school-input-group" style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Receipt size={16} /> Fee Receipt & Invoice Template
              </label>
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.receiptTemplate === 'Thermal POS Print' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Thermal POS Print'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-th">
                      <div style={{width: '100%', height: '4px', background: '#cbd5e1', marginBottom: '6px'}} />
                      <div style={{width: '100%', height: '2px', background: '#e2e8f0', marginBottom: '3px'}} />
                      <div style={{width: '100%', height: '2px', background: '#e2e8f0'}} />
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Thermal POS</div>
                    <div className="template-visual-desc">Standard 80mm roll</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.receiptTemplate === 'Standard A4 Invoice' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Standard A4 Invoice'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-a4">
                      <div style={{width: '100%', height: '6px', background: '#0a2540', marginBottom: '6px'}} />
                      <div style={{width: '100%', height: '16px', border: '1px solid #cbd5e1'}} />
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">A4 Invoice</div>
                    <div className="template-visual-desc">Corporate full page</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.receiptTemplate === 'Modern Email Receipt' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Modern Email Receipt'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-a4" style={{borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: 'none'}}>
                      <div style={{width: '28px', height: '28px', background: '#e2e8f0', borderRadius: '50%', margin: '0 auto'}} />
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Email Receipt</div>
                    <div className="template-visual-desc">Digital email layout</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Sheet Template */}
            <div className="school-input-group" style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} /> Result Sheet Report Card Template
              </label>
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.resultTemplate === 'Standard Classic Grid' ? 'selected' : ''}`} onClick={() => setFormData({...formData, resultTemplate: 'Standard Classic Grid'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-result-grid">
                      <div style={{width: '100%', height: '8px', background: '#e2e8f0'}} />
                      <div style={{width: '100%', height: '8px', background: '#f8fafc', border: '1px solid #e2e8f0'}} />
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Classic Grid</div>
                    <div className="template-visual-desc">Traditional tabular layout</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.resultTemplate === 'Modern Analytical' ? 'selected' : ''}`} onClick={() => setFormData({...formData, resultTemplate: 'Modern Analytical'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-result-mod">
                      <div style={{width: '40%', height: '5px', background: '#0a2540', marginBottom: '6px'}} />
                      <div style={{width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px'}}><div style={{width: '70%', height: '100%', background: '#38bdf8'}} /></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Analytical</div>
                    <div className="template-visual-desc">Charts & progress bars</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.resultTemplate === 'Minimalist Text' ? 'selected' : ''}`} onClick={() => setFormData({...formData, resultTemplate: 'Minimalist Text'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-result-mod" style={{boxShadow: 'none', border: '1px solid #cbd5e1'}}>
                      <div style={{width: '80%', height: '4px', background: '#64748b', marginBottom: '6px'}} />
                      <div style={{width: '60%', height: '4px', background: '#94a3b8'}} />
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Minimalist</div>
                    <div className="template-visual-desc">Clean simple text</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button className="btn-save-school" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? "Saving Configuration..." : "Save School Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
