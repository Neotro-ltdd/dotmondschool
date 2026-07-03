import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../students/Management.css'; 

interface StudentItem {
  id: string;
  surname: string;
  firstName: string;
  otherNames: string;
  registrationNumber: string;
  className: string;
  classId?: string;
  level?: string;
  isCleared: boolean;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function ManualClearance() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  const [toggling, setToggling] = useState<string | null>(null);

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

  const handleToggleClearance = async (studentId: string, currentStatus: boolean) => {
    try {
      setToggling(studentId);
      await api.post(`/finance/manual-clearance/toggle`, {
        studentId: studentId,
        session: filterSession,
        term: filterTerm,
        isCleared: !currentStatus
      });
      // Refresh the list to reflect accurate status
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to update clearance status');
    } finally {
      setToggling(null);
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

  const classOptions = filterLevel ? classes.filter(c => c.level === filterLevel) : classes;

  return (
    <div className="management-page">
      <div className="page-header" style={{ borderLeft: '4px solid #ef4444', paddingLeft: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '0 8px 8px 0' }}>
        <div>
          <h1 className="page-title text-red-600">Manual Fee Clearance (Override)</h1>
          <p className="page-subtitle text-red-500 font-bold mt-1">
            ⚠️ TEMPORARY PAGE: Use this to clear students of debt for the term if they paid before the system launched.
          </p>
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
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Primary">Primary</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
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
                <th>Current Status</th>
                <th>Action</th>
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
                    <span className={`badge ${student.isCleared ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: student.isCleared ? '#28a745' : '#dc3545', color: 'white' }}>
                      {student.isCleared ? 'Cleared' : 'Not Cleared'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`btn ${student.isCleared ? 'btn-outline' : 'btn-primary'} btn-sm`}
                      style={student.isCleared ? { color: '#dc3545', borderColor: '#dc3545' } : {}}
                      onClick={() => handleToggleClearance(student.id, student.isCleared)}
                      disabled={toggling === student.id}
                    >
                      {toggling === student.id ? 'Saving...' : student.isCleared ? 'Revoke Clearance' : 'Mark as Cleared'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
