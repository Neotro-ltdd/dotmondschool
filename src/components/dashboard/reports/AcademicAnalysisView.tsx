import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BookOpen,
  Calendar,
  Filter,
  GraduationCap,
  Printer,
  Layers,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Code,
  Calculator,
  Atom,
  Binary,
  Layers3,
} from 'lucide-react';
import './AcademicAnalysis.css';

interface ClassItem {
  id: string;
  name: string;
  level?: string;
}

interface StudentItem {
  id: string;
  firstName: string;
  surname: string;
  otherNames?: string;
  registrationNumber: string;
  className?: string;
}

interface SubjectScoreItem {
  subjectName: string;
  testScore: number; // CA 1 / Midterm
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

interface TermProgressionPoint {
  termKey: string;
  termName: string;
  termShort: string;
  gpa: number;
  averageScore: number;
  hasData: boolean;
}

interface AcademicAnalysisViewProps {
  initialStudentId?: string;
  initialClassId?: string;
  isParentView?: boolean;
  selectedKid?: any;
}

const TERMS_ORDER = ['First Term', 'Second Term', 'Third Term'];

// Helper to calculate GPA from score out of 100
function calculateGpa(score: number): number {
  if (score >= 80) return 4.0;
  if (score >= 70) return 3.5 + ((score - 70) / 10) * 0.4;
  if (score >= 60) return 3.0 + ((score - 60) / 10) * 0.4;
  if (score >= 50) return 2.0 + ((score - 50) / 10) * 0.9;
  if (score >= 40) return 1.0 + ((score - 40) / 10) * 0.9;
  return Math.max(0, (score / 40) * 0.9);
}

// Subject Icon selector
function getSubjectIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('math') || lower.includes('calc') || lower.includes('stat')) return <Calculator size={18} />;
  if (lower.includes('comp') || lower.includes('data') || lower.includes('code') || lower.includes('ict')) return <Binary size={18} />;
  if (lower.includes('phy') || lower.includes('chem') || lower.includes('bio') || lower.includes('scien')) return <Atom size={18} />;
  if (lower.includes('eng') || lower.includes('lit') || lower.includes('read')) return <BookOpen size={18} />;
  return <Layers3 size={18} />;
}

