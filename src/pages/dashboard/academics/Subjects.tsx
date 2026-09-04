import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import './Subjects.css';
import { useDialog } from '../../../context/DialogContext';
import {
  BookOpen,
  Layers,
  CheckCircle,
  FolderTree,
  Search,
  Plus,
  X,
  MoreVertical,
  Edit3,
  Trash2,
  List,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';

interface SubjectItem {
  id: string;
  name: string;
  category: string;
  subjectTeacherName?: string;
  isLocked: boolean;
  isParent?: boolean;
  parentSubjectId?: string | null;
  departmentTrack?: string;
}

import { useAuth } from '../../../context/AuthContext';

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function Subjects() {
  const { showAlert, showConfirm } = useDialog();
  const { userRole } = useAuth();
  const isReadOnly = userRole === 'Chairman';

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drawer Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    level: '',
    isParent: false,
    parentSubjectId: '',
    departmentTrack: 'General',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const endpoint = filterLevel
        ? `/academics/subjects?level=${encodeURIComponent(filterLevel)}`
        : '/academics/subjects';
      const data = await api.get(endpoint);
      setSubjects(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err: any) {
      console.error('Failed to fetch classes for dropdown');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [filterLevel]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // SAFETY: document mousedown targets are always DOM Nodes (Element/Text), so the EventTarget narrows to Node here.
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // SAFETY: only HTMLInputElement in this handler's element union can have type 'checkbox', so the checked branch target is the checkbox input.
    const value =
      e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        id: isEditing ? formData.id : undefined,
        name: formData.name,
        code: '',
        category: formData.level,
        isParent: formData.isParent,
        parentSubjectId: formData.parentSubjectId || null,
        departmentTrack: formData.departmentTrack || 'General',
      };

      if (isEditing) {
        await api.put(`/academics/subjects/${formData.id}`, payload);
      } else {
        await api.post('/academics/subjects', payload);
      }
      setShowModal(false);
      setFormData({
        id: '',
        name: '',
        level: formData.level,
        isParent: false,
        parentSubjectId: '',
        departmentTrack: 'General',
      });
      fetchSubjects();
    } catch (err: any) {
      showAlert(err.message || `Failed to ${isEditing ? 'update' : 'create'} subject`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (subject: SubjectItem) => {
    setOpenDropdownId(null);
    setFormData({
      id: subject.id,
      name: subject.name,
      level: subject.category,
      isParent: subject.isParent || false,
      parentSubjectId: subject.parentSubjectId || '',
      departmentTrack: subject.departmentTrack || 'General',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string, subjectName: string) => {
    setOpenDropdownId(null);
    if (
      !(await showConfirm(
        `Are you sure you want to delete ${subjectName}? This cannot be undone if scores are attached.`,
      ))
    )
      return;
    try {
      setSubmitting(true);
      await api.delete(`/academics/subjects/${id}`);
      fetchSubjects();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete subject');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      id: '',
      name: '',
      level: filterLevel,
      isParent: false,
      parentSubjectId: '',
      departmentTrack: 'General',
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Filtered subjects
  const filteredSubjects = subjects
    .filter((sub) => !filterLevel || sub.category === filterLevel)
    .filter((sub) => {
      const text = `${sub.name} ${sub.category} ${sub.departmentTrack || ''}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });

  // Metrics
  const totalSubjects = subjects.length;
  const levelsCount = Array.from(new Set(subjects.map((s) => s.category))).length;
  const openSubjects = subjects.filter((s) => !s.isLocked).length;
  const parentSubjects = subjects.filter((s) => s.isParent).length;

  const availableLevels = Array.from(new Set(classes.map((c) => c.level)));

  return (
    <div className="subjects-page-container">
      {/* Page Header */}
      <div className="subjects-page-header">
        <div>
          <h1 className="subjects-page-title">Subject Management</h1>
          <p className="subjects-page-subtitle">
            Configure academic subjects, target levels, and department track mappings
          </p>
        </div>
        {!isReadOnly && (
          <button className="btn-add-subject" onClick={openCreateModal}>
            <Plus size={18} /> Add New Subject
          </button>
        )}
      </div>

      {/* KPI Metrics Banner */}
      <div className="subjects-metrics-grid">
        <div className="subjects-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Subjects</span>
            <span className="metric-number">{totalSubjects}</span>
          </div>
          <div className="metric-icon-badge total">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="subjects-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Levels Covered</span>
            <span className="metric-number">{levelsCount}</span>
          </div>
          <div className="metric-icon-badge levels">
            <Layers size={24} />
          </div>
        </div>

        <div className="subjects-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active / Open</span>
            <span className="metric-number">{openSubjects}</span>
          </div>
          <div className="metric-icon-badge open">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="subjects-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Broad / Parent Groups</span>
            <span className="metric-number">{parentSubjects}</span>
          </div>
          <div className="metric-icon-badge parents">
            <FolderTree size={24} />
          </div>
        </div>
      </div>

      {/* Controls & Filter Card */}
      <div className="subjects-controls-card">
        <div className="subjects-search-group">
          <div className="subjects-search-box">
            <Search className="subjects-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by subject name or level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select-filter-input"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">All Academic Levels</option>
            {availableLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
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

      {error && <div className="alert-error">{error}</div>}

      {/* Main Content Area */}
      {loading ? (
        <div
          className="subjects-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          Loading subject catalog...
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div
          className="subjects-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          No subjects match your active search and filters.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="subjects-table-wrapper" ref={dropdownRef}>
          <table className="executive-subjects-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Target Academic Level</th>
                <th>Department Track</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub) => {
                const isDropdownOpen = openDropdownId === sub.id;

                return (
                  <tr key={sub.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                        {sub.name}
                      </span>
                      {sub.isParent && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            background: '#F3E8FF',
                            color: '#6B21A8',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}
                        >
                          Parent Group
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#1E40AF',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {sub.category}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {sub.departmentTrack || 'General'}
                      </span>
                    </td>
                    <td>
                      {sub.isLocked ? (
                        <span className="status-pill status-inactive">
                          <span className="status-dot-inactive"></span> Locked
                        </span>
                      ) : (
                        <span className="status-pill status-active">
                          <span className="status-dot"></span> Open
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-dropdown-container">
                        <button
                          className="btn-action-dots"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : sub.id)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isDropdownOpen && !isReadOnly && (
                          <div className="action-dropdown-menu">
                            <button
                              className="dropdown-action-item"
                              onClick={() => handleEditClick(sub)}
                            >
                              <Edit3 size={15} color="#000080" /> Edit Subject
                            </button>
                            <div className="dropdown-divider" />
                            <button
                              className="dropdown-action-item danger"
                              onClick={() => handleDeleteClick(sub.id, sub.name)}
                            >
                              <Trash2 size={15} /> Delete Subject
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
        <div className="subjects-grid-wrapper" ref={dropdownRef}>
          {filteredSubjects.map((sub) => {
            const isDropdownOpen = openDropdownId === sub.id;

            return (
              <div key={sub.id} className="subject-grid-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h3
                      style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}
                    >
                      {sub.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748B',
                        display: 'block',
                        marginTop: '0.2rem',
                      }}
                    >
                      {sub.category}
                    </span>
                  </div>

                  <div className="action-dropdown-container">
                    <button
                      className="btn-action-dots"
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : sub.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {isDropdownOpen && (
                      <div className="action-dropdown-menu">
                        <button
                          className="dropdown-action-item"
                          onClick={() => handleEditClick(sub)}
                        >
                          <Edit3 size={15} color="#000080" /> Edit Subject
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-action-item danger"
                          onClick={() => handleDeleteClick(sub.id, sub.name)}
                        >
                          <Trash2 size={15} /> Delete Subject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <span
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    Track: {sub.departmentTrack || 'General'}
                  </span>
                  {sub.isParent && (
                    <span
                      style={{
                        background: '#F3E8FF',
                        color: '#6B21A8',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                      }}
                    >
                      Parent Group
                    </span>
                  )}
                </div>

                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {sub.isLocked ? (
                    <span className="status-pill status-inactive">
                      <span className="status-dot-inactive"></span> Locked
                    </span>
                  ) : (
                    <span className="status-pill status-active">
                      <span className="status-dot"></span> Open
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER DRAWER FORM FOR ADD / EDIT SUBJECT */}
      {showModal && (
        <div className="subject-slideover-backdrop" onClick={() => setShowModal(false)}>
          <div className="subject-slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="subject-slideover-header">
              <div>
                <h2 className="subject-slideover-title">
                  {isEditing ? 'Edit Subject Details' : 'Add New Subject'}
                </h2>
                <p className="subject-slideover-subtitle">
                  Configure target academic level, parent grouping, and track assignments
                </p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateOrUpdate}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div className="subject-slideover-body">
                {/* Target Level */}
                <div className="form-group">
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Target Academic Level <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    required
                    className="select-filter-input"
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                    }}
                  >
                    <option value="">-- Select Target Level --</option>
                    {availableLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Name */}
                <div className="form-group">
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Subject Name <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Mathematics, Basic Science"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                {/* Senior Department Track */}
                {formData.level === 'Senior Secondary' && (
                  <div className="form-group">
                    <label
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#334155',
                        display: 'block',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Department / Track
                    </label>
                    <select
                      name="departmentTrack"
                      value={formData.departmentTrack}
                      onChange={handleInputChange}
                      className="select-filter-input"
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        fontSize: '0.9rem',
                        borderRadius: '10px',
                      }}
                    >
                      <option value="General">General (Cross-Cutting)</option>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                )}

                {/* Junior/Primary Parent Grouping */}
                {formData.level && formData.level !== 'Senior Secondary' && (
                  <>
                    <div
                      style={{
                        background: '#F8FAFC',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        id="isParent"
                        name="isParent"
                        checked={formData.isParent}
                        onChange={handleInputChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label
                        htmlFor="isParent"
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        Is this a Parent Subject? (e.g. NVE, Basic Science & Tech)
                      </label>
                    </div>

                    {!formData.isParent && (
                      <div className="form-group">
                        <label
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#334155',
                            display: 'block',
                            marginBottom: '0.4rem',
                          }}
                        >
                          Parent Subject (Optional)
                        </label>
                        <select
                          name="parentSubjectId"
                          value={formData.parentSubjectId}
                          onChange={handleInputChange}
                          className="select-filter-input"
                          style={{
                            width: '100%',
                            padding: '0.7rem',
                            fontSize: '0.9rem',
                            borderRadius: '10px',
                          }}
                        >
                          <option value="">-- No Parent (Standalone) --</option>
                          {subjects
                            .filter((s) => s.isParent && s.category === formData.level)
                            .map((parentSub) => (
                              <option key={parentSub.id} value={parentSub.id}>
                                {parentSub.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

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
                    Configuring a subject will automatically enable it for teacher allocations and
                    result computation across classes.
                  </span>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="subject-slideover-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
