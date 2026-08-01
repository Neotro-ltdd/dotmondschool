import React, { useState, useEffect, useRef } from 'react';
import { api, API_ROOT } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileSettings() {
  const { showAlert } = useDialog();
  const { userRole, availableRoles, setActiveRole, updateUserInfo } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [title, setTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // File selections
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  
  // Live preview URLs for selected files
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  
  // Loading states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);

  // References for hidden native inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fallback state if server image URLs fail to load or return 404
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [signatureLoadError, setSignatureLoadError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update preview URLs when files are chosen
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAvatarPreview(null);
    }
  }, [avatarFile]);

  useEffect(() => {
    if (signatureFile) {
      const url = URL.createObjectURL(signatureFile);
      setSignaturePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setSignaturePreview(null);
    }
  }, [signatureFile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get('/profile');
      setProfile(data);
      setTitle(data.title || '');
      setPhoneNumber(data.phoneNumber || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setAvatarLoadError(false);
      setSignatureLoadError(false);
      
      if (updateUserInfo) {
        updateUserInfo({
          avatarUrl: data.avatarUrl,
          firstName: data.firstName,
          lastName: data.lastName,
          title: data.title
        });
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await api.put('/profile', {
        title,
        phoneNumber,
        firstName,
        lastName,
        avatarUrl: profile.avatarUrl,
        signatureUrl: profile.signatureUrl
      });
      showAlert('Profile info updated successfully.');
      fetchProfile();
    } catch (error) {
      showAlert('Failed to update profile info.');
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('file', avatarFile);
      await api.post('/profile/upload-avatar', formData);
      showAlert('Profile picture updated successfully!');
      setAvatarFile(null);
      fetchProfile();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      showAlert(error?.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureFile) return;
    try {
      setSignatureUploading(true);
      const formData = new FormData();
      formData.append('file', signatureFile);
      await api.post('/profile/upload-signature', formData);
      showAlert('Official signature uploaded successfully!');
      setSignatureFile(null);
      fetchProfile();
    } catch (error: any) {
      console.error('Signature upload error:', error);
      // Fallback attempt to setup endpoint if needed
      try {
        const formData = new FormData();
        formData.append('file', signatureFile);
        await api.post('/setup/upload-signature', formData);
        showAlert('Official signature uploaded successfully!');
        setSignatureFile(null);
        fetchProfile();
      } catch (fallbackErr) {
        showAlert(error?.response?.data?.message || 'Failed to upload signature.');
      }
    } finally {
      setSignatureUploading(false);
    }
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) return (
    <div className="page-container fade-in" style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
      <p>Loading your profile settings...</p>
    </div>
  );

  if (!profile) return (
    <div className="page-container fade-in" style={{ padding: '3rem', textAlign: 'center', color: '#EF4444' }}>
      <h3>⚠️ Failed to load profile profile data.</h3>
      <button className="btn btn-primary" onClick={fetchProfile} style={{ marginTop: '1rem' }}>Retry Loading</button>
    </div>
  );

  const currentAvatarUrl = avatarPreview || resolveImageUrl(profile.avatarUrl);
  const currentSignatureUrl = signaturePreview || resolveImageUrl(profile.signatureUrl);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile & Credentials</h1>
        <p className="page-subtitle">Manage your personal details, academic titles, profile picture, and official authorization signature.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Left Column: Basic Info & Roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', color: '#0F172A', fontWeight: 700, fontSize: '1.15rem' }}>
              Basic Information
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Email Address (System Identifier)</label>
              <input 
                type="email" 
                className="form-control" 
                value={profile.email || ''} 
                readOnly 
                disabled 
                style={{ backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'not-allowed' }} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ color: '#0F172A', fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Professional & Academic Title</label>
              <select 
                className="form-control" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A', cursor: 'pointer', fontSize: '0.92rem' }}
              >
                <option value="">-- Select Title (Optional) --</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
                <option value="Engr.">Engr.</option>
                <option value="Pastor">Pastor</option>
                <option value="Rev.">Rev.</option>
                <option value="Chief">Chief</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ color: '#0F172A', fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Last Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }} 
                />
              </div>
              <div>
                <label className="form-label" style={{ color: '#0F172A', fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>First Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ color: '#0F172A', fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }} 
              />
            </div>

            <button className="btn btn-primary" onClick={handleUpdateInfo} style={{ width: '100%', padding: '0.75rem' }}>
              💾 Save Basic Info & Title
            </button>
            <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.78rem', color: '#64748B', textAlign: 'center', lineHeight: 1.4 }}>
              Note: This button saves your names, academic title, and phone number only. Profile pictures and signatures have their own independent save buttons on the right.
            </p>
          </div>

          {/* Active Role & Access Management */}
          {availableRoles && availableRoles.length > 0 && (
            <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', color: '#0F172A', fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛡️</span> System Access & Persona
              </h3>
              <div>
                <label className="form-label" style={{ fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>Current Active Role</label>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem', color: '#64748B', lineHeight: 1.4 }}>
                  Select which administrative persona or permission set to activate for your current workspace session.
                </p>
                {availableRoles.length > 1 ? (
                  <select 
                    value={userRole || ''} 
                    onChange={(e) => {
                      setActiveRole(e.target.value);
                      showAlert(`Switched active workspace role to ${e.target.value}.`);
                    }}
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '8px', border: '2px solid #2563EB', backgroundColor: '#EFF6FF', fontWeight: 700, fontSize: '0.95rem', color: '#1E40AF', cursor: 'pointer', outline: 'none' }}
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.7rem 1rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', fontWeight: 700, color: '#166534' }}>
                    <span style={{ fontSize: '1rem' }}>✓</span>
                    <span>{userRole || 'User'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 500, marginLeft: 'auto' }}>Active Persona</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Avatar & Official Signature Uploads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Avatar Upload Card */}
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', color: '#0F172A', fontWeight: 700, fontSize: '1.15rem' }}>
              Profile Picture
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                {currentAvatarUrl && !avatarLoadError ? (
                  <img 
                    src={currentAvatarUrl} 
                    alt="Avatar" 
                    onError={() => setAvatarLoadError(true)}
                    style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                  />
                ) : (
                  <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 700, border: '3px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    {firstName ? firstName[0].toUpperCase() : '👤'}
                  </div>
                )}
                {avatarPreview && (
                  <span style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#2563EB', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase' }}>
                    Preview
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>
                  {avatarFile ? avatarFile.name : (profile.avatarUrl ? 'Current Profile Image' : 'No Picture Set')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
                  {avatarFile 
                    ? `Selected size: ${(avatarFile.size / 1024).toFixed(1)} KB. Ready to save image.` 
                    : 'Recommended format: JPG or PNG, at least 300x300px for sharp display across school reports.'}
                </p>
              </div>
            </div>

            {/* Hidden native input */}
            <input 
              type="file" 
              ref={avatarInputRef}
              accept="image/png, image/jpeg, image/webp" 
              style={{ display: 'none' }} 
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setAvatarFile(e.target.files[0]);
                  setAvatarLoadError(false);
                }
              }} 
            />

            {/* Interactive Executive Button Group */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600, fontSize: '0.88rem', borderStyle: 'dashed' }}
              >
                📁 {avatarFile ? 'Change File...' : 'Select Picture...'}
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => {
                  if (!avatarFile) {
                    avatarInputRef.current?.click();
                  } else {
                    handleUploadAvatar();
                  }
                }} 
                disabled={avatarUploading}
                style={{ flex: 1.4, padding: '0.65rem', fontWeight: 700, fontSize: '0.88rem', boxShadow: avatarFile ? '0 4px 12px rgba(37,99,235,0.3)' : 'none', opacity: avatarFile ? 1 : 0.85 }}
              >
                {avatarUploading ? '⏳ Uploading...' : '💾 Save Profile Picture'}
              </button>
            </div>
            {avatarFile && (
              <button 
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  if (avatarInputRef.current) avatarInputRef.current.value = '';
                }} 
                disabled={avatarUploading}
                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}
              >
                ✕ Discard selected picture
              </button>
            )}
          </div>

          {/* Official Signature Upload Card */}
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, color: '#0F172A', fontWeight: 700, fontSize: '1.15rem' }}>
                Official Signature
              </h3>
              <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>
                Institutional Asset
              </span>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ height: '110px', background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: '0.75rem', marginBottom: '0.75rem' }}>
                {currentSignatureUrl && !signatureLoadError ? (
                  <img 
                    src={currentSignatureUrl} 
                    alt="Official Signature" 
                    onError={() => setSignatureLoadError(true)}
                    style={{ maxWidth: '240px', maxHeight: '90px', objectFit: 'contain' }} 
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                    <span style={{ fontSize: '1.75rem' }}>✍️</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>No Signature Asset Recorded</span>
                  </div>
                )}
                {signaturePreview && (
                  <span style={{ position: 'absolute', top: 8, right: 8, background: '#10B981', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    New Selection Preview
                  </span>
                )}
              </div>
              
              <p className="text-muted" style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Upload a sharp photo or scanned scan of your signature on a clean white or transparent background (PNG recommended). For administrators, class teachers, and financial officers, this signature will be digitally stamped onto termly result sheets and official receipts.
              </p>
            </div>

            {/* Hidden native input */}
            <input 
              type="file" 
              ref={signatureInputRef}
              accept="image/png, image/jpeg, image/webp" 
              style={{ display: 'none' }} 
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setSignatureFile(e.target.files[0]);
                  setSignatureLoadError(false);
                }
              }} 
            />

            {/* Interactive Executive Button Group */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={() => signatureInputRef.current?.click()}
                disabled={signatureUploading}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600, fontSize: '0.88rem', borderStyle: 'dashed' }}
              >
                ✍️ {signatureFile ? 'Change File...' : 'Select Signature...'}
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => {
                  if (!signatureFile) {
                    signatureInputRef.current?.click();
                  } else {
                    handleUploadSignature();
                  }
                }} 
                disabled={signatureUploading}
                style={{ flex: 1.4, padding: '0.65rem', fontWeight: 700, fontSize: '0.88rem', boxShadow: signatureFile ? '0 4px 12px rgba(37,99,235,0.3)' : 'none', opacity: signatureFile ? 1 : 0.85 }}
              >
                {signatureUploading ? '⏳ Saving Asset...' : '💾 Save Official Signature'}
              </button>
            </div>
            {signatureFile && (
              <button 
                type="button"
                onClick={() => {
                  setSignatureFile(null);
                  if (signatureInputRef.current) signatureInputRef.current.value = '';
                }} 
                disabled={signatureUploading}
                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}
              >
                ✕ Discard selected signature
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
