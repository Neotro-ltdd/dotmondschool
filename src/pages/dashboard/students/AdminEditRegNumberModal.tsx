import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import {
  X,
  ShieldCheck,
  QrCode,
  AlertCircle,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';
import './AdminEditRegNumberModal.css';

interface AdminEditRegNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReg: string) => void;
  student: {
    id: string;
    fullName: string;
    registrationNumber: string;
    className: string;
    isIdCardPrinted?: boolean;
    gender?: string;
  } | null;
}

export default function AdminEditRegNumberModal({
  isOpen,
  onClose,
  onSuccess,
  student,
}: AdminEditRegNumberModalProps) {
  const { showAlert } = useDialog();

  const [newRegNumber, setNewRegNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('Standardization of class prefix format');
  const [markNeedsReprint, setMarkNeedsReprint] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setNewRegNumber(student.registrationNumber || '');
      setReason('Standardization of class prefix format');
      setMarkNeedsReprint(false);
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || 'S';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically convert to uppercase and trim leading whitespace
    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
    setNewRegNumber(val);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReg = newRegNumber.trim().toUpperCase();

    if (!cleanReg) {
      setError('Please provide a valid registration number.');
      return;
    }

    if (cleanReg === student.registrationNumber?.trim().toUpperCase()) {
      setError('The new registration number is identical to the current one.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.put(`/admin/students/${student.id}/registration-number`, {
        newRegistrationNumber: cleanReg,
        reason: reason.trim() || 'Administrative override',
        markNeedsIdCardReprint: markNeedsReprint,
      });

      const message =
        res?.message ||
        `Registration number updated successfully to ${cleanReg}. Existing printed ID cards will continue to scan normally.`;

      await showAlert(message, {
        title: 'Registration Number Updated',
        type: 'success',
      });

      onSuccess(cleanReg);
      onClose();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update registration number. Please verify permissions or check for collisions.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="admin-edit-reg-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-reg-modal-title"
      >
        {/* Header */}
        <div className="admin-reg-header">
          <div className="admin-reg-header-title">
            <div className="admin-reg-icon-wrapper">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3
                id="admin-reg-modal-title"
                style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}
              >
                Admin Edit: Registration Number
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Direct institutional override with automatic database persistence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="admin-reg-body">
            {/* Student Snapshot */}
            <div className="admin-reg-student-snapshot">
              <div className="admin-reg-avatar">{getInitials(student.fullName)}</div>
              <div className="admin-reg-student-meta">
                <span className="admin-reg-name">{student.fullName}</span>
                <div className="admin-reg-tags">
                  <span className="admin-reg-badge class-badge">{student.className}</span>
                  <span className="admin-reg-badge current-badge" title="Current registration number">
                    Current: {student.registrationNumber || 'Unassigned'}
                  </span>
                  <span
                    className={`admin-reg-badge ${
                      student.isIdCardPrinted
                        ? 'idcard-badge-printed'
                        : 'idcard-badge-unprinted'
                    }`}
                  >
                    {student.isIdCardPrinted ? 'ID Card Printed' : 'Card Not Printed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guaranteed QR Code Scanning Notice */}
            <div className="admin-reg-qr-notice">
              <QrCode size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Physical ID Card QR Code Guarantee:</strong> Existing plastic ID cards already printed for this student will continue to scan and record gate attendance with 100% reliability because QR codes are anchored to the student's unique permanent system identity.
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="admin-reg-error-box">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* New Registration Number Field */}
            <div className="admin-reg-field-group">
              <label className="admin-reg-label" htmlFor="newRegNumberInput">
                <span>
                  New Registration Number <span style={{ color: '#EF4444' }}>*</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6366F1' }}>Auto-Uppercase</span>
              </label>
              <input
                id="newRegNumberInput"
                type="text"
                className="admin-reg-input monospace"
                value={newRegNumber}
                onChange={handleInputChange}
                placeholder="e.g. DOTNURSERY2-026"
                disabled={loading}
                autoFocus
                required
              />
              <span className="admin-reg-helper">
                Standard format: <code>DOTNURSERY2-016</code>, <code>DOTPRIMARY1-005</code>, <code>DOTJSS1-010</code>
              </span>
            </div>

            {/* Reason for Override */}
            <div className="admin-reg-field-group">
              <label className="admin-reg-label" htmlFor="adminRegReasonInput">
                Reason for Modification (Audit Trail)
              </label>
              <input
                id="adminRegReasonInput"
                type="text"
                className="admin-reg-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Standardizing prefix from DOTNUR1 to DOTNURSERY2"
                disabled={loading}
              />
            </div>

            {/* ID Card Reprint Checkbox */}
            <label className="admin-reg-checkbox-group">
              <input
                type="checkbox"
                checked={markNeedsReprint}
                onChange={(e) => setMarkNeedsReprint(e.target.checked)}
                disabled={loading}
              />
              <div className="admin-reg-checkbox-text">
                <span className="admin-reg-checkbox-title">
                  Queue for ID Card Re-Printing (Optional)
                </span>
                <span className="admin-reg-checkbox-desc">
                  Check this only if you want the vendor to print a new physical card with the updated text number on the front. Leaving this unchecked keeps the current card marked as active.
                </span>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="admin-reg-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newRegNumber.trim()}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                background: '#4F46E5',
                color: '#FFF',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <RotateCcw size={16} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Check size={16} /> Update Registration Number
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
