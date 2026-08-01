import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import './Management.css';
import { useDialog } from '../../../context/DialogContext';
import SlideOver from '../../../components/ui/SlideOver';
import { User, Briefcase, FileCheck, Check, ChevronRight, ArrowLeft, Search, Mail, Phone, Key, Edit2, Power, Trash2, Filter, Users, UserPlus } from 'lucide-react';


interface TeacherItem {
  id: string;
  identityUserId?: string;
  surname: string;
  firstName: string;
  otherNames: string;
  phoneNumber: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl: string;
}

export default function Teachers() {
  const { showAlert, showConfirm } = useDialog();
  const queryClient = useQueryClient();

  // TanStack Query for Server State (Vatebra Enterprise Standard 5.4)
  const { data: teachers = [], isLoading: loading, error: queryError } = useQuery<TeacherItem[]>({
    queryKey: ['staffList'],
    queryFn: async () => await api.get('/setup/staff'),
  });

  const error = queryError ? ((queryError as any).message || 'Failed to load staff.') : null;

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.surname || ''} ${teacher.firstName || ''} ${teacher.otherNames || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (teacher.phoneNumber && teacher.phoneNumber.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || (teacher.role && teacher.role.toLowerCase() === roleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? teacher.isActive : !teacher.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    otherNames: '',
    phoneNumber: '',
    email: '',
    designation: '',
    role: 'Teacher'
  });

  // Credentials Modal State
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsData, setCredsData] = useState<{username: string, password: string, emailQueued: boolean} | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // TanStack Mutations
  const saveStaffMutation = useMutation({
    mutationFn: async (payload: { isEdit: boolean; id?: string; data: FormData | Record<string, any> }) => {
      if (payload.isEdit && payload.id) {
        return await api.put(`/setup/staff/${payload.id}`, payload.data);
      } else {
        return await api.post('/setup/staff', payload.data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      showAlert(variables.isEdit ? 'Staff member updated successfully.' : 'Staff member onboarded successfully.');
      setShowModal(false);
    },
    onError: (err: any) => {
      showAlert(err.message || 'Failed to save staff member');
    }
  });

  const submitting = saveStaffMutation.isPending;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editStaffId) {
      const data = new FormData();
      data.append('surname', formData.surname);
      data.append('firstName', formData.firstName);
      if (formData.otherNames) data.append('otherNames', formData.otherNames);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('email', formData.email);
      data.append('designation', formData.designation);
      data.append('role', formData.role);
      
      if (signatureFile) {
        data.append('signature', signatureFile);
      }
      saveStaffMutation.mutate({ isEdit: true, id: editStaffId, data });
    } else {
      saveStaffMutation.mutate({ isEdit: false, data: { ...formData } });
    }
  };

  const handleEditClick = (teacher: TeacherItem) => {
    setFormData({
      surname: teacher.surname || '',
      firstName: teacher.firstName || '',
      otherNames: teacher.otherNames || '',
      phoneNumber: teacher.phoneNumber || '',
      email: teacher.email || '',
      designation: '', // Provide a fallback as designation isn't in TeacherItem by default
      role: teacher.role || 'Teacher'
    });
    setSignatureFile(null);
    setEditStaffId(teacher.id);
    setIsEditing(true);
    setFormStep(1);
    setShowModal(true);
  };

  const handleAddNewClick = () => {
    setFormData({
      surname: '',
      firstName: '',
      otherNames: '',
      phoneNumber: '',
      email: '',
      designation: '',
      role: 'Teacher'
    });
    setSignatureFile(null);
    setEditStaffId(null);
    setIsEditing(false);
    setFormStep(1);
    setShowModal(true);
  };

  const handleNextStep = () => {
    if (formStep === 1) {
      if (!formData.surname || !formData.firstName || !formData.phoneNumber || !formData.email) {
        showAlert('Please complete all required personal details (Surname, First Name, Phone, and Email) before continuing.');
        return;
      }
      setFormStep(2);
    } else if (formStep === 2) {
      if (!formData.designation || !formData.role) {
        showAlert('Please specify the Designation and Staff Role before continuing.');
        return;
      }
      setFormStep(3);
    }
  };

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => await api.post(`/setup/staff/${id}/deactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      showAlert('Staff member deactivated successfully.');
    },
    onError: (err: any) => showAlert(err.message || 'Failed to deactivate staff member.')
  });

  const handleRemove = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to remove ${name} from the system? They will lose all access.`)) return;
    deactivateMutation.mutate(id);
  };

  const activateMutation = useMutation({
    mutationFn: async (id: string) => await api.post(`/setup/staff/${id}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      showAlert('Staff member activated successfully.');
    },
    onError: (err: any) => showAlert(err.message || 'Failed to activate staff member.')
  });

  const handleActivate = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to restore access for ${name}?`)) return;
    activateMutation.mutate(id);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/setup/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      showAlert('Staff member permanently deleted.');
    },
    onError: (err: any) => showAlert(err.message || 'Failed to delete staff member.')
  });

  const handleDelete = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to PERMANENTLY delete ${name}? This action cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  const regenerateCredsMutation = useMutation({
    mutationFn: async (identityUserId: string) => await api.post('/user-management/regenerate-credentials', { userId: identityUserId }),
    onMutate: (identityUserId) => setGeneratingId(identityUserId),
    onSuccess: (response) => {
      setCredsData({
        username: response.username,
        password: response.password,
        emailQueued: response.emailQueued
      });
      setShowCredsModal(true);
    },
    onError: (err: any) => showAlert(err.message || 'Failed to regenerate credentials.'),
    onSettled: () => setGeneratingId(null)
  });

  const handleRegenerateCredentials = async (identityUserId: string, name: string) => {
    if (!identityUserId) {
        showAlert('This user does not have an active login account.');
        return;
    }
    if (!await showConfirm(`Are you sure you want to regenerate credentials for ${name}? Their old password will be invalidated immediately.`)) return;
    regenerateCredsMutation.mutate(identityUserId);
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Onboard and manage staff members across academic departments</p>
        </div>
        <button className="btn-executive-onboard" onClick={handleAddNewClick} title="Open interactive clearance & role onboarding panel">
          <span className="onboard-icon-wrapper">
            <UserPlus size={16} />
          </span>
          <span>Onboard Staff Member</span>
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="management-desk">
        <div className="desk-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search staff by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Roles</option>
              <option value="Teacher">Teacher</option>
              <option value="Accountant">Accountant</option>
              <option value="Principal">Principal</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>Loading staff roster...</div>
          ) : filteredTeachers.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
              {teachers.length === 0 ? 'No staff members onboarded yet.' : 'No staff members match your active search and filters.'}
            </div>
          ) : (
            <table className="executive-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Contact Information</th>
                  <th>Designated Role</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>
                      <div className="staff-profile-cell">
                        {teacher.avatarUrl && teacher.avatarUrl !== 'default.jpg' && teacher.avatarUrl !== 'null' && teacher.avatarUrl.trim() !== '' ? (
                          <img 
                            src={teacher.avatarUrl} 
                            alt="Avatar" 
                            className="staff-avatar" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((teacher.surname || '') + ' ' + (teacher.firstName || ''))}&background=0F172A&color=fff&rounded=true&bold=true`;
                            }}
                          />
                        ) : (
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent((teacher.surname || '') + ' ' + (teacher.firstName || ''))}&background=0F172A&color=fff&rounded=true&bold=true`}
                            alt="Avatar" 
                            className="staff-avatar" 
                          />
                        )}
                        <div className="staff-names">
                          <span className="staff-primary-name">{teacher.surname} {teacher.firstName}</span>
                          <span className="staff-secondary-name">{teacher.otherNames || 'Staff Member'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-row">
                          <Mail size={13} color="#64748B" />
                          <span>{teacher.email || 'No email specified'}</span>
                        </div>
                        <div className="contact-row phone-row">
                          <Phone size={13} />
                          <span>{teacher.phoneNumber || 'No phone recorded'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill ${teacher.role === 'Admin' || teacher.role === 'Principal' ? 'role-pill-admin' : ''}`}>
                        {teacher.role || 'Staff'}
                      </span>
                    </td>
                    <td>
                      {teacher.isActive ? (
                        <span className="status-pill status-active">
                          <span className="status-dot"></span>
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="status-pill status-inactive">
                          <span className="status-dot-inactive"></span>
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions-group">
                        <button 
                          className="action-btn action-btn-blue" 
                          title="Regenerate credentials & trigger email notification"
                          onClick={() => handleRegenerateCredentials(teacher.identityUserId!, `${teacher.surname} ${teacher.firstName}`)}
                          disabled={generatingId === teacher.identityUserId || !teacher.identityUserId}
                        >
                          <Key size={13} />
                          <span>{generatingId === teacher.identityUserId ? 'Generating...' : 'Credentials'}</span>
                        </button>
                        <button 
                          className="action-btn action-btn-neutral" 
                          title="Edit staff clearance & role details"
                          onClick={() => handleEditClick(teacher)}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        {teacher.isActive ? (
                          <button 
                            className="action-icon-btn action-icon-amber" 
                            title="Temporarily suspend access"
                            onClick={() => handleRemove(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                          >
                            <Power size={15} />
                          </button>
                        ) : (
                          <button 
                            className="action-icon-btn action-icon-green" 
                            title="Restore staff system access"
                            onClick={() => handleActivate(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                          >
                            <Power size={15} />
                          </button>
                        )}
                        <button 
                          className="action-icon-btn action-icon-red" 
                          title="Permanently delete staff record"
                          onClick={() => handleDelete(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="desk-footer">
          <span>Showing <strong>{filteredTeachers.length}</strong> of <strong>{teachers.length}</strong> registered staff members</span>
          <span>Dotmond School System</span>
        </div>
      </div>

      {/* Dotmond School System Slide Show & Slide-Over Panel Architecture */}
      <SlideOver
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title={isEditing ? 'Edit Staff Credentials & Profile' : 'Onboard New Staff Member'}
        subtitle="Complete the step-by-step clearance and role allocation process."
        width="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {formStep > 1 ? (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setFormStep(prev => prev - 1)}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)} 
                disabled={submitting}
              >
                Cancel
              </button>
            )}

            {formStep < 3 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleNextStep}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCreate as any} 
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981' }}
              >
                <Check size={18} /> {submitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Confirm & Onboard Staff'}
              </button>
            )}
          </div>
        }
      >
        {/* Horizontal Progress Stepper */}
        <div className="slideover-stepper" style={{ margin: '-24px -24px 24px -24px' }}>
          <div className={`stepper-step ${formStep === 1 ? 'active' : formStep > 1 ? 'completed' : ''}`}>
            <span className="stepper-circle">{formStep > 1 ? '✓' : '1'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Biodata & Contact</span>
          </div>
          <div className="stepper-divider"></div>
          <div className={`stepper-step ${formStep === 2 ? 'active' : formStep > 2 ? 'completed' : ''}`}>
            <span className="stepper-circle">{formStep > 2 ? '✓' : '2'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> Role Details</span>
          </div>
          <div className="stepper-divider"></div>
          <div className={`stepper-step ${formStep === 3 ? 'active' : ''}`}>
            <span className="stepper-circle">3</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileCheck size={14} /> Verification & Review</span>
          </div>
        </div>

        {/* Slide 1: Biodata & Contact */}
        {formStep === 1 && (
          <div className="slide-stage-content">
            <h3 style={{ margin: 0, color: '#10203F', borderBottom: '1px solid #E3E7EF', paddingBottom: '8px' }}>
              Candidate Biodata & Contact Information
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#5B6B85', margin: '-8px 0 8px 0' }}>
              Please enter the official legal names and active communication channels for the staff member.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label>Surname <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} required placeholder="e.g. Bakare" />
              </div>
              <div className="form-group">
                <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="e.g. Adefolarin" />
              </div>
              <div className="form-group full-width">
                <label>Other Names</label>
                <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} placeholder="Optional middle names" />
              </div>
              <div className="form-group">
                <label>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required placeholder="e.g. 08030000000" />
              </div>
              <div className="form-group">
                <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="staff@dotmond.edu.ng" />
              </div>
            </div>
          </div>
        )}

        {/* Slide 2: Role Details & Signature */}
        {formStep === 2 && (
          <div className="slide-stage-content">
            <h3 style={{ margin: 0, color: '#10203F', borderBottom: '1px solid #E3E7EF', paddingBottom: '8px' }}>
              System Role & Job Designation
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#5B6B85', margin: '-8px 0 8px 0' }}>
              Specify their official title and assign administrative portal access levels.
            </p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Designation / Job Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Senior Mathematics Teacher, Bursaria Officer" required />
              </div>

              <div className="form-group full-width">
                <label>Portal Access Role <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="role" value={formData.role} onChange={handleInputChange} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E3E7EF' }}>
                  <option value="Teacher">Teacher (Class & Attendance Management)</option>
                  <option value="SubjectTeacher">Subject Teacher (Grading & Assignments Only)</option>
                  <option value="Accountant">Accountant (Fee Clearance & POS Billing)</option>
                  <option value="Principal">Principal (Full Analytics & Academic Overseer)</option>
                  <option value="Vendor">Vendor (POS & Service Processing)</option>
                  <option value="Admin">System Admin (Full Portal Configurations)</option>
                  <option value="Staff">General Support Staff</option>
                </select>
              </div>

              {isEditing && (
                <div className="form-group full-width" style={{ marginTop: '1rem', padding: '16px', background: '#FAFCFE', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                  <label style={{ color: '#10203F', fontWeight: 600 }}>Update Official Signature (Optional)</label>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 12px 0' }}>
                    Uploading a signature file will automatically override their current receipt/report signature watermark.
                  </p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                    className="form-control"
                    style={{ padding: '8px', width: '100%', background: '#ffffff', borderRadius: '6px' }}
                  />
                  {signatureFile && <span style={{ fontSize: '0.8rem', color: '#10B981', display: 'block', marginTop: '6px' }}>Selected: {signatureFile.name}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide 3: Verification & Summary */}
        {formStep === 3 && (
          <div className="slide-stage-content">
            <h3 style={{ margin: 0, color: '#10203F', borderBottom: '1px solid #E3E7EF', paddingBottom: '8px' }}>
              Final Verification & Review
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#5B6B85', margin: '-8px 0 8px 0' }}>
              Please review all entered details below before executing the onboarding process.
            </p>

            <div className="review-summary-card">
              <div className="review-row">
                <span className="review-label">Full Name:</span>
                <span className="review-value">{formData.surname} {formData.firstName} {formData.otherNames}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Phone Contact:</span>
                <span className="review-value">{formData.phoneNumber}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Email Address:</span>
                <span className="review-value">{formData.email}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Job Designation:</span>
                <span className="review-value">{formData.designation}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Assigned Role:</span>
                <span className="review-value" style={{ color: '#3b82f6', fontWeight: 700 }}>{formData.role}</span>
              </div>
              {isEditing && (
                <div className="review-row">
                  <span className="review-label">Signature Update:</span>
                  <span className="review-value">{signatureFile ? signatureFile.name : 'No changes made'}</span>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6', color: '#1E3A8A', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>ℹ️ Note:</strong> Upon completion, access credentials and onboarding instructions can be dispatched or generated directly from the master staff table.
            </div>
          </div>
        )}
      </SlideOver>

      {showCredsModal && credsData && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#10b981' }}>Credentials Regenerated!</h2>
                <p className="text-muted text-sm mt-1">Please copy these details immediately.</p>
            </div>
            
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label className="text-muted text-sm" style={{ display: 'block', marginBottom: '0.2rem' }}>Username / Email</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{credsData.username}</div>
                </div>
                <div>
                    <label className="text-muted text-sm" style={{ display: 'block', marginBottom: '0.2rem' }}>New Password</label>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '2px', color: '#60a5fa' }}>{credsData.password}</div>
                </div>
            </div>

            {credsData.emailQueued ? (
                <div className="alert-success" style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                    ✅ A welcome email containing these credentials has also been queued for delivery.
                </div>
            ) : (
                <div className="alert-warning" style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                    ⚠️ No email was sent because this user does not have a real email address on file. You MUST copy this password and send it to them manually.
                </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setShowCredsModal(false)}>
                    I have copied the password
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
