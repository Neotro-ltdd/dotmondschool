import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../../services/api';
import './Academics.css';

interface SubjectItem {
  id: string;
  name: string;
  level: string;
  subjectTeacherName?: string;
  isLocked: boolean;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterLevel, setFilterLevel] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    level: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const endpoint = filterLevel ? `/academics/subjects?level=${encodeURIComponent(filterLevel)}` : '/academics/subjects';
      const data = await api.get(endpoint);
      setSubjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err: any) {
      console.error("Failed to fetch classes for dropdown");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [filterLevel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/academics/subjects/${formData.id}`, { name: formData.name, level: formData.level });
      } else {
        await api.post('/academics/subjects', { name: formData.name, level: formData.level });
      }
      setShowModal(false);
      setFormData({ id: '', name: '', level: formData.level });
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || `Failed to ${isEditing ? 'update' : 'create'} subject`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (subject: SubjectItem) => {
    setFormData({
      id: subject.id,
      name: subject.name,
      level: subject.level
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject? This cannot be undone if there are no scores attached.")) return;
    try {
      setSubmitting(true);
      await api.delete(`/academics/subjects/${id}`);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ id: '', name: '', level: filterLevel });
    setIsEditing(false);
    setShowModal(true);
  };

  return (
    <div className="academics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Management</h1>
          <p className="page-subtitle">Manage subjects across all classes</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span className="icon">➕</span> Add Subject
        </button>
      </div>

      <div className="filter-bar glass-panel">
        <label>Filter by Level:</label>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="filter-select">
          <option value="">All Levels</option>
          {Array.from(new Set(classes.map(c => c.level))).map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p className="empty-text">No subjects found for the selected filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Target Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => (
                <tr key={sub.id}>
                  <td><strong>{sub.name}</strong></td>
                  <td><span className="badge badge-info">{sub.level}</span></td>
                  <td>
                    {sub.isLocked ? (
                      <span className="badge badge-warning">Locked</span>
                    ) : (
                      <span className="badge badge-success">Open</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEditClick(sub)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDeleteClick(sub.id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>Delete</button>
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
          <div className="modal-content glass-panel">
            <h2>{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form onSubmit={handleCreateOrUpdate} className="modal-form">
              <div className="form-group">
                <label>Target Level</label>
                <select name="level" value={formData.level} onChange={handleInputChange} required>
                  <option value="">-- Select Target Level --</option>
                  {Array.from(new Set(classes.map(c => c.level))).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Mathematics" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
