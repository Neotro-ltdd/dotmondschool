import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

interface StudentAttendance {
  studentId: string;
  name: string;
  registrationNumber: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  timeIn: string | null;
  timeOut: string | null;
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
                <th>Registration No.</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(student => (
                <tr key={student.studentId}>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.registrationNumber || '-'}</td>
                  <td style={{ color: '#555', fontSize: '0.9rem' }}>{student.timeIn || '-'}</td>
                  <td style={{ color: '#555', fontSize: '0.9rem' }}>{student.timeOut || '-'}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        border: '1px solid ' + getStatusColor(student.status),
                        background: getStatusColor(student.status),
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                    >
                      {student.status}
                    </span>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'Present': return '#28a745';
    case 'Absent': return '#dc3545';
    case 'Late': return '#ffc107';
    case 'Excused': return '#17a2b8';
    default: return '#6c757d';
  }
}
