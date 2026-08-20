import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
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

export default function AdmissionsHub() {
  const { showAlert } = useDialog();

  const [applications, setApplications] = useState<AdmissionApp[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

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
      console.error("Failed to fetch admission applications", err);
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
      showAlert("Please select an Assessment Appointment Date.");
      return;
    }

    try {
      setSubmittingAction(true);
      await api.post(`/admin/admissions/${assessmentApp.id}/approve-assessment`, {
        registrationFeeAmount: regFeeAmount,
        assessmentDate,
        assessmentNotes
      });
      
      showAlert(`Application for ${assessmentApp.fullName} has been approved for assessment. Parent notified via Email and SMS.`);
      setAssessmentApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || "Failed to approve application for assessment.");
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
        assessmentNotes
      });

      showAlert(`Physical assessment completed for ${completeApp.fullName}. Application is now Ready for Admission.`);
      setCompleteApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || "Failed to complete assessment.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Action Handler 3: Final Admit & Place in Class
  const handleFinalAdmit = async (appItem: AdmissionApp) => {
    try {
      setSubmittingAction(true);
      const res = await api.post(`/admin/admissions/${appItem.id}/approve`, {});
      
      showAlert(`🎉 ${appItem.fullName} officially admitted into ${appItem.targetClassName}!\nAssigned Registration Number: ${res.registrationNumber}`);
      setAdmitApp(null);
      fetchApplications();
    } catch (err: any) {
      showAlert(err.message || "Failed to admit student.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getFullUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
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

  return (
    <div className="admissions-hub-page">
      
      {/* Page Header */}
      <div className="admissions-page-header">
        <div>
          <h1 className="admissions-title">Admission Applications Hub</h1>
          <p className="admissions-subtitle">Review online registration submissions, schedule documentation assessments, and admit new intake students.</p>
        </div>
        <a href="/apply-admission" target="_blank" rel="noreferrer" className="btn btn-primary public-apply-link-btn">
          🔗 Public Application Portal Link
        </a>
      </div>

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
          {['All', 'Submitted', 'ApprovedForAssessment', 'ReadyForAdmission', 'Admitted'].map(st => (
            <button 
              key={st}
              className={`status-tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'All' ? 'All Applications' : st === 'ApprovedForAssessment' ? 'Assessment Scheduled' : st === 'ReadyForAdmission' ? 'Ready For Admission' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form-row">
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder="Search applicant name, email, or phone number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">🔍 Search</button>
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
                  <td colSpan={7} className="text-center py-4">Loading admission applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">No admission applications found matching the selected filter.</td>
                </tr>
              ) : (
                applications.map(appItem => (
                  <tr key={appItem.id}>
                    <td>
                      <div className="applicant-name-block">
                        <span className="applicant-name">{appItem.fullName}</span>
                        {appItem.assignedRegistrationNumber && (
                          <span className="code-pill">{appItem.assignedRegistrationNumber}</span>
                        )}
                      </div>
                    </td>
                    <td>{appItem.age} yrs ({appItem.gender})</td>
                    <td className="font-bold">{appItem.targetClassName}</td>
                    <td>
                      <div className="contact-block">
                        <span>📧 {appItem.parentEmail}</span>
                        <span className="text-muted">📱 {appItem.parentPhoneNumber}</span>
                      </div>
                    </td>
                    <td>{new Date(appItem.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{formatStatusBadge(appItem.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-action-group">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewApp(appItem)}>
                          👁️ View Form
                        </button>

                        {/* Lifecycle Stage Action Triggers */}
                        {appItem.status === 'Submitted' && (
                          <button 
                            className="btn btn-sm btn-primary" 
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
                            className="btn btn-sm btn-warning" 
                            onClick={() => setCompleteApp(appItem)}
                          >
                            ✅ Complete Assessment
                          </button>
                        )}

                        {(appItem.status === 'ReadyForAdmission' || appItem.status === 'ApprovedForAssessment') && (
                          <button 
                            className="btn btn-sm btn-success" 
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

      {/* MODAL 1: VIEW DIGITAL REGISTRATION FORM DETAILS */}
      {viewApp && (
        <div className="modal-overlay">
          <div className="modal-content-large">
            <div className="modal-header">
              <h2>Official Registration Form Details</h2>
              <button className="close-btn" onClick={() => setViewApp(null)}>✕</button>
            </div>
            
            <div className="modal-body form-preview-body">
              <div className="form-preview-paper">
                <div className="paper-header">
                  <h3>DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</h3>
                  <h4>REGISTRATION FORM DETAILS</h4>
                  <p>Applied Session: <strong>{viewApp.session}</strong> | Term: <strong>{viewApp.term}</strong> | Class: <strong>{viewApp.targetClassName}</strong></p>
                </div>

                {/* Section A */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION A: STUDENT INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p><strong>Full Name:</strong> {viewApp.fullName}</p>
                    <p><strong>Date of Birth / Age:</strong> {new Date(viewApp.dateOfBirth).toLocaleDateString('en-GB')} ({viewApp.age} years)</p>
                    <p><strong>Gender:</strong> {viewApp.gender}</p>
                    <p><strong>Place of Birth:</strong> {viewApp.placeOfBirth || '-'}</p>
                    <p><strong>Nationality:</strong> {viewApp.nationality}</p>
                    <p><strong>State of Origin / LGA:</strong> {viewApp.stateOfOrigin} ({viewApp.lga})</p>
                    <p className="full-width"><strong>Home Address:</strong> {viewApp.homeAddress}</p>
                    <p><strong>Previous School:</strong> {viewApp.lastSchoolAttended || '-'}</p>
                    <p><strong>Last Class Completed:</strong> {viewApp.lastClassCompleted || '-'}</p>
                  </div>
                </div>

                {/* Section B */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION B: PARENT / GUARDIAN INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p><strong>Father's Name:</strong> {viewApp.fatherName || '-'}</p>
                    <p><strong>Occupation:</strong> {viewApp.fatherOccupation || '-'}</p>
                    <p><strong>Father Phone:</strong> {viewApp.fatherPhoneNumber || '-'}</p>
                    <p><strong>Father Email:</strong> {viewApp.fatherEmail || '-'}</p>

                    <p><strong>Mother's Name:</strong> {viewApp.motherName || '-'}</p>
                    <p><strong>Occupation:</strong> {viewApp.motherOccupation || '-'}</p>
                    <p><strong>Mother Phone:</strong> {viewApp.motherPhoneNumber || '-'}</p>
                    <p><strong>Mother Email:</strong> {viewApp.motherEmail || '-'}</p>

                    <p className="full-width highlight-text"><strong>Primary Notification Email:</strong> {viewApp.parentEmail}</p>
                    <p className="full-width highlight-text"><strong>Primary Notification Phone:</strong> {viewApp.parentPhoneNumber}</p>

                    {viewApp.guardianName && (
                      <>
                        <p><strong>Guardian Name:</strong> {viewApp.guardianName}</p>
                        <p><strong>Relationship:</strong> {viewApp.guardianRelationship}</p>
                        <p className="full-width"><strong>Guardian Address:</strong> {viewApp.guardianAddress}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Section C */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION C: MEDICAL INFORMATION</h4>
                  <div className="paper-grid-2">
                    <p><strong>Blood Group:</strong> {viewApp.bloodGroup || '-'}</p>
                    <p><strong>Genotype:</strong> {viewApp.genotype || '-'}</p>
                    <p className="full-width"><strong>Medical Conditions / Allergies:</strong> {viewApp.medicalConditions || 'None'}</p>
                    <p><strong>Doctor / Clinic:</strong> {viewApp.doctorNameClinic || '-'}</p>
                    <p><strong>Emergency Contact:</strong> {viewApp.emergencyContactNumber || '-'}</p>
                  </div>
                </div>

                {/* Section D */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION D: DOCUMENTS SUBMITTED &amp; ATTACHMENTS</h4>
                  <div className="documents-checklist-box">
                    <p>Birth Certificate: {viewApp.birthCertificateSubmitted ? '✅ Yes' : '❌ No'}</p>
                    <p>2 Passport Photographs: {viewApp.passportsSubmitted ? '✅ Yes' : '❌ No'}</p>
                    <p>Previous Result / Transfer Cert: {viewApp.previousResultSubmitted ? '✅ Yes' : '❌ No'}</p>
                    {viewApp.otherDocuments && <p>Other Documents: {viewApp.otherDocuments}</p>}
                  </div>

                  <div className="attachments-links-row mt-3">
                    {viewApp.birthCertificateUrl && (
                      <a href={getFullUrl(viewApp.birthCertificateUrl)} target="_blank" rel="noreferrer" className="attachment-btn">
                        📄 View Birth Certificate
                      </a>
                    )}
                    {viewApp.passportPhotoUrl && (
                      <a href={getFullUrl(viewApp.passportPhotoUrl)} target="_blank" rel="noreferrer" className="attachment-btn">
                        📷 View Passport Photo
                      </a>
                    )}
                    {viewApp.previousResultUrl && (
                      <a href={getFullUrl(viewApp.previousResultUrl)} target="_blank" rel="noreferrer" className="attachment-btn">
                        📑 View Previous Result
                      </a>
                    )}
                    {viewApp.paymentProofUrl && (
                      <a href={getFullUrl(viewApp.paymentProofUrl)} target="_blank" rel="noreferrer" className="attachment-btn">
                        💳 View Payment Receipt
                      </a>
                    )}
                  </div>
                </div>

                {/* Section E */}
                <div className="paper-section">
                  <h4 className="paper-sec-title">SECTION E: DECLARATION</h4>
                  <p>Declared by: <strong>{viewApp.declarantFullName}</strong> on {new Date(viewApp.appliedAt).toLocaleDateString('en-GB')}</p>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE FOR ASSESSMENT */}
      {assessmentApp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Schedule Documentation &amp; Assessment</h2>
              <button className="close-btn" onClick={() => setAssessmentApp(null)}>✕</button>
            </div>

            <form onSubmit={handleApproveForAssessment}>
              <div className="modal-body">
                <p>Approve application for <strong>{assessmentApp.fullName}</strong> ({assessmentApp.targetClassName}) and send Email &amp; SMS notice to parent.</p>

                <div className="form-group">
                  <label>Registration Form Fee (₦) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={regFeeAmount} 
                    onChange={(e) => setRegFeeAmount(Number(e.target.value))} 
                    required 
                  />
                  <small className="text-muted">This registration form fee amount will be sent to the parent in the Email and SMS notice.</small>
                </div>

                <div className="form-group mt-3">
                  <label>Assessment Appointment Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={assessmentDate} 
                    onChange={(e) => setAssessmentDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group mt-3">
                  <label>Instructions / Special Notes for Parent</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="e.g. Please bring original birth certificate and come between 9:00 AM - 1:00 PM."
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssessmentApp(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submittingAction}>
                  {submittingAction ? 'Sending Notifications...' : '📧 Send Email & SMS Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COMPLETE ASSESSMENT (READY FOR ADMISSION) */}
      {completeApp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Complete Physical Assessment</h2>
              <button className="close-btn" onClick={() => setCompleteApp(null)}>✕</button>
            </div>

            <form onSubmit={handleMarkAssessmentComplete}>
              <div className="modal-body">
                <p>Confirm that <strong>{completeApp.fullName}</strong> has completed physical assessment and document verification at Dotmond School.</p>

                <div className="form-group">
                  <label>Assessment Result / Performance Notes</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="e.g. Child passed mathematics & english entrance assessment. Documents verified."
                    value={assessmentNotes}
                    onChange={(e) => setAssessmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCompleteApp(null)}>Cancel</button>
                <button type="submit" className="btn btn-warning" disabled={submittingAction}>
                  {submittingAction ? 'Saving...' : '🎓 Mark Ready for Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM FINAL ADMIT & CLASS PLACEMENT */}
      {admitApp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Final Student Admission</h2>
              <button className="close-btn" onClick={() => setAdmitApp(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p>You are about to officially admit <strong>{admitApp.fullName}</strong> into <strong>{admitApp.targetClassName}</strong>.</p>
              
              <div className="admit-summary-box">
                <p>1. System will generate official **Student Registration Number**.</p>
                <p>2. Provision Parent Portal Account for <strong>{admitApp.parentEmail}</strong>.</p>
                <p>3. Create active Student profile and place into <strong>{admitApp.targetClassName}</strong>.</p>
                <p>4. Send Welcome Email and SMS to parent with portal credentials and Student No.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAdmitApp(null)}>Cancel</button>
              <button type="button" className="btn btn-success" onClick={() => handleFinalAdmit(admitApp)} disabled={submittingAction}>
                {submittingAction ? 'Admitting Student...' : '🎉 Confirm Admission & Place in Class'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
