import React, { useState, useEffect, useRef } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import IdCardPrintModal from './IdCardPrintModal';
import EditStudentModal from './EditStudentModal';
import { useDialog } from '../../../context/DialogContext';
import {
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Download,
  UserPlus,
  MoreVertical,
  Eye,
  Edit3,
  QrCode,
  KeyRound,
  Trash2,
  LayoutList,
  LayoutGrid,
  Mail,
  Phone,
  X,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserMinus,
  RotateCcw,
} from 'lucide-react';
import WithdrawStudentModal from './WithdrawStudentModal';
import './Students.css';

interface StudentItem {
  id: string;
  surname: string;
  firstName: string;
  otherNames: string;
  registrationNumber: string;
  parentEmail: string;
  parentPhoneNumber: string;
  parentIdentityUserId?: string;
  className: string;
  classId?: string;
  level?: string;
  status: string;
  isCleared: boolean;
  departmentTrack?: string;
  gender?: string;
  passportUrl?: string;
  withdrawnReason?: string;
  withdrawnNotes?: string;
  withdrawnAt?: string;
  lastActiveSession?: string;
  lastActiveTerm?: string;
}

import { useAuth } from '../../../context/AuthContext';
import { useBranchContext } from '../../../context/BranchContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useSearchParams } from 'react-router-dom';

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function Students() {
  const [searchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId');

  const { showAlert, showConfirm } = useDialog();
  const { userRole } = useAuth();
  const { activeBranchId, branches } = useBranchContext();
  const { canManageClasses, canPrintStudentIdCard } = usePermissions();
  const isReadOnly = userRole === 'Chairman' || !canManageClasses;

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View Mode
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>(queryClassId || '');
  const [filterIdCardReady, setFilterIdCardReady] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'active' | 'suspended' | 'all'>('active');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (queryClassId) {
      setFilterClassId(queryClassId);
    }
  }, [queryClassId]);

  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [admitStep, setAdmitStep] = useState<number>(1);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentItem | null>(null);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [withdrawTargetStudent, setWithdrawTargetStudent] = useState<{
    id: string;
    fullName: string;
    registrationNumber: string;
    className: string;
  } | null>(null);
  const [withdrawInitialStatus, setWithdrawInitialStatus] = useState<'Withdrawn' | 'Suspended'>('Suspended');

  // Reinstatement Modal State
  const [reinstateTargetStudent, setReinstateTargetStudent] = useState<StudentItem | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [reinstateNotes, setReinstateNotes] = useState<string>('');
  const [submittingReinstate, setSubmittingReinstate] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    otherNames: '',
    gender: '',
    branchId: '',
    parentPhoneNumber: '',
    parentEmail: '',
    classId: '',
    departmentTrack: 'General',
  });
  const [submitting, setSubmitting] = useState(false);

  // Credentials Modal State
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsData, setCredsData] = useState<{
    username: string;
    password: string;
    emailQueued: boolean;
  } | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [standardizing, setStandardizing] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get(
        `/setup/students?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}&status=${filterStatus}`,
      );
      setStudents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classData = await api.get('/setup/classes');
      setClasses(classData);
    } catch (err) {
      console.error('Failed to load classes');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filterSession, filterTerm, filterStatus]);

  const handleOpenReinstate = (student: StudentItem) => {
    setOpenDropdownId(null);
    setReinstateTargetStudent(student);
    setTargetClassId(student.classId || classes[0]?.id || '');
    setReinstateNotes('');
  };

  const handleReinstateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reinstateTargetStudent || !targetClassId) return;

    try {
      setSubmittingReinstate(true);
      await api.post(`/setup/students/${reinstateTargetStudent.id}/reinstate`, {
        targetClassId,
        notes: reinstateNotes.trim() || undefined,
      });

      showAlert(
        `Student ${reinstateTargetStudent.surname} ${reinstateTargetStudent.firstName} has been successfully reinstated to the active student roster.`,
        { title: 'Suspension Revoked', type: 'success' }
      );

      setReinstateTargetStudent(null);
      fetchStudents();
    } catch (err: any) {
      showAlert(err?.message || 'Failed to revoke student suspension.', { type: 'danger' });
    } finally {
      setSubmittingReinstate(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdmitModal = () => {
    setFormData({
      surname: '',
      firstName: '',
      otherNames: '',
      gender: '',
      branchId: activeBranchId || '',
      parentPhoneNumber: '',
      parentEmail: '',
      classId: '',
      departmentTrack: 'General',
    });
    setAdmitStep(1);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gender) {
      showAlert('Please select student gender before admitting.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/setup/students', formData);
      setShowModal(false);
      setFormData({
        surname: '',
        firstName: '',
        otherNames: '',
        gender: '',
        branchId: activeBranchId || '',
        parentPhoneNumber: '',
        parentEmail: '',
        classId: formData.classId,
        departmentTrack: 'General',
      });
      fetchStudents();
      showAlert('Student admitted successfully');
    } catch (err: any) {
      showAlert(err.message || 'Failed to admit student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateCredentials = async (identityUserId: string, name: string) => {
    setOpenDropdownId(null);
    if (!identityUserId) {
      showAlert('This parent does not have an active login account.');
      return;
    }
    if (
      !(await showConfirm(
        `Are you sure you want to regenerate credentials for ${name}'s Parent? Their old password will be invalidated immediately.`,
      ))
    )
      return;

    try {
      setGeneratingId(identityUserId);
      const response = await api.post('/user-management/regenerate-credentials', {
        userId: identityUserId,
      });
      setCredsData({
        username: response.username,
        password: response.password,
        emailQueued: response.emailQueued,
      });
      setShowCredsModal(true);
    } catch (err: any) {
      showAlert(err.message || 'Failed to regenerate credentials.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await api.download('/setup/students/template');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Upload_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showAlert(
        'Student upload template downloaded successfully! Refer to the "Available Classes & Guide" sheet for valid class names.',
        { type: 'success' }
      );
    } catch (err: any) {
      showAlert(err.message || 'Failed to download student template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post('/setup/students/upload', formData);
      showAlert(res.message || 'Students uploaded successfully', { type: 'success' });
      fetchStudents();
    } catch (err: any) {
      const errData = err.data;
      if (errData?.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        const preview = errData.errors.slice(0, 8).join('\n• ');
        const remainder =
          errData.errors.length > 8 ? `\n...and ${errData.errors.length - 8} more errors.` : '';
        showAlert(
          `Upload Rejected (${errData.errors.length} error(s)):\n\n• ${preview}${remainder}\n\nTip: Click "Download Template" to ensure correct column headers and valid class names.`
        );
      } else {
        showAlert(err.message || 'Failed to upload students');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStandardizeRegNumbers = async () => {
    if (
      !(await showConfirm(
        'Are you sure you want to standardize all student registration numbers? This will format every student registration number into the exact standard pattern (e.g. DOTSS2-001, DOTJSS1-001).',
        { title: 'Standardize Registration Numbers', type: 'warning' },
      ))
    )
      return;
    try {
      setStandardizing(true);
      const res = await api.post('/admin/students/standardize-reg-numbers', {});
      showAlert(res.message || 'Registration numbers standardized successfully.');
      fetchStudents();
    } catch (err: any) {
      showAlert(err.message || 'Failed to standardize registration numbers.');
    } finally {
      setStandardizing(false);
    }
  };

  const handleSendFeeReminders = async () => {
    const unclearedFiltered = filteredStudents.filter((s) => !s.isCleared);
    if (unclearedFiltered.length === 0) {
      showAlert('No uncleared students in the current selection to send fee reminders to.');
      return;
    }

    const targetClassObj = classes.find((c) => c.id === filterClassId);
    const targetLabel = targetClassObj
      ? `${targetClassObj.level} ${targetClassObj.name} ${targetClassObj.section}`.trim()
      : filterLevel
        ? `Level ${filterLevel}`
        : 'all classes';

    const confirmed = await showConfirm(
      `Send fee reminder emails to ${unclearedFiltered.length} uncleared student(s) in ${targetLabel} for ${filterSession} - ${filterTerm}?`,
      { title: 'Send Fee Reminders', type: 'warning' },
    );
    if (!confirmed) return;

    try {
      setSendingReminders(true);
      const res = await api.post('/invoices/send-reminders', {
        session: filterSession,
        term: filterTerm,
        classId: filterClassId || null,
        level: filterLevel || null,
      });

      if (res && res.success) {
        showAlert(
          res.message || `Fee reminders dispatched to ${res.data?.sentCount || 0} parents.`,
        );
      } else {
        showAlert(res?.message || 'Failed to send fee reminders.');
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to send fee reminders. Please try again.');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    setOpenDropdownId(null);
    if (
      !(await showConfirm(
        `Are you sure you want to delete ${studentName}? This action cannot be undone.`,
        { title: 'Delete Student', type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
      ))
    ) {
      return;
    }
    try {
      await api.delete(`/setup/students/${studentId}`);
      showAlert('Student deleted successfully');
      fetchStudents();
    } catch (err: any) {
      if (err.data?.hasResults || err.data?.HasResults) {
        const confirmResultsDelete = await showConfirm(
          `${err.data?.message || err.data?.Message || 'This student has existing academic result records (assessments, examination scores, or term report cards).'}\n\nAre you sure you want to proceed and permanently erase this student and all their academic results?`,
          {
            title: 'Warning: Existing Academic Results',
            type: 'warning',
            confirmText: 'Yes, Delete All Records',
            cancelText: 'Cancel',
          }
        );
        if (confirmResultsDelete) {
          try {
            await api.delete(`/setup/students/${studentId}?confirmDeleteResults=true`);
            showAlert('Student and all related records deleted successfully.', { type: 'success' });
            fetchStudents();
          } catch (retryErr: any) {
            showAlert(retryErr.message || 'Failed to delete student.');
          }
        }
        return;
      }
      showAlert(err.message || 'Failed to delete student');
    }
  };

  const getStudentInitials = (s: StudentItem) => {
    const f = s.firstName ? s.firstName[0] : '';
    const l = s.surname ? s.surname[0] : '';
    return `${f}${l}`.toUpperCase() || 'ST';
  };

  const getAvatarStyle = (name: string) => {
    const gradients = [
      {
        bg: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
        color: '#FFFFFF',
        border: '1px solid #93C5FD',
      },
      {
        bg: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
        color: '#FFFFFF',
        border: '1px solid #6EE7B7',
      },
      {
        bg: 'linear-gradient(135deg, #6B21A8 0%, #A855F7 100%)',
        color: '#FFFFFF',
        border: '1px solid #D8B4FE',
      },
      {
        bg: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
        color: '#FFFFFF',
        border: '1px solid #FDE68A',
      },
      {
        bg: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
        color: '#FFFFFF',
        border: '1px solid #7DD3FC',
      },
      {
        bg: 'linear-gradient(135deg, #BE123C 0%, #F43F5E 100%)',
        color: '#FFFFFF',
        border: '1px solid #FDA4AF',
      },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Filter Computation
  let baseFilteredStudents = students;
  if (filterSearch) {
    const searchLower = filterSearch.toLowerCase();
    baseFilteredStudents = baseFilteredStudents.filter(
      (s) =>
        s.surname.toLowerCase().includes(searchLower) ||
        s.firstName.toLowerCase().includes(searchLower) ||
        (s.otherNames && s.otherNames.toLowerCase().includes(searchLower)) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchLower)),
    );
  }
  if (filterLevel) {
    baseFilteredStudents = baseFilteredStudents.filter((s) => s.level === filterLevel);
  }
  if (filterClassId) {
    baseFilteredStudents = baseFilteredStudents.filter((s) => s.classId === filterClassId);
  }

  const idCardReadyCount = baseFilteredStudents.filter(
    (s) => Boolean(s.passportUrl && s.passportUrl.trim().length > 0),
  ).length;

  let filteredStudents = filterIdCardReady
    ? baseFilteredStudents.filter((s) => Boolean(s.passportUrl && s.passportUrl.trim().length > 0))
    : baseFilteredStudents;

  // Metrics calculation
  const totalCount = students.length;
  const clearedCount = students.filter((s) => s.isCleared).length;
  const pendingCount = totalCount - clearedCount;
  const uniqueClassesCount = new Set(students.map((s) => s.className).filter(Boolean)).size;

  const classOptions = filterLevel ? classes.filter((c) => c.level === filterLevel) : classes;

  return (
    <div className="students-page-container">
      {/* Page Header */}
      <div className="students-page-header">
        <div>
          <h1 className="students-page-title">Student Management</h1>
          <p className="students-page-subtitle">
            Manage student enrollment, class placements, clearance status, and credentials
          </p>
        </div>

        {!isReadOnly && (
          <div className="header-action-buttons">
            <button className="btn-add-student" onClick={handleOpenAdmitModal}>
              <UserPlus size={18} />
              Admit New Student
            </button>
          </div>
        )}
      </div>

      {/* Top Metrics Banner */}
      <div className="students-metrics-grid">
        <div className="students-metric-card total">
          <div className="metric-info-box">
            <span className="metric-label">
              {filterStatus === 'suspended' ? 'SUSPENDED STUDENTS' : filterStatus === 'all' ? 'ALL ENROLLED' : 'ACTIVE STUDENTS'}
            </span>
            <span className="metric-number">{totalCount}</span>
          </div>
          <div className="metric-icon-badge total">
            <Users size={24} />
          </div>
        </div>

        <div className="students-metric-card cleared">
          <div className="metric-info-box">
            <span className="metric-label">CLEARED STUDENTS</span>
            <span className="metric-number">{clearedCount}</span>
          </div>
          <div className="metric-icon-badge cleared">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="students-metric-card pending">
          <div className="metric-info-box">
            <span className="metric-label">NOT CLEARED</span>
            <span className="metric-number">{pendingCount}</span>
          </div>
          <div className="metric-icon-badge pending">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="students-metric-card classes">
          <div className="metric-info-box">
            <span className="metric-label">CLASSES & LEVELS</span>
            <span className="metric-number">{uniqueClassesCount || classes.length}</span>
          </div>
          <div className="metric-icon-badge classes">
            <School size={24} />
          </div>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="students-status-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'active'}
            className={`students-status-tab-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            <UserCheck size={16} />
            Active Students
            {filterStatus === 'active' && <span className="students-status-tab-badge">{students.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'suspended'}
            className={`students-status-tab-btn suspended ${filterStatus === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('suspended')}
          >
            <ShieldAlert size={16} />
            Suspended Students
            {filterStatus === 'suspended' && <span className="students-status-tab-badge">{students.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'all'}
            className={`students-status-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            <Users size={16} />
            All Students
            {filterStatus === 'all' && <span className="students-status-tab-badge">{students.length}</span>}
          </button>
        </div>

        {filterStatus === 'suspended' && (
          <div style={{ fontSize: '0.82rem', color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={15} color="#D97706" /> Excluded from Class Rosters & ID Card Printing
          </div>
        )}
      </div>

      {/* Two-Tier Controls Card */}
      <div className="students-controls-card">
        {/* Tier 1: Search, Fast Filters & View Toggle */}
        <div className="controls-top-row">
          <div className="search-filter-group">
            <div className="students-search-box">
              <Search size={16} className="students-search-icon" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search by name, reg. number, email..."
              />
            </div>

            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                setFilterClassId('');
              }}
              className="select-filter-input"
            >
              <option value="">All Levels</option>
              <option value="Senior Secondary">Senior Secondary</option>
              <option value="Junior Secondary">Junior Secondary</option>
              <option value="Primary">Primary</option>
              <option value="Upper Primary">Upper Primary</option>
              <option value="Lower Primary">Lower Primary</option>
              <option value="Middle Primary">Middle Primary</option>
              <option value="Nursery">Nursery</option>
              <option value="Kindergarten">Kindergarten</option>
            </select>

            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="select-filter-input"
            >
              <option value="">All Classes</option>
              {classOptions.map((cls) => (
                <option
                  key={cls.id}
                  value={cls.id}
                >{`${cls.level} ${cls.name} ${cls.section}`}</option>
              ))}
            </select>

            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="select-filter-input"
            >
              {getSessionOptions(filterSession).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="select-filter-input"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <LayoutList size={16} /> Table
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} /> Grid
            </button>
          </div>
        </div>

        {/* Tier 2: Secondary Batch Operations */}
        {!isReadOnly && (
          <div className="controls-batch-row">
            <span className="batch-actions-label">Batch Operations:</span>
            <div className="batch-buttons-group">
              <button
                className={`btn-batch-action id-card-ready ${filterIdCardReady ? 'active' : ''}`}
                onClick={() => setFilterIdCardReady(!filterIdCardReady)}
                title="Filter view to only show students with uploaded passport photos ready for ID cards"
              >
                <UserCheck size={16} />
                {`ID Card Ready (${idCardReadyCount})`}
              </button>

              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                className="btn-batch-action"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                title="Download official Excel template with active class references"
              >
                <Download size={16} />
                {downloadingTemplate ? 'Downloading...' : 'Download Template'}
              </button>
              <button
                className="btn-batch-action"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Bulk import students via Excel template"
              >
                <FileSpreadsheet size={16} />
                {uploading ? 'Uploading...' : 'Bulk Upload (Excel)'}
              </button>

              <button
                className="btn-batch-action warning greyed-out"
                onClick={handleStandardizeRegNumbers}
                disabled={true}
                title="Disabled: Student ID cards have been printed. Standardizing again would alter existing registration numbers."
              >
                <ShieldCheck size={16} />
                {standardizing ? 'Standardizing...' : 'Standardize Reg Nos'}
              </button>

              <button
                className="btn-batch-action info"
                onClick={handleSendFeeReminders}
                disabled={sendingReminders}
                title="Dispatch fee reminder emails to uncleared students in current view"
              >
                <Mail size={16} />
                {sendingReminders
                  ? 'Sending...'
                  : `Send Fee Reminders (${filteredStudents.filter((s) => !s.isCleared).length})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="alert-error"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: '#FEE2E2',
            color: '#991B1B',
          }}
        >
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: '#FFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            color: '#64748B',
          }}
        >
          Loading students...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: '#FFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            color: '#64748B',
          }}
        >
          No student records matching current filters.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="students-table-wrapper w-full overflow-x-auto overscroll-x-contain" ref={dropdownRef}>
          <table className="executive-students-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Profile</th>
                <th>Class</th>
                <th>Parent Contact</th>
                <th>Clearance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const fullName = `${student.firstName} ${student.surname}`;
                const isDropdownOpen = openDropdownId === student.id;
                const avatarStyle = getAvatarStyle(fullName);
                const isDropUp =
                  filteredStudents.length <= 3 || index >= filteredStudents.length - 2;

                return (
                  <tr key={student.id}>
                    <td>
                      <span className="student-reg-badge">
                        {student.registrationNumber || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="student-profile-cell">
                        <div
                          className="student-avatar"
                          style={{
                            background: avatarStyle.bg,
                            color: avatarStyle.color,
                            border: avatarStyle.border,
                          }}
                        >
                          {getStudentInitials(student)}
                        </div>
                        <div className="student-name-box">
                          <span className="student-full-name">{fullName}</span>
                          {student.otherNames && (
                            <span className="student-other-names">{student.otherNames}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                        }}
                      >
                        {student.className || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          {student.parentPhoneNumber || 'No phone recorded'}
                        </span>
                        {student.parentEmail && (
                          <span style={{ color: '#64748B', fontSize: '0.78rem' }}>
                            {student.parentEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`clearance-pill ${student.isCleared ? 'cleared' : 'not-cleared'}`}
                      >
                        {student.isCleared ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {student.isCleared ? 'Cleared' : 'Not Cleared'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${student.status === 'Active' ? 'active' : student.status === 'Suspended' ? 'suspended' : student.status === 'Withdrawn' ? 'withdrawn' : 'inactive'}`}
                      >
                        {student.status || 'Active'}
                      </span>
                      {(student.status === 'Suspended' || student.status === 'Withdrawn') && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn-revoke-inline"
                            onClick={() => handleOpenReinstate(student)}
                            title={student.status === 'Suspended' ? 'Revoke suspension and restore student to class roster' : 'Reinstate withdrawn student back to class roster'}
                          >
                            <RotateCcw size={12} /> Reinstate
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-dropdown-container">
                        <button
                          className="btn-action-dots"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : student.id)}
                          title="Actions menu"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isDropdownOpen && (
                          <div className={`action-dropdown-menu ${isDropUp ? 'dropup' : ''}`}>
                            <button
                              className="dropdown-action-item"
                              onClick={() => {
                                setViewingStudent(student);
                                setOpenDropdownId(null);
                              }}
                            >
                              <Eye size={15} color="#3B82F6" /> View Full Profile
                            </button>
                            {canPrintStudentIdCard && student.status === 'Active' && (
                              <button
                                className="dropdown-action-item"
                                onClick={() => {
                                  setPrintStudentId(student.id);
                                  setOpenDropdownId(null);
                                }}
                              >
                                <QrCode size={15} color="#059669" /> Print ID Card
                              </button>
                            )}
                            {!isReadOnly && (
                              <>
                                <button
                                  className="dropdown-action-item"
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Edit3 size={15} color="#000080" /> Edit Details
                                </button>
                                <button
                                  className="dropdown-action-item"
                                  onClick={() =>
                                    handleRegenerateCredentials(
                                      student.parentIdentityUserId!,
                                      fullName,
                                    )
                                  }
                                  disabled={
                                    generatingId === student.parentIdentityUserId ||
                                    !student.parentIdentityUserId
                                  }
                                >
                                  <KeyRound size={15} color="#D97706" /> Parent Credentials
                                </button>
                                <div className="dropdown-divider" />
                                {student.status === 'Suspended' || student.status === 'Withdrawn' ? (
                                  <button
                                    className="dropdown-action-item success"
                                    onClick={() => handleOpenReinstate(student)}
                                    title="Reinstate student back to active classroom roster"
                                    style={{ color: '#059669', fontWeight: 600 }}
                                  >
                                    <RotateCcw size={15} color="#059669" /> Reinstate Student
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className="dropdown-action-item"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setWithdrawInitialStatus('Suspended');
                                        setWithdrawTargetStudent({
                                          id: student.id,
                                          fullName,
                                          registrationNumber: student.registrationNumber,
                                          className: student.className,
                                        });
                                      }}
                                      title="Suspend student for this session so they do not appear on class lists or ID card print queues"
                                    >
                                      <UserMinus size={15} color="#D97706" /> Suspend Student
                                    </button>
                                    <button
                                      className="dropdown-action-item"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setWithdrawInitialStatus('Withdrawn');
                                        setWithdrawTargetStudent({
                                          id: student.id,
                                          fullName,
                                          registrationNumber: student.registrationNumber,
                                          className: student.className,
                                        });
                                      }}
                                      title="Withdraw student permanently from institution"
                                    >
                                      <UserMinus size={15} color="#64748B" /> Withdraw Student
                                    </button>
                                  </>
                                )}
                                <button
                                  className="dropdown-action-item danger"
                                  onClick={() => handleDelete(student.id, fullName)}
                                >
                                  <Trash2 size={15} /> Delete Student
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="students-grid-wrapper" ref={dropdownRef}>
          {filteredStudents.map((student, index) => {
            const fullName = `${student.firstName} ${student.surname}`;
            const isDropdownOpen = openDropdownId === student.id;
            const avatarStyle = getAvatarStyle(fullName);
            const isDropUp = filteredStudents.length <= 3 || index >= filteredStudents.length - 2;

            return (
              <div key={student.id} className="student-card-item">
                <div className="student-card-header">
                  <div className="student-profile-cell">
                    <div
                      className="student-avatar"
                      style={{
                        width: '46px',
                        height: '46px',
                        fontSize: '1rem',
                        background: avatarStyle.bg,
                        color: avatarStyle.color,
                        border: avatarStyle.border,
                      }}
                    >
                      {getStudentInitials(student)}
                    </div>
                    <div className="student-name-box">
                      <span className="student-full-name" style={{ fontSize: '1rem' }}>
                        {fullName}
                      </span>
                      <span
                        className="student-reg-badge"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.45rem',
                          marginTop: '0.2rem',
                        }}
                      >
                        {student.registrationNumber || 'Pending Reg'}
                      </span>
                    </div>
                  </div>

                  <div className="action-dropdown-container">
                    <button
                      className="btn-action-dots"
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : student.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {isDropdownOpen && (
                      <div className={`action-dropdown-menu ${isDropUp ? 'dropup' : ''}`}>
                        <button
                          className="dropdown-action-item"
                          onClick={() => {
                            setViewingStudent(student);
                            setOpenDropdownId(null);
                          }}
                        >
                          <Eye size={15} color="#3B82F6" /> View Full Profile
                        </button>
                        <button
                          className="dropdown-action-item"
                          onClick={() => {
                            setEditingStudent(student);
                            setOpenDropdownId(null);
                          }}
                        >
                          <Edit3 size={15} color="#000080" /> Edit Details
                        </button>
                        {canPrintStudentIdCard && student.status === 'Active' && (
                          <button
                            className="dropdown-action-item"
                            onClick={() => {
                              setPrintStudentId(student.id);
                              setOpenDropdownId(null);
                            }}
                          >
                            <QrCode size={15} color="#059669" /> Print ID Card
                          </button>
                        )}
                        <button
                          className="dropdown-action-item"
                          onClick={() =>
                            handleRegenerateCredentials(student.parentIdentityUserId!, fullName)
                          }
                          disabled={
                            generatingId === student.parentIdentityUserId ||
                            !student.parentIdentityUserId
                          }
                        >
                          <KeyRound size={15} color="#D97706" /> Parent Credentials
                        </button>
                        <div className="dropdown-divider" />
                        {student.status === 'Suspended' || student.status === 'Withdrawn' ? (
                          <button
                            className="dropdown-action-item success"
                            onClick={() => handleOpenReinstate(student)}
                            title="Reinstate student back to active classroom roster"
                            style={{ color: '#059669', fontWeight: 600 }}
                          >
                            <RotateCcw size={15} color="#059669" /> Reinstate Student
                          </button>
                        ) : (
                          <>
                            <button
                              className="dropdown-action-item"
                              onClick={() => {
                                setOpenDropdownId(null);
                                setWithdrawInitialStatus('Suspended');
                                setWithdrawTargetStudent({
                                  id: student.id,
                                  fullName,
                                  registrationNumber: student.registrationNumber,
                                  className: student.className,
                                });
                              }}
                              title="Suspend student for this session so they do not appear on class lists or ID card print queues"
                            >
                              <UserMinus size={15} color="#D97706" /> Suspend Student
                            </button>
                            <button
                              className="dropdown-action-item"
                              onClick={() => {
                                setOpenDropdownId(null);
                                setWithdrawInitialStatus('Withdrawn');
                                setWithdrawTargetStudent({
                                  id: student.id,
                                  fullName,
                                  registrationNumber: student.registrationNumber,
                                  className: student.className,
                                });
                              }}
                              title="Withdraw student permanently from institution"
                            >
                              <UserMinus size={15} color="#64748B" /> Withdraw Student
                            </button>
                          </>
                        )}
                        <button
                          className="dropdown-action-item danger"
                          onClick={() => handleDelete(student.id, fullName)}
                        >
                          <Trash2 size={15} /> Delete Student
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      background: '#F1F5F9',
                      color: '#334155',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                    }}
                  >
                    {student.className || 'Unassigned'}
                  </span>
                  <span
                    className={`clearance-pill ${student.isCleared ? 'cleared' : 'not-cleared'}`}
                  >
                    {student.isCleared ? 'Cleared' : 'Not Cleared'}
                  </span>
                  <span
                    className={`status-pill ${student.status === 'Active' ? 'active' : student.status === 'Suspended' ? 'suspended' : student.status === 'Withdrawn' ? 'withdrawn' : 'inactive'}`}
                  >
                    {student.status || 'Active'}
                  </span>
                  {(student.status === 'Suspended' || student.status === 'Withdrawn') && (
                    <button
                      type="button"
                      className="btn-revoke-inline"
                      onClick={() => handleOpenReinstate(student)}
                      title="Reinstate student"
                    >
                      <RotateCcw size={11} /> Reinstate
                    </button>
                  )}
                </div>

                <div
                  style={{
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                  }}
                >
                  {student.parentEmail && (
                    <span
                      style={{
                        color: '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Mail size={14} color="#94A3B8" /> {student.parentEmail}
                    </span>
                  )}
                  {student.parentPhoneNumber && (
                    <span
                      style={{
                        color: '#64748B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Phone size={14} color="#94A3B8" /> {student.parentPhoneNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW FULL STUDENT PROFILE MODAL */}
      {viewingStudent && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '540px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>
                Student Record Details
              </h2>
              <button
                onClick={() => setViewingStudent(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: '#F8FAFC',
                padding: '1.25rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
              }}
            >
              <div
                className="student-avatar"
                style={{ width: '56px', height: '56px', fontSize: '1.2rem' }}
              >
                {getStudentInitials(viewingStudent)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  {viewingStudent.firstName} {viewingStudent.surname}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontFamily: 'monospace' }}>
                  Reg: {viewingStudent.registrationNumber || 'Pending'}
                </span>
                {viewingStudent.otherNames && (
                  <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                    {viewingStudent.otherNames}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#64748B',
                    display: 'block',
                  }}
                >
                  Class
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  {viewingStudent.className || 'Unassigned'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#64748B',
                    display: 'block',
                  }}
                >
                  Department Track
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  {viewingStudent.departmentTrack || 'General'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#64748B',
                    display: 'block',
                  }}
                >
                  Clearance Status
                </span>
                <span
                  className={`clearance-pill ${viewingStudent.isCleared ? 'cleared' : 'not-cleared'}`}
                  style={{ marginTop: '0.25rem' }}
                >
                  {viewingStudent.isCleared ? 'Cleared' : 'Not Cleared'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#64748B',
                    display: 'block',
                  }}
                >
                  Account Status
                </span>
                <span
                  className={`status-pill ${viewingStudent.status === 'Active' ? 'active' : 'inactive'}`}
                  style={{ marginTop: '0.25rem' }}
                >
                  {viewingStudent.status || 'Active'}
                </span>
              </div>
            </div>

            <div
              style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', marginBottom: '1.5rem' }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#64748B',
                  display: 'block',
                  marginBottom: '0.65rem',
                }}
              >
                Parent / Guardian Contact
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#334155',
                  }}
                >
                  <Mail size={16} color="#64748B" />{' '}
                  {viewingStudent.parentEmail || 'No email provided'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#334155',
                  }}
                >
                  <Phone size={16} color="#64748B" />{' '}
                  {viewingStudent.parentPhoneNumber || 'No phone provided'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setViewingStudent(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingStudent(viewingStudent);
                  setViewingStudent(null);
                }}
              >
                Edit Student Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID CARD PRINT MODAL */}
      {printStudentId && (
        <IdCardPrintModal studentId={printStudentId} onClose={() => setPrintStudentId(null)} />
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchStudents();
          }}
        />
      )}

      {/* SLIDE-OVER DRAWER FORM FOR ADMIT NEW STUDENT */}
      {showModal && (
        <div className="student-slideover-backdrop" onClick={() => setShowModal(false)}>
          <div className="student-slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="student-slideover-header">
              <div>
                <h2 className="student-slideover-title">Admit New Student</h2>
                <p className="student-slideover-subtitle">
                  Step {admitStep} of 3: {admitStep === 1 ? 'Academic Placement' : admitStep === 2 ? 'Student Bio-Data' : 'Parent Contact'}
                </p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Stepper Navigation Header (Horizontal Bar) */}
            <div className="slideover-stepper">
              <div
                className={`stepper-step ${admitStep === 1 ? 'active' : admitStep > 1 ? 'completed' : ''}`}
                onClick={() => setAdmitStep(1)}
                style={{ cursor: 'pointer' }}
              >
                <span className="stepper-circle">{admitStep > 1 ? '✓' : '1'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={14} /> Placement
                </span>
              </div>
              <div className="stepper-divider"></div>
              <div
                className={`stepper-step ${admitStep === 2 ? 'active' : admitStep > 2 ? 'completed' : ''}`}
                onClick={() => {
                  if (!formData.classId || !formData.gender) {
                    showAlert('Please complete Academic Placement first.');
                    return;
                  }
                  setAdmitStep(2);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="stepper-circle">{admitStep > 2 ? '✓' : '2'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={14} /> Biodata
                </span>
              </div>
              <div className="stepper-divider"></div>
              <div
                className={`stepper-step ${admitStep === 3 ? 'active' : ''}`}
                onClick={() => {
                  if (!formData.classId || !formData.gender) {
                    showAlert('Please complete Academic Placement first.');
                    return;
                  }
                  if (!formData.firstName.trim() || !formData.surname.trim()) {
                    showAlert('Please complete Student Bio-Data first.');
                    return;
                  }
                  setAdmitStep(3);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="stepper-circle">3</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> Parent Contact
                </span>
              </div>
            </div>

            <form
              onSubmit={handleCreate}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div className="student-slideover-body">
                {/* Step 1: Academic Placement */}
                {admitStep === 1 && (
                  <div className="drawer-form-section" style={{ animation: 'stageSlideIn 0.25s ease forwards' }}>
                    <div className="drawer-section-header">
                      <span className="drawer-section-num">01</span>
                      <span className="drawer-section-title">Academic Placement</span>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">
                        Assign to Class <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <select
                        name="classId"
                        value={formData.classId}
                        onChange={handleInputChange}
                        required
                        className="drawer-form-select"
                      >
                        <option value="">-- Select Class --</option>
                        {classes.map((cls) => (
                          <option
                            key={cls.id}
                            value={cls.id}
                          >{`${cls.level} ${cls.name} ${cls.section}`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">
                        Gender <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="drawer-form-select"
                      >
                        <option value="">-- Select Gender --</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">
                        Department / Track (For Senior Secondary)
                      </label>
                      <select
                        name="departmentTrack"
                        value={formData.departmentTrack}
                        onChange={handleInputChange}
                        className="drawer-form-select"
                      >
                        <option value="General">General (Cross-Cutting / All Tracks)</option>
                        <option value="Science">Science</option>
                        <option value="Arts">Arts</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Student Bio-Data */}
                {admitStep === 2 && (
                  <div className="drawer-form-section" style={{ animation: 'stageSlideIn 0.25s ease forwards' }}>
                    <div className="drawer-section-header">
                      <span className="drawer-section-num">02</span>
                      <span className="drawer-section-title">Student Bio-Data</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div className="drawer-form-group">
                        <label className="drawer-form-label">
                          First Name <span style={{ color: '#E11D48' }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g. Olufunke"
                          className="drawer-form-input"
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-form-label">
                          Surname <span style={{ color: '#E11D48' }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="surname"
                          value={formData.surname}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g. Ikang"
                          className="drawer-form-input"
                        />
                      </div>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">Other Names</label>
                      <input
                        type="text"
                        name="otherNames"
                        value={formData.otherNames}
                        onChange={handleInputChange}
                        placeholder="e.g. Elizabeth"
                        className="drawer-form-input"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Parent / Guardian Contact */}
                {admitStep === 3 && (
                  <div className="drawer-form-section" style={{ animation: 'stageSlideIn 0.25s ease forwards' }}>
                    <div className="drawer-section-header">
                      <span className="drawer-section-num">03</span>
                      <span className="drawer-section-title">Parent / Guardian Contact</span>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">
                        Parent Phone Number <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="parentPhoneNumber"
                        value={formData.parentPhoneNumber}
                        onChange={handleInputChange}
                        required
                        placeholder="08012345678"
                        className="drawer-form-input"
                      />
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-form-label">Parent Email Address (Optional)</label>
                      <input
                        type="email"
                        name="parentEmail"
                        value={formData.parentEmail}
                        onChange={handleInputChange}
                        placeholder="parent@example.com"
                        className="drawer-form-input"
                      />
                    </div>

                    {/* Quick Admission Preview Card */}
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.85rem 1rem',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                        Admission Summary
                      </div>
                      <div>
                        Candidate: <strong>{formData.firstName || '—'} {formData.surname || '—'}</strong> ({formData.gender || 'N/A'})
                      </div>
                      <div>
                        Target Class: <strong>{classes.find((c) => c.id === formData.classId)?.name || 'Selected Class'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="student-slideover-footer">
                {admitStep === 1 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (!formData.classId) {
                          showAlert('Please select a class for academic placement.');
                          return;
                        }
                        if (!formData.gender) {
                          showAlert('Please select student gender.');
                          return;
                        }
                        setAdmitStep(2);
                      }}
                    >
                      Next: Biodata &rarr;
                    </button>
                  </>
                )}

                {admitStep === 2 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setAdmitStep(1)}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (!formData.firstName.trim()) {
                          showAlert("Please enter the student's first name.");
                          return;
                        }
                        if (!formData.surname.trim()) {
                          showAlert("Please enter the student's surname.");
                          return;
                        }
                        setAdmitStep(3);
                      }}
                    >
                      Next: Parent Contact &rarr;
                    </button>
                  </>
                )}

                {admitStep === 3 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setAdmitStep(2)}
                      disabled={submitting}
                    >
                      &larr; Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Admitting...' : 'Admit Student'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGENERATE PARENT CREDENTIALS MODAL */}
      {showCredsModal && credsData && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div
              style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem', marginBottom: '1rem' }}
            >
              <h2 style={{ margin: 0, color: '#10b981' }}>Parent Credentials Regenerated!</h2>
              <p className="text-muted text-sm mt-1">Please copy these details immediately.</p>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <label
                  className="text-muted text-sm"
                  style={{ display: 'block', marginBottom: '0.2rem' }}
                >
                  Username / Email
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{credsData.username}</div>
              </div>
              <div>
                <label
                  className="text-muted text-sm"
                  style={{ display: 'block', marginBottom: '0.2rem' }}
                >
                  New Password
                </label>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    color: '#60a5fa',
                  }}
                >
                  {credsData.password}
                </div>
              </div>
            </div>

            {credsData.emailQueued ? (
              <div
                className="alert-success"
                style={{
                  marginBottom: '1.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                ✅ A welcome email containing these credentials has also been queued for delivery.
              </div>
            ) : (
              <div
                className="alert-warning"
                style={{
                  marginBottom: '1.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                ⚠️ No email was sent because this parent does not have a real email address on file.
                You MUST copy this password and send it to them manually.
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCredsModal(false)}
              >
                I have copied the password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw / Suspend Student Modal */}
      {withdrawTargetStudent && (
        <WithdrawStudentModal
          isOpen={!!withdrawTargetStudent}
          onClose={() => setWithdrawTargetStudent(null)}
          onSuccess={() => {
            setWithdrawTargetStudent(null);
            fetchStudents();
          }}
          student={withdrawTargetStudent}
          currentSession={filterSession}
          currentTerm={filterTerm}
          initialStatus={withdrawInitialStatus}
        />
      )}

      {/* Revoke Suspension / Reinstatement Modal */}
      {reinstateTargetStudent && (
        <div className="modal-overlay" onClick={() => setReinstateTargetStudent(null)}>
          <div
            className="modal-container"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669', padding: '0.6rem', borderRadius: '10px' }}>
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {reinstateTargetStudent.status === 'Withdrawn' ? 'Reinstate Withdrawn Student' : 'Revoke Suspension & Reinstate'}
                  </h3>
                  <p className="modal-subtitle" style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    {reinstateTargetStudent.status === 'Withdrawn'
                      ? 'Restore student back to active classroom roster and school records.'
                      : 'Restore student back to active classroom roster and records.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setReinstateTargetStudent(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReinstateSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {reinstateTargetStudent.surname} {reinstateTargetStudent.firstName} {reinstateTargetStudent.otherNames}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Reg: <strong>{reinstateTargetStudent.registrationNumber || 'Pending'}</strong> | Current Class: <strong>{reinstateTargetStudent.className || 'Unassigned'}</strong>
                </div>
                {reinstateTargetStudent.withdrawnReason && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.35rem' }}>
                    {reinstateTargetStudent.status === 'Withdrawn' ? 'Departure Reason: ' : 'Suspension Reason: '}
                    <em>{reinstateTargetStudent.withdrawnReason}</em>
                  </div>
                )}
                {reinstateTargetStudent.lastActiveSession && (
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {reinstateTargetStudent.status === 'Withdrawn' ? 'Last Active Session: ' : 'Suspended in Session: '}
                    <strong>{reinstateTargetStudent.lastActiveSession}</strong>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Assign Active Class <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="field-input"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select Target Class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {`${c.level} ${c.name} ${c.section}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Reinstatement Remarks (Optional)
                </label>
                <textarea
                  className="field-textarea"
                  rows={2}
                  placeholder="e.g. Student returned to school; suspension formally revoked by administrator."
                  value={reinstateNotes}
                  onChange={(e) => setReinstateNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReinstateTargetStudent(null)}
                  disabled={submittingReinstate}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.15rem', borderRadius: '8px', background: '#059669', color: '#ffffff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  disabled={submittingReinstate || !targetClassId}
                >
                  {submittingReinstate ? 'Reinstating...' : 'Confirm Revoke & Reinstate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
