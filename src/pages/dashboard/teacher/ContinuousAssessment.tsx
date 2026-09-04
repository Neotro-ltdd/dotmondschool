import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { useAuth } from '../../../context/AuthContext';
import './TeacherAcademics.css';
import '../students/Management.css';

interface MySubject {
  id: string;
  name: string;
  code?: string;
}

interface MyClass {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
  mySubjects: MySubject[];
}

interface ScoreRecord {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  scoreId?: string;
  caData: {
    'First Test': number | null;
    'Second Test': number | null;
  } | null;
  caTotal: number | null;
  exam: number | null;
  total: number | null;
  isSubmitted: boolean;
}

interface GradeBand {
  grade: string;
  badgeClass: string;
}

type CaData = {
  'First Test': number | null;
  'Second Test': number | null;
};

interface SubjectStatus {
  subjectId: string;
  subjectName: string;
  isSubmitted: boolean;
  scoresEntered: number;
  totalStudents: number;
}

export default function ContinuousAssessment() {
  const { showAlert } = useDialog();
  const { userRole } = useAuth();

  const [classes, setClasses] = useState<MyClass[]>([]);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [activeTab, setActiveTab] = useState<'ca' | 'exam' | 'compile'>('ca');

  // Tab 1 & 2 State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [lockingScores, setLockingScores] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compile State
  const [statusLoading, setStatusLoading] = useState(false);
  const [classStatus, setClassStatus] = useState<{
    allSubmitted: boolean;
    subjects: SubjectStatus[];
  } | null>(null);
  const [compiling, setCompiling] = useState(false);

  // Term Setup
  const [termSetup, setTermSetup] = useState<{
    caWeightFirst: number;
    caWeightSecond: number;
    examWeight: number;
  } | null>(null);

  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();

  const isSuperUser = [
    'SuperAdmin',
    'Superadmin',
    'SystemAdmin',
    'Director',
    'Admin',
    'Principal',
  ].includes(userRole || '');

  // Fetch Teacher Assigned Classes OR Fallback to All School Classes for SuperAdmin / Admin / Unallocated Users
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const myClassesData = await api.get('/academics/teacher/my-classes').catch(() => []);

      if (myClassesData && myClassesData.length > 0 && !isSuperUser) {
        setClasses(myClassesData);
        setIsDeveloperMode(false);
        setSelectedClass(myClassesData[0]);
        if (myClassesData[0].mySubjects?.length > 0) {
          setSelectedSubjectId(myClassesData[0].mySubjects[0].id);
        }
      } else {
        // Fallback for SuperAdmin / Admin / Unallocated Teachers: Fetch All System Classes
        const allSystemClasses = await api.get('/setup/classes').catch(() => []);
        const formattedClasses: MyClass[] = (allSystemClasses || []).map((c: any) => ({
          id: c.id,
          session: c.session || filterSession,
          level: c.level || 'Class',
          name: `${c.level || ''} ${c.name || ''}`.trim(),
          section: c.section || '',
          isClassTeacher: true, // Developers/SuperAdmins have full compiler authority
          mySubjects: c.subjects || [{ id: 'all-subjects', name: 'General Evaluation' }],
        }));

        setClasses(formattedClasses);
        setIsDeveloperMode(true);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0]);
          if (formattedClasses[0].mySubjects?.length > 0) {
            setSelectedSubjectId(formattedClasses[0].mySubjects[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load classes roster', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchScores = async () => {
    if (!selectedClass || !selectedSubjectId) return;
    try {
      setLoadingScores(true);
      const data = await api.get(
        `/academics/scores/subject?classId=${selectedClass.id}&subjectId=${selectedSubjectId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );
      setScores(data || []);
    } catch (err) {
      console.error('Failed to fetch assessment scores', err);
    } finally {
      setLoadingScores(false);
    }
  };

  const fetchClassStatus = async () => {
    if (!selectedClass) return;
    try {
      setStatusLoading(true);
      const data = await api.get(
        `/academics/scores/status?classId=${selectedClass.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );
      setClassStatus(data);
    } catch (err) {
      console.error('Failed to fetch class compilation status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [userRole]);

  useEffect(() => {
    if (selectedClass && selectedSubjectId && (activeTab === 'ca' || activeTab === 'exam')) {
      fetchScores();
    }
  }, [selectedClass, selectedSubjectId, filterSession, filterTerm, activeTab]);

  useEffect(() => {
    if (filterSession && filterTerm) {
      api
        .get(
          `/setup/terms?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
        )
        .then((data) => setTermSetup(data))
        .catch((err) => console.error('Failed to load term setup weights', err));
    }
  }, [filterSession, filterTerm]);

  useEffect(() => {
    if (selectedClass && activeTab === 'compile') {
      fetchClassStatus();
    }
  }, [selectedClass, filterSession, filterTerm, activeTab]);

  // Helper to compute Grade Letter (A-F)
  const getGradeLetter = (total: number | null): GradeBand => {
    if (total === null || isNaN(total)) return { grade: '-', badgeClass: '' };
    if (total >= 70) return { grade: 'A', badgeClass: 'grade-A' };
    if (total >= 60) return { grade: 'B', badgeClass: 'grade-B' };
    if (total >= 50) return { grade: 'C', badgeClass: 'grade-C' };
    if (total >= 40) return { grade: 'D', badgeClass: 'grade-D' };
    return { grade: 'F', badgeClass: 'grade-F' };
  };

  const handleScoreChange = (studentId: string, field: string, valueStr: string) => {
    setScores((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;

        const newScore = { ...s };
        const value = valueStr === '' ? null : parseFloat(valueStr);

        if (field === 'exam') {
          const isNurseryPrimary =
            selectedClass &&
            (selectedClass.level.toLowerCase().includes('nursery') ||
              selectedClass.level.toLowerCase().includes('kindergarten') ||
              selectedClass.level.toLowerCase().includes('primary'));
          const maxExam = isNurseryPrimary ? 100 : (termSetup?.examWeight ?? 60);
          newScore.exam =
            value !== null && value > maxExam ? maxExam : value !== null && value < 0 ? 0 : value;
        } else {
          const prevCaData = newScore.caData || { 'First Test': null, 'Second Test': null };
          // SAFETY: this branch only runs for the 'First Test'/'Second Test' call sites with value parsed to number|null, so the computed-key spread preserves the CaData shape.
          const updatedCaData = { ...prevCaData, [field]: value } as CaData;
          newScore.caData = updatedCaData;

          const maxFirst = termSetup?.caWeightFirst ?? 20;
          const maxSecond = termSetup?.caWeightSecond ?? 20;

          if (field === 'First Test' && newScore.caData['First Test'] !== null) {
            if (newScore.caData['First Test']! > maxFirst) newScore.caData['First Test'] = maxFirst;
            if (newScore.caData['First Test']! < 0) newScore.caData['First Test'] = 0;
          }
          if (field === 'Second Test' && newScore.caData['Second Test'] !== null) {
            if (newScore.caData['Second Test']! > maxSecond)
              newScore.caData['Second Test'] = maxSecond;
            if (newScore.caData['Second Test']! < 0) newScore.caData['Second Test'] = 0;
          }

          const first = newScore.caData['First Test'] || 0;
          const second = newScore.caData['Second Test'] || 0;

          newScore.caTotal =
            newScore.caData['First Test'] === null && newScore.caData['Second Test'] === null
              ? null
              : first + second;
        }

        if (newScore.caTotal === null && newScore.exam === null) {
          newScore.total = null;
        } else {
          newScore.total = (newScore.caTotal || 0) + (newScore.exam || 0);
        }

        return newScore;
      }),
    );
  };

  const handleSaveScores = async () => {
    try {
      setSavingScores(true);
      const promises = scores
        .filter((s) => !s.isSubmitted)
        .map((s) => {
          const isCompletelyNull =
            s.exam === null &&
            (!s.caData || (s.caData['First Test'] === null && s.caData['Second Test'] === null));
          return api.post('/academics/scores', {
            studentId: s.studentId,
            subjectId: selectedSubjectId,
            session: filterSession,
            term: filterTerm,
            caData: isCompletelyNull ? null : s.caData || { 'First Test': 0, 'Second Test': 0 },
            exam: isCompletelyNull ? null : s.exam || 0,
          });
        });
      await Promise.all(promises);
      showAlert('Draft scores saved successfully!');
      fetchScores();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save scores.');
    } finally {
      setSavingScores(false);
    }
  };

  const handleLockScores = () => {
    setShowConfirmModal(true);
  };

  const confirmLockScores = async () => {
    setShowConfirmModal(false);
    try {
      setLockingScores(true);

      const savePromises = scores
        .filter((s) => !s.isSubmitted)
        .map((s) => {
          const isCompletelyNull =
            s.exam === null &&
            (!s.caData || (s.caData['First Test'] === null && s.caData['Second Test'] === null));
          return api.post('/academics/scores', {
            studentId: s.studentId,
            subjectId: selectedSubjectId,
            session: filterSession,
            term: filterTerm,
            caData: isCompletelyNull ? null : s.caData || { 'First Test': 0, 'Second Test': 0 },
            exam: isCompletelyNull ? null : s.exam || 0,
          });
        });
      await Promise.all(savePromises);

      await api.post('/academics/scores/submit-batch', {
        classId: selectedClass!.id,
        subjectId: selectedSubjectId,
        session: filterSession,
        term: filterTerm,
      });
      showAlert('Assessment scores locked & submitted successfully!');
      fetchScores();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to lock scores.');
    } finally {
      setLockingScores(false);
    }
  };

  const handleCompile = async () => {
    if (!selectedClass) return;
    try {
      setCompiling(true);
      await api.post('/academics/results/compile', {
        session: filterSession,
        term: filterTerm,
        classId: selectedClass.id,
      });
      showAlert('Results compiled successfully and forwarded for principal approval!');
      fetchClassStatus();
    } catch (error: any) {
      showAlert(error.response?.data?.message || error.message || 'Failed to compile results.');
    } finally {
      setCompiling(false);
    }
  };

  const isNurseryPrimary =
    selectedClass &&
    (selectedClass.level.toLowerCase().includes('nursery') ||
      selectedClass.level.toLowerCase().includes('kindergarten') ||
      selectedClass.level.toLowerCase().includes('primary'));

  const totalSubmittedInSubject = scores.filter((s) => s.isSubmitted).length;
  const isSubjectLocked = scores.length > 0 && scores.every((s) => s.isSubmitted);

  return (
    <div className="teacher-hub-page">
      {/* HERO BANNER & STATS */}
      <div className="ca-hero-banner">
        <h1 className="ca-hero-title">
          <span>📝</span> Continuous Assessment & Result Matrix
        </h1>
        <p className="ca-hero-subtitle">
          Manage termly continuous assessment tests, enter terminal examination scores, and compile
          official result sheets.
        </p>

        <div className="ca-stats-grid">
          <div className="ca-stat-card">
            <div className="ca-stat-icon">🏫</div>
            <div>
              <div className="ca-stat-value">
                {selectedClass ? `${selectedClass.name} ${selectedClass.section}` : 'None'}
              </div>
              <div className="ca-stat-label">Active Class</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon">🎓</div>
            <div>
              <div className="ca-stat-value">{scores.length} Students</div>
              <div className="ca-stat-label">Class Roster</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon">⚖️</div>
            <div>
              <div className="ca-stat-value">
                {isNurseryPrimary
                  ? 'Total (100%)'
                  : `${termSetup?.caWeightFirst ?? 20} / ${termSetup?.caWeightSecond ?? 20} / ${termSetup?.examWeight ?? 60}`}
              </div>
              <div className="ca-stat-label">Weights (1st CA / 2nd CA / Exam)</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon">🔒</div>
            <div>
              <div
                className="ca-stat-value"
                style={{ color: isSubjectLocked ? '#34D399' : '#FBBF24' }}
              >
                {isSubjectLocked
                  ? 'Locked & Final'
                  : `${totalSubmittedInSubject}/${scores.length} Submitted`}
              </div>
              <div className="ca-stat-label">Subject Lock Status</div>
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
              You are inspecting all school classes as a SuperAdmin / System Admin. Select any class
              to view or manage its assessment scores.
            </span>
          </div>
        </div>
      )}

      {/* SESSION & TERM CONTROL BAR */}
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
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              Academic Session
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontWeight: '600',
                color: '#0F172A',
                background: '#F8FAFC',
                minWidth: '160px',
              }}
            >
              {getSessionOptions(filterSession).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

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
              Academic Term
            </label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontWeight: '600',
                color: '#0F172A',
                background: '#F8FAFC',
                minWidth: '160px',
              }}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
            Term Active:{' '}
            <strong style={{ color: '#2563EB' }}>
              {filterSession} - {filterTerm}
            </strong>
          </span>
        </div>
      </div>

      <div className="teacher-hub-grid">
        {/* SIDEBAR: CLASS SELECTOR */}
        <div className="sidebar-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0F172A', fontWeight: 800 }}>
              Select Class
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                background: '#F1F5F9',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
              }}
            >
              {classes.length} Classes
            </span>
          </div>

          {loadingClasses ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
              Loading classes roster...
            </div>
          ) : classes.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B' }}>
              <p>No classes found.</p>
            </div>
          ) : (
            <div className="class-list">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className={`class-item ${selectedClass?.id === c.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedClass(c);
                    if (c.mySubjects && c.mySubjects.length > 0) {
                      setSelectedSubjectId(c.mySubjects[0].id);
                    } else {
                      setSelectedSubjectId('');
                    }
                  }}
                >
                  <div className="class-name">
                    <span>
                      {c.name} {c.section}
                    </span>
                    {selectedClass?.id === c.id && <span style={{ color: '#2563EB' }}>✓</span>}
                  </div>
                  <div className="class-meta">
                    <span className="ca-role-badge">
                      {c.isClassTeacher
                        ? '⭐ Form Master'
                        : `${c.mySubjects?.length || 0} Subjects`}
                    </span>
                    {isDeveloperMode && (
                      <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>
                        [System]
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN PANEL: ASSESSMENT WORKSPACE */}
        <div className="main-panel">
          {!selectedClass ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👈</span>
              <h3 style={{ color: '#0F172A' }}>Select a Class</h3>
              <p>
                Choose a class from the left sidebar to manage its continuous assessment scores.
              </p>
            </div>
          ) : (
            <>
              {/* NAVIGATION TABS */}
              <div className="tabs-container">
                {!isNurseryPrimary && (
                  <button
                    className={`tab-btn ${activeTab === 'ca' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ca')}
                  >
                    📊 1st & 2nd CA Tests
                  </button>
                )}
                <button
                  className={`tab-btn ${activeTab === 'exam' ? 'active' : ''}`}
                  onClick={() => setActiveTab('exam')}
                >
                  📝 {isNurseryPrimary ? 'Exam / Total Scores' : 'Terminal Exam Scores'}
                </button>
                <button
                  className={`tab-btn ${activeTab === 'compile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('compile')}
                >
                  ⚙️ Review & Compute Results
                </button>
              </div>

              {/* SUBJECT SELECTOR CHIPS FOR CA & EXAM TABS */}
              {(activeTab === 'ca' || activeTab === 'exam') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '700',
                      color: '#475569',
                      fontSize: '0.85rem',
                    }}
                  >
                    Select Subject Roster:
                  </label>

                  {!selectedClass.mySubjects || selectedClass.mySubjects.length === 0 ? (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: '#FFFBEB',
                        color: '#B45309',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        border: '1px solid #FCD34D',
                      }}
                    >
                      ⚠️ No specific subjects registered for this class. Select a subject from
                      system setup.
                    </div>
                  ) : (
                    <div className="ca-subjects-chips">
                      {selectedClass.mySubjects.map((s) => (
                        <button
                          key={s.id}
                          className={`ca-subject-chip ${selectedSubjectId === s.id ? 'active' : ''}`}
                          onClick={() => setSelectedSubjectId(s.id)}
                        >
                          <span>📚</span> {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: CA SCORES */}
              {activeTab === 'ca' && (
                <div>
                  {loadingScores ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      Loading student CA records...
                    </div>
                  ) : !selectedSubjectId ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      Select a subject above to enter CA scores.
                    </div>
                  ) : scores.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No enrolled students found for this class.
                    </div>
                  ) : (
                    <div className="ca-table-card">
                      <table className="ca-table">
                        <thead>
                          <tr>
                            <th>Student Details</th>
                            <th style={{ width: '130px', textAlign: 'center' }}>
                              1st Test ({termSetup?.caWeightFirst ?? 20} Max)
                            </th>
                            <th style={{ width: '130px', textAlign: 'center' }}>
                              2nd Test ({termSetup?.caWeightSecond ?? 20} Max)
                            </th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Total CA</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map((score) => {
                            const isLocked = score.isSubmitted;
                            const firstInitials = (score.studentName || 'S')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase();

                            return (
                              <tr key={score.studentId}>
                                <td>
                                  <div className="student-profile-cell">
                                    <div className="student-avatar-chip">{firstInitials}</div>
                                    <div>
                                      <strong style={{ color: '#0F172A', display: 'block' }}>
                                        {score.studentName}
                                      </strong>
                                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        {score.registrationNumber}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    className="score-input"
                                    min="0"
                                    max={termSetup?.caWeightFirst ?? 20}
                                    value={score.caData?.['First Test'] ?? ''}
                                    disabled={isLocked}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        score.studentId,
                                        'First Test',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    className="score-input"
                                    min="0"
                                    max={termSetup?.caWeightSecond ?? 20}
                                    value={score.caData?.['Second Test'] ?? ''}
                                    disabled={isLocked}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        score.studentId,
                                        'Second Test',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  style={{
                                    textAlign: 'center',
                                    fontWeight: '800',
                                    color: '#0F172A',
                                  }}
                                >
                                  {score.caTotal !== null ? score.caTotal : '-'} /{' '}
                                  {(termSetup?.caWeightFirst ?? 20) +
                                    (termSetup?.caWeightSecond ?? 20)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {isLocked ? (
                                    <span
                                      style={{
                                        background: '#DCFCE7',
                                        color: '#15803D',
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                      }}
                                    >
                                      Submitted
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        background: '#FEF3C7',
                                        color: '#D97706',
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                      }}
                                    >
                                      Draft
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="ca-table-footer">
                        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                          Showing {scores.length} enrolled students
                        </span>
                        <button
                          className="btn-save-draft"
                          onClick={handleSaveScores}
                          disabled={savingScores || scores.every((s) => s.isSubmitted)}
                        >
                          {savingScores ? 'Saving Draft...' : '💾 Save CA Draft'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXAM SCORES */}
              {activeTab === 'exam' && (
                <div>
                  {loadingScores ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      Loading student exam records...
                    </div>
                  ) : !selectedSubjectId ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      Select a subject above to enter exam scores.
                    </div>
                  ) : scores.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No enrolled students found for this class.
                    </div>
                  ) : (
                    <div className="ca-table-card">
                      <table className="ca-table">
                        <thead>
                          <tr>
                            <th>Student Details</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>CA Total</th>
                            <th style={{ width: '150px', textAlign: 'center' }}>
                              {isNurseryPrimary
                                ? 'Total Score (100 Max)'
                                : `Exam Score (${termSetup?.examWeight ?? 60} Max)`}
                            </th>
                            <th style={{ width: '110px', textAlign: 'center' }}>Grand Total</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Grade</th>
                            <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map((score) => {
                            const isLocked = score.isSubmitted;
                            const firstInitials = (score.studentName || 'S')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase();
                            const { grade, badgeClass } = getGradeLetter(score.total);

                            return (
                              <tr key={score.studentId}>
                                <td>
                                  <div className="student-profile-cell">
                                    <div className="student-avatar-chip">{firstInitials}</div>
                                    <div>
                                      <strong style={{ color: '#0F172A', display: 'block' }}>
                                        {score.studentName}
                                      </strong>
                                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        {score.registrationNumber}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td
                                  style={{
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    color: '#475569',
                                  }}
                                >
                                  {score.caTotal !== null ? score.caTotal : '-'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    className="score-input"
                                    min="0"
                                    max={isNurseryPrimary ? 100 : (termSetup?.examWeight ?? 60)}
                                    value={score.exam ?? ''}
                                    disabled={isLocked}
                                    onChange={(e) =>
                                      handleScoreChange(score.studentId, 'exam', e.target.value)
                                    }
                                  />
                                </td>
                                <td
                                  style={{
                                    textAlign: 'center',
                                    fontWeight: '800',
                                    color: '#0F172A',
                                    fontSize: '1rem',
                                  }}
                                >
                                  {score.total !== null ? score.total : '-'} / 100
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {score.total !== null && (
                                    <span className={`grade-badge ${badgeClass}`}>{grade}</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {isLocked ? (
                                    <span
                                      style={{
                                        background: '#DCFCE7',
                                        color: '#15803D',
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                      }}
                                    >
                                      Submitted
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        background: '#FEF3C7',
                                        color: '#D97706',
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                      }}
                                    >
                                      Draft
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="ca-table-footer">
                        <button
                          className="btn-save-draft"
                          onClick={handleSaveScores}
                          disabled={savingScores || scores.every((s) => s.isSubmitted)}
                        >
                          {savingScores ? 'Saving...' : '💾 Save Draft'}
                        </button>

                        <button
                          className="btn-submit-scores"
                          onClick={handleLockScores}
                          disabled={lockingScores || scores.every((s) => s.isSubmitted)}
                        >
                          {lockingScores ? 'Locking...' : '🔒 Submit & Lock Scores'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REVIEW & COMPUTE */}
              {activeTab === 'compile' && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '2rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        background: '#EFF6FF',
                        color: '#2563EB',
                        padding: '12px',
                        borderRadius: '14px',
                        fontSize: '1.5rem',
                      }}
                    >
                      📊
                    </div>
                    <div>
                      <h3
                        style={{ margin: 0, color: '#0F172A', fontSize: '1.2rem', fontWeight: 800 }}
                      >
                        Terminal Result Compilation & Audit
                      </h3>
                      <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                        Review subject submission statuses for{' '}
                        <strong>
                          {selectedClass.name} {selectedClass.section}
                        </strong>{' '}
                        before computing final report cards.
                      </p>
                    </div>
                  </div>

                  {statusLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Loading subject submission statuses...
                    </div>
                  ) : classStatus ? (
                    <>
                      <div style={{ marginBottom: '2rem' }}>
                        <h4
                          style={{
                            color: '#334155',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Subject Completion Matrix
                        </h4>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1rem',
                          }}
                        >
                          {classStatus.subjects.map((sub) => (
                            <div
                              key={sub.subjectId}
                              style={{
                                padding: '1.1rem',
                                borderRadius: '12px',
                                border: `1.5px solid ${sub.isSubmitted ? '#10B981' : '#CBD5E1'}`,
                                backgroundColor: sub.isSubmitted ? '#ECFDF5' : '#F8FAFC',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: '700',
                                  color: '#0F172A',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span>{sub.subjectName}</span>
                                <span>{sub.isSubmitted ? '✅' : '⏳'}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#64748B',
                                  marginTop: '0.35rem',
                                }}
                              >
                                {sub.scoresEntered} / {sub.totalStudents} Scores Recorded
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!classStatus.allSubmitted ? (
                        <div
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#991B1B',
                            padding: '1rem 1.25rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                          <span>
                            Not all subjects for this class have been locked & submitted. All
                            subject teachers must submit their scores before final result
                            compilation.
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '1.5rem',
                          }}
                        >
                          <button
                            className="btn-submit-scores"
                            onClick={handleCompile}
                            disabled={compiling}
                          >
                            {compiling
                              ? 'Computing Results...'
                              : `📊 Compute & Forward Results for ${selectedClass.name}`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Click below to check subject submission status and trigger result compilation.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
            >
              <div
                style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  padding: '12px',
                  borderRadius: '50%',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
              </div>
              <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem', fontWeight: 800 }}>
                Confirm Subject Score Lock
              </h3>
            </div>

            <p
              style={{
                color: '#475569',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
              }}
            >
              Are you sure you want to <strong>lock and submit</strong> scores for{' '}
              <strong>{selectedClass?.name}</strong>?
              <br />
              <br />
              Submitted scores will be locked from further edits until unlocked by an Administrator
              or Principal.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLockScores}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563EB',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                }}
              >
                Yes, Submit Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
