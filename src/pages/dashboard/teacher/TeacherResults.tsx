import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  Award,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  BookOpen,
  AlertCircle,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import './TeacherAcademics.css';
import '../students/Students.css';

interface StudentResultItem {
  id: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  principalRemarks: string;
  classTeacherRemarks: string;
}

interface BatchResultResponse {
  batchId: string;
  status: string;
  results: StudentResultItem[];
}

interface MyClass {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
}

export default function TeacherResults() {
  const { showConfirm, showAlert } = useDialog();
  const { userRole } = useAuth();
  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();

  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const [data, setData] = useState<BatchResultResponse | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperUser = [
    'SuperAdmin',
    'Superadmin',
    'SystemAdmin',
    'Director',
    'Admin',
    'Principal',
  ].includes(userRole || '');

  // 1. Fetch Classes Roster
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const myClassesResponse = await api.get('/academics/teacher/my-classes').catch(() => []);
      const myClasses: MyClass[] = myClassesResponse || [];

      if (myClasses.length > 0 && !isSuperUser) {
        const formClass = myClasses.find((c) => c.isClassTeacher) || myClasses[0];
        setClasses(myClasses);
        setSelectedClass(formClass);
        setIsDeveloperMode(false);
      } else {
        // Fallback for SuperAdmin / Admin / Unallocated: Fetch All System Classes
        const allSystemClasses = await api.get('/setup/classes').catch(() => []);
        const formattedClasses: MyClass[] = (allSystemClasses || []).map((c: any) => ({
          id: c.id,
          session: c.session || filterSession,
          level: c.level || 'Class',
          name: `${c.level || ''} ${c.name || ''}`.trim(),
          section: c.section || '',
          isClassTeacher: true,
        }));

        setClasses(formattedClasses);
        setIsDeveloperMode(true);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load classes', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // 2. Fetch Class Broadsheet Results
  const fetchResults = async () => {
    if (!selectedClass) return;
    try {
      setLoadingResults(true);
      setError(null);
      const res = await api.get(
        `/academics/teacher/class-results?classId=${selectedClass.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );

      if (!res || !res.batchId || res.batchId === '00000000-0000-0000-0000-000000000000') {
        setData(null);
        setError('No results found or results have not been compiled yet for this class and term.');
      } else {
        setData(res);
      }
    } catch (err: any) {
      setData(null);
      setError(err.message || 'Failed to load class results.');
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [userRole]);

  useEffect(() => {
    if (selectedClass) {
      fetchResults();
    }
  }, [selectedClass, filterSession, filterTerm]);

  // Reset Compilation Handler
  const handleReset = async () => {
    if (!data?.batchId) return;

    const confirmed = await showConfirm(
      'Are you sure you want to reset and delete this compilation? This will return the class results to a pre-compiled state so teachers can re-edit scores.',
    );
    if (!confirmed) return;

    try {
      setLoadingResults(true);
      await api.delete(`/academics/results/reset/${data.batchId}`);
      await showAlert('Results have been successfully reset.', { type: 'success' });
      fetchResults();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to reset results.', { type: 'danger' });
      setLoadingResults(false);
    }
  };

  // Student Initials Avatar Generator
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  // Position Badge Formatter
  const getPositionBadge = (pos: number) => {
    if (pos === 1) return { label: '🥇 1st Position', bg: '#FEF3C7', color: '#B45309' };
    if (pos === 2) return { label: '🥈 2nd Position', bg: '#F1F5F9', color: '#475569' };
    if (pos === 3) return { label: '🥉 3rd Position', bg: '#FFEDD5', color: '#C2410C' };
    return { label: `#${pos}`, bg: '#F8FAFC', color: '#64748B' };
  };

  // Computed Broadsheet Metrics
  const resultsList = data?.results || [];
  const totalStudents = resultsList.length;
  const classAvg =
    totalStudents > 0
      ? (resultsList.reduce((acc, r) => acc + (r.averageScore || 0), 0) / totalStudents).toFixed(1)
      : '0.0';
  const topScore = totalStudents > 0 ? Math.max(...resultsList.map((r) => r.totalScore || 0)) : 0;

  return (
    <div className="teacher-hub-page fade-in">
      {/* HERO BANNER & METRICS */}
      <div className="ca-hero-banner">
        <h1 className="ca-hero-title">
          <span>📊</span> Class Broadsheet & Results Master
        </h1>
        <p className="ca-hero-subtitle">
          Review terminal broadsheet summaries, student positions, and batch approval status for
          official report card generation.
        </p>

        <div className="ca-stats-grid">
          <div className="ca-stat-card">
            <div
              className="ca-stat-icon"
              style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}
            >
              <Users size={24} />
            </div>
            <div>
              <div className="ca-stat-value">{totalStudents}</div>
              <div className="ca-stat-label">Compiled Students</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div
              className="ca-stat-icon"
              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}
            >
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ color: '#34D399' }}>
                {classAvg}%
              </div>
              <div className="ca-stat-label">Class Mean Average</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div
              className="ca-stat-icon"
              style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}
            >
              <Award size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ color: '#FBBF24' }}>
                {topScore} pts
              </div>
              <div className="ca-stat-label">Top Class Score</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div
              className="ca-stat-icon"
              style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div
                className="ca-stat-value"
                style={{
                  fontSize: '1.1rem',
                  color: data?.status === 'Approved' ? '#34D399' : '#FBBF24',
                }}
              >
                {data?.status || 'Pre-Compiled'}
              </div>
              <div className="ca-stat-label">Approval Status</div>
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
              You are inspecting class broadsheets as a System Admin / SuperAdmin. Select any class
              below to view compiled results.
            </span>
          </div>
        </div>
      )}

      {/* CONTROL BAR: CLASS SELECTOR, SESSION & TERM */}
      <div
        style={{
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Class Selector Dropdown */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.35rem',
                fontWeight: '700',
                color: '#475569',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Selected Class
            </label>
            <select
              value={selectedClass?.id || ''}
              onChange={(e) => {
                const found = classes.find((c) => c.id === e.target.value);
                if (found) setSelectedClass(found);
              }}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontWeight: '700',
                color: '#0F172A',
                background: '#F8FAFC',
                minWidth: '180px',
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.level} {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          {/* Session Dropdown */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.35rem',
                fontWeight: '700',
                color: '#475569',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Session
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontWeight: '600',
                color: '#0F172A',
                background: '#F8FAFC',
                minWidth: '160px',
              }}
            >
              {getSessionOptions(filterSession).map((s: string) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Term Dropdown */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.35rem',
                fontWeight: '700',
                color: '#475569',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Term
            </label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontWeight: '600',
                color: '#0F172A',
                background: '#F8FAFC',
                minWidth: '140px',
              }}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>

        {/* RESET COMPILATION BUTTON */}
        {data?.results && data.results.length > 0 && (
          <button
            className="btn-save-draft"
            onClick={handleReset}
            style={{ borderColor: '#FCA5A5', color: '#991B1B', background: '#FEF2F2' }}
          >
            <RotateCcw size={16} /> Reset Compilation
          </button>
        )}
      </div>

      {/* ERROR NOTICE DISPLAY */}
      {error && !data && (
        <div
          style={{
            padding: '1.25rem',
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            color: '#92400E',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Broadsheet Status</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* BROADSHEET TABLE CARD OR GUIDED EMPTY STATE */}
      <div className="ca-table-card">
        {loadingClasses || loadingResults ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            Loading class broadsheet results...
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          /* GUIDED STEP-BY-STEP WORKFLOW WHEN NO RESULTS COMPILED YET */
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                background: '#EFF6FF',
                color: '#2563EB',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                fontSize: '1.75rem',
              }}
            >
              📊
            </div>
            <h3
              style={{
                color: '#0F172A',
                fontSize: '1.25rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
              }}
            >
              Results Not Compiled Yet
            </h3>
            <p
              style={{
                color: '#64748B',
                maxWidth: '520px',
                margin: '0 auto 2rem',
                fontSize: '0.92rem',
                lineHeight: '1.6',
              }}
            >
              No compiled broadsheet is available for <strong>{selectedClass?.name}</strong> in{' '}
              {filterSession} ({filterTerm}). Follow the academic workflow steps below to compile
              results.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <span
                  style={{
                    background: '#E0E7FF',
                    color: '#3730A3',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                  }}
                >
                  STEP 1
                </span>
                <h4 style={{ color: '#0F172A', margin: '0.5rem 0 0.25rem', fontSize: '0.95rem' }}>
                  Enter CA & Exam Scores
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
                  Subject teachers record test and examination marks in Continuous Assessment.
                </p>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <span
                  style={{
                    background: '#E0E7FF',
                    color: '#3730A3',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                  }}
                >
                  STEP 2
                </span>
                <h4 style={{ color: '#0F172A', margin: '0.5rem 0 0.25rem', fontSize: '0.95rem' }}>
                  Lock Subject Scores
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
                  Subject teachers submit and lock their subject assessment rosters.
                </p>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <span
                  style={{
                    background: '#E0E7FF',
                    color: '#3730A3',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                  }}
                >
                  STEP 3
                </span>
                <h4 style={{ color: '#0F172A', margin: '0.5rem 0 0.25rem', fontSize: '0.95rem' }}>
                  Compute Final Results
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
                  Form Masters click Review & Compute to generate class broadsheets.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <a
                href="/dashboard/teacher/ca"
                className="btn-submit-scores"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Go to Continuous Assessment Matrix <ArrowRight size={16} />
              </a>
            </div>
          </div>
        ) : (
          /* BROADSHEET DATA TABLE */
          <table className="ca-table">
            <thead>
              <tr>
                <th>STUDENT DETAILS</th>
                <th style={{ width: '130px', textAlign: 'center' }}>TOTAL SCORE</th>
                <th style={{ width: '130px', textAlign: 'center' }}>AVERAGE %</th>
                <th style={{ width: '160px', textAlign: 'center' }}>POSITION IN CLASS</th>
                <th style={{ width: '120px', textAlign: 'center' }}>BATCH STATUS</th>
                <th style={{ width: '140px', textAlign: 'right' }}>REPORT CARD</th>
              </tr>
            </thead>
            <tbody>
              {[...data.results]
                .sort((a, b) => a.studentName.localeCompare(b.studentName))
                .map((r) => {
                  const initials = getInitials(r.studentName);
                  const posBadge = getPositionBadge(r.positionInClass);

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-chip">{initials}</div>
                          <div>
                            <strong
                              style={{ color: '#0F172A', display: 'block', fontSize: '0.95rem' }}
                            >
                              {r.studentName}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Position: #{r.positionInClass}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: '800',
                          color: '#0F172A',
                          fontSize: '1rem',
                        }}
                      >
                        {r.totalScore} pts
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: '700',
                            color: r.averageScore >= 50 ? '#15803D' : '#B91C1C',
                          }}
                        >
                          {r.averageScore}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            background: posBadge.bg,
                            color: posBadge.color,
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            fontWeight: '800',
                          }}
                        >
                          {posBadge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            background: data.status === 'Approved' ? '#DCFCE7' : '#FEF3C7',
                            color: data.status === 'Approved' ? '#15803D' : '#B45309',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontWeight: '700',
                          }}
                        >
                          {data.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={`/dashboard/reports/result/${r.studentId}/${data.batchId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                          }}
                        >
                          <FileCheck size={14} /> View Card <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {data?.results && data.results.length > 0 && (
          <div className="ca-table-footer">
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
              Showing {data.results.length} compiled student report cards
            </span>
            <button
              className="btn-save-draft"
              onClick={handleReset}
              style={{ borderColor: '#FCA5A5', color: '#991B1B', background: '#FEF2F2' }}
            >
              <RotateCcw size={16} /> Reset Compilation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
