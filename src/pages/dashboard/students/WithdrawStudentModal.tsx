import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { 
  X, 
  AlertTriangle, 
  UserMinus, 
  ShieldAlert, 
  FileCheck2, 
  HelpCircle,
  Clock,
  Calendar,
  Building2
} from 'lucide-react';
import './WithdrawStudentModal.css';

interface WithdrawStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: {
    id: string;
    fullName: string;
    registrationNumber: string;
    className: string;
  } | null;
  currentSession?: string;
  currentTerm?: string;
  initialStatus?: 'Withdrawn' | 'Suspended';
}

const COMMON_REASONS = [
  'Stopped coming to school / Truancy',
  'Changed school / Transferred',
  'Family relocation / Moved away',
  'Disciplinary suspension',
  'Financial constraints',
  'Personal / Medical circumstances',
  'Other administrative decision'
];

const TERM_OPTIONS = ['First Term', 'Second Term', 'Third Term'];

export default function WithdrawStudentModal({
  isOpen,
  onClose,
  onSuccess,
  student,
  currentSession,
  currentTerm,
  initialStatus = 'Withdrawn'
}: WithdrawStudentModalProps) {
  const { showAlert } = useDialog();
  const sessionOptions = getSessionOptions();

  const [statusType, setStatusType] = useState<'Withdrawn' | 'Suspended'>(initialStatus);
  const [reason, setReason] = useState<string>('Stopped coming to school / Truancy');
  const [customReason, setCustomReason] = useState<string>('');
  const [session, setSession] = useState<string>(currentSession || sessionOptions[0] || '2026/2027');
  const [term, setTerm] = useState<string>(currentTerm || 'First Term');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatusType(initialStatus || 'Withdrawn');
      setReason('Stopped coming to school / Truancy');
      setCustomReason('');
      setSession(currentSession || sessionOptions[0] || '2026/2027');
      setTerm(currentTerm || 'First Term');
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentSession, currentTerm, initialStatus]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveReason = reason === 'Other administrative decision' 
      ? (customReason.trim() || 'Other administrative decision')
      : reason;

    if (!effectiveReason) {
      setError('Please provide a withdrawal or suspension reason.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        status: statusType,
        reason: effectiveReason,
        lastActiveSession: session,
        lastActiveTerm: term,
        notes: notes.trim() || undefined
      };

      await api.post(`/setup/students/${student.id}/withdraw`, payload);

      showAlert(
        `Student ${student.fullName} has been successfully marked as ${statusType}. All past scores, term results, and transcripts remain safely preserved in Institutional Records.`,
        { title: `${statusType} Successfully Processed`, type: 'success' }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || `Failed to process student ${statusType.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container withdraw-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className={`modal-icon-badge ${statusType.toLowerCase()}`}>
              <UserMinus size={20} />
            </div>
            <div>
              <h3 id="withdraw-modal-title" className="modal-title">
                Withdraw / Suspend Student
              </h3>
              <p className="modal-subtitle">
                Deactivate student from active class rosters while preserving complete transcripts and results.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="withdraw-alert-banner error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Student Profile Snapshot */}
        <div className="student-snapshot-card">
          <div className="student-snapshot-info">
            <span className="snapshot-reg">{student.registrationNumber || 'No Reg No'}</span>
            <h4 className="snapshot-name">{student.fullName}</h4>
            <span className="snapshot-class">
              <Building2 size={14} /> Current Class: <strong>{student.className || 'Unassigned'}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="withdraw-form">
          {/* Status Selection (Withdrawn vs Suspended) */}
          <div className="form-field-group">
            <label className="field-label">Action Classification <span className="text-red-500">*</span></label>
            <div className="status-selector-grid">
              <label className={`status-option ${statusType === 'Withdrawn' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="statusType"
                  value="Withdrawn"
                  checked={statusType === 'Withdrawn'}
                  onChange={() => setStatusType('Withdrawn')}
                />
                <div className="status-option-content">
                  <div className="status-option-title">
                    <span className="dot withdrawn" /> Withdrawn (Left Institution)
                  </div>
                  <p className="status-option-desc">
                    For students who have stopped coming, transferred, or relocated permanently.
                  </p>
                </div>
              </label>

              <label className={`status-option ${statusType === 'Suspended' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="statusType"
                  value="Suspended"
                  checked={statusType === 'Suspended'}
                  onChange={() => setStatusType('Suspended')}
                />
                <div className="status-option-content">
                  <div className="status-option-title">
                    <span className="dot suspended" /> Suspended (Administrative/Disciplinary)
                  </div>
                  <p className="status-option-desc">
                    For students temporarily suspended due to school policy or disciplinary review.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="form-field-group">
            <label htmlFor="withdraw-reason" className="field-label">
              Primary Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="withdraw-reason"
              className="field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other administrative decision' && (
            <div className="form-field-group">
              <label htmlFor="custom-reason" className="field-label">
                Specify Reason <span className="text-red-500">*</span>
              </label>
              <input
                id="custom-reason"
                type="text"
                className="field-input"
                placeholder="Enter specific withdrawal / suspension rationale..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          {/* Last Active Session & Term (Two Columns) */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label htmlFor="withdraw-session" className="field-label">
                <Calendar size={14} /> Last Session Completed / Attended <span className="text-red-500">*</span>
              </label>
              <select
                id="withdraw-session"
                className="field-input"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                required
              >
                {sessionOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label htmlFor="withdraw-term" className="field-label">
                <Clock size={14} /> Last Term Completed / Attended <span className="text-red-500">*</span>
              </label>
              <select
                id="withdraw-term"
                className="field-input"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
              >
                {TERM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Operational Notes */}
          <div className="form-field-group">
            <label htmlFor="withdraw-notes" className="field-label">
              Administrative Remarks / Record Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="withdraw-notes"
              className="field-textarea"
              rows={3}
              placeholder="e.g. Transferred to Kings College Lagos; academic clearance certificate issued."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Institutional Guarantee Note */}
          <div className="guarantee-box">
            <FileCheck2 size={18} className="guarantee-icon" />
            <div className="guarantee-text">
              <strong>Records Preservation Guarantee:</strong> This student will be hidden from active classroom rosters, continuous assessments, and fee billings, but all their results, term report cards, invoices, and academic transcripts will be permanently kept in <strong>Records &gt; Students</strong>.
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-modal-confirm ${statusType.toLowerCase()}`}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : `Confirm ${statusType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
