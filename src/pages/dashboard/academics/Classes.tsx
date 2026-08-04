import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import './Classes.css';
import { useDialog } from '../../../context/DialogContext';
import { 
  BookOpen, 
  Users, 
  UserCheck, 
  Layers, 
  Search, 
  Plus, 
  X, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  LayoutGrid, 
  List, 
  AlertCircle 
} from 'lucide-react';

interface ClassItem {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isRosterApproved: boolean;
  classTeacherName: string | null;
  studentCount: number;
}

export default function Classes() {
  const { showAlert, showConfirm } = useDialog();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drawer Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    session: '2025/2026',
    level: 'Junior Secondary',
    name: '1',
    section: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await api.get('/setup/classes');
      setClasses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Close 3-dots dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/setup/classes/${formData.id}`, formData);
      } else {
        await api.post('/setup/classes', formData);
      }
      setShowModal(false);
      setIsEditing(false);
      fetchClasses();
    } catch (err: any) {
      showAlert(err.message || `Failed to ${isEditing ? 'update' : 'create'} class`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls: ClassItem) => {
    setFormData({
      id: cls.id,
      session: cls.session,
      level: cls.level,
      name: cls.name,
      section: cls.section
    });
    setIsEditing(true);
    setShowModal(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async (id: string, className: string) => {
    setOpenDropdownId(null);
    if (!await showConfirm(`Are you sure you want to delete class ${className}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/setup/classes/${id}`);
      fetchClasses();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete class');
    }
  };

  const openCreateModal = () => {
    setFormData({
      id: '',
      session: '2025/2026',
      level: 'Junior Secondary',
      name: '1',
      section: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Helper for teacher avatar initials
  const getTeacherInitials = (name: string) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Sorting hierarchy
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

  // Filter logic
  const filteredClasses = sortedClasses.filter(cls => {
    const fullClassText = `${cls.level} ${cls.name} ${cls.section} ${cls.classTeacherName || ''}`.toLowerCase();
    const matchesSearch = fullClassText.includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || cls.level === selectedLevel;
    const matchesSession = selectedSessionFilter === 'All' || cls.session === selectedSessionFilter;
    return matchesSearch && matchesLevel && matchesSession;
  });

  // Metrics
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const assignedTeachers = classes.filter(c => !!c.classTeacherName).length;
  const uniqueLevels = Array.from(new Set(classes.map(c => c.level))).length;

  const availableSessions = Array.from(new Set(classes.map(c => c.session))).filter(Boolean);

  return (
    <div className="classes-page-container">
      {/* Page Header */}
      <div className="classes-page-header">
        <div>
          <h1 className="classes-page-title">Class Management</h1>
          <p className="classes-page-subtitle">Configure class structures, form teacher assignments, and student rosters</p>
        </div>
        <button className="btn-add-class" onClick={openCreateModal}>
          <Plus size={18} /> Add New Class
        </button>
      </div>

      {/* KPI Metrics Banner */}
      <div className="classes-metrics-grid">
        <div className="classes-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Classes</span>
            <span className="metric-number">{totalClasses}</span>
          </div>
          <div className="metric-icon-badge total">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="classes-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Enrolled Students</span>
            <span className="metric-number">{totalStudents}</span>
          </div>
          <div className="metric-icon-badge students">
            <Users size={24} />
          </div>
        </div>

        <div className="classes-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Assigned Teachers</span>
            <span className="metric-number">{assignedTeachers}</span>
          </div>
          <div className="metric-icon-badge teachers">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="classes-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Academic Levels</span>
            <span className="metric-number">{uniqueLevels}</span>
          </div>
          <div className="metric-icon-badge levels">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="classes-controls-card">
        <div className="classes-search-group">
          <div className="classes-search-box">
            <Search className="classes-search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by class name or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="select-filter-input"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="All">All Academic Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          {availableSessions.length > 0 && (
            <select 
              className="select-filter-input"
              value={selectedSessionFilter}
              onChange={(e) => setSelectedSessionFilter(e.target.value)}
            >
              <option value="All">All Sessions</option>
              {availableSessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* View Switcher Toggle */}
        <div className="view-switcher-container">
          <button 
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <List size={16} /> Table View
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={16} /> Grid Cards
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Main Content Area */}
      {loading ? (
        <div className="classes-table-wrapper" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          Loading class records...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="classes-table-wrapper" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          No classes match your current search and filter criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="classes-table-wrapper" ref={dropdownRef}>
          <table className="executive-classes-table">
            <thead>
              <tr>
                <th>Academic Level</th>
                <th>Class Name</th>
                <th>Section</th>
                <th>Session</th>
                <th>Form Teacher</th>
                <th>Enrolled Students</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => {
                const fullClassName = `${cls.level} ${cls.name}`;
                const isDropdownOpen = openDropdownId === cls.id;

                return (
                  <tr key={cls.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>
                        {cls.level}
                      </span>
                    </td>
                    <td>
                      <span className="class-main-name">{cls.name}</span>
                    </td>
                    <td>
                      {cls.section ? (
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {cls.section}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                        {cls.session}
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
                      <span className="student-count-badge">
                        <Users size={13} /> {cls.studentCount} Students
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-dropdown-container">
                        <button 
                          className="btn-action-dots"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : cls.id)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isDropdownOpen && (
                          <div className="action-dropdown-menu">
                            <button 
                              className="dropdown-action-item" 
                              onClick={() => handleEdit(cls)}
                            >
                              <Edit3 size={15} color="#000080" /> Edit Class Details
                            </button>
                            <div className="dropdown-divider" />
                            <button 
                              className="dropdown-action-item danger" 
                              onClick={() => handleDelete(cls.id, fullClassName)}
                            >
                              <Trash2 size={15} /> Delete Class
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="classes-grid-wrapper" ref={dropdownRef}>
          {filteredClasses.map(cls => {
            const fullClassName = `${cls.level} ${cls.name}`;
            const isDropdownOpen = openDropdownId === cls.id;

            return (
              <div key={cls.id} className="class-grid-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{cls.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{cls.level}</span>
                  </div>
                  
                  <div className="action-dropdown-container">
                    <button 
                      className="btn-action-dots"
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : cls.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {isDropdownOpen && (
                      <div className="action-dropdown-menu">
                        <button 
                          className="dropdown-action-item" 
                          onClick={() => handleEdit(cls)}
                        >
                          <Edit3 size={15} color="#000080" /> Edit Class Details
                        </button>
                        <div className="dropdown-divider" />
                        <button 
                          className="dropdown-action-item danger" 
                          onClick={() => handleDelete(cls.id, fullClassName)}
                        >
                          <Trash2 size={15} /> Delete Class
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {cls.section && (
                    <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                      Section: {cls.section}
                    </span>
                  )}
                  <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {cls.session}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                  <span className="student-count-badge">
                    <Users size={13} /> {cls.studentCount} Students
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER DRAWER FORM FOR ADD / EDIT CLASS */}
      {showModal && (
        <div className="class-slideover-backdrop" onClick={() => setShowModal(false)}>
          <div className="class-slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="class-slideover-header">
              <div>
                <h2 className="class-slideover-title">
                  {isEditing ? 'Edit Class Details' : 'Add New Class'}
                </h2>
                <p className="class-slideover-subtitle">
                  {isEditing ? 'Update academic level and section details' : 'Configure a new class room structure for the school'}
                </p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="class-slideover-body">
                {/* Academic Session */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Academic Session <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="session" 
                    value={formData.session} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g. 2025/2026"
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Level Select */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Academic Level <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <select 
                    name="level" 
                    value={formData.level} 
                    onChange={handleInputChange} 
                    required 
                    className="select-filter-input"
                    style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem', borderRadius: '10px' }}
                  >
                    <option value="Senior Secondary">Senior Secondary</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Upper Primary">Upper Primary</option>
                    <option value="Lower Primary">Lower Primary</option>
                    <option value="Middle Primary">Middle Primary</option>
                    <option value="Nursery 2">Nursery 2</option>
                    <option value="Nursery 1">Nursery 1</option>
                    <option value="Kindergarten">Kindergarten</option>
                  </select>
                </div>

                {/* Class Name */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Class Name / Number <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g. SS 1, JSS 2, PRIMARY 3"
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Section */}
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Section (Optional)
                  </label>
                  <input 
                    type="text" 
                    name="section" 
                    value={formData.section} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Gold, A, Science Track"
                    style={{ width: '100%', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Creating or modifying a class will immediately make it available for student enrollments and form teacher assignments across the school portal.</span>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="class-slideover-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
