import React from 'react';
import { Camera } from 'lucide-react';

interface AvatarTabProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  currentAvatarUrl: string;
  avatarLoadError: boolean;
  firstName?: string;
  avatarUploading: boolean;
  onUpload: () => void;
  onBrowseClick: () => void;
}

export const AvatarTab: React.FC<AvatarTabProps> = ({
  avatarFile,
  setAvatarFile,
  currentAvatarUrl,
  avatarLoadError,
  firstName,
  avatarUploading,
  onUpload,
  onBrowseClick
}) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Profile Picture Avatar</h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
          Upload an official headshot photo for your staff identity badge and portal header.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Upload Drag & Drop Box */}
        <div 
          onClick={onBrowseClick}
          style={{
            border: '2px dashed #CBD5E1',
            borderRadius: '14px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#F8FAFC',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={26} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Click to Browse Photo
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Supports PNG, JPG or WEBP (Max size: 5MB)
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-outline"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
          >
            Select Photo...
          </button>
        </div>

        {/* Preview Box */}
        <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '1rem' }}>
              Avatar Preview
            </span>

            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', margin: '0 auto 1rem auto', backgroundColor: '#0F172A' }}>
              {currentAvatarUrl && !avatarLoadError ? (
                <img src={currentAvatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', fontSize: '2.2rem', fontWeight: 800 }}>
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            {avatarFile && (
              <span style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 700 }}>
                Selected file: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {avatarFile && (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAvatarFile(null)}
                disabled={avatarUploading}
                style={{ flex: 1, padding: '0.6rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onUpload}
                disabled={avatarUploading}
                style={{ flex: 1, padding: '0.6rem', background: '#000080', borderColor: '#000080', color: '#ffffff', fontWeight: 700 }}
              >
                {avatarUploading ? 'Uploading...' : 'Save Avatar'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AvatarTab;
