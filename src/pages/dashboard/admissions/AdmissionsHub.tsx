import React, { useState, useEffect } from 'react';
import { api, API_ROOT, getTenantId } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { useTenant } from '../../../context/TenantContext';
import { useBranch, type Branch } from '../../../context/BranchContext';
import './AdmissionsHub.css';

interface AdmissionApp {
  id: string;
  session: string;
  term: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  placeOfBirth: string;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  homeAddress: string;
  lastSchoolAttended: string;
  lastClassCompleted: string;

  // Section B
  fatherName: string;
  fatherOccupation: string;
  fatherPhoneNumber: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherPhoneNumber: string;
  motherEmail: string;
  parentEmail: string;
  parentPhoneNumber: string;
  guardianName: string;
  guardianRelationship: string;
  guardianAddress: string;

  // Section C
  bloodGroup: string;
  genotype: string;
  medicalConditions: string;
  doctorNameClinic: string;
  emergencyContactNumber: string;

  // Section D
  birthCertificateSubmitted: boolean;
  passportsSubmitted: boolean;
  previousResultSubmitted: boolean;
  otherDocuments: string;
  paymentProofUrl: string;
  birthCertificateUrl: string;
  passportPhotoUrl: string;
  previousResultUrl: string;

  // Workflow
  targetClassId: string;
  targetClassName: string;
  branchId?: string;
  branchName?: string;
  status: string; // Submitted, ApprovedForAssessment, ReadyForAdmission, Admitted, Rejected
  registrationFeeAmount: number;
  assessmentNotes?: string;
  assessmentDate?: string;
  declarantFullName: string;
  appliedAt: string;
  approvedForAssessmentAt?: string;
  readyForAdmissionAt?: string;
  admittedAt?: string;
  assignedRegistrationNumber?: string;
}

interface SummaryStats {
  totalApplications: number;
  submittedCount: number;
  approvedForAssessmentCount: number;
  readyForAdmissionCount: number;
  admittedCount: number;
}

export interface SchoolVisit {
  id: string;
  parentName: string;
  email: string;
  phoneNumber: string;
  childName?: string;
  classLevelInterested?: string;
  preferredDate: string;
  timeSlot: string;
  notes?: string;
  status: string; // Pending, Confirmed, Completed, Cancelled
  requestedAt: string;
}

