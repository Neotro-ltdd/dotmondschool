import React, { useState } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../../services/api';

interface RequestEmailChangeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
}

export const RequestEmailChangeDrawer: React.FC<RequestEmailChangeDrawerProps> = ({
  isOpen,
  onClose,
  currentEmail = ''
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newEmail || !newEmail.trim()) {
      setErrorMsg('Please enter a valid new email address.');
      return;
    }

    if (!reason || !reason.trim()) {
      setErrorMsg('Please provide a reason for requesting an email change.');
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      setErrorMsg('The new email must be different from your current email.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/setup/staff/request-email-change', {
        newEmail: newEmail.trim(),
        reason: reason.trim()
      });

      setSuccessMsg(res?.message || 'Your email change request has been submitted successfully to Admin/Director for review.');
      setNewEmail('');
      setReason('');

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit email change request', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(3px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Backdrop click to close */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Slide Drawer Content */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        backgroundColor: '#FFFFFF',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Request Email Change</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>Submit email update request to Admin/Director</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {errorMsg && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#166534',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMsg}</div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              CURRENT EMAIL ADDRESS
            </label>
            <input
              type="email"
              readOnly
              value={currentEmail}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                fontWeight: 600,
                color: '#64748B',
                fontSize: '0.9rem'
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              Your active login email associated with your staff profile.
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              NEW EMAIL ADDRESS <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. new.email@dotmondschool.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                border: '1.5px solid #000080',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                color: '#0F172A',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Double-check spelling. Once approved, you will log in with this new email.
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              REASON FOR REQUEST <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain why you are requesting an email change (e.g. Official name change, corrected typo)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontWeight: 500,
                color: '#0F172A',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            background: '#EFF6FF',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            border: '1px solid #BFDBFE',
            fontSize: '0.78rem',
            color: '#1E40AF',
            lineHeight: '1.45'
          }}>
            <strong>🔒 Password Protection Notice:</strong> Your existing password will remain unchanged. Once an Admin or Director approves your request, you can log in immediately using your new email address with your existing password.
          </div>

          {/* Drawer Footer Actions */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
              style={{ padding: '0.65rem 1.25rem', fontWeight: 700, fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn"
              style={{
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: '#000080',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={15} />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RequestEmailChangeDrawer;
