import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  School,
  Search,
  Calendar,
  BookOpen,
  Edit,
  GraduationCap,
  List,
  Grid,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import '../students/Students.css';
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
  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();

  // View & Filter UI state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [selectedSubjectClassId, setSelectedSubjectClassId] = useState<string>('');

  // 1. Fetch teacher's assigned classes (Form Class & Subject Classes)
  const {
    data: teacherClasses = [],
    isLoading: isClassesLoading,
    error: classesError,
  } = useQuery<MyClassData[]>({
    queryKey: ['myTeacherClassesAll'],
    queryFn: async () => {
      const response = await api.get('/academics/teacher/my-classes');
      return response || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Resolve mode & active class
  const formClass = teacherClasses.find((c) => c.isClassTeacher) || null;
  const subjectClasses = teacherClasses.filter(
    (c) => !c.isClassTeacher && c.mySubjects && c.mySubjects.length > 0,
  );

  const isFormClassTeacher = !!formClass;
  const activeClass =
    formClass ||
    (selectedSubjectClassId
      ? teacherClasses.find((c) => c.id === selectedSubjectClassId) || subjectClasses[0] || null
      : subjectClasses[0] || null);

  // 2. Fetch class students for activeClass
  const {
    data: students = [],
    isLoading: isStudentsLoading,
    error: studentsError,
  } = useQuery<StudentItem[]>({
    queryKey: ['myClassStudents', activeClass?.id, filterSession, filterTerm],
    queryFn: async () => {
      if (!activeClass?.id) return [];
      const data = await api.get(
        `/setup/students?classId=${activeClass.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );
      return data || [];
    },
    enabled: !!activeClass?.id,
    staleTime: 30 * 1000,
  });

  const loading = isClassesLoading || isStudentsLoading;
  const errorMsg = classesError?.message || studentsError?.message;

  // Filter logic
  let filteredStudents = students;
  if (filterSearch.trim()) {
    const searchLower = filterSearch.toLowerCase().trim();
    filteredStudents = filteredStudents.filter(
      (s) =>
        s.surname?.toLowerCase().includes(searchLower) ||
        s.firstName?.toLowerCase().includes(searchLower) ||
        s.otherNames?.toLowerCase().includes(searchLower) ||
        s.registrationNumber?.toLowerCase().includes(searchLower),
    );
  }

  // Summary Metrics matching Image 1
  const totalCount = students.length;
  const clearedCount = students.filter((s) => s.isCleared).length;
  const pendingCount = totalCount - clearedCount;

  // Student Initials Avatar Generator
  const getInitials = (surname?: string, firstName?: string) => {
    const s = (surname || '').trim()[0] || '';
    const f = (firstName || '').trim()[0] || '';
    return `${s}${f}`.toUpperCase() || 'ST';
  };

  return (
    <div className="students-page-container">
      {/* Page Header (Matching Image 1 layout without creation buttons) */}
      <div className="students-page-header">
        <div>
          <h1 className="students-page-title">
            {isFormClassTeacher ? 'My Class Management' : 'My Subjects Management'}
          </h1>
          <p className="students-page-subtitle">
            {isFormClassTeacher
              ? `Assigned Class Teacher for ${formClass?.level || ''} ${formClass?.name || ''} ${formClass?.section || ''}`.trim()
              : activeClass
                ? `Subject Teacher Workstation • ${activeClass.level || ''} ${activeClass.name || ''} ${activeClass.section || ''}`.trim()
                : 'Manage student enrollment, class placements, clearance status, and credentials'}
          </p>
        </div>
      </div>

      {/* Top 4 Metrics Cards (Matching Image 1 grid & circular icon badges) */}
      <div className="students-metrics-grid">
        <div className="students-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">TOTAL STUDENTS</span>
            <span className="metric-number">{totalCount}</span>
          </div>
          <div className="metric-icon-badge total">
            <Users size={24} />
          </div>
        </div>

        <div className="students-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">CLEARED STUDENTS</span>
            <span className="metric-number">{clearedCount}</span>
          </div>
          <div className="metric-icon-badge cleared">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="students-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">NOT CLEARED</span>
            <span className="metric-number">{pendingCount}</span>
          </div>
          <div className="metric-icon-badge pending">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="students-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">CLASSES & LEVELS</span>
            <span
              className="metric-number"
              style={{
                fontSize: activeClass ? '1.25rem' : '1.85rem',
                marginTop: activeClass ? '0.4rem' : '0.25rem',
              }}
            >
              {activeClass ? `${activeClass.name} ${activeClass.section}` : '1'}
            </span>
          </div>
          <div className="metric-icon-badge classes">
            <School size={24} />
          </div>
        </div>
      </div>

      {/* Floating Search & Filter Toolbar (Matching Image 1 floating card) */}
      <div className="students-controls-card">
        <div className="search-filter-group">
          {/* Search Box */}
          <div className="students-search-box">
            <Search size={16} className="students-search-icon" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search by name or reg. number..."
            />
          </div>

          {/* Subject Class Selector (if multiple classes) */}
          {!isFormClassTeacher && subjectClasses.length > 1 && (
            <select
              value={activeClass?.id || ''}
              onChange={(e) => setSelectedSubjectClassId(e.target.value)}
              className="select-filter-input"
              style={{
                fontWeight: 600,
                color: '#1E40AF',
                background: '#EFF6FF',
                borderColor: '#BFDBFE',
              }}
            >
              {subjectClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.level} {c.name} {c.section}
                </option>
              ))}
            </select>
          )}

          {/* Session Dropdown */}
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="select-filter-input"
          >
            {getSessionOptions(filterSession).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Term Dropdown */}
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="select-filter-input"
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="view-mode-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <List size={16} /> Table View
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} /> Grid Cards
          </button>
        </div>
      </div>

      {/* System Warning/Notice Display */}
      {errorMsg && (
        <div
          style={{
            padding: '1.25rem',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>System Notice</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !activeClass && !errorMsg && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            textAlign: 'center',
            padding: '3.5rem 2rem',
            color: '#64748B',
          }}
        >
          <Users size={48} style={{ margin: '0 auto 1rem', color: '#94A3B8' }} />
          <h3
            style={{
              fontSize: '1.2rem',
              color: '#0F172A',
              marginBottom: '0.5rem',
              fontWeight: 800,
            }}
          >
            No Class or Subject Assigned
          </h3>
          <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
            You are not currently assigned as a Class Teacher or Subject Teacher for any active
            class. Please contact your School Administrator for allocation.
          </p>
        </div>
      )}

      {/* DATA VIEW AREA */}
      {activeClass && (
        <>
          {loading ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '3.5rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1rem', color: '#64748B', fontWeight: 600 }}>
                Loading student directory...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '3.5rem 1rem',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              <Users size={40} style={{ margin: '0 auto 0.75rem', color: '#CBD5E1' }} />
              <h4 style={{ color: '#0F172A', margin: '0 0 0.25rem', fontWeight: 800 }}>
                No Students Found
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                No student records match your active search query or term criteria.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW (Matching Image 1 layout & typography) */
            <div className="students-table-wrapper">
              <table className="executive-students-table">
                <thead>
                  <tr>
                    <th>REGISTRATION NO.</th>
                    <th>STUDENT PROFILE</th>
                    <th>CLASS</th>
                    <th>PARENT CONTACT</th>
                    <th>CLEARANCE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const initials = getInitials(student.surname, student.firstName);
                    return (
                      <tr key={student.id}>
                        <td
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#0F172A',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {student.registrationNumber || 'Pending'}
                        </td>
                        <td>
                          <div className="student-profile-cell">
                            <div className="student-avatar">{initials}</div>
                            <div className="student-name-box">
                              <span className="student-full-name">
                                {student.surname} {student.firstName}
                              </span>
                              <span className="student-other-names">
                                {student.otherNames || ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              display: 'inline-block',
                            }}
                          >
                            {student.className || activeClass.name}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              fontSize: '0.82rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#475569',
                              }}
                            >
                              <Mail size={13} style={{ color: '#94A3B8' }} />
                              {student.parentEmail || 'No email provided'}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#64748B',
                              }}
                            >
                              <Phone size={13} style={{ color: '#94A3B8' }} />
                              {student.parentPhoneNumber || 'No phone number'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`clearance-pill ${student.isCleared ? 'cleared' : 'not-cleared'}`}
                          >
                            {student.isCleared ? (
                              <ShieldCheck size={13} />
                            ) : (
                              <ShieldAlert size={13} />
                            )}
                            {student.isCleared ? 'Cleared' : 'Not Cleared'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${student.status === 'Active' ? 'active' : 'inactive'}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-add-student"
                            style={{
                              padding: '0.45rem 0.9rem',
                              fontSize: '0.82rem',
                              boxShadow: 'none',
                              borderRadius: '8px',
                              background: '#2563EB',
                            }}
                            onClick={() => setEditingStudent(student)}
                          >
                            <Edit size={14} /> Edit student
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredStudents.map((student) => {
                const initials = getInitials(student.surname, student.firstName);
                return (
                  <div
                    key={student.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div className="student-profile-cell">
                        <div
                          className="student-avatar"
                          style={{ width: '44px', height: '44px', fontSize: '0.95rem' }}
                        >
                          {initials}
                        </div>
                        <div>
                          <strong
                            style={{ color: '#0F172A', fontSize: '0.95rem', display: 'block' }}
                          >
                            {student.surname} {student.firstName}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748B',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                            }}
                          >
                            {student.registrationNumber || 'Pending'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`clearance-pill ${student.isCleared ? 'cleared' : 'not-cleared'}`}
                      >
                        {student.isCleared ? 'Cleared' : 'Not Cleared'}
                      </span>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid #F1F5F9',
                        borderBottom: '1px solid #F1F5F9',
                        padding: '0.75rem 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#475569',
                        }}
                      >
                        <Mail size={13} style={{ color: '#94A3B8' }} />{' '}
                        {student.parentEmail || 'No email provided'}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#64748B',
                        }}
                      >
                        <Phone size={13} style={{ color: '#94A3B8' }} />{' '}
                        {student.parentPhoneNumber || 'No phone number'}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          background: '#F1F5F9',
                          color: '#334155',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        {student.className || activeClass.name}
                      </span>

                      <button
                        className="btn-add-student"
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          background: '#2563EB',
                          boxShadow: 'none',
                        }}
                        onClick={() => setEditingStudent(student)}
                      >
                        <Edit size={13} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* EDIT STUDENT MODAL */}
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
