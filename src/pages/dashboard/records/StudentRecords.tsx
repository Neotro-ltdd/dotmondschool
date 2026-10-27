import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { useDialog } from '../../../context/DialogContext';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  Archive,
  Search,
  Filter,
  Users,
  GraduationCap,
  UserX,
  UserCheck,
  FileText,
  Printer,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Eye,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import './StudentRecords.css';

interface StudentRecord {
  id: string;
  registrationNumber: string;
  surname: string;
  firstName: string;
  otherNames: string;
  fullName: string;
  gender: string;
  passportUrl?: string;
  parentEmail?: string;
  parentPhoneNumber?: string;
  departmentTrack?: string;
  className: string;
  classId: string;
  status: string;
  hasGraduated: boolean;
  graduatedAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  withdrawnReason?: string;
  withdrawnNotes?: string;
  withdrawnAt?: string;
  lastActiveSession: string;
  lastActiveTerm: string;
  admittedSession?: string;
  admittedTerm?: string;
  admissionDate?: string;
  hasResults: boolean;
}

interface RecordsSummary {
  totalRecords: number;
  totalWithdrawn: number;
  totalSuspended: number;
  totalGraduated: number;
  totalArchived: number;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
  section: string;
}

export default function StudentRecords() {
  const { showAlert } = useDialog();
  const { canManageClasses, isDeveloperRoot } = usePermissions();
  const sessionOptions = getSessionOptions();

  // Primary Data State
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [summary, setSummary] = useState<RecordsSummary>({
    totalRecords: 0,
    totalWithdrawn: 0,
    totalSuspended: 0,
    totalGraduated: 0,
    totalArchived: 0,
  });
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  // Default to 'withdrawn_or_suspended' as requested by the user
  const [filterStatus, setFilterStatus] = useState<string>('withdrawn_or_suspended');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState<StudentRecord | null>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [reinstateStudent, setReinstateStudent] = useState<StudentRecord | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [reinstateNotes, setReinstateNotes] = useState<string>('');
  const [submittingReinstate, setSubmittingReinstate] = useState(false);

  const [dossierStudent, setDossierStudent] = useState<StudentRecord | null>(null);

  // Fetch classes for dropdown filter & reinstatement
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.get('/setup/classes');
        const list = Array.isArray(data) ? data : data?.data || [];
        setClasses(list);
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch records from backend
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterClassId && filterClassId !== 'all') params.append('classId', filterClassId);
      if (filterSession && filterSession !== 'all') params.append('session', filterSession);
      if (filterTerm && filterTerm !== 'all') params.append('term', filterTerm);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/records/students?${params.toString()}`);
      const payload = res?.data || res;

      if (payload?.records) {
        setRecords(payload.records);
        if (payload.summary) {
          setSummary(payload.summary);
        }
      } else if (Array.isArray(payload)) {
        setRecords(payload);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load institutional student records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filterStatus, filterClassId, filterSession, filterTerm]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  // Open Transcript Modal
  const handleOpenTranscript = async (student: StudentRecord) => {
    setSelectedTranscriptStudent(student);
    setTranscriptData(null);
    setTranscriptError(null);
    setLoadingTranscript(true);

    try {
      const res = await api.get(`/academics/students/${student.id}/transcript`);
      const payload = res?.data || res;
      setTranscriptData(payload);
    } catch (err: any) {
      setTranscriptError(err?.message || 'Failed to generate academic transcript.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  // Handle Reinstatement submission
  const handleReinstateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reinstateStudent || !targetClassId) return;

    try {
      setSubmittingReinstate(true);
      await api.post(`/setup/students/${reinstateStudent.id}/reinstate`, {
        targetClassId,
        notes: reinstateNotes.trim() || undefined,
      });

      showAlert(
        `Student ${reinstateStudent.fullName} has been successfully reinstated to the active student roster.`,
        { title: 'Reinstatement Complete', type: 'success' }
      );

      setReinstateStudent(null);
      setTargetClassId('');
      setReinstateNotes('');
      fetchRecords();
    } catch (err: any) {
      showAlert(err?.message || 'Failed to reinstate student.', { type: 'danger' });
    } finally {
      setSubmittingReinstate(false);
    }
  };

  return (
    <div className="records-page-container">
      {/* Header Banner */}
      <div className="records-header">
        <div className="records-title-box">
          <div className="records-icon-badge">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="records-title">Institutional Student Records</h1>
            <p className="records-subtitle">
              Authoritative historical repository of student academic trajectories, withdrawn/suspended students, transcripts, and alumni records.
            </p>
          </div>
        </div>
        <div className="records-header-actions">
          <button 
            className="btn-records-secondary"
            onClick={fetchRecords}
            title="Refresh record set"
          >
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="records-metric-grid">
        <div 
          className={`metric-card ${filterStatus === 'withdrawn_or_suspended' || filterStatus === 'withdrawn' ? 'active-metric' : ''}`}
          onClick={() => setFilterStatus('withdrawn')}
        >
          <div className="metric-icon-box withdrawn">
            <UserX size={20} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Withdrawn Students</span>
            <span className="metric-value">{summary.totalWithdrawn}</span>
            <span className="metric-hint">Left / Transferred</span>
          </div>
        </div>

        <div 
          className={`metric-card ${filterStatus === 'suspended' ? 'active-metric' : ''}`}
          onClick={() => setFilterStatus('suspended')}
        >
          <div className="metric-icon-box suspended">
            <Clock size={20} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Suspended Students</span>
            <span className="metric-value">{summary.totalSuspended}</span>
            <span className="metric-hint">Administrative / Disciplinary</span>
          </div>
        </div>

        <div 
          className={`metric-card ${filterStatus === 'graduated' ? 'active-metric' : ''}`}
          onClick={() => setFilterStatus('graduated')}
        >
          <div className="metric-icon-box graduated">
            <GraduationCap size={20} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Graduated Alumni</span>
            <span className="metric-value">{summary.totalGraduated}</span>
            <span className="metric-hint">Completed Studies</span>
          </div>
        </div>

        <div 
          className={`metric-card ${filterStatus === 'all' ? 'active-metric' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          <div className="metric-icon-box total">
            <Archive size={20} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Historical Records</span>
            <span className="metric-value">{summary.totalRecords}</span>
            <span className="metric-hint">Preserved Transcripts</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="records-toolbar-card">
        {/* Status Filter Tabs / Pills */}
        <div className="records-status-pills">
          <button
            type="button"
            className={`status-pill ${filterStatus === 'withdrawn_or_suspended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('withdrawn_or_suspended')}
          >
            <UserX size={14} /> Withdrawn & Suspended
          </button>
          <button
            type="button"
            className={`status-pill ${filterStatus === 'withdrawn' ? 'active' : ''}`}
            onClick={() => setFilterStatus('withdrawn')}
          >
            Withdrawn Only ({summary.totalWithdrawn})
          </button>
          <button
            type="button"
            className={`status-pill ${filterStatus === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('suspended')}
          >
            Suspended Only ({summary.totalSuspended})
          </button>
          <button
            type="button"
            className={`status-pill ${filterStatus === 'graduated' ? 'active' : ''}`}
            onClick={() => setFilterStatus('graduated')}
          >
            Graduated ({summary.totalGraduated})
          </button>
          <button
            type="button"
            className={`status-pill ${filterStatus === 'archived' ? 'active' : ''}`}
            onClick={() => setFilterStatus('archived')}
          >
            Archived ({summary.totalArchived})
          </button>
          <button
            type="button"
            className={`status-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Inactive Records ({summary.totalRecords})
          </button>
        </div>

        {/* Detailed Secondary Filters & Search */}
        <div className="records-filter-row">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by student name or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    fetchRecords();
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          <div className="filter-select-group">
            <select
              className="records-select"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <option value="all">All Former Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>

            <select
              className="records-select"
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
            >
              <option value="all">All Last Sessions</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>
                  Last Session: {s}
                </option>
              ))}
            </select>

            <select
              className="records-select"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            >
              <option value="all">All Last Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table Area */}
      <div className="records-table-card">
        {loading ? (
          <div className="records-state-box loading">
            <div className="spinner" />
            <p>Loading institutional student records...</p>
          </div>
        ) : error ? (
          <div className="records-state-box error">
            <AlertTriangle size={36} className="text-red-500" />
            <p className="font-semibold text-gray-800">{error}</p>
            <button className="btn-records-secondary mt-3" onClick={fetchRecords}>
              Try Again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="records-state-box empty">
            <Archive size={40} className="text-gray-400" />
            <h3 className="font-bold text-gray-800 text-lg">No Student Records Found</h3>
            <p className="text-gray-500 text-sm max-w-md mt-1">
              There are currently no students matching the selected status or search criteria in the institutional archive.
            </p>
          </div>
        ) : (
          <div className="records-table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Student Name</th>
                  <th>Former / Last Class</th>
                  <th>Last Session Completed</th>
                  <th>Last Term Completed</th>
                  <th>Reason / Record Note</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((student) => {
                  return (
                    <tr key={student.id}>
                      {/* Registration Number */}
                      <td>
                        <span className="badge-reg-number">
                          {student.registrationNumber || 'No Reg No'}
                        </span>
                      </td>

                      {/* Student Profile */}
                      <td>
                        <div className="student-profile-cell">
                          {student.passportUrl ? (
                            <img
                              src={student.passportUrl}
                              alt={student.fullName}
                              className="student-avatar"
                            />
                          ) : (
                            <div className="student-avatar-placeholder">
                              {student.surname?.[0] || 'S'}
                              {student.firstName?.[0] || ''}
                            </div>
                          )}
                          <div className="student-name-meta">
                            <span className="student-full-name">{student.fullName}</span>
                            <span className="student-sub-meta">
                              {student.gender || 'Unknown'} • {student.departmentTrack || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Former Class */}
                      <td>
                        <div className="class-badge-cell">
                          <Building2 size={14} className="text-gray-400" />
                          <span>{student.className}</span>
                        </div>
                      </td>

                      {/* Last Session Attended */}
                      <td>
                        <div className="session-badge-cell">
                          <Calendar size={14} className="text-blue-500" />
                          <span className="font-semibold text-gray-900">
                            {student.lastActiveSession || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Last Term Attended */}
                      <td>
                        <div className="term-badge-cell">
                          <Clock size={14} className="text-amber-500" />
                          <span className="font-medium text-gray-700">
                            {student.lastActiveTerm || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Departure Reason / Record Notes */}
                      <td>
                        <div className="reason-cell">
                          {student.withdrawnReason ? (
                            <span className="reason-pill" title={student.withdrawnNotes || ''}>
                              {student.withdrawnReason}
                            </span>
                          ) : student.hasGraduated ? (
                            <span className="reason-pill graduated">Completed Final Grade</span>
                          ) : (
                            <span className="text-xs text-gray-400">Not recorded</span>
                          )}
                          {student.withdrawnNotes && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]" title={student.withdrawnNotes}>
                              {student.withdrawnNotes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span className={`status-tag ${student.status.toLowerCase()}`}>
                          {student.status === 'Withdrawn' && '🛑 Withdrawn'}
                          {student.status === 'Suspended' && '⚠️ Suspended'}
                          {student.status === 'Graduated' && '🎓 Graduated'}
                          {student.status === 'Archived' && '📦 Archived'}
                          {student.status !== 'Withdrawn' &&
                           student.status !== 'Suspended' &&
                           student.status !== 'Graduated' &&
                           student.status !== 'Archived' &&
                           student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-cluster">
                          <button
                            type="button"
                            className="btn-action-primary"
                            onClick={() => handleOpenTranscript(student)}
                            title="View official complete transcript with term results"
                          >
                            <FileText size={14} /> Transcript
                          </button>

                          {(canManageClasses || isDeveloperRoot) && (
                            <button
                              type="button"
                              className="btn-action-secondary"
                              onClick={() => {
                                setReinstateStudent(student);
                                setTargetClassId(student.classId || (classes[0]?.id || ''));
                                setReinstateNotes('');
                              }}
                              title="Reinstate student back to active classroom roster"
                            >
                              <UserCheck size={14} /> Reinstate
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => setDossierStudent(student)}
                            title="View Student Dossier & Info"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. TRANSCRIPT MODAL */}
      {selectedTranscriptStudent && (
        <div className="modal-overlay" onClick={() => setSelectedTranscriptStudent(null)}>
          <div 
            className="modal-container transcript-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="modal-title">Official Student Academic Transcript</h3>
                  <p className="modal-subtitle">
                    Permanent term-by-term academic record for {selectedTranscriptStudent.fullName}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-records-secondary"
                  onClick={() => window.print()}
                  title="Print official transcript sheet"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedTranscriptStudent(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="transcript-modal-body">
              {/* Student Header Snapshot */}
              <div className="transcript-hero-card">
                <div className="transcript-hero-meta">
                  <span className="snapshot-reg">{selectedTranscriptStudent.registrationNumber}</span>
                  <h2 className="transcript-student-name">{selectedTranscriptStudent.fullName}</h2>
                  <div className="transcript-sub-row">
                    <span>Gender: <strong>{selectedTranscriptStudent.gender}</strong></span>
                    <span>•</span>
                    <span>Department: <strong>{selectedTranscriptStudent.departmentTrack || 'General'}</strong></span>
                    <span>•</span>
                    <span>Last Class: <strong>{selectedTranscriptStudent.className}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-red-600">{selectedTranscriptStudent.status}</strong></span>
                  </div>
                </div>
                <div className="transcript-stamp-box">
                  <span className="stamp-title">INSTITUTIONAL ARCHIVE</span>
                  <span className="stamp-sub">Record Verified</span>
                </div>
              </div>

              {loadingTranscript ? (
                <div className="records-state-box loading" style={{ minHeight: '200px' }}>
                  <div className="spinner" />
                  <p>Assembling historical scores and computed term results...</p>
                </div>
              ) : transcriptError ? (
                <div className="withdraw-alert-banner error">
                  <AlertTriangle size={18} />
                  <span>{transcriptError}</span>
                </div>
              ) : transcriptData?.data && Array.isArray(transcriptData.data) && transcriptData.data.length > 0 ? (
                <div className="transcript-terms-list">
                  <h4 className="transcript-section-title">Academic Term Progressions</h4>
                  <table className="transcript-terms-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Term</th>
                        <th>Enrolled Class</th>
                        <th>Average Score</th>
                        <th>Total Score</th>
                        <th>Position</th>
                        <th>Principal Endorsement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transcriptData.data.map((termRow: any, idx: number) => (
                        <tr key={idx}>
                          <td className="font-semibold text-gray-900">{termRow.session}</td>
                          <td>{termRow.term}</td>
                          <td>{termRow.class}</td>
                          <td className="font-bold text-blue-700">
                            {termRow.averageScore != null ? `${Number(termRow.averageScore).toFixed(1)}%` : '—'}
                          </td>
                          <td className="font-bold text-gray-800">
                            {termRow.totalScore != null ? Number(termRow.totalScore).toFixed(1) : '—'}
                          </td>
                          <td>
                            {termRow.position ? (
                              <span className="font-extrabold text-amber-700">
                                {termRow.position}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-xs text-gray-600 italic">
                            {termRow.principalRemarks || 'Term results recorded.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="records-state-box empty" style={{ minHeight: '180px' }}>
                  <BookOpen size={32} className="text-gray-400" />
                  <p className="font-semibold text-gray-700 text-sm">No Computed Term Batches Found</p>
                  <p className="text-gray-500 text-xs">
                    This student was enrolled but does not have published class term result batches recorded in the database.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ padding: '1rem 1.5rem', background: '#f8fafc' }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedTranscriptStudent(null)}
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REINSTATE STUDENT MODAL */}
      {reinstateStudent && (
        <div className="modal-overlay" onClick={() => setReinstateStudent(null)}>
          <div 
            className="modal-container"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Reinstate Student</h3>
                  <p className="modal-subtitle">
                    Reactivate student back into active attendance registers and class rosters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReinstateStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReinstateSubmit} className="withdraw-form">
              <div className="student-snapshot-card" style={{ margin: 0 }}>
                <span className="snapshot-reg">{reinstateStudent.registrationNumber}</span>
                <h4 className="snapshot-name">{reinstateStudent.fullName}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Previous Class: <strong>{reinstateStudent.className}</strong> • Last Active: <strong>{reinstateStudent.lastActiveSession} {reinstateStudent.lastActiveTerm}</strong>
                </p>
              </div>

              <div className="form-field-group">
                <label htmlFor="reinstate-target-class" className="field-label">
                  Assign To Active Class <span className="text-red-500">*</span>
                </label>
                <select
                  id="reinstate-target-class"
                  className="field-input"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  required
                >
                  <option value="">Select Target Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label htmlFor="reinstate-notes" className="field-label">
                  Reinstatement Note / Remarks
                </label>
                <textarea
                  id="reinstate-notes"
                  className="field-textarea"
                  rows={2}
                  placeholder="e.g. Student returned from relocation and passed readmission screening."
                  value={reinstateNotes}
                  onChange={(e) => setReinstateNotes(e.target.value)}
                />
              </div>

              <div className="guarantee-box">
                <CheckCircle2 size={18} className="guarantee-icon" />
                <div className="guarantee-text">
                  Reinstating will set status to <strong>Active</strong>, assign the student to the selected class, and restore them to attendance logs, CA score sheets, and invoice billing.
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setReinstateStudent(null)}
                  disabled={submittingReinstate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm"
                  style={{ background: '#16a34a' }}
                  disabled={submittingReinstate || !targetClassId}
                >
                  {submittingReinstate ? 'Reinstating...' : 'Confirm Reinstatement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. STUDENT DOSSIER MODAL */}
      {dossierStudent && (
        <div className="modal-overlay" onClick={() => setDossierStudent(null)}>
          <div 
            className="modal-container"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge" style={{ background: '#f8fafc', color: '#334155' }}>
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Student Record Dossier</h3>
                  <p className="modal-subtitle">Comprehensive archive profile</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDossierStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="student-snapshot-card" style={{ margin: 0 }}>
                <span className="snapshot-reg">{dossierStudent.registrationNumber}</span>
                <h4 className="snapshot-name">{dossierStudent.fullName}</h4>
                <span className="snapshot-class">
                  Former Class: <strong>{dossierStudent.className}</strong>
                </span>
              </div>

              <div className="dossier-grid">
                <div className="dossier-item">
                  <span className="dossier-label">Enrollment Status</span>
                  <span className="dossier-value font-bold text-red-600">{dossierStudent.status}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Gender</span>
                  <span className="dossier-value">{dossierStudent.gender}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Department Track</span>
                  <span className="dossier-value">{dossierStudent.departmentTrack || 'General'}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Admission Term/Session</span>
                  <span className="dossier-value">{dossierStudent.admittedSession || 'N/A'} • {dossierStudent.admittedTerm || 'N/A'}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Last Active Session</span>
                  <span className="dossier-value font-bold text-blue-700">{dossierStudent.lastActiveSession}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Last Active Term</span>
                  <span className="dossier-value font-bold text-amber-700">{dossierStudent.lastActiveTerm}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Parent Contact</span>
                  <span className="dossier-value">{dossierStudent.parentPhoneNumber || 'N/A'}</span>
                </div>
                <div className="dossier-item">
                  <span className="dossier-label">Parent Email</span>
                  <span className="dossier-value">{dossierStudent.parentEmail || 'N/A'}</span>
                </div>
              </div>

              {dossierStudent.withdrawnReason && (
                <div className="guarantee-box" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                  <div className="guarantee-text" style={{ color: '#991b1b' }}>
                    <strong>Withdrawal / Departure Reason:</strong> {dossierStudent.withdrawnReason}
                    {dossierStudent.withdrawnNotes && (
                      <div className="mt-1 text-gray-700 font-normal">
                        Note: {dossierStudent.withdrawnNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ padding: '1rem 1.5rem', background: '#f8fafc' }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDossierStudent(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
