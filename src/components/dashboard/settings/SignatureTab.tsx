import React from 'react';
import { FileSignature, X, Check } from 'lucide-react';

interface SignatureTabProps {
  signatureFile: File | null;
  setSignatureFile: (file: File | null) => void;
  currentSignatureUrl: string;
  signatureLoadError: boolean;
  setSignatureLoadError: (val: boolean) => void;
  signatureUploading: boolean;
  onUpload: () => void;
  onBrowseClick: () => void;
}

export const SignatureTab: React.FC<SignatureTabProps> = ({
  signatureFile,
  setSignatureFile,
  currentSignatureUrl,
  signatureLoadError,
  setSignatureLoadError,
  signatureUploading,
  onUpload,
  onBrowseClick
}) => {
  const previewUrl = React.useMemo(() => {
    if (signatureFile) {
      try {
        return URL.createObjectURL(signatureFile);
      } catch {
        return null;
      }
    }
    return currentSignatureUrl;
  }, [signatureFile, currentSignatureUrl]);

  React.useEffect(() => {
    setSignatureLoadError(false);
  }, [signatureFile]);

  return (
    <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Official Digital Signature</h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
          Upload your official digital signature to automatically sign report cards, broadsheets, and clearance documents.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Upload Box */}
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
            <FileSignature size={26} />
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
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
          >
            Select Signature Image...
          </button>
        </div>

        {/* Right Preview Box */}
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

            {/* Inner Signature Grid Box */}
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
              {previewUrl && !signatureLoadError ? (
                <img 
                  src={previewUrl} 
                  alt="Signature Asset Preview" 
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
                  onClick={() => setSignatureFile(null)}
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
              onClick={() => setSignatureFile(null)}
              disabled={signatureUploading || !signatureFile}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onUpload}
              disabled={signatureUploading || !signatureFile}
              style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.88rem', background: '#000080', borderColor: '#000080', color: '#ffffff' }}
            >
              <Check size={16} />
              {signatureUploading ? 'Uploading...' : 'Save & Upload Signature'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SignatureTab;
