import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../../services/api';
import './Academics.css';

interface ClassItem {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isRosterApproved: boolean;
  classTeacherName: string | null;
  studentCount: number;
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    session: '2026/2027',
    level: 'Junior Secondary',
    name: '1',
    section: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await api.get('/setup/classes');
      setClasses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/setup/classes/${formData.id}`, formData);
      } else {
        await api.post('/setup/classes', formData);
      }
      setShowModal(false);
      setIsEditing(false);
      fetchClasses();
    } catch (err: any) {
      alert(err.message || `Failed to ${isEditing ? 'update' : 'create'} class`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls: ClassItem) => {
    setFormData({
      id: cls.id,
      session: cls.session,
      level: cls.level,
      name: cls.name,
      section: cls.section
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    try {
      await api.delete(`/setup/classes/${id}`);
      fetchClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class');
    }
  };

  const openCreateModal = () => {
    setFormData({
      id: '',
      session: '2026/2027',
      level: 'Junior Secondary',
      name: '1',
      section: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const levelOrder: Record<string, number> = {
    'Senior Secondary': 1,
    'Junior Secondary': 2,
    'Primary': 3,
    'Kindergarten': 4,
    'Nursery': 5
  };

  const sortedClasses = [...classes].sort((a, b) => {
    const levelA = levelOrder[a.level] || 99;
    const levelB = levelOrder[b.level] || 99;
    
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    
    if (numA !== numB) {
      if (a.level === 'Senior Secondary') {
        return numB - numA; // Descending for SS
      }
      return numA - numB; // Ascending for others
    }
    
    return (a.section || '').localeCompare(b.section || '');
  });

  return (
    <div className="academics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Management</h1>
          <p className="page-subtitle">Manage all active classes in the school</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="icon">➕</span> Add Class
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading classes...</p>
        ) : sortedClasses.length === 0 ? (
          <p className="empty-text">No classes found. Add your first class to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Name</th>
                <th>Section</th>
                <th>Session</th>
                <th>Class Teacher</th>
                <th>Students</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedClasses.map(cls => (
                <tr key={cls.id}>
                  <td>{cls.level}</td>
                  <td>{cls.name}</td>
                  <td>{cls.section}</td>
                  <td>{cls.session}</td>
                  <td>{cls.classTeacherName || <span className="text-muted">Not Assigned</span>}</td>
                  <td>
                    <span className="badge badge-info">{cls.studentCount} Students</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon" onClick={() => handleEdit(cls)} title="Edit Class" style={{ marginRight: '0.5rem', color: 'var(--color-primary-light)' }}>
                      ✏️
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(cls.id)} title="Delete Class" style={{ color: '#ff4136' }}>
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>{isEditing ? 'Edit Class' : 'Add New Class'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="modal-form">
              <div className="form-group">
                <label>Academic Session</label>
                <input type="text" name="session" value={formData.session} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select name="level" value={formData.level} onChange={handleInputChange} required className="form-control" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                  <option value="Senior Secondary" style={{ color: '#000' }}>Senior Secondary</option>
                  <option value="Junior Secondary" style={{ color: '#000' }}>Junior Secondary</option>
                  <option value="Primary" style={{ color: '#000' }}>Primary</option>
                  <option value="Nursery" style={{ color: '#000' }}>Nursery</option>
                  <option value="Kindergarten" style={{ color: '#000' }}>Kindergarten</option>
                </select>
              </div>
              <div className="form-group">
                <label>Name (e.g. 1, 2, 3)</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Section (Optional, e.g. A, B, Gold)</label>
                <input type="text" name="section" value={formData.section} onChange={handleInputChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
