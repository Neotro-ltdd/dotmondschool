import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Calendar, 
  BookOpen, 
  Edit, 
  GraduationCap,
  XCircle
} from 'lucide-react';
import '../students/Management.css'; 
import '../Dashboard.css';
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
  departmentTrack?: string;
  status: string;
  isCleared: boolean;
}

interface SubjectItem {
  id: string;
  name: string;
}

interface MyClassData {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
  mySubjects?: SubjectItem[];
}

export default function MyClass() {
  const queryClient = useQueryClient();
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();
  
  // Local interface UI state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [selectedSubjectClassId, setSelectedSubjectClassId] = useState<string>('');

  // 1. Fetch teacher's assigned classes (Form Class & Subject Classes)
  const { 
    data: teacherClasses = [], 
    isLoading: isClassesLoading, 
    error: classesError 
  } = useQuery<MyClassData[]>({
    queryKey: ['myTeacherClassesAll'],
    queryFn: async () => {
      const response = await api.get('/academics/teacher/my-classes');
      return response || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Resolve mode & active class
  const formClass = teacherClasses.find(c => c.isClassTeacher) || null;
  const subjectClasses = teacherClasses.filter(c => !c.isClassTeacher && c.mySubjects && c.mySubjects.length > 0);

  const isFormClassTeacher = !!formClass;
  const activeClass = formClass || (selectedSubjectClassId 
    ? teacherClasses.find(c => c.id === selectedSubjectClassId) || subjectClasses[0] || null
    : subjectClasses[0] || null);

  // 2. Dependent query: fetch class students for activeClass
  const { 
    data: students = [], 
    isLoading: isStudentsLoading, 
    error: studentsError 
  } = useQuery<StudentItem[]>({
    queryKey: ['myClassStudents', activeClass?.id, filterSession, filterTerm],
    queryFn: async () => {
      if (!activeClass?.id) return [];
      const data = await api.get(`/setup/students?classId=${activeClass.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      return data || [];
    },
    enabled: !!activeClass?.id,
    staleTime: 30 * 1000,
  });

  const loading = isClassesLoading || isStudentsLoading;
  const errorMsg = classesError?.message || studentsError?.message;

  // Filter logic on cached records
  let filteredStudents = students;
  if (filterSearch.trim()) {
    const searchLower = filterSearch.toLowerCase().trim();
    filteredStudents = filteredStudents.filter(s => 
      s.surname?.toLowerCase().includes(searchLower) ||
      s.firstName?.toLowerCase().includes(searchLower) ||
      s.otherNames?.toLowerCase().includes(searchLower) ||
      s.registrationNumber?.toLowerCase().includes(searchLower)
    );
  }

  // Summary Metrics for STAT Cards
  const totalStudents = students.length;
  const clearedCount = students.filter(s => s.isCleared).length;
  const unclearedCount = totalStudents - clearedCount;

  const activeSubjectsLabel = activeClass?.mySubjects && activeClass.mySubjects.length > 0 
    ? activeClass.mySubjects.map(s => s.name).join(', ')
    : '';

  return (
    <div className="management-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="stat-icon-square" style={{ background: isFormClassTeacher ? '#e0f2fe' : '#fef3c7', color: isFormClassTeacher ? '#0284c7' : '#d97706', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFormClassTeacher ? <GraduationCap size={28} /> : <BookOpen size={28} />}
        </div>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {isFormClassTeacher ? 'My Class Management' : 'My Subjects Management'}
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0' }}>
            {isFormClassTeacher
              ? `Assigned Class Teacher for ${formClass?.level} ${formClass?.name} ${formClass?.section}`
              : activeClass
                ? `Subject Teacher Workstation • ${activeSubjectsLabel ? `${activeSubjectsLabel} (${activeClass.level} ${activeClass.name} ${activeClass.section})` : `${activeClass.level} ${activeClass.name} ${activeClass.section}`}`
                : 'Subject teacher overview and assigned class student roster'}
          </p>
        </div>
      </div>

      {/* Subject Selector Pills for Subject Teachers teaching multiple classes */}
      {!isFormClassTeacher && subjectClasses.length > 1 && (
        <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Allocated Classes:
          </span>
          {subjectClasses.map(c => {
            const isSelected = (activeClass?.id === c.id);
            const subjectsText = c.mySubjects ? c.mySubjects.map(s => s.name).join(', ') : '';
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedSubjectClassId(c.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #d97706' : '1px solid #cbd5e1',
                  background: isSelected ? '#fffbeb' : '#ffffff',
                  color: isSelected ? '#b45309' : '#334155',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 2px 4px rgba(217, 119, 6, 0.12)' : 'none'
                }}
              >
                {subjectsText ? `${subjectsText} — ${c.level} ${c.name} ${c.section}` : `${c.level} ${c.name} ${c.section}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Summary Statistical Cards */}
      {activeClass && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Total Enrollment</p>
              <div className="stat-icon-square" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <Users size={20} />
              </div>
            </div>
            <div className="stat-value-container">
              <h3 className="stat-value">{totalStudents}</h3>
              <span className="trend-text" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Enrolled in {activeClass.name} {activeClass.section}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Cleared Students</p>
              <div className="stat-icon-square" style={{ background: '#dcfce7', color: '#15803d' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="stat-value-container">
              <h3 className="stat-value" style={{ color: '#15803d' }}>{clearedCount}</h3>
              <span className="trend-pill positive" style={{ marginLeft: '0.5rem' }}>
                {totalStudents > 0 ? Math.round((clearedCount / totalStudents) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Pending Clearance</p>
              <div className="stat-icon-square" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="stat-value-container">
              <h3 className="stat-value" style={{ color: '#b91c1c' }}>{unclearedCount}</h3>
              <span className="trend-text" style={{ fontSize: '0.85rem', color: '#64748b' }}>Requires attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 2, minWidth: '260px', position: 'relative' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
            <Search size={15} /> Search Student Directory
          </label>
          <input 
            type="text" 
            value={filterSearch} 
            onChange={(e) => setFilterSearch(e.target.value)} 
            className="filter-select" 
            style={{ width: '100%', paddingLeft: '1rem' }}
            placeholder="Search by student name or registration number..."
          />
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
            <Calendar size={15} /> Session
          </label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select" style={{ width: '100%' }}>
            {getSessionOptions(filterSession).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
            <BookOpen size={15} /> Term
          </label>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="filter-select" style={{ width: '100%' }}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {/* Error Displays */}
      {errorMsg && (
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', color: '#be123c', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>System Notice</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Empty State when teacher has neither class nor subject assigned */}
      {!loading && !activeClass && !errorMsg && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Class or Subject Assigned</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto' }}>You are not currently assigned as a Class Teacher or Subject Teacher for any class in the system. If you believe this is an error, please contact your School Admin.</p>
        </div>
      )}

      {/* Table Data Section */}
      {activeClass && (
        <div className="table-container glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="loading-text" style={{ fontSize: '1rem', color: '#64748b' }}>Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <Users size={40} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
              <h4 style={{ color: '#334155', margin: '0 0 0.25rem' }}>No Students Matching Criteria</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>No enrolled student records found matching your current search or term selection.</p>
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Registration No.</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Student Name</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Class</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Parent Contact</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Clearance</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                      {student.registrationNumber || 'Pending'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{student.surname} {student.firstName}</div>
                      <div className="text-muted" style={{ fontSize: '0.82rem', color: '#64748b' }}>{student.otherNames || ''}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', display: 'inline-block', marginRight: '0.4rem' }}>
                        {student.className || 'Unassigned'}
                      </span>
                      {student.departmentTrack && student.departmentTrack !== 'General' && (
                        <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', display: 'inline-block' }}>
                          {student.departmentTrack}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.88rem' }}>
                      <div style={{ color: '#334155' }}>{student.parentEmail || 'No email provided'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: student.parentPhoneNumber ? 'normal' : 'italic' }}>
                        {student.parentPhoneNumber || 'No phone number'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          padding: '0.35rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: 600,
                          backgroundColor: student.isCleared ? '#dcfce7' : '#fee2e2', 
                          color: student.isCleared ? '#166534' : '#991b1b',
                          border: `1px solid ${student.isCleared ? '#86efac' : '#fca5a5'}`
                        }}
                      >
                        {student.isCleared ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {student.isCleared ? 'Cleared' : 'Not Cleared'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: 600,
                          backgroundColor: student.status === 'Active' ? '#f0fdf4' : '#fef9c3', 
                          color: student.status === 'Active' ? '#15803d' : '#854d0e' 
                        }}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', borderRadius: '6px', fontWeight: 500 }}
                        onClick={() => setEditingStudent(student)}
                      >
                        <Edit size={14} />
                        Edit student
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            setEditingStudent(null);
            queryClient.invalidateQueries({ queryKey: ['myClassStudents', activeClass?.id] });
          }}
        />
      )}
    </div>
  );
}
