import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import AvatarCropper from './AvatarCropper';

interface AvatarTabProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  currentAvatarUrl: string;
  avatarLoadError: boolean;
  firstName?: string;
  avatarUploading: boolean;
  onUpload: (fileToUpload?: File) => void;
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
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  const displayAvatarUrl = livePreviewUrl || currentAvatarUrl;

  const handleSave = () => {
    onUpload(croppedFile || avatarFile || undefined);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Profile Picture Avatar</h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
          Upload an official headshot photo for your staff identity badge and portal header. You can position and zoom your photo to ensure perfect framing.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Upload Drag & Drop Box OR Interactive Cropper */}
        {!avatarFile ? (
          <div 
            onClick={onBrowseClick}
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '14px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#F8FAFC',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              minHeight: '340px'
            }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#EFF6FF', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} />
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
        ) : (
          <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Adjust Photo Position & Zoom
            </span>

            <AvatarCropper
              imageFile={avatarFile}
              onPreviewChange={(url) => setLivePreviewUrl(url)}
              onCroppedFileReady={(file) => setCroppedFile(file)}
              uploading={avatarUploading}
              onCancel={() => {
                setAvatarFile(null);
                setLivePreviewUrl(null);
                setCroppedFile(null);
              }}
            />
          </div>
        )}

        {/* Preview Box */}
        <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '380px' }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
              Final Previews
            </span>

            {/* Dual Previews Container */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
              {/* ID Card Rectangular Frame Preview */}
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Staff ID Card Frame
                </span>
                <div style={{ width: '120px', height: '115px', borderRadius: '8px', border: '2px solid #000080', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', overflow: 'hidden', backgroundColor: '#0F172A' }}>
                  {displayAvatarUrl && !avatarLoadError ? (
                    <img src={displayAvatarUrl} alt="Staff ID Card Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', fontSize: '2.2rem', fontWeight: 800 }}>
                      {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* Header Circle Avatar Preview */}
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Portal Circle
                </span>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', overflow: 'hidden', backgroundColor: '#0F172A' }}>
                  {displayAvatarUrl && !avatarLoadError ? (
                    <img src={displayAvatarUrl} alt="Portal Circle Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', fontSize: '2rem', fontWeight: 800 }}>
                      {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {avatarFile ? (
              <div style={{ background: '#F1F5F9', borderRadius: '8px', padding: '0.6rem 0.85rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700, display: 'block' }}>
                  ✓ Positioned & Ready for ID Badge
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>
                  {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                No new photo selected yet.
              </span>
            )}
          </div>

          {avatarFile && (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setAvatarFile(null);
                  setLivePreviewUrl(null);
                  setCroppedFile(null);
                }}
                disabled={avatarUploading}
                style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={avatarUploading}
                style={{ flex: 1.5, padding: '0.65rem', background: '#000080', borderColor: '#000080', color: '#ffffff', fontWeight: 700 }}
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

