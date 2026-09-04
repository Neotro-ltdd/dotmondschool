import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import './SubjectAllocations.css';
import { useDialog } from '../../../../context/DialogContext';
import {
  BookOpen,
  Users,
  UserCheck,
  AlertCircle,
  Search,
  X,
  UserPlus,
  List,
  LayoutGrid,
  GraduationCap,
} from 'lucide-react';

import { useAuth } from '../../../../context/AuthContext';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  role: string;
}

interface SubjectItem {
  subjectId: string;
  subjectName: string;
  assignedTeacher: {
    teacherId: string;
    teacherName: string;
  } | null;
}

interface ClassAllocationItem {
  classId: string;
  className: string;
  level: string;
  subjects: SubjectItem[];
}

export default function SubjectAllocations() {
  const { showAlert } = useDialog();
  const { userRole } = useAuth();
  const isReadOnly = userRole === 'Chairman';

  const [allocations, setAllocations] = useState<ClassAllocationItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Slide-Over Drawer State
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = levelFilter ? `?level=${encodeURIComponent(levelFilter)}` : '';
      const [allocData, teacherData] = await Promise.all([
        api.get(`/academics/subject-allocations${query}`),
        api.get('/setup/staff'),
      ]);
      setAllocations(allocData);
      setTeachers(teacherData.filter((t: any) => t.isActive !== false));

      // Auto-select first class if none selected or if level changes
      if (allocData.length > 0) {
        if (!selectedClassId || !allocData.find((c: any) => c.classId === selectedClassId)) {
          setSelectedClassId(allocData[0].classId);
        }
      } else {
        setSelectedClassId('');
      }
    } catch (err: any) {
      console.error('Failed to load subject allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [levelFilter]);

  const activeClass = allocations.find((c) => c.classId === selectedClassId);
  const isPrimaryOrNursery =
    levelFilter.toLowerCase().includes('primary') ||
    levelFilter.toLowerCase().includes('nursery') ||
    levelFilter.toLowerCase().includes('kindergarten');

  const openAssignModal = (sub: SubjectItem) => {
    setSelectedSubject(sub);
    setSelectedTeacherId(sub.assignedTeacher?.teacherId || '');
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !selectedSubject) return;

    try {
      setSubmitting(true);
      await api.post('/academics/subject-allocations', {
        classId: activeClass.classId,
        subjectId: selectedSubject.subjectId,
        teacherId: selectedTeacherId || null,
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to assign subject teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const getTeacherInitials = (name: string) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Filtered subjects inside active class roster
  const rawSubjects = activeClass?.subjects || [];
  const filteredSubjects = [...rawSubjects]
    .filter((sub) => {
      const teacherName = sub.assignedTeacher?.teacherName || '';
      const text = `${sub.subjectName} ${teacherName}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  // Global Metrics
  const totalClassesCount = allocations.length;
  const activeClassSubjectsCount = activeClass?.subjects.length || 0;
  const activeClassAssignedCount =
    activeClass?.subjects.filter((s) => !!s.assignedTeacher).length || 0;
  const activeClassUnassignedCount = activeClassSubjectsCount - activeClassAssignedCount;

  return (
    <div className="allocations-page-container">
      {/* Page Header */}
      <div className="allocations-page-header">
        <div>
          <h1 className="allocations-page-title">Subject Allocations</h1>
          <p className="allocations-page-subtitle">
            Assign specialized subject teachers to class rosters across departments
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="allocations-metrics-grid">
        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Classes Configured</span>
            <span className="metric-number">{totalClassesCount}</span>
          </div>
          <div className="metric-icon-badge classes">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Roster Subjects</span>
            <span className="metric-number">{activeClassSubjectsCount}</span>
          </div>
          <div className="metric-icon-badge subjects">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Assigned Teachers</span>
            <span className="metric-number">{activeClassAssignedCount}</span>
          </div>
          <div className="metric-icon-badge assigned">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Unassigned Subjects</span>
            <span className="metric-number">{activeClassUnassignedCount}</span>
          </div>
          <div className="metric-icon-badge unassigned">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Search & Control Card */}
      <div className="subject-alloc-controls-card">
        <div className="subject-alloc-search-group">
          <div className="subject-alloc-search-box">
            <Search className="subject-alloc-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search subject or teacher name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="select-filter-input"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Academic Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          {allocations.length > 0 && (
            <select
              className="select-filter-input"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {allocations.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Switcher Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <List size={16} /> Table View
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={16} /> Grid Cards
          </button>
        </div>
      </div>

      {/* Main Roster Area */}
      {loading ? (
        <div
          className="subject-alloc-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          Loading class subject allocations...
        </div>
      ) : allocations.length === 0 ? (
        <div
          className="subject-alloc-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          Please select an academic level with configured classes.
        </div>
      ) : isPrimaryOrNursery ? (
        <div
          className="subject-alloc-table-wrapper"
          style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#334155' }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👩‍🏫</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
            Managed by Form / Class Teacher
          </h2>
          <p
            style={{
              maxWidth: '520px',
              margin: '0.5rem auto 0',
              color: '#64748B',
              fontSize: '0.92rem',
              lineHeight: 1.6,
            }}
          >
            Primary and Nursery classes use form-teacher subject management. The assigned{' '}
            <strong>Class Teacher</strong> automatically conducts all subjects for this class room.
          </p>
        </div>
      ) : activeClass ? (
        viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="subject-alloc-table-wrapper">
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {activeClass.className} Subject Roster
              </h2>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: '#EFF6FF',
                  color: '#1E40AF',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                }}
              >
                {filteredSubjects.length} Subjects Configured
              </span>
            </div>

            <table className="executive-subject-alloc-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Assigned Subject Teacher</th>
                  <th>Allocation Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}
                    >
                      No subjects match your active search filter in this class roster.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((sub) => (
                    <tr key={sub.subjectId}>
                      <td>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                          {sub.subjectName}
                        </span>
                      </td>
                      <td>
                        {sub.assignedTeacher ? (
                          <div className="teacher-profile-cell">
                            <div className="teacher-avatar">
                              {getTeacherInitials(sub.assignedTeacher.teacherName)}
                            </div>
                            <span className="teacher-name-title">
                              {sub.assignedTeacher.teacherName}
                            </span>
                          </div>
                        ) : (
                          <span className="unassigned-warning-pill">
                            <AlertCircle size={14} /> Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${sub.assignedTeacher ? 'active' : 'inactive'}`}
                        >
                          <span
                            className={sub.assignedTeacher ? 'status-dot' : 'status-dot-inactive'}
                          ></span>
                          {sub.assignedTeacher ? 'Assigned' : 'Needs Teacher'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!isReadOnly && (
                          <button
                            className={`btn-assign-action ${sub.assignedTeacher ? 'change' : 'new'}`}
                            onClick={() => openAssignModal(sub)}
                          >
                            <UserPlus size={15} />
                            {sub.assignedTeacher ? 'Change Teacher' : 'Assign Teacher'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="subject-alloc-grid-wrapper">
            {filteredSubjects.map((sub) => (
              <div key={sub.subjectId} className="subject-alloc-grid-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    {sub.subjectName}
                  </h3>
                  <span className={`status-pill ${sub.assignedTeacher ? 'active' : 'inactive'}`}>
                    {sub.assignedTeacher ? 'Assigned' : 'Needs Teacher'}
                  </span>
                </div>

                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: '#64748B',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Subject Teacher
                  </span>
                  {sub.assignedTeacher ? (
                    <div className="teacher-profile-cell">
                      <div className="teacher-avatar">
                        {getTeacherInitials(sub.assignedTeacher.teacherName)}
                      </div>
                      <span className="teacher-name-title">{sub.assignedTeacher.teacherName}</span>
                    </div>
                  ) : (
                    <span className="unassigned-warning-pill">
                      <AlertCircle size={14} /> Unassigned
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <button
                    className={`btn-assign-action ${sub.assignedTeacher ? 'change' : 'new'}`}
                    onClick={() => openAssignModal(sub)}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  >
                    <UserPlus size={15} />
                    {sub.assignedTeacher ? 'Change Subject Teacher' : 'Assign Subject Teacher'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* SLIDE-OVER DRAWER FORM FOR SUBJECT TEACHER ALLOCATION */}
      {showModal && activeClass && selectedSubject && (
        <div className="subject-alloc-slideover-backdrop" onClick={() => setShowModal(false)}>
          <div className="subject-alloc-slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="subject-alloc-slideover-header">
              <div>
                <h2 className="subject-alloc-slideover-title">Subject Teacher Allocation</h2>
                <p className="subject-alloc-slideover-subtitle">
                  Assign or update subject teacher for <strong>{activeClass.className}</strong>
                </p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAssign}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div className="subject-alloc-slideover-body">
                {/* Subject & Class Summary Card */}
                <div className="class-summary-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                      {selectedSubject.subjectName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                      }}
                    >
                      {activeClass.className}
                    </span>
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748B' }}>
                    Currently Assigned:{' '}
                    {selectedSubject.assignedTeacher ? (
                      <strong style={{ color: '#0F172A' }}>
                        {selectedSubject.assignedTeacher.teacherName}
                      </strong>
                    ) : (
                      <span style={{ color: '#D97706', fontWeight: 700 }}>Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Teacher Select Input */}
                <div className="form-group">
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Select Staff Member
                  </label>
                  <select
                    className="select-filter-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                    }}
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">-- Unassigned (Remove Teacher) --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{`${t.firstName} ${t.surname}`}</option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.82rem',
                    color: '#64748B',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle
                    size={16}
                    color="#3B82F6"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span>
                    Assigning a teacher to <strong>{selectedSubject.subjectName}</strong> grants
                    them score entry privileges for <strong>{activeClass.className}</strong>.
                  </span>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="subject-alloc-slideover-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
