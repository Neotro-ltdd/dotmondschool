import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { useDialog } from '../../../../context/DialogContext';
import { 
  School, 
  UserCheck, 
  UserX, 
  Users, 
  Search, 
  LayoutList, 
  LayoutGrid, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  X,
  UserPlus
} from 'lucide-react';
import './ClassAllocations.css';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  role: string;
}

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
  session: string;
  classTeacherName: string | null;
  classTeacherId?: string;
}

export default function ClassAllocations() {
  const { showAlert } = useDialog();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Search Filters
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal State for assigning
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classData, teacherData] = await Promise.all([
        api.get('/setup/classes'),
        api.get('/setup/staff')
      ]);
      setClasses(classData);
      setTeachers(teacherData);
    } catch (err: any) {
      console.error("Failed to load class allocations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const levelOrder: Record<string, number> = {
    'Senior Secondary': 1,
    'Junior Secondary': 2,
    'Upper Primary': 3,
    'Lower Primary': 4,
    'Middle Primary': 5,
    'Primary': 5,
    'Nursery 2': 6,
    'Nursery 1': 7,
    'Nursery': 8,
    'Kindergarten': 9
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
      if (['Senior Secondary', 'Junior Secondary', 'Upper Primary', 'Middle Primary', 'Lower Primary', 'Primary', 'Nursery 2', 'Nursery 1', 'Nursery'].includes(a.level)) {
        return numB - numA;
      }
      return numA - numB;
    }
    
    return (a.section || '').localeCompare(b.section || '');
  });

  // Filter Computation
  let filteredClasses = sortedClasses;
  if (levelFilter) {
    filteredClasses = filteredClasses.filter(c => c.level === levelFilter);
  }
  if (statusFilter) {
    if (statusFilter === 'assigned') {
      filteredClasses = filteredClasses.filter(c => !!c.classTeacherName);
    } else if (statusFilter === 'unassigned') {
      filteredClasses = filteredClasses.filter(c => !c.classTeacherName);
    }
  }
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredClasses = filteredClasses.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.level.toLowerCase().includes(query) ||
      (c.classTeacherName && c.classTeacherName.toLowerCase().includes(query))
    );
  }

  // Metrics
  const totalClasses = classes.length;
  const assignedCount = classes.filter(c => !!c.classTeacherName).length;
  const unassignedCount = totalClasses - assignedCount;
  const teacherPoolCount = teachers.length;

  const openAssignModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    const teacherMatch = teachers.find(t => `${t.firstName} ${t.surname}` === cls.classTeacherName);
    setSelectedTeacherId(teacherMatch ? teacherMatch.id : '');
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      await api.post(`/setup/classes/${selectedClass.id}/assign-teacher`, {
        classId: selectedClass.id,
        teacherId: selectedTeacherId || null
      });
      setShowModal(false);
      fetchData();
      showAlert('Class Form Teacher allocation updated successfully');
    } catch (err: any) {
      showAlert(err.message || 'Failed to assign class teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const getTeacherInitials = (name: string) => {
    if (!name) return 'TR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="allocations-page-container">
      {/* Header */}
      <div className="allocations-page-header">
        <div>
          <h1 className="allocations-page-title">Class Allocations</h1>
          <p className="allocations-page-subtitle">Assign and manage Form Teachers assigned to each class</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="allocations-metrics-grid">
        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">TOTAL CLASSES</span>
            <span className="metric-number">{totalClasses}</span>
          </div>
          <div className="metric-icon-badge total">
            <School size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">ASSIGNED FORM TEACHERS</span>
            <span className="metric-number">{assignedCount}</span>
          </div>
          <div className="metric-icon-badge assigned">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">UNASSIGNED CLASSES</span>
            <span className="metric-number">{unassignedCount}</span>
          </div>
          <div className="metric-icon-badge unassigned">
            <UserX size={24} />
          </div>
        </div>

        <div className="allocations-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">STAFF POOL</span>
            <span className="metric-number">{teacherPoolCount}</span>
          </div>
          <div className="metric-icon-badge staff">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="allocations-controls-card">
        <div className="allocations-search-group">
          <div className="allocations-search-box">
            <Search size={16} className="allocations-search-icon" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search class or form teacher name..."
            />
          </div>

          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)} 
            className="select-filter-input"
          >
            <option value="">All Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="select-filter-input"
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="view-mode-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <LayoutList size={16} /> Table View
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} /> Grid Cards
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B' }}>
          Loading class allocations...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B' }}>
          No classes match the selected filter criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="allocations-table-wrapper">
          <table className="executive-allocations-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Academic Level</th>
                <th>Assigned Class Form Teacher</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.id}>
                  <td>
                    <div className="class-badge-box">
                      <span className="class-main-name">{cls.name}</span>
                      <span className="class-level-subtext">{cls.section || 'General'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                      {cls.level}
                    </span>
                  </td>
                  <td>
                    {cls.classTeacherName ? (
                      <div className="teacher-profile-cell">
                        <div className="teacher-avatar">
                          {getTeacherInitials(cls.classTeacherName)}
                        </div>
                        <span className="teacher-name-title">{cls.classTeacherName}</span>
                      </div>
                    ) : (
                      <span className="unassigned-warning-pill">
                        <AlertCircle size={14} /> Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${cls.classTeacherName ? 'active' : 'inactive'}`}>
                      {cls.classTeacherName ? 'Assigned' : 'Needs Teacher'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className={`btn-assign-action ${cls.classTeacherName ? 'change' : 'new'}`}
                      onClick={() => openAssignModal(cls)}
                    >
                      <UserPlus size={15} />
                      {cls.classTeacherName ? 'Change Teacher' : 'Assign Teacher'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="allocations-grid-wrapper">
          {filteredClasses.map(cls => (
            <div key={cls.id} className="allocation-grid-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{cls.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{cls.level}</span>
                </div>
                <span className={`status-pill ${cls.classTeacherName ? 'active' : 'inactive'}`}>
                  {cls.classTeacherName ? 'Assigned' : 'Needs Teacher'}
                </span>
              </div>

              <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '0.5rem' }}>
                  Form Teacher
                </span>
                {cls.classTeacherName ? (
                  <div className="teacher-profile-cell">
                    <div className="teacher-avatar">
                      {getTeacherInitials(cls.classTeacherName)}
                    </div>
                    <span className="teacher-name-title">{cls.classTeacherName}</span>
                  </div>
                ) : (
                  <span className="unassigned-warning-pill">
                    <AlertCircle size={14} /> Unassigned
                  </span>
                )}
              </div>

              <button 
                className={`btn-assign-action ${cls.classTeacherName ? 'change' : 'new'}`}
                onClick={() => openAssignModal(cls)}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
              >
                <UserPlus size={15} />
                {cls.classTeacherName ? 'Change Form Teacher' : 'Assign Form Teacher'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SLIDE-OVER DRAWER FORM */}
      {showModal && selectedClass && (
        <div className="slideover-backdrop" onClick={() => setShowModal(false)}>
          <div className="slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="slideover-header">
              <div>
                <h2 className="slideover-title">Form Teacher Allocation</h2>
                <p className="slideover-subtitle">Assign or update form teacher for <strong>{selectedClass.name}</strong></p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="slideover-body">
                {/* Class Summary Card */}
                <div className="class-summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{selectedClass.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {selectedClass.level}
                    </span>
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748B' }}>
                    Currently Assigned: {' '}
                    {selectedClass.classTeacherName ? (
                      <strong style={{ color: '#0F172A' }}>{selectedClass.classTeacherName}</strong>
                    ) : (
                      <span style={{ color: '#D97706', fontWeight: 700 }}>Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Teacher Select Input */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                    Select Staff Member
                  </label>
                  <select 
                    className="select-filter-input"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    value={selectedTeacherId} 
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    <option value="">-- Unassigned (Remove Teacher) --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{`${t.firstName} ${t.surname}`}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Assigning a staff member will immediately update class record access and grant them Form Teacher privileges for <strong>{selectedClass.name}</strong>.</span>
                </div>
              </div>

              <div className="slideover-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
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
