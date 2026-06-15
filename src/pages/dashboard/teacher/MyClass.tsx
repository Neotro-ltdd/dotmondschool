import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../students/Management.css'; 
import EditStudentModal from '../students/EditStudentModal';

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
  gender?: string;
  passportUrl?: string;
  status: string;
  isCleared: boolean;
}

interface MyClass {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
}

export default function MyClass() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [myClass, setMyClass] = useState<MyClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [filterTerm, setFilterTerm] = useState<string>('First Term');
  
  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  const fetchMyClassAndStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get Teacher's Classes
      const classesResponse = await api.get('/academics/teacher/my-classes');
      const classes: MyClass[] = classesResponse || [];
      
      // Find the one where they are the Class Teacher
      const classTeacherClass = classes.find(c => c.isClassTeacher);
      
      if (!classTeacherClass) {
        setMyClass(null);
        setStudents([]);
        setError("You are not assigned as a Class Teacher for any class.");
        return;
      }
      
      setMyClass(classTeacherClass);

      // Fetch students for this class
      const data = await api.get(`/setup/students?classId=${classTeacherClass.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      setStudents(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load class data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClassAndStudents();
  }, [filterSession, filterTerm]);

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

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Class</h1>
          <p className="page-subtitle">
            {myClass 
              ? `Manage students for ${myClass.level} ${myClass.name} ${myClass.section}` 
              : 'Student list for your assigned class'}
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

      {error && <div className="alert-error" style={{ marginBottom: '1rem', color: '#dc3545' }}>{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="empty-text">No students found for this class.</p>
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
                <th>Actions</th>
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
                    <button className="btn btn-primary btn-sm" onClick={() => setEditingStudent(student)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            fetchMyClassAndStudents();
          }}
        />
      )}
    </div>
  );
}
