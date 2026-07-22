import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../services/api';
import { useDialog } from '../../context/DialogContext';


export default function ProfileSettings() {
  const { showAlert } = useDialog();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Files
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/profile');
      setProfile(data);
      setPhoneNumber(data.phoneNumber || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await api.put('/profile', {
        phoneNumber,
        firstName,
        lastName,
        avatarUrl: profile.avatarUrl,
        signatureUrl: profile.signatureUrl
      });
      showAlert('Profile info updated successfully');
      fetchProfile();
    } catch (error) {
      showAlert('Failed to update profile info');
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('file', avatarFile);
      const res = await api.post('/profile/upload-avatar', formData);
      showAlert('Avatar updated successfully');
      setAvatarFile(null);
      fetchProfile();
    } catch (error) {
      showAlert('Failed to upload avatar');
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
      // We can use the existing setup/upload-signature endpoint which handles Teachers properly
      await api.post('/setup/upload-signature', formData);
      showAlert('Signature uploaded successfully');
      setSignatureFile(null);
      fetchProfile();
    } catch (error) {
      showAlert('Failed to upload signature');
    } finally {
      setSignatureUploading(false);
    }
  };

  if (loading) return <div>Loading Profile...</div>;
  if (!profile) return <div>Failed to load profile.</div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information, profile picture, and signature.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Basic Info */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Basic Information</h3>
          
          <div className="form-group">
            <label className="form-label">Email Address (Locked)</label>
            <input type="email" className="form-control" value={profile.email || ''} readOnly disabled style={{ opacity: 0.7 }} />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-control" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={handleUpdateInfo} style={{ marginTop: '1rem' }}>
            Save Changes
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Avatar Upload */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Profile Picture</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <img 
                src={`${API_ROOT}${profile.avatarUrl}`} 
                alt="Avatar" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', background: '#333' }} 
              />
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control" 
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)} 
                />
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handleUploadAvatar} 
              disabled={!avatarFile || avatarUploading}
            >
              {avatarUploading ? 'Uploading...' : 'Upload New Picture'}
            </button>
          </div>

          {/* Signature Upload */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Official Signature</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '150px', height: '80px', background: '#fff', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile.signatureUrl ? (
                  <img src={`${API_ROOT}${profile.signatureUrl}`} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: '#999' }}>No Signature</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control" 
                  onChange={e => setSignatureFile(e.target.files?.[0] || null)} 
                />
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Upload a clear image of your signature with a white or transparent background. For class teachers, this will appear on the final result sheets.</p>
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={handleUploadSignature} 
              disabled={!signatureFile || signatureUploading}
            >
              {signatureUploading ? 'Uploading...' : 'Upload New Signature'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
