import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Search, 
  CheckCheck, 
  XSquare, 
  Save,
  AlertCircle
} from 'lucide-react';
import './TeacherAcademics.css';
import '../students/Students.css';

interface StudentAttendance {
  studentId: string;
  name: string;
  registrationNumber: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  timeIn: string | null;
  timeOut: string | null;
  remarks?: string;
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
  const { showAlert } = useDialog();
  const { userRole } = useAuth();
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const isSuperUser = ['SuperAdmin', 'Superadmin', 'SystemAdmin', 'Director', 'Admin', 'Principal'].includes(userRole || '');

  // 1. Fetch Classes (Assigned Form Class OR All System Classes for SuperAdmin / Unallocated)
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      setError(null);

      const classesResponse = await api.get('/academics/teacher/my-classes').catch(() => []);
      const myClasses: MyClass[] = classesResponse || [];

      if (myClasses.length > 0 && !isSuperUser) {
        const classTeacherClass = myClasses.find(c => c.isClassTeacher) || myClasses[0];
        setClasses(myClasses);
        setSelectedClass(classTeacherClass);
        setIsDeveloperMode(false);
      } else {
        // Fallback for SuperAdmin / Admin / Unallocated Teachers: Fetch All System Classes
        const allSystemClasses = await api.get('/setup/classes').catch(() => []);
        const formattedClasses: MyClass[] = (allSystemClasses || []).map((c: any) => ({
          id: c.id,
          session: c.session || filterSession,
          level: c.level || 'Class',
          name: `${c.level || ''} ${c.name || ''}`.trim(),
          section: c.section || '',
          isClassTeacher: true
        }));

        setClasses(formattedClasses);
        setIsDeveloperMode(true);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load class roster', err);
      setError('Failed to load class list.');
    } finally {
      setLoadingClasses(false);
    }
  };

  // 2. Fetch Attendance Register for Selected Class & Date
  const fetchAttendance = async () => {
    if (!selectedClass) return;
    try {
      setLoadingAttendance(true);
      setError(null);
      const data = await api.get(`/academics/classes/${selectedClass.id}/attendance?date=${date}`);
      setAttendance(data || []);
    } catch (err: any) {
      console.error('Failed to load attendance records', err);
      setError(err.message || 'Failed to load attendance records.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [userRole]);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass, date]);

  // Bulk Status Handlers
  const handleMarkAllPresent = () => {
    setAttendance(prev => prev.map(a => ({ ...a, status: 'Present' })));
  };

  const handleMarkAllAbsent = () => {
    setAttendance(prev => prev.map(a => ({ ...a, status: 'Absent' })));
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    try {
      setSaving(true);
      await api.post(`/academics/classes/${selectedClass.id}/attendance`, {
        classId: selectedClass.id,
        date: new Date(date).toISOString(),
        term: filterTerm,
        students: attendance.map(a => ({
          studentId: a.studentId,
          status: a.status,
          remarks: a.remarks || ''
        }))
      });
      showAlert('Daily attendance marked and synced successfully!');
      fetchAttendance();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Date Shortcut Helpers
  const setTodayDate = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  // Student Initials Avatar Generator
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Filtered Students Roster
  let filteredAttendance = attendance;
  if (filterSearch.trim()) {
    const q = filterSearch.toLowerCase().trim();
    filteredAttendance = filteredAttendance.filter(a => 
      a.name?.toLowerCase().includes(q) || 
      a.registrationNumber?.toLowerCase().includes(q)
    );
  }

  // Live Summary Metrics
  const totalEnrolled = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late' || a.status === 'Excused').length;
  const presentPercent = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  return (
    <div className="teacher-hub-page fade-in">
      
      {/* HERO BANNER & STATS */}
      <div className="ca-hero-banner">
        <h1 className="ca-hero-title">
          <span>📋</span> Daily Attendance Register
        </h1>
        <p className="ca-hero-subtitle">
          Mark daily class attendance, track gate check-ins, and monitor student punctuality.
        </p>

        <div className="ca-stats-grid">
          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="ca-stat-value">{totalEnrolled}</div>
              <div className="ca-stat-label">Total Enrollment</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ color: '#34D399' }}>
                {presentCount} <span style={{ fontSize: '0.85rem', color: '#9CA3AF', fontWeight: 500 }}>({presentPercent}%)</span>
              </div>
              <div className="ca-stat-label">Present Today</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}>
              <XCircle size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ color: '#F87171' }}>{absentCount}</div>
              <div className="ca-stat-label">Absent Today</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ color: '#FBBF24' }}>{lateCount}</div>
              <div className="ca-stat-label">Late / Excused</div>
            </div>
          </div>
        </div>
      </div>

      {/* DEVELOPER SUPERADMIN OVERLAY BANNER */}
      {isDeveloperMode && (
        <div className="ca-dev-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="ca-dev-badge">Developer & Admin Mode</span>
            <span style={{ fontSize: '0.9rem', color: '#1E40AF', fontWeight: 500 }}>
              You are inspecting class attendance records as a System Admin / SuperAdmin. Select any class below to inspect or mark attendance.
            </span>
          </div>
        </div>
      )}

      {/* CONTROLS BAR: CLASS SELECTOR, DATE, TERM & BULK ACTIONS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Class Selector Dropdown */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Class
            </label>
            <select 
              value={selectedClass?.id || ''} 
              onChange={(e) => {
                const found = classes.find(c => c.id === e.target.value);
                if (found) setSelectedClass(found);
              }} 
              style={{
                padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
                fontWeight: '700', color: '#0F172A', background: '#F8FAFC', minWidth: '180px'
              }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.level} {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector & Shortcuts */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attendance Date
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
                  fontWeight: '600', color: '#0F172A', background: '#F8FAFC'
                }}
              />
              <button 
                type="button" 
                onClick={setTodayDate}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.75rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={setYesterdayDate}
                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.75rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Term Selector */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Term
            </label>
            <select 
              value={filterTerm} 
              onChange={(e) => setFilterTerm(e.target.value)} 
              style={{
                padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
                fontWeight: '600', color: '#0F172A', background: '#F8FAFC', minWidth: '140px'
              }}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>

        {/* BULK ACTIONS & SAVE BUTTON */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-save-draft" 
            onClick={handleMarkAllPresent}
            title="Set all students to Present status"
            disabled={attendance.length === 0}
          >
            <CheckCheck size={16} style={{ color: '#10B981' }} /> Mark All Present
          </button>

          <button 
            type="button"
            className="btn-save-draft" 
            onClick={handleMarkAllAbsent}
            title="Set all students to Absent status"
            disabled={attendance.length === 0}
          >
            <XSquare size={16} style={{ color: '#EF4444' }} /> Mark All Absent
          </button>

          <button 
            type="button"
            className="btn-submit-scores" 
            onClick={handleSaveAttendance}
            disabled={saving || attendance.length === 0}
          >
            <Save size={16} /> {saving ? 'Syncing...' : 'Save Register'}
          </button>
        </div>
      </div>

      {/* SEARCH FILTER BOX */}
      <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '380px' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input 
          type="text" 
          value={filterSearch} 
          onChange={(e) => setFilterSearch(e.target.value)} 
          placeholder="Search student by name or reg. number..." 
          style={{
            width: '100%', padding: '0.6rem 0.85rem 0.6rem 2.4rem', border: '1.5px solid #CBD5E1',
            borderRadius: '10px', fontSize: '0.88rem', color: '#0F172A', background: '#FFFFFF', outline: 'none'
          }}
        />
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div style={{ padding: '1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#991B1B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ATTENDANCE ROSTER TABLE CARD */}
      <div className="ca-table-card">
        {loadingClasses || loadingAttendance ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>Loading attendance roster...</div>
        ) : !selectedClass ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>No active class selected.</div>
        ) : filteredAttendance.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            <Users size={40} style={{ margin: '0 auto 0.75rem', color: '#CBD5E1' }} />
            <h4 style={{ color: '#0F172A', margin: '0 0 0.25rem', fontWeight: 800 }}>No Students Found</h4>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>No enrolled student records found for {selectedClass.name} {selectedClass.section}.</p>
          </div>
        ) : (
          <table className="ca-table">
            <thead>
              <tr>
                <th>REGISTRATION NO.</th>
                <th>STUDENT PROFILE</th>
                <th style={{ width: '110px', textAlign: 'center' }}>TIME IN</th>
                <th style={{ width: '110px', textAlign: 'center' }}>TIME OUT</th>
                <th style={{ width: '120px', textAlign: 'center' }}>STATUS</th>
                <th style={{ width: '280px', textAlign: 'right' }}>ATTENDANCE TOGGLE</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map(student => {
                const initials = getInitials(student.name);

                return (
                  <tr key={student.studentId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                      {student.registrationNumber || 'Pending'}
                    </td>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-chip">{initials}</div>
                        <div>
                          <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.92rem' }}>{student.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{student.registrationNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>
                      {student.timeIn || '-'}
                    </td>
                    <td style={{ textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>
                      {student.timeOut || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`att-status-pill ${student.status}`}>
                        {student.status === 'Present' && <CheckCircle2 size={13} />}
                        {student.status === 'Absent' && <XCircle size={13} />}
                        {student.status === 'Late' && <Clock size={13} />}
                        {student.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="att-toggle-group">
                        <button 
                          type="button"
                          className={`att-toggle-btn Present ${student.status === 'Present' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.studentId, 'Present')}
                        >
                          Present
                        </button>
                        <button 
                          type="button"
                          className={`att-toggle-btn Absent ${student.status === 'Absent' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.studentId, 'Absent')}
                        >
                          Absent
                        </button>
                        <button 
                          type="button"
                          className={`att-toggle-btn Late ${student.status === 'Late' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.studentId, 'Late')}
                        >
                          Late
                        </button>
                        <button 
                          type="button"
                          className={`att-toggle-btn Excused ${student.status === 'Excused' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.studentId, 'Excused')}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="ca-table-footer">
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
            Showing {filteredAttendance.length} student records for {date}
          </span>
          <button 
            type="button" 
            className="btn-submit-scores" 
            onClick={handleSaveAttendance}
            disabled={saving || attendance.length === 0}
          >
            <Save size={16} /> {saving ? 'Syncing...' : 'Save & Sync Register'}
          </button>
        </div>
      </div>

    </div>
  );
}
