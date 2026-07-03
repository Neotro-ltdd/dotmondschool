import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './Management.css';

interface TeacherItem {
  id: string;
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
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/setup/staff', {
        ...formData
      });
      setShowModal(false);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to onboard staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the system? They will lose all access.`)) return;
    try {
      await api.post(`/setup/staff/${id}/deactivate`, {});
      alert('Staff member deactivated successfully.');
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff member.');
    }
  };

  const handleActivate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore access for ${name}?`)) return;
    try {
      await api.post(`/setup/staff/${id}/activate`, {});
      alert('Staff member activated successfully.');
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to activate staff member.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/setup/staff/${id}`);
      alert('Staff member permanently deleted.');
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member.');
    }
  };

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Onboard and manage staff members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
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
            <h2>Add New Staff</h2>
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
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Onboarding...' : 'Onboard Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