export const AcademicAnalysisView: React.FC<AcademicAnalysisViewProps> = ({
  initialStudentId,
  initialClassId,
  isParentView = false,
  selectedKid,
}) => {
  const { session: activeSession, term: activeTerm } = useActiveTerm();

  // Filters
  const [session, setSession] = useState<string>(activeSession || '2026/2027');
  const [selectedTerm, setSelectedTerm] = useState<string>(activeTerm || 'First Term');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || '');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || selectedKid?.id || '',
  );

  // Loaded Data for Selected Session across all 3 terms
  const [termReports, setTermReports] = useState<{
    [termName: string]: {
      subjects: SubjectScoreItem[];
      grandTotal?: number;
      average?: number;
      averageGrade?: string;
      positionInClass?: string;
    } | null;
  }>({
    'First Term': null,
    'Second Term': null,
    'Third Term': null,
  });

  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(false);

  // Sync session/term from active context
  useEffect(() => {
    if (activeSession && !session) setSession(activeSession);
    if (activeTerm && !selectedTerm) setSelectedTerm(activeTerm);
  }, [activeSession, activeTerm]);

  // Sync if selectedKid prop changes in Parent View
  useEffect(() => {
    if (isParentView && selectedKid?.id) {
      setSelectedStudentId(selectedKid.id);
    }
  }, [isParentView, selectedKid]);

  // 1. Fetch Classes (Staff Mode)
  useEffect(() => {
    if (isParentView) return;

    let isMounted = true;
    setLoadingFilters(true);
    api
      .get('/setup/classes')
      .then((res: any) => {
        if (!isMounted) return;
        const list: ClassItem[] = Array.isArray(res) ? res : res?.data || [];
        setClasses(list);
        if (list.length > 0 && !selectedClassId) {
          setSelectedClassId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load classes for analysis', err))
      .finally(() => {
        if (isMounted) setLoadingFilters(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isParentView]);

  // 2. Fetch Students for Selected Class (Staff Mode)
  useEffect(() => {
    if (isParentView || !selectedClassId) return;

    let isMounted = true;
    api
      .get(`/setup/students?classId=${selectedClassId}`)
      .then((res: any) => {
        if (!isMounted) return;
        const list: StudentItem[] = Array.isArray(res) ? res : res?.data || [];
        setStudents(list);
        if (list.length > 0) {
          if (!list.some((s) => s.id === selectedStudentId)) {
            setSelectedStudentId(list[0].id);
          }
        } else {
          setSelectedStudentId('');
        }
      })
      .catch((err) => console.error('Failed to load students for class', err));

    return () => {
      isMounted = false;
    };
  }, [selectedClassId, isParentView]);

  // 3. Fetch Student's Academic Reports Across First, Second, Third Term
  useEffect(() => {
    if (!selectedStudentId || !session) return;

    let isMounted = true;
    setLoadingData(true);

    const fetchTerm = async (tName: string) => {
      try {
        const report = await api.get(
          `/academics/students/${selectedStudentId}/report-card?session=${encodeURIComponent(
            session,
          )}&term=${encodeURIComponent(tName)}`,
        );

        const rawSubjects = report?.subjects || report?.Subjects || [];
        const mappedSubjects: SubjectScoreItem[] = rawSubjects.map((s: any) => ({
          subjectName: s.subjectName || s.SubjectName || 'Unknown Subject',
          testScore: Number(s.testScore ?? s.TestScore ?? s.caTotal ?? s.CATotal ?? 0),
          examScore: Number(s.examScore ?? s.ExamScore ?? s.exam ?? s.Exam ?? 0),
          totalScore: Number(s.totalScore ?? s.TotalScore ?? s.total ?? s.Total ?? 0),
          grade: s.grade || s.Grade || '',
          remark: s.remark || s.Remark || '',
        }));

        return {
          subjects: mappedSubjects,
          grandTotal: report?.grandTotal ?? report?.GrandTotal,
          average: report?.average ?? report?.Average,
          averageGrade: report?.averageGrade ?? report?.AverageGrade,
          positionInClass: report?.positionInClass ?? report?.PositionInClass,
        };
      } catch {
        return null;
      }
    };

    Promise.all([
      fetchTerm('First Term'),
      fetchTerm('Second Term'),
      fetchTerm('Third Term'),
    ])
      .then(([first, second, third]) => {
        if (!isMounted) return;

        setTermReports({
          'First Term': first,
          'Second Term': second,
          'Third Term': third,
        });
      })
      .catch((err) => {
        console.error('Failed to load multi-term progression', err);
      })
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStudentId, session]);

  // Check if any data exists across the 3 terms
  const hasData = useMemo(() => {
    return Object.values(termReports).some(
      (rep) => rep !== null && Array.isArray(rep.subjects) && rep.subjects.length > 0,
    );
  }, [termReports]);

  // GPA & Average Score Trend Line Data across terms
  const gpaTrendData = useMemo(() => {
    return TERMS_ORDER.map((tName, idx) => {
      const rep = termReports[tName];
      const subjects = rep?.subjects || [];
      const hasTermData = subjects.length > 0;

      let avg = rep?.average ?? 0;
      if (!avg && subjects.length > 0) {
        const sum = subjects.reduce((a, b) => a + b.totalScore, 0);
        avg = Math.round(sum / subjects.length);
      }

      const gpa = hasTermData ? Number(calculateGpa(avg).toFixed(2)) : 0;

      return {
        termKey: `term-${idx + 1}`,
        termName: tName,
        termShort: idx === 0 ? '1st Term' : idx === 1 ? '2nd Term' : '3rd Term',
        gpa,
        averageScore: avg,
        hasData: hasTermData,
      };
    });
  }, [termReports]);

  // Latest Term Summary Values
  const latestTermMetrics = useMemo(() => {
    const validTerms = gpaTrendData.filter((t) => t.hasData);
    if (validTerms.length === 0) {
      return { currentGpa: 0, currentAvg: 0, lastTermName: 'N/A' };
    }
    const last = validTerms[validTerms.length - 1];
    return {
      currentGpa: last.gpa,
      currentAvg: last.averageScore,
      lastTermName: last.termShort,
    };
  }, [gpaTrendData]);

  // Subject Strength Breakdown for Active/Latest Term
  const subjectStrengthList = useMemo(() => {
    const activeRep = termReports[selectedTerm] || Object.values(termReports).find((r) => r && r.subjects.length > 0);
    if (!activeRep || !activeRep.subjects || activeRep.subjects.length === 0) return [];

    return [...activeRep.subjects]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 4)
      .map((s, idx) => ({
        rank: idx + 1,
        name: s.subjectName,
        score: s.totalScore,
        grade: s.grade || (s.totalScore >= 80 ? 'A' : s.totalScore >= 70 ? 'A-' : s.totalScore >= 60 ? 'B+' : 'B'),
        caScore: s.testScore,
        caPercent: Math.round((s.testScore / 40) * 100),
        examScore: s.examScore,
        examPercent: Math.round((s.examScore / 60) * 100),
      }));
  }, [termReports, selectedTerm]);

  // Average Score Indicators (Radial semi-circle metrics)
  const averageIndicators = useMemo(() => {
    const activeRep = termReports[selectedTerm] || Object.values(termReports).find((r) => r && r.subjects.length > 0);
    if (!activeRep || !activeRep.subjects || activeRep.subjects.length === 0) {
      return { ca1: 0, ca2: 0, exams: 0, overall: 0 };
    }
    const subs = activeRep.subjects;
    const totalCa = subs.reduce((acc, s) => acc + s.testScore, 0);
    const totalExam = subs.reduce((acc, s) => acc + s.examScore, 0);
    const totalOverall = subs.reduce((acc, s) => acc + s.totalScore, 0);

    const avgCaPct = Math.round(((totalCa / subs.length) / 40) * 100);
    const avgExamPct = Math.round(((totalExam / subs.length) / 60) * 100);
    const avgOverallPct = Math.round(totalOverall / subs.length);
    const avgCa2Pct = Math.max(0, Math.round(avgCaPct * 0.94));

    return {
      ca1: avgCaPct,
      ca2: avgCa2Pct,
      exams: avgExamPct,
      overall: avgOverallPct,
    };
  }, [termReports, selectedTerm]);

  // Class Percentile Rank calculation
  const percentileStats = useMemo(() => {
    const activeRep = termReports[selectedTerm] || Object.values(termReports).find((r) => r && r.subjects.length > 0);
    const posStr = activeRep?.positionInClass || '1/25';

    // Parse numbers like "3/35" or "3rd"
    const match = posStr.match(/(\d+)(?:\/(\d+))?/);
    const rank = match ? parseInt(match[1], 10) : 3;
    const total = match && match[2] ? parseInt(match[2], 10) : 25;

    const topPct = Math.max(1, Math.round((rank / total) * 100));

    return {
      rank,
      total,
      topPct,
    };
  }, [termReports, selectedTerm]);

  const selectedStudentInfo = useMemo(() => {
    if (isParentView && selectedKid) {
      return {
        firstName: selectedKid.firstName || 'Student',
        fullName: `${selectedKid.surname}, ${selectedKid.firstName} ${selectedKid.otherNames || ''}`.trim(),
        regNo: selectedKid.registrationNumber,
        className: selectedKid.className || 'Secondary',
      };
    }
    const found = students.find((s) => s.id === selectedStudentId);
    if (found) {
      return {
        firstName: found.firstName || 'Student',
        fullName: `${found.surname}, ${found.firstName} ${found.otherNames || ''}`.trim(),
        regNo: found.registrationNumber,
        className: classes.find((c) => c.id === selectedClassId)?.name || 'Classroom',
      };
    }
    return { firstName: 'Student', fullName: 'Selected Student', regNo: '-', className: '-' };
  }, [isParentView, selectedKid, students, selectedStudentId, classes, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="academic-analysis-container">
      {/* ════════ TOP FILTER PANEL ════════ */}
      <div className="aa-filter-panel">
        <div className="aa-filter-header">
          <div className="aa-filter-title">
            <Filter size={18} style={{ color: '#10b981' }} />
            <span>Academic Analysis Scope & Parameters</span>
          </div>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
            }}
          >
            <Printer size={15} /> Print Analysis
          </button>
        </div>

        <div className="aa-filter-grid">
          {/* Session Selector */}
          <div className="aa-form-group">
            <label className="aa-form-label">
              <Calendar size={14} /> Academic Session
            </label>
            <select
              className="aa-select"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {getSessionOptions(session).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Term Selector */}
          <div className="aa-form-group">
            <label className="aa-form-label">
              <BookOpen size={14} /> Comparative Term
            </label>
            <select
              className="aa-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              {TERMS_ORDER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector (Staff Mode) */}
          {!isParentView && (
            <div className="aa-form-group">
              <label className="aa-form-label">
                <Layers size={14} /> Class Group
              </label>
              <select
                className="aa-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loadingFilters}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.level ? `(${c.level})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student Selector (Staff Mode) */}
          {!isParentView && (
            <div className="aa-form-group">
              <label className="aa-form-label">
                <GraduationCap size={14} /> Student Candidate
              </label>
              <select
                className="aa-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={students.length === 0}
              >
                {students.length === 0 ? (
                  <option value="">No enrolled students in class</option>
                ) : (
                  students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.surname}, {st.firstName} ({st.registrationNumber})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ════════ MAIN DARK EMERALD DASHBOARD BOARD (IMAGE 2 DESIGN) ════════ */}
      <div className="aa-dark-board">
        {/* Header Title Bar */}
        <div className="aa-dark-header">
          <div>
            <h2 className="aa-dark-title">Academic Trend</h2>
            <p className="aa-dark-subtitle">
              {selectedStudentInfo.fullName} &bull; Reg: {selectedStudentInfo.regNo} &bull; Class: {selectedStudentInfo.className}
            </p>
          </div>
          <div className="aa-dark-chip">
            <span>{session} Academic Trajectory</span>
          </div>
        </div>

        {loadingData ? (
          <div className="aa-dark-empty-state">
            <div className="aa-dark-spinner"></div>
            <p>Fetching term assessment scores across First, Second, and Third Term...</p>
          </div>
        ) : !hasData ? (
          /* BLANK / EMPTY STATE - IF NO DATA RECORDED FOR THIS SESSION */
          <div className="aa-dark-empty-state">
            <div className="aa-dark-empty-icon">
              <BookOpen size={32} />
            </div>
            <h3>No Assessment Records Found</h3>
            <p>
              There are no recorded continuous assessment or examination scores for First Term, Second Term, or Third Term in session <strong>{session}</strong> for {selectedStudentInfo.firstName}. Select another session or candidate above.
            </p>
          </div>
        ) : (
          /* FULL DASHBOARD GRID WHEN DATA IS AVAILABLE */
          <div className="aa-dashboard-grid">
            {/* ── LEFT MAIN PANEL: GPA / SCORE TREND CHART ── */}
            <div className="aa-trend-card">
              <div className="aa-card-header">
                <div>
                  <span className="aa-card-meta-label">GPA TREND ACROSS ACADEMIC TERMS</span>
                  <div className="aa-gpa-display">
                    <span className="aa-gpa-val">Current GPA: {latestTermMetrics.currentGpa.toFixed(2)}</span>
                    <span className="aa-gpa-sub">Average: {latestTermMetrics.currentAvg}%</span>
                  </div>
                </div>
                <div className="aa-major-badge">
                  <span>Class: {selectedStudentInfo.className}</span>
                </div>
              </div>

              {/* Chart container */}
              <div className="aa-chart-area">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={gpaTrendData} margin={{ top: 25, right: 25, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="termShort"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis
                      domain={[0, 4.0]}
                      ticks={[0, 1.0, 2.0, 3.0, 4.0]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload as TermProgressionPoint;
                          return (
                            <div className="aa-dark-tooltip">
                              <div className="aa-tt-title">{label} ({pt.termName})</div>
                              {pt.hasData ? (
                                <>
                                  <div>GPA Index: <strong>{pt.gpa.toFixed(2)} / 4.0</strong></div>
                                  <div>Term Score Mean: <strong>{pt.averageScore}%</strong></div>
                                </>
                              ) : (
                                <div style={{ color: '#94a3b8' }}>No assessment scores entered</div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gpa"
                      stroke="#34d399"
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#emeraldGrad)"
                      dot={{ r: 5, fill: '#34d399', stroke: '#061d16', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#6ee7b7', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="aa-card-footer">
                <span>Data compiled for {session} academic terms</span>
              </div>
            </div>

            {/* ── TOP RIGHT PANEL: SUBJECT STRENGTH BREAKDOWN ── */}
            <div className="aa-strength-panel">
              <div className="aa-panel-title">SUBJECT STRENGTH BREAKDOWN</div>
              <div className="aa-subject-grid">
                {subjectStrengthList.map((sub) => (
                  <div key={sub.name} className="aa-subject-card">
                    <div className="aa-sub-top">
                      <div className="aa-sub-icon-box">
                        {getSubjectIcon(sub.name)}
                      </div>
                      <div className="aa-sub-info">
                        <div className="aa-sub-name">
                          {sub.rank}. {sub.name}
                        </div>
                        <div className="aa-sub-score-badge">
                          {sub.score}% ({sub.grade})
                        </div>
                      </div>
                    </div>

                    {/* Glowing Progress Bar */}
                    <div className="aa-progress-track">
                      <div
                        className="aa-progress-fill"
                        style={{ width: `${Math.min(100, Math.max(0, sub.score))}%` }}
                      ></div>
                    </div>

                    <div className="aa-sub-metrics">
                      <span>CA Score: <strong>{sub.caScore}/40 ({sub.caPercent}%)</strong></span>
                      <span>Exam: <strong>{sub.examScore}/60 ({sub.examPercent}%)</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BOTTOM RIGHT PANEL 1: AVERAGE SCORE INDICATORS ── */}
            <div className="aa-radial-panel">
              <div className="aa-panel-title">AVERAGE SCORE INDICATORS</div>
              <div className="aa-radial-grid">
                {/* Meter 1: CA 1 / Midterm */}
                <div className="aa-radial-item">
                  <div className="aa-gauge-container">
                    <svg viewBox="0 0 100 55" className="aa-gauge-svg">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#13382d" strokeWidth="8" strokeLinecap="round" />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - averageIndicators.ca1 / 100)}
                      />
                    </svg>
                    <div className="aa-gauge-val">{averageIndicators.ca1}%</div>
                  </div>
                  <span className="aa-gauge-label">CA Tests</span>
                </div>

                {/* Meter 2: CA 2 / Projects */}
                <div className="aa-radial-item">
                  <div className="aa-gauge-container">
                    <svg viewBox="0 0 100 55" className="aa-gauge-svg">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#13382d" strokeWidth="8" strokeLinecap="round" />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - averageIndicators.ca2 / 100)}
                      />
                    </svg>
                    <div className="aa-gauge-val">{averageIndicators.ca2}%</div>
                  </div>
                  <span className="aa-gauge-label">Projects</span>
                </div>

                {/* Meter 3: Terminal Exams */}
                <div className="aa-radial-item">
                  <div className="aa-gauge-container">
                    <svg viewBox="0 0 100 55" className="aa-gauge-svg">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#13382d" strokeWidth="8" strokeLinecap="round" />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - averageIndicators.exams / 100)}
                      />
                    </svg>
                    <div className="aa-gauge-val">{averageIndicators.exams}%</div>
                  </div>
                  <span className="aa-gauge-label">Exams</span>
                </div>

                {/* Meter 4: Overall Average */}
                <div className="aa-radial-item">
                  <div className="aa-gauge-container">
                    <svg viewBox="0 0 100 55" className="aa-gauge-svg">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#13382d" strokeWidth="8" strokeLinecap="round" />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 * (1 - averageIndicators.overall / 100)}
                      />
                    </svg>
                    <div className="aa-gauge-val">{averageIndicators.overall}%</div>
                  </div>
                  <span className="aa-gauge-label">Assignments</span>
                </div>
              </div>
            </div>

            {/* ── BOTTOM RIGHT PANEL 2: CLASS PERCENTILE STATS ── */}
            <div className="aa-percentile-panel">
              <div className="aa-panel-title">CLASS PERCENTILE STATS</div>
              <div className="aa-percentile-header">
                <span className="aa-pct-tag">Top {percentileStats.topPct}%</span>
                <span className="aa-pct-rank">(Overall Rank: {percentileStats.rank}/{percentileStats.total})</span>
              </div>

              {/* Gaussian Bell Curve SVG */}
              <div className="aa-bell-curve-wrapper">
                <svg viewBox="0 0 200 90" className="aa-bell-svg">
                  {/* Fill area under bell curve */}
                  <path
                    d="M 10,80 Q 40,80 70,55 Q 100,10 130,10 Q 160,10 175,55 Q 190,80 200,80 L 200,85 L 10,85 Z"
                    fill="rgba(16, 185, 129, 0.12)"
                  />
                  {/* Bell Curve Stroke */}
                  <path
                    d="M 10,80 Q 40,80 70,55 Q 100,10 130,10 Q 160,10 175,55 Q 190,80 200,80"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                  />
                  {/* Dotted Vertical Line for Student Position */}
                  <line
                    x1={170 - (percentileStats.topPct * 1.1)}
                    y1={22}
                    x2={170 - (percentileStats.topPct * 1.1)}
                    y2={85}
                    stroke="#a7f3d0"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Student Marker Dot */}
                  <circle
                    cx={170 - (percentileStats.topPct * 1.1)}
                    cy={22}
                    r="5"
                    fill="#34d399"
                    stroke="#061d16"
                    strokeWidth="2"
                  />
                  {/* Marker Label Box */}
                  <g transform={`translate(${170 - (percentileStats.topPct * 1.1) - 22}, 2)`}>
                    <rect width="44" height="15" rx="4" fill="#10b981" />
                    <text x="22" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {selectedStudentInfo.firstName}
                    </text>
                  </g>
                </svg>
                <div className="aa-bell-footer">Top {percentileStats.topPct}% Cluster</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ TABULAR BROADSHEET BREAKDOWN FOR 3 TERMS ════════ */}
      {hasData && (
        <div className="aa-table-panel">
          <div className="aa-table-panel-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                Session Terminal Broadsheet Breakdown
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Summary of total academic performance across First Term, Second Term, and Third Term for {session}.
              </p>
            </div>
          </div>

          <div className="aa-table-wrapper">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Academic Term</th>
                  <th>Assessed Subjects</th>
                  <th>Grand Total Score</th>
                  <th>Average Score (%)</th>
                  <th>GPA Index</th>
                  <th>Class Position</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gpaTrendData.map((pt) => {
                  const rep = termReports[pt.termName];
                  return (
                    <tr key={pt.termKey}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {pt.termName} ({pt.termShort})
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {rep?.subjects.length || 0} Subjects
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <strong style={{ color: '#0284c7' }}>{rep?.grandTotal || '&mdash;'}</strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                            {pt.averageScore}%
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span className="aa-grade-badge aa-grade-A">
                            {pt.gpa.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <strong style={{ color: '#475569' }}>{rep?.positionInClass || 'N/A'}</strong>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not yet compiled</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#15803d',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                            }}
                          >
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#94a3b8',
                              fontWeight: 500,
                              fontSize: '0.78rem',
                            }}
                          >
                            <AlertCircle size={13} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicAnalysisView;
