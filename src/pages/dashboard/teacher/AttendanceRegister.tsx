import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

interface StudentAttendance {
  studentId: string;
  name: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks: string;
}

interface MyClass {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
}

export default function AttendanceRegister() {
  const [myClass, setMyClass] = useState<MyClass | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState<string>('First Term');

  const fetchClassAndAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get Teacher's Classes
      const classesResponse = await api.get('/academics/teacher/my-classes');
      const classes: MyClass[] = classesResponse || [];
      const classTeacherClass = classes.find(c => c.isClassTeacher);
      
      if (!classTeacherClass) {
        setMyClass(null);
        setAttendance([]);
        setError("You are not assigned as a Class Teacher for any class.");
        return;
      }
      
      setMyClass(classTeacherClass);

      // Fetch attendance
      const data = await api.get(`/academics/classes/${classTeacherClass.id}/attendance?date=${date}`);
      setAttendance(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAndAttendance();
  }, [date]);

  const handleStatusChange = (studentId: string, status: any) => {
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, remarks } : a));
  };

  const handleMarkAll = (status: any) => {
    setAttendance(prev => prev.map(a => ({ ...a, status })));
  };

  const handleSaveAttendance = async () => {
    if (!myClass) return;
    try {
      setSaving(true);
      await api.post(`/academics/classes/${myClass.id}/attendance`, {
        classId: myClass.id,
        date: date,
        term: term,
        students: attendance
      });
      alert('Attendance saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Register</h1>
          <p className="page-subtitle">
            {myClass 
              ? `Mark daily attendance for ${myClass.level} ${myClass.name} ${myClass.section}` 
              : 'Daily attendance management'}
          </p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">Date:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="form-control" 
            max={new Date().toISOString().split('T')[0]}
            style={{ backgroundColor: '#f0f8ff', borderRadius: '12px', border: '1px solid #cce0ff', padding: '0.6rem 1rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">Term:</label>
          <select 
            value={term} 
            onChange={(e) => setTerm(e.target.value)} 
            className="form-control"
            style={{ backgroundColor: '#f0f8ff', borderRadius: '12px', border: '1px solid #cce0ff', padding: '0.6rem 1rem' }}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={() => handleMarkAll('Present')} disabled={!myClass || loading}>
            Mark All Present
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem', color: '#dc3545' }}>{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading attendance roster...</p>
        ) : attendance.length === 0 ? (
          <p className="empty-text">No students found for this class.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Status</th>
                <th>Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(student => (
                <tr key={student.studentId}>
                  <td><strong>{student.name}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.studentId, status)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            border: '1px solid ' + (student.status === status ? getStatusColor(status) : '#ccc'),
                            background: student.status === status ? getStatusColor(status) : 'transparent',
                            color: student.status === status ? '#fff' : '#666',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={student.remarks} 
                      onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                      placeholder="Add note..."
                      style={{ backgroundColor: '#f0f8ff', borderRadius: '12px', border: '1px solid #cce0ff', padding: '0.5rem 1rem', width: '100%' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {myClass && attendance.length > 0 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAttendance} 
            disabled={saving}
            style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Present': return '#28a745';
    case 'Absent': return '#dc3545';
    case 'Late': return '#ffc107';
    case 'Excused': return '#17a2b8';
    default: return '#6c757d';
  }
}
