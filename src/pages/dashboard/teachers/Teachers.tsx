import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './Management.css';
import { useDialog } from '../../../context/DialogContext';


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

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

interface SubjectItem {
  id: string;
  name: string;
  className: string;
}

export default function Teachers() {
  const { showAlert, showConfirm } = useDialog();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);

  // Credentials Modal State
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsData, setCredsData] = useState<{username: string, password: string, emailQueued: boolean} | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Form dependencies
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);


  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/setup/staff');
      setTeachers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const classData = await api.get('/setup/classes');
      setClasses(classData);
      const subjectData = await api.get('/academics/subjects');
      setSubjects(subjectData);
    } catch (err) {
      console.error("Failed to load classes or subjects");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
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

        await api.put(`/setup/staff/${editStaffId}`, data);
        showAlert('Staff member updated successfully.');
      } else {
        await api.post('/setup/staff', { ...formData });
        showAlert('Staff member onboarded successfully.');
      }
      
      setShowModal(false);
      fetchTeachers();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save staff member');
    } finally {
      setSubmitting(false);
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
    setShowModal(true);
  };

  const handleRemove = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to remove ${name} from the system? They will lose all access.`)) return;
    try {
      await api.post(`/setup/staff/${id}/deactivate`, {});
      showAlert('Staff member deactivated successfully.');
      fetchTeachers();
    } catch (err: any) {
      showAlert(err.message || 'Failed to deactivate staff member.');
    }
  };

  const handleActivate = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to restore access for ${name}?`)) return;
    try {
      await api.post(`/setup/staff/${id}/activate`, {});
      showAlert('Staff member activated successfully.');
      fetchTeachers();
    } catch (err: any) {
      showAlert(err.message || 'Failed to activate staff member.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!await showConfirm(`Are you sure you want to PERMANENTLY delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/setup/staff/${id}`);
      showAlert('Staff member permanently deleted.');
      fetchTeachers();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete staff member.');
    }
  };

  const handleRegenerateCredentials = async (identityUserId: string, name: string) => {
    if (!identityUserId) {
        showAlert('This user does not have an active login account.');
        return;
    }
    if (!await showConfirm(`Are you sure you want to regenerate credentials for ${name}? Their old password will be invalidated immediately.`)) return;
    
    try {
        setGeneratingId(identityUserId);
        const response = await api.post('/user-management/regenerate-credentials', { userId: identityUserId });
        setCredsData({
            username: response.username,
            password: response.password,
            emailQueued: response.emailQueued
        });
        setShowCredsModal(true);
    } catch (err: any) {
        showAlert(err.message || 'Failed to regenerate credentials.');
    } finally {
        setGeneratingId(null);
    }
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Onboard and manage staff members</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddNewClick}>
          <span className="icon">➕</span> Add Staff
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading staff...</p>
        ) : teachers.length === 0 ? (
          <p className="empty-text">No staff onboarded yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>
                    <div className="user-info">
                      {teacher.avatarUrl && teacher.avatarUrl !== 'default.jpg' && teacher.avatarUrl !== 'null' && teacher.avatarUrl.trim() !== '' ? (
                        <img 
                          src={teacher.avatarUrl} 
                          alt="Avatar" 
                          className="avatar-small" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((teacher.surname || '') + ' ' + (teacher.firstName || ''))}&background=000080&color=fff&rounded=true&bold=true`;
                          }}
                        />
                      ) : (
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent((teacher.surname || '') + ' ' + (teacher.firstName || ''))}&background=000080&color=fff&rounded=true&bold=true`}
                          alt="Avatar" 
                          className="avatar-small" 
                        />
                      )}
                      <div>
                        <strong>{teacher.surname} {teacher.firstName}</strong>
                        <div className="text-muted text-sm">{teacher.otherNames}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{teacher.email}</div>
                    <div className="text-muted text-sm">{teacher.phoneNumber}</div>
                  </td>
                  <td>
                    <span className={`badge ${teacher.role === 'Teacher' ? 'badge-primary' : 'badge-info'}`}>
                      {teacher.role}
                    </span>
                  </td>
                  <td>
                    {teacher.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-warning">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        title="Regenerate Credentials"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
                        onClick={() => handleRegenerateCredentials(teacher.identityUserId!, `${teacher.surname} ${teacher.firstName}`)}
                        disabled={generatingId === teacher.identityUserId || !teacher.identityUserId}
                      >
                        {generatingId === teacher.identityUserId ? 'Generating...' : 'Credentials'}
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        title="Edit staff details"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#6366f1', color: 'white', border: 'none' }}
                        onClick={() => handleEditClick(teacher)}
                      >
                        Edit
                      </button>
                      {teacher.isActive ? (
                        <button 
                          className="btn btn-secondary" 
                          title="Temporarily deactivate this staff member"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                          onClick={() => handleRemove(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          title="Restore access for this staff member"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#10b981', color: 'white', border: 'none' }}
                          onClick={() => handleActivate(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                        >
                          Activate
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        title="Permanently delete this staff member"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                        onClick={() => handleDelete(teacher.id, `${teacher.surname} ${teacher.firstName}`)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel large-modal">
            <h2>{isEditing ? 'Edit Staff Details' : 'Add New Staff'}</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Other Names</label>
                  <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                
                <div className="form-group full-width section-divider">
                  <h3>Role Details</h3>
                </div>

                <div className="form-group full-width">
                  <label>Designation / Job Title</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Mathematics Teacher, Senior Accountant" required />
                </div>

                <div className="form-group full-width">
                  <label>Staff Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="Teacher">Teacher</option>
                    <option value="SubjectTeacher">SubjectTeacher</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Principal">Principal</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                
                {isEditing && (
                  <div className="form-group full-width section-divider" style={{ marginTop: '1rem' }}>
                    <h3>Upload Signature (Optional)</h3>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>If you upload a signature here, it will automatically override their current signature.</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                      className="form-control"
                      style={{ padding: '0.5rem', border: '1px dashed #ccc', width: '100%' }}
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Onboard Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
