import React, { useState, useEffect, useRef } from 'react';
import { api, API_ROOT } from '../../services/api';
import { useDialog } from '../../context/DialogContext';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Shield, 
  Camera, 
  FileSignature, 
  Edit3, 
  Calendar, 
  Phone, 
  Mail, 
  Check, 
  Upload, 
  X, 
  Sparkles,
  Briefcase
} from 'lucide-react';

export default function ProfileSettings() {
  const { showAlert } = useDialog();
  const { userRole, availableRoles, setActiveRole, updateUserInfo } = useAuth();

  const [activeTab, setActiveTab] = useState<'biodata' | 'roles' | 'avatar' | 'signature'>('biodata');

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states for Bio-Data
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  
  // File selections
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  
  // Live preview URLs for selected files
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  
  // Loading states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);

  // References for hidden native inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fallback state if server image URLs fail to load
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [signatureLoadError, setSignatureLoadError] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
      setMiddleName(data.middleName || '');
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
      setInfoSaving(true);
      await api.put('/profile', {
        title,
        phoneNumber,
        firstName,
        lastName,
        middleName,
        avatarUrl: profile.avatarUrl,
        signatureUrl: profile.signatureUrl
      });
      showAlert('Bio-Data updated successfully.');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      showAlert('Failed to update Bio-Data.');
    } finally {
      setInfoSaving(false);
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
      <p>Loading profile settings...</p>
    </div>
  );

  if (!profile) return (
    <div className="page-container fade-in" style={{ padding: '3rem', textAlign: 'center', color: '#EF4444' }}>
      <h3>⚠️ Failed to load profile data.</h3>
      <button className="btn btn-primary" onClick={fetchProfile} style={{ marginTop: '1rem' }}>Retry Loading</button>
    </div>
  );

  const currentAvatarUrl = avatarPreview || resolveImageUrl(profile.avatarUrl);
  const currentSignatureUrl = signaturePreview || resolveImageUrl(profile.signatureUrl);
  const fullName = `${title ? title + ' ' : ''}${firstName} ${lastName}`.trim() || profile.email || 'User Profile';

  // Role list to display
  const rolesList: string[] = availableRoles && availableRoles.length > 0
    ? availableRoles
    : (userRole ? [userRole] : ['User']);

  return (
    <div className="page-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* ════════ TOP HERO BANNER & AVATAR ════════ */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        
        {/* Banner header background - School Primary Navy Gradient */}
        <div style={{
          height: '160px',
          background: 'linear-gradient(135deg, #0A192F 0%, #000080 50%, #1E3A8A 100%)',
          position: 'relative',
          padding: '0 2rem'
        }}>
          {/* User Name in Crisp White Ink sitting directly inside the blue banner */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '185px',
            right: '2rem',
            zIndex: 2
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '1.85rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
            }}>
              {fullName}
            </h1>
          </div>
        </div>

        {/* Profile Card Main Info Row */}
        <div style={{ padding: '0 2rem 1.25rem 2rem', position: 'relative' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Left: Avatar + Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              
              {/* Overlapping Circle Avatar (Enlarged to 140px, negative margin applied only to avatar) */}
              <div style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                marginTop: '-70px',
                borderRadius: '50%',
                border: '4px solid #ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                background: '#ffffff',
                overflow: 'hidden',
                flexShrink: 0,
                zIndex: 3
              }}>
                {currentAvatarUrl && !avatarLoadError ? (
                  <img 
                    src={currentAvatarUrl} 
                    alt={fullName} 
                    onError={() => setAvatarLoadError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #000080 0%, #1E3A8A 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '3rem',
                    fontWeight: 800
                  }}>
                    {firstName ? firstName[0].toUpperCase() : '👤'}
                  </div>
                )}
              </div>

              {/* Subtitles & Badges (Positioned 100% on white surface below blue banner) */}
              <div style={{ paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {/* Primary Role Badge (School Navy Theme) */}
                  <span style={{ background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE', fontSize: '0.8rem', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={14} />
                    {userRole || 'User'}
                  </span>

                  {/* Joined Date Badge */}
                  <span style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontSize: '0.8rem', fontWeight: 600, padding: '4px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    Joined: {profile.createdDate ? new Date(profile.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Staff'}
                  </span>
                </div>
              </div>

            </div>

            {/* Right: Quick Action Pill */}
            <div style={{ paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: '#EAB308' }} />
                Account Status: <strong style={{ color: '#166534' }}>Verified</strong>
              </span>
            </div>

          </div>

          {/* ════════ HORIZONTAL TAB BAR ════════ */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.75rem',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '1rem',
            overflowX: 'auto'
          }}>
            
            <button
              type="button"
              onClick={() => setActiveTab('biodata')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'biodata' ? '#000080' : 'transparent',
                color: activeTab === 'biodata' ? '#ffffff' : '#64748B',
                fontWeight: activeTab === 'biodata' ? 700 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'biodata' ? '0 4px 14px rgba(0, 0, 128, 0.25)' : 'none'
              }}
            >
              <User size={16} />
              Bio-Data
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'roles' ? '#000080' : 'transparent',
                color: activeTab === 'roles' ? '#ffffff' : '#64748B',
                fontWeight: activeTab === 'roles' ? 700 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'roles' ? '0 4px 14px rgba(0, 0, 128, 0.25)' : 'none'
              }}
            >
              <Shield size={16} />
              Role Selection ({rolesList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('avatar')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'avatar' ? '#000080' : 'transparent',
                color: activeTab === 'avatar' ? '#ffffff' : '#64748B',
                fontWeight: activeTab === 'avatar' ? 700 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'avatar' ? '0 4px 14px rgba(0, 0, 128, 0.25)' : 'none'
              }}
            >
              <Camera size={16} />
              Profile Image
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signature')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'signature' ? '#000080' : 'transparent',
                color: activeTab === 'signature' ? '#ffffff' : '#64748B',
                fontWeight: activeTab === 'signature' ? 700 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'signature' ? '0 4px 14px rgba(0, 0, 128, 0.25)' : 'none'
              }}
            >
              <FileSignature size={16} />
              Signature
            </button>

          </div>

        </div>
      </div>

      {/* ════════ TAB CONTENT 1: BIO-DATA ════════ */}
      {activeTab === 'biodata' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          
          {/* Left Panel: Personal Overview */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', height: 'fit-content', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>
              PERSONAL OVERVIEW
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000080', flexShrink: 0 }}>
                  <Mail size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', display: 'block' }}>EMAIL</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A', wordBreak: 'break-all' }}>{profile.email || 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000080', flexShrink: 0 }}>
                  <Phone size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', display: 'block' }}>PHONE</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{phoneNumber || profile.phoneNumber || 'Not provided'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000080', flexShrink: 0 }}>
                  <Briefcase size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', display: 'block' }}>ACADEMIC TITLE</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{title || 'Not specified'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000080', flexShrink: 0 }}>
                  <Shield size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', display: 'block' }}>ASSIGNED ROLES</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {rolesList.map(r => (
                      <span key={r} style={{ background: '#F1F5F9', color: '#0F172A', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Panel: Detailed Bio-Data Form */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Basic Profile Information</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>View and update your personal bio-data details.</p>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditing(!isEditing)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
              >
                <Edit3 size={15} />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Title
                </label>
                {isEditing ? (
                  <select 
                    className="form-control" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
                  >
                    <option value="">-- Select Title --</option>
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
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                    {title || '—'}
                  </div>
                )}
              </div>

              {/* Username / ID (Displays Email Address) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  USERNAME (EMAIL)
                </label>
                <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A', wordBreak: 'break-all' }}>
                  {profile.email || profile.username || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  First Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600 }} 
                  />
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                    {firstName || '—'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Surname / Last Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600 }} 
                  />
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                    {lastName || '—'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Middle Name
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={middleName} 
                    onChange={e => setMiddleName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600 }} 
                  />
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                    {middleName || '—'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Phone Number
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600 }} 
                  />
                ) : (
                  <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                    {phoneNumber || '—'}
                  </div>
                )}
              </div>

            </div>

            {/* Roles Summary Box (School Navy Theme) */}
            <div style={{ marginTop: '1.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#000080', fontWeight: 700, fontSize: '0.9rem' }}>
                <Shield size={18} />
                <span>Assigned System Roles</span>
              </div>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#1E3A8A', lineHeight: 1.4 }}>
                Below are all administrative & instructional roles assigned to your user account across the portal.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rolesList.map(role => (
                  <span key={role} style={{ background: '#ffffff', color: '#000080', border: '1px solid #93C5FD', fontWeight: 700, fontSize: '0.82rem', padding: '4px 12px', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0, 0, 128, 0.05)' }}>
                    ✓ {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Save Button if Editing */}
            {isEditing && (
              <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateInfo}
                  disabled={infoSaving}
                  style={{ padding: '0.65rem 1.75rem', fontWeight: 700 }}
                >
                  {infoSaving ? 'Saving...' : '💾 Save Bio-Data'}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ════════ TAB CONTENT 2: ROLE SELECTION ════════ */}
      {activeTab === 'roles' && (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield style={{ color: '#000080' }} />
              Role Selection & Workspace Switcher
            </h3>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Select which administrative role or active persona to activate for your current session.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            {rolesList.map(role => {
              const isCurrentActive = userRole === role;
              return (
                <div 
                  key={role}
                  onClick={() => {
                    if (!isCurrentActive) {
                      setActiveRole(role);
                      showAlert(`Switched active role persona to ${role}.`);
                    }
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: isCurrentActive ? '2px solid #000080' : '1px solid #CBD5E1',
                    background: isCurrentActive ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isCurrentActive ? '0 4px 12px rgba(0,0,128,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isCurrentActive ? '#000080' : '#F1F5F9', color: isCurrentActive ? '#FFFFFF' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{role}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>System Access Role</span>
                      </div>
                    </div>

                    {isCurrentActive && (
                      <span style={{ background: '#000080', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} />
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: isCurrentActive ? '1px solid #93C5FD' : '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrentActive ? '#000080' : '#64748B' }}>
                      {isCurrentActive ? '● Active Persona' : 'Click to Activate'}
                    </span>
                    {isCurrentActive && (
                      <span style={{ fontSize: '0.72rem', background: '#000080', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        Current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ════════ TAB CONTENT 3: PROFILE IMAGE ════════ */}
      {activeTab === 'avatar' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Camera style={{ color: '#000080' }} size={24} />
              Profile Picture Management 📸
            </h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: '#64748B' }}>
              Upload and preview your official profile avatar displayed across student report cards, grade sheets, and staff records.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
            
            {/* Left Column: File Dropzone / Chooser */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} style={{ color: '#000080' }} />
                Upload Profile Picture File
              </h4>

              <div 
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  flex: 1,
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  background: avatarFile ? '#F0FDF4' : '#F8FAFC',
                  borderRadius: '14px',
                  border: avatarFile ? '2px dashed #10B981' : '2px dashed #CBD5E1',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
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

                {avatarFile ? (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        New Image Selected
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                        Supports PNG, JPG, or WEBP (Max size: 5MB)
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }}
                      style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <Upload size={14} />
                      Choose Different File
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={26} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        Click to Browse Image File
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                        Upload a clear headshot photo (300×300px recommended)
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
                    >
                      Select Image...
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Live Picture Preview & Action Card */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: avatarFile ? '#10B981' : '#3B82F6' }}></span>
                    {avatarFile ? 'New Image Preview' : 'Current Active Picture'}
                  </span>

                  {avatarFile ? (
                    <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                      Ready to Save
                    </span>
                  ) : currentAvatarUrl ? (
                    <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                      Active Avatar
                    </span>
                  ) : (
                    <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                      Default Avatar
                    </span>
                  )}
                </div>

                {/* Avatar Display Frame */}
                <div style={{
                  width: '100%',
                  height: '170px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}>
                  {currentAvatarUrl && !avatarLoadError ? (
                    <img 
                      src={currentAvatarUrl} 
                      alt="Avatar Preview" 
                      onError={() => setAvatarLoadError(true)}
                      style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #ffffff', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }} 
                    />
                  ) : (
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, #000080 0%, #1E3A8A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '3rem', fontWeight: 800, border: '4px solid #ffffff', boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}>
                      {firstName ? firstName[0].toUpperCase() : '👤'}
                    </div>
                  )}
                </div>

                {/* Selected File Details Box */}
                {avatarFile && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', display: 'block', wordBreak: 'break-all' }}>
                        {avatarFile.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {(avatarFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={15} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAvatarFile(null);
                    if (avatarInputRef.current) avatarInputRef.current.value = '';
                  }}
                  disabled={avatarUploading || !avatarFile}
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadAvatar}
                  disabled={avatarUploading || !avatarFile}
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  <Check size={16} />
                  {avatarUploading ? 'Uploading...' : 'Save Profile Picture'}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ════════ TAB CONTENT 4: SIGNATURE ════════ */}
      {activeTab === 'signature' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileSignature style={{ color: '#000080' }} size={24} />
              Official E-Signature Management ✍️
            </h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: '#64748B' }}>
              View your existing uploaded signature or upload a new signature image on a plain white background for authorized E-Memos, report cards, and vouchers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
            
            {/* Left Column: Upload Signature File Dropzone */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} style={{ color: '#000080' }} />
                Upload Signature File
              </h4>

              <div 
                onClick={() => signatureInputRef.current?.click()}
                style={{
                  flex: 1,
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  background: signatureFile ? '#F0FDF4' : '#F8FAFC',
                  borderRadius: '14px',
                  border: signatureFile ? '2px dashed #10B981' : '2px dashed #CBD5E1',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <input 
                  type="file" 
                  ref={signatureInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                  style={{ display: 'none' }} 
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSignatureFile(e.target.files[0]);
                      setSignatureLoadError(false);
                    }
                  }} 
                />

                {signatureFile ? (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        New Signature Selected
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                        Supports PNG, JPG, JPEG or SVG (Max size: 5MB)
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        signatureInputRef.current?.click();
                      }}
                      style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <Upload size={14} />
                      Choose Different File
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={26} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        Click to Browse Signature File
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                        Upload a clear scan on a plain white or transparent background
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
                    >
                      Select Signature Image...
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Live Preview & Action Card */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: signatureFile ? '#10B981' : '#3B82F6' }}></span>
                    {signatureFile ? 'New Signature Preview' : 'Current Active Signature'}
                  </span>

                  {signatureFile ? (
                    <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                      Ready to Save
                    </span>
                  ) : currentSignatureUrl ? (
                    <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                      Active Asset
                    </span>
                  ) : (
                    <span style={{ background: '#FEF2F2', color: '#991B1B', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                      No Signature
                    </span>
                  )}
                </div>

                {/* Inner Signature Display Grid Box */}
                <div style={{
                  width: '100%',
                  height: '170px',
                  background: '#FFFFFF',
                  backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.25rem',
                  overflow: 'hidden'
                }}>
                  {currentSignatureUrl && !signatureLoadError ? (
                    <img 
                      src={currentSignatureUrl} 
                      alt="Signature Asset" 
                      onError={() => setSignatureLoadError(true)}
                      style={{ maxWidth: '100%', maxHeight: '130px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                      <FileSignature size={36} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>No Signature Asset Recorded</span>
                    </div>
                  )}
                </div>

                {/* Selected File Details Box */}
                {signatureFile && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', display: 'block', wordBreak: 'break-all' }}>
                        {signatureFile.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {(signatureFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setSignatureFile(null);
                        if (signatureInputRef.current) signatureInputRef.current.value = '';
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={15} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSignatureFile(null);
                    if (signatureInputRef.current) signatureInputRef.current.value = '';
                  }}
                  disabled={signatureUploading || !signatureFile}
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadSignature}
                  disabled={signatureUploading || !signatureFile}
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  <Check size={16} />
                  {signatureUploading ? 'Uploading...' : 'Save & Upload Signature'}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
