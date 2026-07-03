import React, { useState, useEffect } from 'react';
import { api, API_ROOT, ApiError } from '../../../services/api';
import './Settings.css';

export default function SchoolConfig() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    motto: '',
    officialEmail: '',
    currentSession: '',
    currentTerm: '',
    caWeightFirst: 20,
    caWeightSecond: 20,
    examWeight: 60,
    principalEmail: '',
    principalFirstName: '',
    principalLastName: '',
    principalPhoneNumber: '',
    primaryColor: '#0A192F',
    secondaryColor: '#FACC15',
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
          currentSession: data.currentSession || '',
          currentTerm: data.currentTerm || '',
          caWeightFirst: data.caWeightFirst ?? 20,
          caWeightSecond: data.caWeightSecond ?? 20,
          examWeight: data.examWeight ?? 60,
          primaryColor: data.primaryColor || '#0A192F',
          secondaryColor: data.secondaryColor || '#FACC15',
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
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value.trim()
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

    const totalWeight = formData.caWeightFirst + formData.caWeightSecond + formData.examWeight;
    if (totalWeight !== 100) {
      setError(`Grading weights must equal 100. Current total: ${totalWeight}`);
      setLoading(false);
      return;
    }

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
        setSuccess("School settings have been updated successfully.");
      } else {
        await api.post('/setup/configure-school', payload);
        setSuccess("School settings have been configured successfully. A confirmation email has been sent to the Principal.");
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
    return <div className="settings-page"><p>Loading configuration...</p></div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="page-title">School Configuration</h1>
        <p className="page-subtitle">Manage core school details, academic sessions, and administrative accounts.</p>
      </div>

      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      <form className="settings-form" onSubmit={handleSubmit}>
        
        {/* Section 1: School Details */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">🏫 School Details</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>School Name</label>
              <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Motto / Slogan</label>
              <input type="text" name="motto" value={formData.motto} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Official Email</label>
              <input type="email" name="officialEmail" value={formData.officialEmail} onChange={handleChange} required />
            </div>

            <div className="form-group full-width">
              <label>Physical Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="form-group full-width">
              <label>School Logo {currentLogoUrl && "(Upload new to replace)"}</label>
              {currentLogoUrl && !logoFile && <img src={currentLogoUrl.startsWith('http') ? currentLogoUrl : `${API_ROOT}${currentLogoUrl}`} alt="Current Logo" style={{maxHeight: '50px', marginBottom: '10px'}} />}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile)} className="form-control" />
            </div>
          </div>
        </div>

        {/* Section 2: Principal Signature (Only in Update Mode) */}
        {isUpdateMode && (
          <div className="settings-section glass-panel">
            <h2 className="section-title">✍️ Principal Signature</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Digital Signature (Upload new to replace)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSignatureFile)} />
                  <button type="button" className="btn btn-secondary" onClick={async () => {
                    if (!signatureFile) { alert("Please select a file first"); return; }
                    try {
                      const sigPayload = new FormData();
                      sigPayload.append('file', signatureFile);
                      await api.post('/setup/upload-signature', sigPayload);
                      alert("Signature uploaded successfully.");
                      setSignatureFile(null);
                    } catch (err: any) {
                      alert("Failed to upload signature: " + err.message);
                    }
                  }}>
                    Upload Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Academic Settings */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">📚 Academic Settings</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Current Session (e.g. 2026/2027)</label>
              <input type="text" name="currentSession" placeholder="2026/2027" value={formData.currentSession} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Current Term</label>
              <select name="currentTerm" value={formData.currentTerm} onChange={handleChange} required>
                <option value="">Select Term</option>
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
            </div>

            <div className="form-group">
              <label>1st CA Weight (%)</label>
              <input type="number" name="caWeightFirst" min="0" max="100" value={formData.caWeightFirst} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>2nd CA Weight (%)</label>
              <input type="number" name="caWeightSecond" min="0" max="100" value={formData.caWeightSecond} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Exam Weight (%)</label>
              <input type="number" name="examWeight" min="0" max="100" value={formData.examWeight} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Section 4: Theme & Formatting */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">🎨 Theme & Formatting</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Primary Brand Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} style={{ padding: '0', width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                <input type="text" name="primaryColor" value={formData.primaryColor} onChange={handleChange} placeholder="#0A192F" style={{ flex: 1 }} />
              </div>
            </div>

            <div className="form-group">
              <label>Secondary Accent Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} style={{ padding: '0', width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                <input type="text" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} placeholder="#FACC15" style={{ flex: 1 }} />
              </div>
            </div>

            <div className="form-group full-width" style={{marginTop: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '14px', color: '#38bdf8', margin: 0}}>ID Card Template</h3>
                <a href="/dashboard/operations/template-gallery" target="_blank" rel="noreferrer" style={{fontSize: '12px', color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <i className="fas fa-external-link-alt"></i> Preview Full Size
                </a>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1rem' }}>Select the visual layout for your gate access cards.</p>
              
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.idCardTemplate === 'Vertical CR80' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Vertical CR80'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id"><div className="mini-mock-id-h"></div><div className="mini-mock-id-p"></div><div className="mini-mock-id-f"></div></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Vertical CR80</div>
                    <div className="template-visual-desc">Standard lanyard clip layout</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.idCardTemplate === 'Landscape Lanyard' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Landscape Lanyard'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id-land"><div className="mini-mock-id-land-l"><div className="mini-mock-id-land-p"></div></div></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Landscape Lanyard</div>
                    <div className="template-visual-desc">Wider corporate style</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.idCardTemplate === 'Square Badge' ? 'selected' : ''}`} onClick={() => setFormData({...formData, idCardTemplate: 'Square Badge'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-id-sq"><div className="mini-mock-id-sq-p"></div></div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Square Badge</div>
                    <div className="template-visual-desc">Modern compact layout</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group full-width" style={{marginTop: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '14px', color: '#38bdf8', margin: 0}}>Receipt Template</h3>
                <a href="/dashboard/operations/template-gallery" target="_blank" rel="noreferrer" style={{fontSize: '12px', color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <i className="fas fa-external-link-alt"></i> Preview Full Size
                </a>
              </div>
              
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.receiptTemplate === 'Thermal POS Print' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Thermal POS Print'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-th">
                       <div style={{width: '100%', height: '4px', background: '#cbd5e1', marginBottom: '8px'}}></div>
                       <div style={{width: '100%', height: '2px', background: '#e2e8f0', marginBottom: '4px'}}></div>
                       <div style={{width: '100%', height: '2px', background: '#e2e8f0', marginBottom: '4px'}}></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Thermal POS Print</div>
                    <div className="template-visual-desc">Standard 80mm roll printer</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.receiptTemplate === 'Standard A4 Invoice' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Standard A4 Invoice'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-a4">
                       <div style={{width: '100%', height: '8px', background: '#0a2540', marginBottom: '8px'}}></div>
                       <div style={{width: '100%', height: '20px', border: '1px solid #cbd5e1'}}></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Standard A4 Invoice</div>
                    <div className="template-visual-desc">Full corporate page layout</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.receiptTemplate === 'Modern Email Receipt' ? 'selected' : ''}`} onClick={() => setFormData({...formData, receiptTemplate: 'Modern Email Receipt'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-receipt-a4" style={{borderRadius: '4px', border: '1px solid #cbd5e1', boxShadow: 'none'}}>
                       <div style={{width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', margin: '0 auto'}}></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Modern Email Receipt</div>
                    <div className="template-visual-desc">Digital-first layout</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group full-width" style={{marginTop: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '14px', color: '#38bdf8', margin: 0}}>Result Sheet Template</h3>
                <a href="/dashboard/operations/template-gallery" target="_blank" rel="noreferrer" style={{fontSize: '12px', color: '#0ea5e9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <i className="fas fa-external-link-alt"></i> Preview Full Size
                </a>
              </div>
              
              <div className="template-visual-grid">
                <div className={`template-visual-card ${formData.resultTemplate === 'Standard Classic Grid' ? 'selected' : ''}`} onClick={() => setFormData({...formData, resultTemplate: 'Standard Classic Grid'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-result-grid">
                       <div style={{width: '100%', height: '10px', background: '#e2e8f0'}}></div>
                       <div style={{width: '100%', height: '10px', background: '#f8fafc', border: '1px solid #e2e8f0'}}></div>
                       <div style={{width: '100%', height: '10px', background: '#f8fafc', border: '1px solid #e2e8f0'}}></div>
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
                       <div style={{width: '40%', height: '6px', background: '#0a2540', marginBottom: '8px'}}></div>
                       <div style={{width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '4px'}}><div style={{width: '70%', height: '100%', background: '#38bdf8'}}></div></div>
                       <div style={{width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px'}}><div style={{width: '40%', height: '100%', background: '#38bdf8'}}></div></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Modern Analytical</div>
                    <div className="template-visual-desc">Charts & progress bars</div>
                  </div>
                </div>

                <div className={`template-visual-card ${formData.resultTemplate === 'Minimalist Text' ? 'selected' : ''}`} onClick={() => setFormData({...formData, resultTemplate: 'Minimalist Text'})}>
                  <div className="template-visual-preview">
                    <div className="mini-mock-result-mod" style={{boxShadow: 'none', border: '1px solid #cbd5e1'}}>
                       <div style={{width: '80%', height: '4px', background: '#64748b', marginBottom: '8px'}}></div>
                       <div style={{width: '60%', height: '4px', background: '#94a3b8', marginBottom: '4px'}}></div>
                    </div>
                  </div>
                  <div className="template-visual-info">
                    <div className="template-visual-title">Minimalist Text</div>
                    <div className="template-visual-desc">Clean, simple formatting</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Principal Account (Only shown on Create) */}
        {!isUpdateMode && (
          <div className="settings-section glass-panel">
            <h2 className="section-title">👔 Principal Details</h2>
            <p className="section-description">This will create the official superadmin account for the school.</p>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" name="principalFirstName" value={formData.principalFirstName} onChange={handleChange} required />
              </div>
              
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="principalLastName" value={formData.principalLastName} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Principal Email Address</label>
                <input type="email" name="principalEmail" value={formData.principalEmail} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="principalPhoneNumber" value={formData.principalPhoneNumber} onChange={handleChange} required />
              </div>

              <div className="form-group full-width">
                <label>Digital Signature (Upload Image)</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSignatureFile)} required />
              </div>
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving Configuration..." : (isUpdateMode ? "Update Configuration" : "Save Configuration")}
          </button>
        </div>
      </form>
    </div>
  );
}
