import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { useDialog } from '../../../context/DialogContext';
import { api } from '../../../services/api';
import './ManualClearance.css';
import { 
  CreditCard, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ShieldAlert, 
  List, 
  LayoutGrid, 
  UserCheck, 
  UserX 
} from 'lucide-react';

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
  const { showAlert } = useDialog();

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
      fetchStudents();
    } catch (err: any) {
      showAlert(err.message || 'Failed to update clearance status');
    } finally {
      setToggling(null);
    }
  };

  const getStudentInitials = (firstName: string, surname: string) => {
    const f = firstName ? firstName[0] : '';
    const s = surname ? surname[0] : '';
    return `${f}${s}`.toUpperCase() || 'ST';
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

  // Metrics
  const totalStudents = students.length;
  const clearedStudents = students.filter(s => s.isCleared).length;
  const pendingStudents = totalStudents - clearedStudents;

  return (
    <div className="clearance-page-container">
      {/* Page Header */}
      <div className="clearance-page-header">
        <div>
          <h1 className="clearance-page-title">Manual Fee Clearance (Override)</h1>
          <p className="clearance-page-subtitle">Administrative override hub to clear student fee status for report card generation and portal access</p>
        </div>
      </div>

      {/* Operational Override Alert Banner */}
      <div className="clearance-override-banner">
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ display: 'block', fontWeight: 800 }}>Administrative Fee Override Utility</strong>
          <span>Use this control to clear debt status for students who paid offline or prior to system deployment. Manual clearance unlocks result report cards for the active session and term.</span>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="clearance-metrics-grid">
        <div className="clearance-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Enrolled Students</span>
            <span className="metric-number">{totalStudents}</span>
          </div>
          <div className="metric-icon-badge students">
            <Users size={24} />
          </div>
        </div>

        <div className="clearance-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Cleared Students</span>
            <span className="metric-number">{clearedStudents}</span>
          </div>
          <div className="metric-icon-badge cleared">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="clearance-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Outstanding / Not Cleared</span>
            <span className="metric-number" style={{ color: '#BE123C' }}>{pendingStudents}</span>
          </div>
          <div className="metric-icon-badge pending">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="clearance-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Target Term</span>
            <span className="metric-number" style={{ fontSize: '1.25rem', marginTop: '0.4rem' }}>
              {filterSession} - {filterTerm}
            </span>
          </div>
          <div className="metric-icon-badge session">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="clearance-controls-card">
        <div className="clearance-search-group">
          <div className="clearance-search-box">
            <Search className="clearance-search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or reg. number..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>

          {/* Level Filter */}
          <select 
            className="select-filter-input"
            value={filterLevel} 
            onChange={(e) => { setFilterLevel(e.target.value); setFilterClassId(''); }}
          >
            <option value="">All Academic Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Primary">Primary</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Nursery">Nursery</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          {/* Class Filter */}
          <select 
            className="select-filter-input"
            value={filterClassId} 
            onChange={(e) => setFilterClassId(e.target.value)}
          >
            <option value="">All Classes</option>
            {classOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{`${cls.level} ${cls.name} ${cls.section || ''}`}</option>
            ))}
          </select>

          {/* Session Selector */}
          <select 
            className="select-filter-input"
            value={filterSession} 
            onChange={(e) => setFilterSession(e.target.value)}
          >
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
          </select>

          {/* Term Selector */}
          <select 
            className="select-filter-input"
            value={filterTerm} 
            onChange={(e) => setFilterTerm(e.target.value)}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
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
        <div className="clearance-table-wrapper" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
          Loading student fee clearance roster...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="clearance-table-wrapper" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
          No students match your active filters.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="clearance-table-wrapper">
          <table className="executive-clearance-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Name</th>
                <th>Class Room</th>
                <th>Clearance Status</th>
                <th style={{ textAlign: 'center' }}>Override Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                      {student.registrationNumber || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="teacher-profile-cell">
                      <div className="teacher-avatar">
                        {getStudentInitials(student.firstName, student.surname)}
                      </div>
                      <div>
                        <span className="teacher-name-title">{`${student.firstName} ${student.surname}`}</span>
                        {student.otherNames && (
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>{student.otherNames}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {student.className || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${student.isCleared ? 'active' : 'inactive'}`}>
                      <span className={student.isCleared ? 'status-dot' : 'status-dot-inactive'}></span>
                      {student.isCleared ? 'Cleared' : 'Not Cleared'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {student.isCleared ? (
                      <button 
                        className="btn-assign-action change"
                        onClick={() => handleToggleClearance(student.id, student.isCleared)}
                        disabled={toggling === student.id}
                        style={{ border: '1px solid #FECDD3', color: '#E11D48', background: '#FFF1F2' }}
                      >
                        <UserX size={15} />
                        {toggling === student.id ? 'Updating...' : 'Revoke Clearance'}
                      </button>
                    ) : (
                      <button 
                        className="btn-assign-action new"
                        onClick={() => handleToggleClearance(student.id, student.isCleared)}
                        disabled={toggling === student.id}
                      >
                        <UserCheck size={15} />
                        {toggling === student.id ? 'Updating...' : 'Mark as Cleared'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="clearance-grid-wrapper">
          {filteredStudents.map(student => (
            <div key={student.id} className="clearance-grid-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="teacher-profile-cell">
                  <div className="teacher-avatar">
                    {getStudentInitials(student.firstName, student.surname)}
                  </div>
                  <div>
                    <span className="teacher-name-title" style={{ fontSize: '1.05rem' }}>{`${student.firstName} ${student.surname}`}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginTop: '0.1rem' }}>
                      {student.registrationNumber || 'Pending Reg.'}
                    </span>
                  </div>
                </div>

                <span className={`status-pill ${student.isCleared ? 'active' : 'inactive'}`}>
                  {student.isCleared ? 'Cleared' : 'Not Cleared'}
                </span>
              </div>

              <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  {student.className || 'Unassigned'}
                </span>

                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                  {filterSession} ({filterTerm})
                </span>
              </div>

              {student.isCleared ? (
                <button 
                  className="btn-assign-action change"
                  onClick={() => handleToggleClearance(student.id, student.isCleared)}
                  disabled={toggling === student.id}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', border: '1px solid #FECDD3', color: '#E11D48', background: '#FFF1F2' }}
                >
                  <UserX size={15} />
                  {toggling === student.id ? 'Updating...' : 'Revoke Clearance'}
                </button>
              ) : (
                <button 
                  className="btn-assign-action new"
                  onClick={() => handleToggleClearance(student.id, student.isCleared)}
                  disabled={toggling === student.id}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                >
                  <UserCheck size={15} />
                  {toggling === student.id ? 'Updating...' : 'Mark as Cleared'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