export default function AdmissionsHub() {
  const { showAlert } = useDialog();
  const { logoUrl } = useTenant();

  const [applications, setApplications] = useState<AdmissionApp[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Primary Tab: applications | visits
  const [activeHubTab, setActiveHubTab] = useState<'applications' | 'visits'>('applications');

  // School Visits State
  const [schoolVisits, setSchoolVisits] = useState<SchoolVisit[]>([]);
  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('All');
  const [viewVisit, setViewVisit] = useState<SchoolVisit | null>(null);

  // Selected Application Modals
  const [viewApp, setViewApp] = useState<AdmissionApp | null>(null);

  // Modal 1: Approve for Assessment State
  const [assessmentApp, setAssessmentApp] = useState<AdmissionApp | null>(null);
  const [regFeeAmount, setRegFeeAmount] = useState<number>(10000);
  const [assessmentDate, setAssessmentDate] = useState<string>('');
  const [assessmentNotes, setAssessmentNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Modal 2: Complete Assessment State
  const [completeApp, setCompleteApp] = useState<AdmissionApp | null>(null);

  // Modal 3: Final Admit State
  const [admitApp, setAdmitApp] = useState<AdmissionApp | null>(null);

  // Modal 4: Public Link Share Popup
  const [linkModal, setLinkModal] = useState<{
    title: string;
    url: string;
    copied: boolean;
  } | null>(null);

  // Modal 5: Document Previewer Popup
  const [docPreviewModal, setDocPreviewModal] = useState<{
    title: string;
    url: string;
    originalUrl: string;
  } | null>(null);

  const { branches } = useBranch();
  const [classesList, setClassesList] = useState<Array<{ id: string; name: string; section?: string; branchId?: string }>>([]);

  // Modal 6: Edit Application & Upload Missing Documents
  const [editApp, setEditApp] = useState<AdmissionApp | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editFiles, setEditFiles] = useState<{
    birthCert: File | null;
    passport: File | null;
    prevResult: File | null;
    paymentProof: File | null;
  }>({
    birthCert: null,
    passport: null,
    prevResult: null,
    paymentProof: null,
  });
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  const handleOpenLinkModal = (title: string, path: string) => {
    const activeTenantId = getTenantId();
    const fullUrl = `${window.location.origin}${path}${path.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(activeTenantId)}`;
    setLinkModal({ title, url: fullUrl, copied: false });
  };

  const handleCopyLink = () => {
    if (!linkModal) return;
    navigator.clipboard.writeText(linkModal.url);
    setLinkModal({ ...linkModal, copied: true });
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      if (Array.isArray(data)) {
        setClassesList(data);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchSchoolVisits();
    fetchClasses();
  }, [statusFilter, visitStatusFilter, activeHubTab]);

  const handleOpenEditModal = (appItem: AdmissionApp) => {
    setEditApp(appItem);
    setEditFormData({
      fullName: appItem.fullName || '',
      gender: appItem.gender || 'Male',
      dateOfBirth: appItem.dateOfBirth ? appItem.dateOfBirth.substring(0, 10) : '',
      age: appItem.age ? String(appItem.age) : '',
      targetClassId: appItem.targetClassId || '',
      branchId: appItem.branchId || '',
      session: appItem.session || '2026/2027',
      term: appItem.term || 'First Term',
      parentEmail: appItem.parentEmail || '',
      parentPhoneNumber: appItem.parentPhoneNumber || '',
      fatherName: appItem.fatherName || '',
      fatherOccupation: appItem.fatherOccupation || '',
      fatherPhoneNumber: appItem.fatherPhoneNumber || '',
      fatherEmail: appItem.fatherEmail || '',
      motherName: appItem.motherName || '',
      motherOccupation: appItem.motherOccupation || '',
      motherPhoneNumber: appItem.motherPhoneNumber || '',
      motherEmail: appItem.motherEmail || '',
      guardianName: appItem.guardianName || '',
      guardianRelationship: appItem.guardianRelationship || '',
      guardianAddress: appItem.guardianAddress || '',
      homeAddress: appItem.homeAddress || '',
      placeOfBirth: appItem.placeOfBirth || '',
      nationality: appItem.nationality || 'Nigerian',
      stateOfOrigin: appItem.stateOfOrigin || '',
      lga: appItem.lga || '',
      lastSchoolAttended: appItem.lastSchoolAttended || '',
      lastClassCompleted: appItem.lastClassCompleted || '',
      bloodGroup: appItem.bloodGroup || '',
      genotype: appItem.genotype || '',
      medicalConditions: appItem.medicalConditions || '',
      doctorNameClinic: appItem.doctorNameClinic || '',
      emergencyContactNumber: appItem.emergencyContactNumber || '',
    });
    setEditFiles({
      birthCert: null,
      passport: null,
      prevResult: null,
      paymentProof: null,
    });
    setPassportPreview(null);
  };

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditFiles((prev) => ({ ...prev, passport: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPassportPreview(url);
    } else {
      setPassportPreview(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;

    if (!editFormData.fullName?.trim()) {
      showAlert('Applicant Full Name is required.');
      return;
    }
    if (!editFormData.parentEmail?.trim()) {
      showAlert('Parent Email is required.');
      return;
    }
    if (!editFormData.parentPhoneNumber?.trim()) {
      showAlert('Parent Phone Number is required.');
      return;
    }

    try {
      setSubmittingAction(true);
      const formData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      if (editFiles.birthCert) {
        formData.append('BirthCertificateFile', editFiles.birthCert);
      }
      if (editFiles.passport) {
        formData.append('PassportPhotoFile', editFiles.passport);
      }
      if (editFiles.prevResult) {
        formData.append('PreviousResultFile', editFiles.prevResult);
      }
      if (editFiles.paymentProof) {
        formData.append('PaymentProofFile', editFiles.paymentProof);
      }

      await api.put(`/admin/admissions/${editApp.id}`, formData);
      showAlert('✅ Application details and documents updated successfully! If already admitted, student profile has been synced.');
      setEditApp(null);
      fetchApplications();

      if (viewApp && viewApp.id === editApp.id) {
        const refreshed = await api.get(`/admin/admissions?search=${encodeURIComponent(editFormData.fullName)}`);
        if (refreshed.applications && refreshed.applications.length > 0) {
          const match = refreshed.applications.find((a: AdmissionApp) => a.id === editApp.id);
          if (match) setViewApp(match);
        }
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to update admission application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const fetchSchoolVisits = async () => {
    try {
      let queryParams = [];
      if (visitStatusFilter && visitStatusFilter !== 'All')
        queryParams.push(`status=${visitStatusFilter}`);
      if (searchQuery.trim()) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await api.get(`/admin/school-visits${queryString}`);
      setSchoolVisits(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch school visit requests', err);
    }
  };

  const handleUpdateVisitStatus = async (visitId: string, newStatus: string) => {
    try {
      setSubmittingAction(true);
      await api.put(`/admin/school-visits/${visitId}/status`, { status: newStatus });
      showAlert(`Campus visit request updated to ${newStatus}.`);
      fetchSchoolVisits();
      if (viewVisit && viewVisit.id === visitId) {
        setViewVisit((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to update visit status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let queryParams = [];
      if (statusFilter && statusFilter !== 'All') queryParams.push(`status=${statusFilter}`);
      if (searchQuery.trim()) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await api.get(`/admin/admissions${queryString}`);

      setApplications(response.applications || []);
      setSummary(response.summary || null);
    } catch (err) {
      console.error('Failed to fetch admission applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  // Action Handler 1: Approve for Assessment
  const handleApproveForAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentApp) return;
    if (!assessmentDate) {
      showAlert('Please select an Assessment Appointment Date.');
      return;
    }

    try {
      setSubmittingAction(true);
      await api.post(`/admin/admissions/${assessmentApp.id}/approve-assessment`, {
        registrationFeeAmount: regFeeAmount,
        assessmentDate,
        assessmentNotes,
      });

      showAlert(
        `Application for ${assessmentApp.fullName} has been approved for assessment. Parent notified via Email and SMS.`,
      );
      setAssessmentApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || 'Failed to approve application for assessment.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Action Handler 2: Mark Assessment Complete (Ready for Admission)
  const handleMarkAssessmentComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeApp) return;

    try {
      setSubmittingAction(true);
      await api.post(`/admin/admissions/${completeApp.id}/complete-assessment`, {
        assessmentNotes,
      });

      showAlert(
        `Physical assessment completed for ${completeApp.fullName}. Application is now Ready for Admission.`,
      );
      setCompleteApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || 'Failed to complete assessment.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Action Handler 3: Final Admit & Place in Class
  const handleFinalAdmit = async (appItem: AdmissionApp) => {
    try {
      setSubmittingAction(true);
      const res = await api.post(`/admin/admissions/${appItem.id}/approve`, {});

      showAlert(
        `🎉 ${appItem.fullName} officially admitted into ${appItem.targetClassName}!\nAssigned Registration Number: ${res.registrationNumber}`,
      );
      setAdmitApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || 'Failed to admit student.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getFullUrl = (url?: string | null) => {
    if (!url) return '';
    let finalUrl = url.startsWith('/') ? `${API_ROOT}${url}` : url;
    if (
      finalUrl.includes('cloudinary.com') &&
      finalUrl.toLowerCase().endsWith('.pdf') &&
      finalUrl.includes('/image/upload/')
    ) {
      finalUrl = finalUrl.replace(/\.pdf$/i, '.jpg');
    }
    return finalUrl;
  };

  const handlePreviewDocument = (
    rawUrl?: string | null,
    docTitle: string = 'Uploaded Document',
  ) => {
    if (!rawUrl) return;
    const resolvedUrl = getFullUrl(rawUrl);
    const originalUrl = rawUrl.startsWith('/') ? `${API_ROOT}${rawUrl}` : rawUrl;
    setDocPreviewModal({
      title: docTitle,
      url: resolvedUrl,
      originalUrl,
    });
  };

  const formatStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return <span className="status-badge badge-submitted">📥 Submitted</span>;
      case 'ApprovedForAssessment':
        return <span className="status-badge badge-assessment">📋 Assessment Scheduled</span>;
      case 'ReadyForAdmission':
        return <span className="status-badge badge-ready">🎓 Ready For Admission</span>;
      case 'Admitted':
        return <span className="status-badge badge-admitted">✅ Admitted</span>;
      case 'Rejected':
        return <span className="status-badge badge-rejected">❌ Rejected</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatVisitStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="status-badge badge-submitted">⏳ Pending</span>;
      case 'Confirmed':
        return <span className="status-badge badge-assessment">📅 Confirmed</span>;
      case 'Completed':
        return <span className="status-badge badge-admitted">✅ Completed</span>;
      case 'Cancelled':
        return <span className="status-badge badge-rejected">❌ Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="admissions-hub-page">
      {/* Page Header */}
      <div className="admissions-page-header">
        <div>
          <h1 className="admissions-title">Admission Applications &amp; Campus Visit Hub</h1>
          <p className="admissions-subtitle">
            Review online registration submissions, manage prospective parent campus visits, and
            admit new intake students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleOpenLinkModal('Schedule a School Visit Link', '/schedule-visit')}
            className="btn btn-secondary"
          >
            📅 Public Schedule Visit Link
          </button>
          <button
            type="button"
            onClick={() =>
              handleOpenLinkModal('Public Admission Application Portal Link', '/apply-admission')
            }
            className="btn btn-primary public-apply-link-btn"
          >
            🔗 Public Application Portal Link
          </button>
        </div>
      </div>

      {/* Top Primary View Toggle Tabs */}
      <div className="hub-top-tabs">
        <button
          type="button"
          className={`hub-tab-btn ${activeHubTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveHubTab('applications')}
        >
          📄 Admission Applications
          <span className="tab-badge-blue">
            {summary?.totalApplications || applications.length}
          </span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeHubTab === 'visits' ? 'active' : ''}`}
          onClick={() => {
            setActiveHubTab('visits');
            fetchSchoolVisits();
          }}
        >
          🏫 Scheduled Campus Visits
          <span className="tab-badge-amber">{schoolVisits.length}</span>
        </button>
      </div>

      {activeHubTab === 'visits' ? (
        /* Campus Visit Requests Table View */
        <div className="visits-management-section">
          {/* Filter Bar for Visits */}
          <div className="admissions-filter-panel">
            <div className="status-tabs-row">
              {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`status-tab-btn ${visitStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setVisitStatusFilter(st)}
                >
                  {st === 'All' ? 'All Visits' : st}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchSchoolVisits();
              }}
              className="search-form-row"
            >
              <input
                type="text"
                placeholder="Search visitor name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control search-input"
              />
              <button type="submit" className="btn btn-secondary">
                🔍 Search
              </button>
            </form>
          </div>

          {/* Visits Table */}
          <div className="admissions-table-card">
            <div className="table-responsive">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>Visitor / Parent Name</th>
                    <th>Contact Details</th>
                    <th>Child &amp; Interest</th>
                    <th>Scheduled Date &amp; Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Loading campus visit requests...
                      </td>
                    </tr>
                  ) : schoolVisits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No campus visit requests found matching filter.
                      </td>
                    </tr>
                  ) : (
                    schoolVisits.map((visit) => (
                      <tr key={visit.id}>
                        <td>
                          <strong className="applicant-name">{visit.parentName}</strong>
                        </td>
                        <td>
                          <div className="contact-block">
                            <span>📧 {visit.email}</span>
                            <span className="text-muted">📱 {visit.phoneNumber}</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{visit.childName || 'Child Tour'}</strong>
                          </div>
                          <small style={{ color: 'var(--primary-color, #1b5e4b)', fontWeight: 700 }}>
                            {visit.classLevelInterested}
                          </small>
                        </td>
                        <td>
                          <div>
                            📅{' '}
                            {new Date(visit.preferredDate).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <small style={{ color: '#047857', fontWeight: 600 }}>
                            ⏰ {visit.timeSlot}
                          </small>
                        </td>
                        <td>{formatVisitStatusBadge(visit.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-action-group">
                            <button
                              className="act-btn act-btn-view"
                              onClick={() => setViewVisit(visit)}
                              title="View Visit Details"
                            >
                              👁️ View
                            </button>
                            {visit.status === 'Pending' && (
                              <button
                                className="act-btn act-btn-approve"
                                onClick={() => handleUpdateVisitStatus(visit.id, 'Confirmed')}
                                disabled={submittingAction}
                              >
                                📅 Confirm
                              </button>
                            )}
                            {(visit.status === 'Confirmed' || visit.status === 'Pending') && (
                              <button
                                className="act-btn act-btn-admit"
                                onClick={() => handleUpdateVisitStatus(visit.id, 'Completed')}
                                disabled={submittingAction}
                              >
                                ✅ Complete
                              </button>
                            )}
                            {visit.status !== 'Cancelled' && (
                              <button
                                className="act-btn act-btn-cancel"
                                onClick={() => handleUpdateVisitStatus(visit.id, 'Cancelled')}
                                disabled={submittingAction}
                              >
                                ❌ Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Applications View */
        <>
          {/* KPI Stage Counter Cards */}
          <div className="kpi-stats-grid">
            <div className="kpi-card" onClick={() => setStatusFilter('Submitted')}>
              <div className="kpi-info">
                <span className="kpi-label">New Submitted</span>
                <span className="kpi-value">{summary?.submittedCount || 0}</span>
              </div>
              <div className="kpi-icon-box icon-blue">📥</div>
            </div>

            <div className="kpi-card" onClick={() => setStatusFilter('ApprovedForAssessment')}>
              <div className="kpi-info">
                <span className="kpi-label">Assessment Scheduled</span>
                <span className="kpi-value">{summary?.approvedForAssessmentCount || 0}</span>
              </div>
              <div className="kpi-icon-box icon-amber">📋</div>
            </div>

            <div className="kpi-card" onClick={() => setStatusFilter('ReadyForAdmission')}>
              <div className="kpi-info">
                <span className="kpi-label">Ready For Admission</span>
                <span className="kpi-value">{summary?.readyForAdmissionCount || 0}</span>
              </div>
              <div className="kpi-icon-box icon-purple">🎓</div>
            </div>

            <div className="kpi-card" onClick={() => setStatusFilter('Admitted')}>
              <div className="kpi-info">
                <span className="kpi-label">Admitted Students</span>
                <span className="kpi-value">{summary?.admittedCount || 0}</span>
              </div>
              <div className="kpi-icon-box icon-green">✅</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="admissions-filter-panel">
            <div className="status-tabs-row">
              {['All', 'Submitted', 'ApprovedForAssessment', 'ReadyForAdmission', 'Admitted'].map(
                (st) => (
                  <button
                    key={st}
                    className={`status-tab-btn ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st === 'All'
                      ? 'All Applications'
                      : st === 'ApprovedForAssessment'
                        ? 'Assessment Scheduled'
                        : st === 'ReadyForAdmission'
                          ? 'Ready For Admission'
                          : st}
                  </button>
                ),
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="search-form-row">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search applicant name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary">
                🔍 Search
              </button>
            </form>
          </div>

          {/* Main Applications Data Table */}
          <div className="admissions-table-card">
            <div className="table-responsive">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th>Age / Gender</th>
                    <th>Class Applied</th>
                    <th>Parent Email &amp; Phone</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        Loading admission applications...
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No admission applications found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    applications.map((appItem) => (
                      <tr key={appItem.id}>
                        <td>
                          <div className="applicant-name-block">
                            <span className="applicant-name">{appItem.fullName}</span>
                            {appItem.assignedRegistrationNumber && (
                              <span className="code-pill">
                                {appItem.assignedRegistrationNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {appItem.age} yrs ({appItem.gender})
                        </td>
                        <td className="font-bold">
                          {appItem.targetClassName}
                        </td>
                        <td>
                          <div className="contact-block">
                            <span>📧 {appItem.parentEmail}</span>
                            <span className="text-muted">📱 {appItem.parentPhoneNumber}</span>
                          </div>
                        </td>
                        <td>
                          {new Date(appItem.appliedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>{formatStatusBadge(appItem.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-action-group">
                            <button
                              className="act-btn act-btn-view"
                              onClick={() => setViewApp(appItem)}
                              title="View Form Details"
                            >
                              👁️ View Form
                            </button>

                            {/* Lifecycle Stage Action Triggers */}
                            {appItem.status === 'Submitted' && (
                              <button
                                className="act-btn act-btn-approve"
                                onClick={() => {
                                  setAssessmentApp(appItem);
                                  setRegFeeAmount(appItem.registrationFeeAmount || 10000);
                                }}
                              >
                                📋 Approve for Assessment
                              </button>
                            )}

                            {appItem.status === 'ApprovedForAssessment' && (
                              <button
                                className="act-btn act-btn-complete"
                                onClick={() => setCompleteApp(appItem)}
                              >
                                ✅ Complete Assessment
                              </button>
                            )}

                            {(appItem.status === 'ReadyForAdmission' ||
                              appItem.status === 'ApprovedForAssessment') && (
                              <button
                                className="act-btn act-btn-admit"
                                onClick={() => setAdmitApp(appItem)}
                                disabled={submittingAction}
                              >
                                🎓 Admit Student
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: VIEW DIGITAL REGISTRATION FORM DETAILS */}
      {viewApp && (
        <div className="modal-overlay">
          <div className="modal-content-large">
            <div className="modal-header">
              <h2>Official Registration Form Details</h2>
              <button className="close-btn" onClick={() => setViewApp(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body form-preview-body">
              <div className="form-preview-paper">
                <div className="paper-header">
                  <img
                    src={logoUrl || '/images/dotmond-logo-1.png'}
                    alt="School Logo"
                    className="modal-school-logo"
                  />
                  <h3>DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</h3>
                  <h4>REGISTRATION FORM DETAILS</h4>
                  <p>
                    Applied Session: <strong>{viewApp.session}</strong> | Class:{' '}
                    <strong>{viewApp.targetClassName}</strong>
                    {viewApp.branchName && (
                      <> | Campus Branch: <strong>🏢 {viewApp.branchName}</strong></>
                    )}
                  </p>
                </div>

                {/* Section A */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION A: STUDENT INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p>
                      <strong>Full Name:</strong> {viewApp.fullName}
                    </p>
                    <p>
                      <strong>Date of Birth / Age:</strong>{' '}
                      {new Date(viewApp.dateOfBirth).toLocaleDateString('en-GB')} ({viewApp.age}{' '}
                      years)
                    </p>
                    <p>
                      <strong>Gender:</strong> {viewApp.gender}
                    </p>
                    <p>
                      <strong>Place of Birth:</strong> {viewApp.placeOfBirth || '-'}
                    </p>
                    <p>
                      <strong>Nationality:</strong> {viewApp.nationality}
                    </p>
                    <p>
                      <strong>State of Origin / LGA:</strong> {viewApp.stateOfOrigin} ({viewApp.lga}
                      )
                    </p>
                    <p className="full-width">
                      <strong>Home Address:</strong> {viewApp.homeAddress}
                    </p>
                    <p>
                      <strong>Previous School:</strong> {viewApp.lastSchoolAttended || '-'}
                    </p>
                    <p>
                      <strong>Last Class Completed:</strong> {viewApp.lastClassCompleted || '-'}
                    </p>
                  </div>
                </div>

                {/* Section B */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION B: PARENT / GUARDIAN INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p>
                      <strong>Father's Name:</strong> {viewApp.fatherName || '-'}
                    </p>
                    <p>
                      <strong>Occupation:</strong> {viewApp.fatherOccupation || '-'}
                    </p>
                    <p>
                      <strong>Father Phone:</strong> {viewApp.fatherPhoneNumber || '-'}
                    </p>
                    <p>
                      <strong>Father Email:</strong> {viewApp.fatherEmail || '-'}
                    </p>

                    <p>
                      <strong>Mother's Name:</strong> {viewApp.motherName || '-'}
                    </p>
                    <p>
                      <strong>Occupation:</strong> {viewApp.motherOccupation || '-'}
                    </p>
                    <p>
                      <strong>Mother Phone:</strong> {viewApp.motherPhoneNumber || '-'}
                    </p>
                    <p>
                      <strong>Mother Email:</strong> {viewApp.motherEmail || '-'}
                    </p>

                    <p className="full-width highlight-text">
                      <strong>Primary Notification Email:</strong> {viewApp.parentEmail}
                    </p>
                    <p className="full-width highlight-text">
                      <strong>Primary Notification Phone:</strong> {viewApp.parentPhoneNumber}
                    </p>

                    {viewApp.guardianName && (
                      <>
                        <p>
                          <strong>Guardian Name:</strong> {viewApp.guardianName}
                        </p>
                        <p>
                          <strong>Relationship:</strong> {viewApp.guardianRelationship}
                        </p>
                        <p className="full-width">
                          <strong>Guardian Address:</strong> {viewApp.guardianAddress}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Section C */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION C: MEDICAL INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p>
                      <strong>Blood Group:</strong> {viewApp.bloodGroup || '-'}
                    </p>
                    <p>
                      <strong>Genotype:</strong> {viewApp.genotype || '-'}
                    </p>
                    <p className="full-width">
                      <strong>Medical Conditions / Allergies:</strong>{' '}
                      {viewApp.medicalConditions || 'None'}
                    </p>
                    <p>
                      <strong>Doctor / Clinic:</strong> {viewApp.doctorNameClinic || '-'}
                    </p>
                    <p>
                      <strong>Emergency Contact:</strong> {viewApp.emergencyContactNumber || '-'}
                    </p>
                  </div>
                </div>

                {/* Section D */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">
                    SECTION D: DOCUMENTS SUBMITTED &amp; ATTACHMENTS
                  </h4>
                  <div className="documents-checklist-box">
                    <p>
                      Birth Certificate: {viewApp.birthCertificateSubmitted ? '✅ Yes' : '❌ No'}
                    </p>
                    <p>2 Passport Photographs: {viewApp.passportsSubmitted ? '✅ Yes' : '❌ No'}</p>
                    <p>
                      Previous Result / Transfer Cert:{' '}
                      {viewApp.previousResultSubmitted ? '✅ Yes' : '❌ No'}
                    </p>
                    {viewApp.otherDocuments && <p>Other Documents: {viewApp.otherDocuments}</p>}
                  </div>

                  {(!viewApp.birthCertificateUrl || !viewApp.passportPhotoUrl || !viewApp.previousResultUrl || !viewApp.paymentProofUrl) && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', margin: '14px 0 6px 0', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span>⚠️ <strong>Incomplete Documentation:</strong> Some verification files have not yet been uploaded.</span>
                      <button
                        type="button"
                        className="act-btn act-btn-edit"
                        style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          const item = viewApp;
                          setViewApp(null);
                          handleOpenEditModal(item);
                        }}
                      >
                        ✏️ Upload Now
                      </button>
                    </div>
                  )}

                  <div className="attachments-links-row mt-3">
                    {viewApp.birthCertificateUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewDocument(
                            viewApp.birthCertificateUrl,
                            `Birth Certificate - ${viewApp.fullName}`,
                          )
                        }
                        className="act-btn act-btn-view"
                      >
                        📄 View Birth Certificate
                      </button>
                    )}
                    {viewApp.passportPhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewDocument(
                            viewApp.passportPhotoUrl,
                            `Passport Photograph - ${viewApp.fullName}`,
                          )
                        }
                        className="act-btn act-btn-view"
                      >
                        📷 View Passport Photo
                      </button>
                    )}
                    {viewApp.previousResultUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewDocument(
                            viewApp.previousResultUrl,
                            `Previous Academic Result - ${viewApp.fullName}`,
                          )
                        }
                        className="act-btn act-btn-view"
                      >
                        📑 View Previous Result
                      </button>
                    )}
                    {viewApp.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePreviewDocument(
                            viewApp.paymentProofUrl,
                            `Payment Receipt Proof - ${viewApp.fullName}`,
                          )
                        }
                        className="act-btn act-btn-view"
                      >
                        💳 View Payment Receipt
                      </button>
                    )}
                  </div>
                </div>

                {/* Section E */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION E: DECLARATION</h4>
                  <p>
                    Declared by: <strong>{viewApp.declarantFullName}</strong> on{' '}
                    {new Date(viewApp.appliedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const item = viewApp;
                  setViewApp(null);
                  handleOpenEditModal(item);
                }}
              >
                ✏️ Edit Application &amp; Upload Documents
              </button>
              <button className="btn btn-secondary" onClick={() => setViewApp(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE FOR ASSESSMENT */}
      {assessmentApp && (
        <div className="modal-overlay" onClick={() => setAssessmentApp(null)}>
          <div className="modal-content-revamped" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-revamped">
              <div className="modal-title-group">
                <span className="modal-header-icon">📋</span>
                <h2>Schedule Documentation &amp; Assessment</h2>
              </div>
              <button className="close-btn-revamped" onClick={() => setAssessmentApp(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveForAssessment}>
              <div className="modal-body-revamped">
                <div className="modal-applicant-card">
                  <div className="applicant-avatar-box">
                    {assessmentApp.fullName ? assessmentApp.fullName.charAt(0) : 'A'}
                  </div>
                  <div className="applicant-details-box">
                    <div className="applicant-card-name">
                      {assessmentApp.fullName}
                      <span className="applicant-card-class">{assessmentApp.targetClassName}</span>
                    </div>
                    <div className="applicant-card-meta">
                      ✉️ Parent Notification will be dispatched via Email &amp; SMS
                    </div>
                  </div>
                </div>

                <div className="form-group-revamped">
                  <label className="form-label-revamped">
                    Registration Form Fee (₦) <span className="req-star">*</span>
                  </label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">₦</span>
                    <input
                      type="number"
                      className="form-control-revamped input-prefixed"
                      value={regFeeAmount}
                      onChange={(e) => setRegFeeAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                  <small className="form-help-text">
                    This registration fee amount will be sent to the parent in the Email and SMS
                    notice.
                  </small>
                </div>

                <div className="form-group-revamped mt-3">
                  <label className="form-label-revamped">
                    Assessment Appointment Date <span className="req-star">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control-revamped"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-revamped mt-3">
                  <label className="form-label-revamped">
                    Instructions / Special Notes for Parent
                  </label>
                  <textarea
                    className="form-control-revamped textarea-revamped"
                    rows={3}
                    placeholder="e.g. Please bring original birth certificate and come between 9:00 AM - 1:00 PM."
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer-revamped">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setAssessmentApp(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit btn-modal-primary"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Sending Notifications...' : '📧 Send Email & SMS Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLETE ASSESSMENT (READY FOR ADMISSION) */}
      {completeApp && (
        <div className="modal-overlay" onClick={() => setCompleteApp(null)}>
          <div className="modal-content-revamped" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-revamped">
              <div className="modal-title-group">
                <span className="modal-header-icon">✅</span>
                <h2>Complete Physical Assessment</h2>
              </div>
              <button className="close-btn-revamped" onClick={() => setCompleteApp(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkAssessmentComplete}>
              <div className="modal-body-revamped">
                <div className="modal-applicant-card">
                  <div
                    className="applicant-avatar-box"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                  >
                    {completeApp.fullName ? completeApp.fullName.charAt(0) : 'A'}
                  </div>
                  <div className="applicant-details-box">
                    <div className="applicant-card-name">
                      {completeApp.fullName}
                      <span className="applicant-card-class">{completeApp.targetClassName}</span>
                    </div>
                    <div className="applicant-card-meta">
                      Physical assessment &amp; document verification stage
                    </div>
                  </div>
                </div>

                <div className="form-group-revamped">
                  <label className="form-label-revamped">
                    Assessment Result / Performance Notes
                  </label>
                  <textarea
                    className="form-control-revamped textarea-revamped"
                    rows={3}
                    placeholder="e.g. Child passed mathematics & english entrance assessment. Documents verified."
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer-revamped">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCompleteApp(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit btn-modal-warning"
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Saving...' : '🎓 Mark Ready for Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM FINAL ADMIT & CLASS PLACEMENT */}
      {admitApp && (
        <div className="modal-overlay" onClick={() => setAdmitApp(null)}>
          <div className="modal-content-revamped" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-revamped">
              <div className="modal-title-group">
                <span className="modal-header-icon">🎓</span>
                <h2>Confirm Final Student Admission</h2>
              </div>
              <button className="close-btn-revamped" onClick={() => setAdmitApp(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body-revamped">
              <div className="modal-applicant-card">
                <div
                  className="applicant-avatar-box"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  {admitApp.fullName ? admitApp.fullName.charAt(0) : 'A'}
                </div>
                <div className="applicant-details-box">
                  <div className="applicant-card-name">
                    {admitApp.fullName}
                    <span className="applicant-card-class">{admitApp.targetClassName}</span>
                  </div>
                  <div className="applicant-card-meta">Parent Email: {admitApp.parentEmail}</div>
                </div>
              </div>

              <div className="admit-summary-box">
                <p>
                  1. System will generate official <strong>Student Registration Number</strong>.
                </p>
                <p>
                  2. Provision Parent Portal Account for <strong>{admitApp.parentEmail}</strong>.
                </p>
                <p>
                  3. Create active Student profile and place into{' '}
                  <strong>{admitApp.targetClassName}</strong>.
                </p>
                <p>
                  4. Send Welcome Email and SMS to parent with portal credentials and Student No.
                </p>
              </div>
            </div>

            <div className="modal-footer-revamped">
              <button type="button" className="btn-modal-cancel" onClick={() => setAdmitApp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit btn-modal-success"
                onClick={() => handleFinalAdmit(admitApp)}
                disabled={submittingAction}
              >
                {submittingAction
                  ? 'Admitting Student...'
                  : '🎉 Confirm Admission & Place in Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PUBLIC SHAREABLE LINK COPY POPUP */}
      {linkModal && (
        <div className="modal-overlay" onClick={() => setLinkModal(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🔗 {linkModal.title}</h2>
              <button className="close-btn" onClick={() => setLinkModal(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <p
                style={{
                  color: '#475569',
                  fontSize: '14px',
                  marginBottom: '14px',
                  lineHeight: 1.5,
                }}
              >
                Share this direct URL with parents or publish on social media to allow prospective
                parents to complete the form:
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  readOnly
                  value={linkModal.url}
                  className="form-control"
                  style={{
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
                <button
                  type="button"
                  className={`btn ${linkModal.copied ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopyLink}
                  style={{ whiteSpace: 'nowrap', minWidth: '115px' }}
                >
                  {linkModal.copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              {linkModal.copied && (
                <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  ✓ Link copied to clipboard! You can now paste and send it.
                </p>
              )}
            </div>

            <div
              className="modal-footer"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <a
                href={linkModal.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '13px' }}
              >
                ↗ Open Link in New Tab
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLinkModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 6: VIEW VISIT DETAILS */}
      {viewVisit && (
        <div className="modal-overlay" onClick={() => setViewVisit(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🏫 Campus Tour Appointment Details</h2>
              <button className="close-btn" onClick={() => setViewVisit(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    VISITOR NAME
                  </label>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {viewVisit.parentName}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    STATUS
                  </label>
                  <div>{formatVisitStatusBadge(viewVisit.status)}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ fontSize: '14px', color: '#334155' }}>📧 {viewVisit.email}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    PHONE NUMBER
                  </label>
                  <div style={{ fontSize: '14px', color: '#334155' }}>
                    📱 {viewVisit.phoneNumber}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    CHILD'S NAME &amp; AGE
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {viewVisit.childName || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    CLASS INTERESTED IN
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color, #1b5e4b)' }}>
                    {viewVisit.classLevelInterested}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    PREFERRED DATE
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857' }}>
                    📅{' '}
                    {new Date(viewVisit.preferredDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    TIME SLOT
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857' }}>
                    ⏰ {viewVisit.timeSlot}
                  </div>
                </div>
              </div>

              {viewVisit.notes && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--primary-color, #1b5e4b)',
                  }}
                >
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    SPECIAL NOTES / QUESTIONS
                  </label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#1e293b' }}>
                    {viewVisit.notes}
                  </p>
                </div>
              )}
            </div>

            <div
              className="modal-footer"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewVisit.status === 'Pending' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateVisitStatus(viewVisit.id, 'Confirmed')}
                  >
                    📅 Confirm Visit
                  </button>
                )}
                {(viewVisit.status === 'Confirmed' || viewVisit.status === 'Pending') && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleUpdateVisitStatus(viewVisit.id, 'Completed')}
                  >
                    ✅ Complete
                  </button>
                )}
              </div>
              <button className="btn btn-secondary" onClick={() => setViewVisit(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: INLINE DOCUMENT PREVIEWER */}
      {docPreviewModal && (
        <div className="modal-overlay" onClick={() => setDocPreviewModal(null)}>
          <div
            className="modal-content-revamped"
            style={{ maxWidth: '800px', width: '94%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-revamped">
              <div className="modal-title-group">
                <span className="modal-header-icon">📑</span>
                <h2>{docPreviewModal.title}</h2>
              </div>
              <button className="close-btn-revamped" onClick={() => setDocPreviewModal(null)}>
                ✕
              </button>
            </div>

            <div
              className="modal-body-revamped"
              style={{
                textAlign: 'center',
                background: '#0f172a',
                padding: '1.25rem',
                minHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {docPreviewModal.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={docPreviewModal.url}
                  title={docPreviewModal.title}
                  style={{
                    width: '100%',
                    height: '520px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#ffffff',
                  }}
                />
              ) : (
                <img
                  src={docPreviewModal.url}
                  alt={docPreviewModal.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '540px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                />
              )}
            </div>

            <div className="modal-footer-revamped" style={{ justifyContent: 'space-between' }}>
              <a
                href={docPreviewModal.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-modal-cancel"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ↗ Open Original Direct Link
              </a>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDocPreviewModal(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT APPLICATION & UPLOAD MISSING DOCUMENTS */}
      {editApp && (
        <div className="modal-overlay" onClick={() => !submittingAction && setEditApp(null)}>
          <div
            className="modal-content-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '92vh' }}
          >
            <div className="modal-header-edit">
              <div>
                <h2>
                  <span>✏️</span> Edit Application &amp; Upload Documents
                </h2>
                <p>
                  Applicant: <strong style={{ color: 'var(--primary-color, #1b5e4b)' }}>{editApp.fullName}</strong>
                  {editApp.assignedRegistrationNumber && (
                    <span
                      style={{
                        marginLeft: '8px',
                        background: '#ecfdf5',
                        color: '#059669',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      🎓 Student ID: {editApp.assignedRegistrationNumber}
                    </span>
                  )}
                  <span style={{ marginLeft: '8px' }}>
                    Status: {formatStatusBadge(editApp.status)}
                  </span>
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => !submittingAction && setEditApp(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="edit-form-scrollable">
                {/* SECTION 1: DOCUMENT UPLOADS & STATUS BADGES */}
                <div className="edit-section-box" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <div className="edit-section-header" style={{ color: 'var(--primary-color, #1b5e4b)', borderBottomColor: '#cbd5e1' }}>
                    <span>📂</span> Required Documents &amp; Verification Files
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b', marginLeft: 'auto' }}>
                      (Upload files when received from parents to enable student ID card and admission validation)
                    </span>
                  </div>

                  <div className="doc-upload-grid">
                    {/* Doc 1: Passport Photo */}
                    <div className={`doc-upload-card ${editApp.passportPhotoUrl || passportPreview ? 'has-uploaded' : 'has-missing'}`}>
                      <div>
                        <div className="doc-card-top">
                          <h4 className="doc-card-title">
                            <span>📷</span> Passport Photograph
                          </h4>
                          {passportPreview || editApp.passportPhotoUrl ? (
                            <span className="doc-status-pill uploaded">✅ Uploaded</span>
                          ) : (
                            <span className="doc-status-pill missing">⚠️ Missing</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0' }}>
                          Used for official student ID cards &amp; student registry profile.
                        </p>

                        {(passportPreview || editApp.passportPhotoUrl) && (
                          <div className="doc-preview-inline">
                            <img
                              src={passportPreview || getFullUrl(editApp.passportPhotoUrl)}
                              alt="Passport preview"
                              className="doc-thumb-img"
                            />
                            <div style={{ fontSize: '0.75rem' }}>
                              {passportPreview ? (
                                <span style={{ color: '#16a34a', fontWeight: 700 }}>New file selected</span>
                              ) : (
                                <button
                                  type="button"
                                  className="act-btn act-btn-view"
                                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handlePreviewDocument(editApp.passportPhotoUrl, `Passport - ${editApp.fullName}`)}
                                >
                                  👁️ View Current
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          {editApp.passportPhotoUrl ? 'Replace Photo:' : 'Upload Photo:'}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="doc-file-input"
                          onChange={handlePassportFileChange}
                        />
                      </div>
                    </div>

                    {/* Doc 2: Birth Certificate */}
                    <div className={`doc-upload-card ${editApp.birthCertificateUrl || editFiles.birthCert ? 'has-uploaded' : 'has-missing'}`}>
                      <div>
                        <div className="doc-card-top">
                          <h4 className="doc-card-title">
                            <span>📄</span> Birth Certificate
                          </h4>
                          {editFiles.birthCert || editApp.birthCertificateUrl ? (
                            <span className="doc-status-pill uploaded">✅ Uploaded</span>
                          ) : (
                            <span className="doc-status-pill missing">⚠️ Missing</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0' }}>
                          Official birth certificate or statutory age declaration document.
                        </p>

                        {editApp.birthCertificateUrl && !editFiles.birthCert && (
                          <div className="doc-preview-inline">
                            <span style={{ fontSize: '1.2rem' }}>📜</span>
                            <button
                              type="button"
                              className="act-btn act-btn-view"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => handlePreviewDocument(editApp.birthCertificateUrl, `Birth Certificate - ${editApp.fullName}`)}
                            >
                              👁️ View Current Document
                            </button>
                          </div>
                        )}
                        {editFiles.birthCert && (
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginBottom: '6px' }}>
                            Selected: {editFiles.birthCert.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          {editApp.birthCertificateUrl ? 'Replace Document:' : 'Upload Document:'}
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="doc-file-input"
                          onChange={(e) => setEditFiles((prev) => ({ ...prev, birthCert: e.target.files?.[0] || null }))}
                        />
                      </div>
                    </div>

                    {/* Doc 3: Previous Result */}
                    <div className={`doc-upload-card ${editApp.previousResultUrl || editFiles.prevResult ? 'has-uploaded' : 'has-missing'}`}>
                      <div>
                        <div className="doc-card-top">
                          <h4 className="doc-card-title">
                            <span>📑</span> Previous Academic Result
                          </h4>
                          {editFiles.prevResult || editApp.previousResultUrl ? (
                            <span className="doc-status-pill uploaded">✅ Uploaded</span>
                          ) : (
                            <span className="doc-status-pill missing">⚠️ Missing</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0' }}>
                          Previous school report card, testimonial, or transfer certificate.
                        </p>

                        {editApp.previousResultUrl && !editFiles.prevResult && (
                          <div className="doc-preview-inline">
                            <span style={{ fontSize: '1.2rem' }}>📊</span>
                            <button
                              type="button"
                              className="act-btn act-btn-view"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => handlePreviewDocument(editApp.previousResultUrl, `Previous Result - ${editApp.fullName}`)}
                            >
                              👁️ View Current Result
                            </button>
                          </div>
                        )}
                        {editFiles.prevResult && (
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginBottom: '6px' }}>
                            Selected: {editFiles.prevResult.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          {editApp.previousResultUrl ? 'Replace Result:' : 'Upload Result:'}
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="doc-file-input"
                          onChange={(e) => setEditFiles((prev) => ({ ...prev, prevResult: e.target.files?.[0] || null }))}
                        />
                      </div>
                    </div>

                    {/* Doc 4: Payment Receipt Proof */}
                    <div className={`doc-upload-card ${editApp.paymentProofUrl || editFiles.paymentProof ? 'has-uploaded' : 'has-missing'}`}>
                      <div>
                        <div className="doc-card-top">
                          <h4 className="doc-card-title">
                            <span>💳</span> Fee / Application Receipt
                          </h4>
                          {editFiles.paymentProof || editApp.paymentProofUrl ? (
                            <span className="doc-status-pill uploaded">✅ Uploaded</span>
                          ) : (
                            <span className="doc-status-pill missing">⚠️ Missing</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0' }}>
                          Proof of admission application fee or acceptance deposit.
                        </p>

                        {editApp.paymentProofUrl && !editFiles.paymentProof && (
                          <div className="doc-preview-inline">
                            <span style={{ fontSize: '1.2rem' }}>🧾</span>
                            <button
                              type="button"
                              className="act-btn act-btn-view"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => handlePreviewDocument(editApp.paymentProofUrl, `Payment Proof - ${editApp.fullName}`)}
                            >
                              👁️ View Current Receipt
                            </button>
                          </div>
                        )}
                        {editFiles.paymentProof && (
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginBottom: '6px' }}>
                            Selected: {editFiles.paymentProof.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          {editApp.paymentProofUrl ? 'Replace Receipt:' : 'Upload Receipt:'}
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="doc-file-input"
                          onChange={(e) => setEditFiles((prev) => ({ ...prev, paymentProof: e.target.files?.[0] || null }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CAMPUS BRANCH & PLACEMENT */}
                <div className="edit-section-box">
                  <div className="edit-section-header">
                    <span>🏢</span> Campus Branch &amp; Academic Placement
                  </div>
                  <div className="edit-grid-3">
                    <div className="form-field-group field-highlight-branch">
                      <label style={{ color: '#0369a1' }}>
                        🏫 Campus Branch <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        style={{ borderColor: '#93c5fd', fontWeight: 700, background: '#ffffff' }}
                        value={editFormData.branchId}
                        onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                      >
                        <option value="">-- Assign Campus Branch --</option>
                        {branches.map((b: Branch) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.isMainBranch ? '(Main Campus)' : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.72rem', color: '#0369a1' }}>
                        Admitted students and applications will be mapped to this branch.
                      </span>
                    </div>

                    <div className="form-field-group">
                      <label>Target Class Placement</label>
                      <select
                        className="form-control"
                        value={editFormData.targetClassId}
                        onChange={(e) => setEditFormData({ ...editFormData, targetClassId: e.target.value })}
                      >
                        <option value="">-- Select Class --</option>
                        {classesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.section || ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label>Academic Session &amp; Term</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 2026/2027"
                          value={editFormData.session}
                          onChange={(e) => setEditFormData({ ...editFormData, session: e.target.value })}
                        />
                        <select
                          className="form-control"
                          value={editFormData.term}
                          onChange={(e) => setEditFormData({ ...editFormData, term: e.target.value })}
                        >
                          <option value="First Term">First Term</option>
                          <option value="Second Term">Second Term</option>
                          <option value="Third Term">Third Term</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: STUDENT BIODATA */}
                <div className="edit-section-box">
                  <div className="edit-section-header">
                    <span>👤</span> Student Biodata
                  </div>
                  <div className="edit-grid-3">
                    <div className="form-field-group">
                      <label>
                        Full Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Gender</label>
                      <select
                        className="form-control"
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label>Date of Birth &amp; Age</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="date"
                          className="form-control"
                          value={editFormData.dateOfBirth}
                          onChange={(e) => {
                            const val = e.target.value;
                            let computedAge = editFormData.age;
                            if (val) {
                              const bDate = new Date(val);
                              computedAge = String(Math.max(1, new Date().getFullYear() - bDate.getFullYear()));
                            }
                            setEditFormData({ ...editFormData, dateOfBirth: val, age: computedAge });
                          }}
                        />
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Age"
                          style={{ width: '80px' }}
                          value={editFormData.age}
                          onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>Place of Birth</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.placeOfBirth}
                        onChange={(e) => setEditFormData({ ...editFormData, placeOfBirth: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.nationality}
                        onChange={(e) => setEditFormData({ ...editFormData, nationality: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>State of Origin / LGA</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="State"
                          value={editFormData.stateOfOrigin}
                          onChange={(e) => setEditFormData({ ...editFormData, stateOfOrigin: e.target.value })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="LGA"
                          value={editFormData.lga}
                          onChange={(e) => setEditFormData({ ...editFormData, lga: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="edit-grid-3 mt-3">
                    <div className="form-field-group" style={{ gridColumn: 'span 2' }}>
                      <label>Home Residential Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.homeAddress}
                        onChange={(e) => setEditFormData({ ...editFormData, homeAddress: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Last School / Class Completed</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Last School"
                          value={editFormData.lastSchoolAttended}
                          onChange={(e) => setEditFormData({ ...editFormData, lastSchoolAttended: e.target.value })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Last Class"
                          value={editFormData.lastClassCompleted}
                          onChange={(e) => setEditFormData({ ...editFormData, lastClassCompleted: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: PARENT / GUARDIAN INFORMATION */}
                <div className="edit-section-box">
                  <div className="edit-section-header">
                    <span>👨‍👩‍👧</span> Parent &amp; Emergency Contact Information
                  </div>
                  <div className="edit-grid-2">
                    <div className="form-field-group">
                      <label>
                        Primary Parent Email <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={editFormData.parentEmail}
                        onChange={(e) => setEditFormData({ ...editFormData, parentEmail: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>
                        Primary Parent Phone <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        required
                        value={editFormData.parentPhoneNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, parentPhoneNumber: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Father's Name &amp; Phone</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Father's Full Name"
                          value={editFormData.fatherName}
                          onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        />
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone"
                          value={editFormData.fatherPhoneNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, fatherPhoneNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>Mother's Name &amp; Phone</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Mother's Full Name"
                          value={editFormData.motherName}
                          onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                        />
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone"
                          value={editFormData.motherPhoneNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, motherPhoneNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: MEDICAL INFORMATION */}
                <div className="edit-section-box">
                  <div className="edit-section-header">
                    <span>🩺</span> Medical Information
                  </div>
                  <div className="edit-grid-3">
                    <div className="form-field-group">
                      <label>Blood Group &amp; Genotype</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Blood (e.g. O+)"
                          value={editFormData.bloodGroup}
                          onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Genotype (e.g. AA)"
                          value={editFormData.genotype}
                          onChange={(e) => setEditFormData({ ...editFormData, genotype: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label>Medical Conditions / Allergies</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="None or specify"
                        value={editFormData.medicalConditions}
                        onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                      />
                    </div>

                    <div className="form-field-group">
                      <label>Emergency Contact Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="Emergency contact number"
                        value={editFormData.emergencyContactNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="modal-footer-revamped"
                style={{
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.75rem',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => !submittingAction && setEditApp(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit btn-modal-primary"
                  disabled={submittingAction}
                >
                  {submittingAction ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      Saving &amp; Uploading Documents...
                    </>
                  ) : (
                    <>
                      <span>💾</span> Save Changes &amp; Upload Documents
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
