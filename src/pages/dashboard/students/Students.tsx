import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './Management.css'; // We'll share CSS with Teachers
import IdCardPrintModal from './IdCardPrintModal';

interface StudentItem {
  id: string;
  surname: string;
  firstName: string;
  otherNames: string;
  registrationNumber: string;
  parentEmail: string;
  parentPhoneNumber: string;
  className: string;
  classId?: string;
  level?: string;
  status: string;
  isCleared: boolean;
  departmentTrack?: string;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function Students() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    otherNames: '',
    parentPhoneNumber: '',
    parentEmail: '',
    classId: '',
    departmentTrack: 'General'
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Upload State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/setup/students?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
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
      console.error("Failed to load classes");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filterSession, filterTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/setup/students', formData);
      setShowModal(false);
      setFormData({
        surname: '',
        firstName: '',
        otherNames: '',
        parentPhoneNumber: '',
        parentEmail: '',
        classId: formData.classId, // Keep the class selected for rapid entry
        departmentTrack: 'General'
      });
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to admit student');
    } finally {
      setSubmitting(false);
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
      alert(res.message || 'Students uploaded successfully');
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to upload students');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  let filteredStudents = students;
  if (filterSearch) {
    const searchLower = filterSearch.toLowerCase();
    filteredStudents = filteredStudents.filter(s => 
      s.surname.toLowerCase().includes(searchLower) ||
      s.firstName.toLowerCase().includes(searchLower) ||
      (s.otherNames && s.otherNames.toLowerCase().includes(searchLower)) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchLower))
    );
  }
  if (filterLevel) {
    filteredStudents = filteredStudents.filter(s => s.level === filterLevel);
  }
  if (filterClassId) {
    filteredStudents = filteredStudents.filter(s => s.classId === filterClassId);
  }

  // Generate options for classes based on selected level
  const classOptions = filterLevel ? classes.filter(c => c.level === filterLevel) : classes;

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">Admit, manage, and archive student records</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button 
              className="btn btn-secondary" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <span className="icon">📁</span> {uploading ? 'Uploading...' : 'Bulk Upload (CSV)'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <span className="icon">➕</span> Add Student
            </button>
          </div>
          <small style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
            CSV Format: Surname, FirstName, OtherNames, Gender, DOB, Class, Phone, Email
          </small>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label>Search Student:</label>
          <input 
            type="text" 
            value={filterSearch} 
            onChange={(e) => setFilterSearch(e.target.value)} 
            className="filter-select" 
            placeholder="Name or Reg. Number..."
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Level:</label>
          <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setFilterClassId(''); }} className="filter-select">
            <option value="">All Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Class:</label>
          <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} className="filter-select">
            <option value="">All Classes</option>
            {classOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{`${cls.level} ${cls.name} ${cls.section}`}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="empty-text">No students found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Parent Contact</th>
                <th>Clearance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td><strong>{student.registrationNumber || 'Pending'}</strong></td>
                  <td>
                    <strong>{student.surname} {student.firstName}</strong>
                    <div className="text-muted text-sm">{student.otherNames}</div>
                  </td>
                  <td><span className="badge badge-info">{student.className || 'Unassigned'}</span></td>
                  <td>
                    <div>{student.parentEmail}</div>
                    <div className="text-muted text-sm">{student.parentPhoneNumber}</div>
                  </td>
                  <td>
                    <span className={`badge ${student.isCleared ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: student.isCleared ? '#28a745' : '#dc3545', color: 'white' }}>
                      {student.isCleared ? 'Cleared' : 'Not Cleared'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPrintStudentId(student.id)}>
                      🪪 ID Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {printStudentId && (
        <IdCardPrintModal 
          studentId={printStudentId} 
          onClose={() => setPrintStudentId(null)} 
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel large-modal">
            <h2>Admit New Student</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Assign to Class</label>
                  <select name="classId" value={formData.classId} onChange={handleInputChange} required>
                    <option value="">-- Select Class --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{`${cls.level} ${cls.name} ${cls.section}`}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Department / Track (For Senior Students)</label>
                  <select name="departmentTrack" value={formData.departmentTrack} onChange={handleInputChange}>
                    <option value="General">General (Junior / Primary)</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Other Names</label>
                  <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} />
                </div>
                
                <div className="form-group full-width section-divider">
                  <h3>Parent / Guardian Info</h3>
                </div>

                <div className="form-group">
                  <label>Parent Phone Number</label>
                  <input type="tel" name="parentPhoneNumber" value={formData.parentPhoneNumber} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Parent Email Address</label>
                  <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Admitting...' : 'Admit Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
