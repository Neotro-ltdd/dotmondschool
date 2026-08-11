import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, API_ROOT } from '../../services/api';
import ProfileHeroHeader from '../../components/dashboard/settings/ProfileHeroHeader';
import PersonalOverviewSidebar from '../../components/dashboard/settings/PersonalOverviewSidebar';
import BiodataForm from '../../components/dashboard/settings/BiodataForm';
import RolesTab from '../../components/dashboard/settings/RolesTab';
import AvatarTab from '../../components/dashboard/settings/AvatarTab';
import SignatureTab from '../../components/dashboard/settings/SignatureTab';

export default function ProfileSettings() {
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
  
  // File selections & preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  
  // Loading states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);

  // Hidden native inputs refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fallback states
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
      alert('Bio-Data updated successfully.');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      alert('Failed to update Bio-Data.');
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
      alert('Profile picture updated successfully!');
      setAvatarFile(null);
      fetchProfile();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      alert(error?.response?.data?.message || 'Failed to upload profile picture.');
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
      alert('Official signature uploaded successfully!');
      setSignatureFile(null);
      fetchProfile();
    } catch (error: any) {
      console.error('Signature upload error:', error);
      try {
        const formData = new FormData();
        formData.append('file', signatureFile);
        await api.post('/setup/upload-signature', formData);
        alert('Official signature uploaded successfully!');
        setSignatureFile(null);
        fetchProfile();
      } catch (fallbackErr) {
        alert(error?.response?.data?.message || 'Failed to upload signature.');
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
  const rolesList: string[] = Array.from(new Set([
    ...(availableRoles || []),
    ...(profile?.roles || []),
    ...(profile?.assignedRoles || []),
    ...(userRole ? [userRole] : [])
  ])).filter((r): r is string => Boolean(r));

  return (
    <div className="page-container fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
          }
        }}
      />
      
      <input 
        type="file" 
        ref={signatureInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSignatureFile(e.target.files[0]);
          }
        }}
      />

      {/* ════════ TOP HERO BANNER & AVATAR ════════ */}
      <ProfileHeroHeader 
        fullName={fullName}
        currentAvatarUrl={currentAvatarUrl}
        avatarLoadError={avatarLoadError}
        setAvatarLoadError={setAvatarLoadError}
        firstName={firstName}
        email={profile.email}
        userRole={userRole}
        rolesList={rolesList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCameraClick={() => {
          setActiveTab('avatar');
          setTimeout(() => avatarInputRef.current?.click(), 100);
        }}
      />

      {/* ════════ TAB CONTENT 1: BIO-DATA ════════ */}
      {activeTab === 'biodata' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          <PersonalOverviewSidebar 
            email={profile.email}
            phoneNumber={phoneNumber || profile.phoneNumber}
            title={title}
            rolesList={rolesList}
          />

          <BiodataForm 
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            title={title}
            setTitle={setTitle}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            middleName={middleName}
            setMiddleName={setMiddleName}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            email={profile.email}
            rolesList={rolesList}
            infoSaving={infoSaving}
            onSave={handleUpdateInfo}
          />
        </div>
      )}

      {/* ════════ TAB CONTENT 2: ROLES & ACCESS ════════ */}
      {activeTab === 'roles' && (
        <RolesTab 
          rolesList={rolesList}
          userRole={userRole}
          onSwitchRole={(roleName: string) => setActiveRole && setActiveRole(roleName)}
        />
      )}

      {/* ════════ TAB CONTENT 3: PROFILE IMAGE ════════ */}
      {activeTab === 'avatar' && (
        <AvatarTab 
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
          currentAvatarUrl={currentAvatarUrl}
          avatarLoadError={avatarLoadError}
          firstName={firstName}
          avatarUploading={avatarUploading}
          onUpload={handleUploadAvatar}
          onBrowseClick={() => avatarInputRef.current?.click()}
        />
      )}

      {/* ════════ TAB CONTENT 4: SIGNATURE ════════ */}
      {activeTab === 'signature' && (
        <SignatureTab 
          signatureFile={signatureFile}
          setSignatureFile={setSignatureFile}
          currentSignatureUrl={currentSignatureUrl}
          signatureLoadError={signatureLoadError}
          setSignatureLoadError={setSignatureLoadError}
          signatureUploading={signatureUploading}
          onUpload={handleUploadSignature}
          onBrowseClick={() => signatureInputRef.current?.click()}
        />
      )}

    </div>
  );
}
