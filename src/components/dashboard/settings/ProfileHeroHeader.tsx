import React from 'react';
import { Shield, Calendar, Check, Camera, User, FileSignature } from 'lucide-react';

interface ProfileHeroHeaderProps {
  fullName: string;
  currentAvatarUrl: string;
  avatarLoadError: boolean;
  setAvatarLoadError: (val: boolean) => void;
  firstName?: string;
  email?: string;
  userRole?: string | null;
  rolesList: string[];
  activeTab: 'biodata' | 'roles' | 'avatar' | 'signature';
  setActiveTab: (tab: 'biodata' | 'roles' | 'avatar' | 'signature') => void;
  onCameraClick: () => void;
}

export const ProfileHeroHeader: React.FC<ProfileHeroHeaderProps> = ({
  fullName,
  currentAvatarUrl,
  avatarLoadError,
  setAvatarLoadError,
  firstName,
  email,
  userRole,
  rolesList,
  activeTab,
  setActiveTab,
  onCameraClick
}) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
      
      {/* Banner header background - School Primary Navy matching Dashboard Banner */}
      <div style={{
        height: '160px',
        background: 'var(--primary-color, #000080)',
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
            
            {/* Overlapping Circle Avatar */}
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '4px solid #ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              marginTop: '-70px',
              position: 'relative',
              zIndex: 3,
              backgroundColor: '#0F172A',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {currentAvatarUrl && !avatarLoadError ? (
                <img 
                  src={currentAvatarUrl} 
                  alt={fullName} 
                  onError={() => setAvatarLoadError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', backgroundColor: '#0F172A', fontSize: '2.5rem', fontWeight: 800 }}>
                  {firstName ? firstName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
                </div>
              )}

              <button 
                type="button"
                onClick={onCameraClick}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '36px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Change Profile Picture"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Badges & Joined Meta */}
            <div style={{ paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#EFF6FF', color: '#000080', fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #BFDBFE' }}>
                  <Shield size={13} /> {userRole || 'Staff Member'}
                </span>
                
                <span style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.8rem', fontWeight: 600, padding: '4px 12px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #E2E8F0' }}>
                  <Calendar size={13} /> Joined: Active Staff
                </span>
              </div>
            </div>

          </div>

          {/* Right: Account Verification Status */}
          <div style={{ paddingTop: '0.75rem' }}>
            <span style={{ background: '#F0FDF4', color: '#166534', fontSize: '0.82rem', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Check size={15} style={{ color: '#16A34A' }} /> Account Status: <strong>Verified</strong>
            </span>
          </div>

        </div>

        {/* Nav Tabs Row inside Hero Box */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
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

          {(userRole === 'Teacher' || userRole === 'SubjectTeacher' || userRole === 'FormTeacher' || userRole === 'Principal' || userRole === 'Admin' || userRole === 'SuperAdmin') && (
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
          )}

        </div>

      </div>
    </div>
  );
};

export default ProfileHeroHeader;
