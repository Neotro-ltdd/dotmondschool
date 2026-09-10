import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Calendar,
  Filter,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  RefreshCw,
  Layers,
  BarChart2,
  Target,
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
  testScore: number; // CA
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

interface TermProgressionPoint {
  termKey: string;
  termName: string;
  termShort: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  hasData: boolean;
}

interface AcademicAnalysisViewProps {
  initialStudentId?: string;
  initialClassId?: string;
  isParentView?: boolean;
  selectedKid?: any;
}

const TERMS_ORDER = ['First Term', 'Second Term', 'Third Term'];

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

  // Subjects & Selection
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Loaded Data
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

  // Sync session if activeTerm updates
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
          // If current selectedStudentId is not in this class, select first student
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

  // 3. Fetch Student's Academic Reports Across All 3 Terms
  useEffect(() => {
    if (!selectedStudentId || !session) return;

    let isMounted = true;
    setLoadingData(true);

    const fetchTerm = async (tName: string) => {
      try {
        // Try standard report-card endpoint
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
        // If 404 or not computed yet, return null
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

        const reportsMap = {
          'First Term': first,
          'Second Term': second,
          'Third Term': third,
        };
        setTermReports(reportsMap);

        // Gather all unique subjects assessed across any term
        const subjectSet = new Set<string>();
        [first, second, third].forEach((r) => {
          r?.subjects.forEach((s) => {
            if (s.subjectName && s.subjectName.trim()) {
              subjectSet.add(s.subjectName.trim());
            }
          });
        });

        const subjectList = Array.from(subjectSet).sort();
        setAvailableSubjects(subjectList);

        // If current subject is not in list, select the first available subject
        if (subjectList.length > 0) {
          if (!selectedSubject || !subjectSet.has(selectedSubject)) {
            setSelectedSubject(subjectList[0]);
          }
        } else {
          setSelectedSubject('');
        }
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

  // Progression Line Graph Data for Selected Subject
  const progressionData: TermProgressionPoint[] = useMemo(() => {
    if (!selectedSubject) return [];

    return TERMS_ORDER.map((tName, idx) => {
      const termData = termReports[tName];
      const match = termData?.subjects.find(
        (s) => s.subjectName.toLowerCase() === selectedSubject.toLowerCase(),
      );

      return {
        termKey: `term-${idx + 1}`,
        termName: tName,
        termShort: idx === 0 ? '1st Term' : idx === 1 ? '2nd Term' : '3rd Term',
        ca: match ? match.testScore : 0,
        exam: match ? match.examScore : 0,
        total: match ? match.totalScore : 0,
        grade: match ? match.grade : '-',
        remark: match ? match.remark : 'No Record',
        hasData: !!match,
      };
    });
  }, [termReports, selectedSubject]);

  // Current Subject KPI Statistics
  const subjectKpis = useMemo(() => {
    const validTerms = progressionData.filter((p) => p.hasData);
    if (validTerms.length === 0) {
      return {
        hasData: false,
        latestTotal: 0,
        latestGrade: '-',
        latestCa: 0,
        latestExam: 0,
        annualAverage: 0,
        delta: 0,
        deltaType: 'neutral' as 'positive' | 'negative' | 'neutral',
        highestTerm: '-',
        bestScore: 0,
      };
    }

    const latest = validTerms[validTerms.length - 1];
    const totalSum = validTerms.reduce((acc, curr) => acc + curr.total, 0);
    const annualAvg = Math.round(totalSum / validTerms.length);

    // Delta between last two recorded terms
    let delta = 0;
    let deltaType: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (validTerms.length >= 2) {
      const prev = validTerms[validTerms.length - 2];
      delta = latest.total - prev.total;
      if (delta > 0) deltaType = 'positive';
      else if (delta < 0) deltaType = 'negative';
    }

    // Best term
    let bestScore = -1;
    let highestTerm = '-';
    validTerms.forEach((p) => {
      if (p.total > bestScore) {
        bestScore = p.total;
        highestTerm = p.termShort;
      }
    });

    return {
      hasData: true,
      latestTotal: latest.total,
      latestGrade: latest.grade,
      latestCa: latest.ca,
      latestExam: latest.exam,
      annualAverage: annualAvg,
      delta,
      deltaType,
      highestTerm,
      bestScore,
    };
  }, [progressionData]);

  // Cross-Subject Comparison for the Selected Term
  const crossSubjectData = useMemo(() => {
    const activeTermData = termReports[selectedTerm];
    if (!activeTermData || !activeTermData.subjects || activeTermData.subjects.length === 0) {
      return [];
    }

    return activeTermData.subjects.map((s) => ({
      name: s.subjectName,
      total: s.totalScore,
      ca: s.testScore,
      exam: s.examScore,
      grade: s.grade,
    }));
  }, [termReports, selectedTerm]);

  const handlePrint = () => {
    window.print();
  };

  const selectedStudentInfo = useMemo(() => {
    if (isParentView && selectedKid) {
      return {
        name: `${selectedKid.surname}, ${selectedKid.firstName} ${selectedKid.otherNames || ''}`.trim(),
        regNo: selectedKid.registrationNumber,
        className: selectedKid.className,
      };
    }
    const found = students.find((s) => s.id === selectedStudentId);
    if (found) {
      return {
        name: `${found.surname}, ${found.firstName} ${found.otherNames || ''}`.trim(),
        regNo: found.registrationNumber,
        className: classes.find((c) => c.id === selectedClassId)?.name || 'Classroom',
      };
    }
    return { name: 'Student Selected', regNo: '-', className: '-' };
  }, [isParentView, selectedKid, students, selectedStudentId, classes, selectedClassId]);

  return (
    <div className="academic-analysis-container">
      {/* ════════ FILTER & SELECTION PANEL ════════ */}
      <div className="aa-filter-panel">
        <div className="aa-filter-header">
          <div className="aa-filter-title">
            <Filter size={18} style={{ color: '#000080' }} />
            <span>Academic Analysis Scope & Parameters</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
              }}
              title="Print Academic Analysis Sheet"
            >
              <Printer size={15} /> Print Analysis
            </button>
          </div>
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

          {/* Reference Term */}
          <div className="aa-form-group">
            <label className="aa-form-label">
              <ClockIcon size={14} /> Comparative Term
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

        {/* Dynamic Subject Selector Chips */}
        {availableSubjects.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <BookOpen size={14} /> Assessed Subjects (Click to Analyze Progression):
            </div>
            <div className="aa-subjects-strip">
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`aa-subject-chip ${selectedSubject === sub ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(sub)}
                >
                  <BookOpen size={13} />
                  <span>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACTIVE SELECTION BANNER ════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: '#e0e7ff',
              color: '#3730a3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            {selectedStudentInfo.name ? selectedStudentInfo.name[0] : 'S'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>
              {selectedStudentInfo.name}
            </h4>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Reg: <strong>{selectedStudentInfo.regNo}</strong> &bull; Class:{' '}
              <strong>{selectedStudentInfo.className}</strong> &bull; Analyzing Subject:{' '}
              <strong style={{ color: '#000080' }}>
                {selectedSubject || 'None Selected'}
              </strong>
            </p>
          </div>
        </div>

        {selectedSubject && (
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
          >
            {session} Multi-Term Trajectory
          </span>
        )}
      </div>

      {/* ════════ KPI METRICS SECTION ════════ */}
      {loadingData ? (
        <div className="aa-empty-state">
          <div className="aa-spinner"></div>
          <p>Compiling terminal results and comparative progression graph...</p>
        </div>
      ) : !selectedSubject || !subjectKpis.hasData ? (
        <div className="aa-empty-state">
          <div className="aa-empty-icon">
            <BookOpen size={28} />
          </div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>No Assessment Record Found</h3>
          <p style={{ maxWidth: 460 }}>
            There are no recorded continuous assessment or examination scores for this subject in{' '}
            {session}. Select another subject or academic session above.
          </p>
        </div>
      ) : (
        <>
          <div className="aa-kpi-grid">
            {/* KPI 1: Latest Term Score */}
            <div
              className="aa-kpi-card"
              style={{
                ['--kpi-accent' as any]: '#000080',
                ['--kpi-bg' as any]: '#eff6ff',
                ['--kpi-color' as any]: '#000080',
              }}
            >
              <div className="aa-kpi-top">
                <span className="aa-kpi-label">Latest Recorded Score</span>
                <div className="aa-kpi-icon-box">
                  <Award size={18} />
                </div>
              </div>
              <div className="aa-kpi-val-row">
                <span className="aa-kpi-value">{subjectKpis.latestTotal}</span>
                <span className={`aa-grade-badge aa-grade-${subjectKpis.latestGrade}`}>
                  Grade {subjectKpis.latestGrade}
                </span>
              </div>
              <p className="aa-kpi-subtext">
                Breakdown: CA <strong>{subjectKpis.latestCa}</strong>/40 &bull; Exam{' '}
                <strong>{subjectKpis.latestExam}</strong>/60
              </p>
            </div>

            {/* KPI 2: Term-over-Term Progression */}
            <div
              className="aa-kpi-card"
              style={{
                ['--kpi-accent' as any]:
                  subjectKpis.deltaType === 'positive'
                    ? '#16a34a'
                    : subjectKpis.deltaType === 'negative'
                      ? '#dc2626'
                      : '#64748b',
                ['--kpi-bg' as any]:
                  subjectKpis.deltaType === 'positive'
                    ? '#f0fdf4'
                    : subjectKpis.deltaType === 'negative'
                      ? '#fef2f2'
                      : '#f8fafc',
                ['--kpi-color' as any]:
                  subjectKpis.deltaType === 'positive'
                    ? '#16a34a'
                    : subjectKpis.deltaType === 'negative'
                      ? '#dc2626'
                      : '#64748b',
              }}
            >
              <div className="aa-kpi-top">
                <span className="aa-kpi-label">Progression Trend</span>
                <div className="aa-kpi-icon-box">
                  {subjectKpis.deltaType === 'positive' ? (
                    <TrendingUp size={18} />
                  ) : subjectKpis.deltaType === 'negative' ? (
                    <TrendingDown size={18} />
                  ) : (
                    <Target size={18} />
                  )}
                </div>
              </div>
              <div className="aa-kpi-val-row">
                <span
                  className="aa-kpi-value"
                  style={{
                    color:
                      subjectKpis.deltaType === 'positive'
                        ? '#16a34a'
                        : subjectKpis.deltaType === 'negative'
                          ? '#dc2626'
                          : '#0f172a',
                  }}
                >
                  {subjectKpis.delta > 0 ? `+${subjectKpis.delta}` : subjectKpis.delta}%
                </span>
                <span className={`aa-trend-badge aa-trend-${subjectKpis.deltaType}`}>
                  {subjectKpis.deltaType === 'positive'
                    ? '▲ Improved'
                    : subjectKpis.deltaType === 'negative'
                      ? '▼ Dropped'
                      : '● Stable'}
                </span>
              </div>
              <p className="aa-kpi-subtext">Compared against immediate prior term</p>
            </div>

            {/* KPI 3: Annual Average Score */}
            <div
              className="aa-kpi-card"
              style={{
                ['--kpi-accent' as any]: '#7c3aed',
                ['--kpi-bg' as any]: '#f5f3ff',
                ['--kpi-color' as any]: '#7c3aed',
              }}
            >
              <div className="aa-kpi-top">
                <span className="aa-kpi-label">Session Cumulative Average</span>
                <div className="aa-kpi-icon-box">
                  <BarChart2 size={18} />
                </div>
              </div>
              <div className="aa-kpi-val-row">
                <span className="aa-kpi-value">{subjectKpis.annualAverage}%</span>
              </div>
              <p className="aa-kpi-subtext">Cumulative mean across all active terms</p>
            </div>

            {/* KPI 4: Peak Term Performance */}
            <div
              className="aa-kpi-card"
              style={{
                ['--kpi-accent' as any]: '#059669',
                ['--kpi-bg' as any]: '#ecfdf5',
                ['--kpi-color' as any]: '#059669',
              }}
            >
              <div className="aa-kpi-top">
                <span className="aa-kpi-label">Peak Performance Term</span>
                <div className="aa-kpi-icon-box">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="aa-kpi-val-row">
                <span className="aa-kpi-value">{subjectKpis.bestScore}</span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#059669',
                    background: '#d1fae5',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  {subjectKpis.highestTerm}
                </span>
              </div>
              <p className="aa-kpi-subtext">Highest score registered this session</p>
            </div>
          </div>

          {/* ════════ CHARTS SECTION ════════ */}
          <div className="aa-charts-grid">
            {/* Chart 1: 3-Term Progression Line Graph */}
            <div className="aa-chart-card">
              <div className="aa-chart-card-header">
                <div>
                  <h3 className="aa-chart-title">
                    <TrendingUp size={20} style={{ color: '#000080' }} />
                    Multi-Term Progress: {selectedSubject}
                  </h3>
                  <p className="aa-chart-subtitle">
                    Tracking 1st, 2nd & 3rd term progression with continuous assessment and exam
                    trajectories.
                  </p>
                </div>
                <div className="aa-chart-legend-pills">
                  <div className="aa-chart-legend-pill">
                    <span className="aa-legend-dot" style={{ background: '#000080' }}></span>
                    <span>Total Score (100)</span>
                  </div>
                  <div className="aa-chart-legend-pill">
                    <span className="aa-legend-dot" style={{ background: '#0284c7' }}></span>
                    <span>C.A. (40)</span>
                  </div>
                  <div className="aa-chart-legend-pill">
                    <span className="aa-legend-dot" style={{ background: '#16a34a' }}></span>
                    <span>Exam (60)</span>
                  </div>
                </div>
              </div>

              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                  initialDimension={{ width: 500, height: 320 }}
                >
                  <LineChart
                    data={progressionData}
                    margin={{ top: 20, right: 25, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="termShort"
                      stroke="#64748b"
                      fontSize={13}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as TermProgressionPoint;
                          return (
                            <div
                              style={{
                                background: '#0f172a',
                                color: '#ffffff',
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                fontSize: '0.82rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  marginBottom: '0.4rem',
                                  color: '#93c5fd',
                                }}
                              >
                                {label} ({data.termName})
                              </div>
                              {data.hasData ? (
                                <>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '1.5rem',
                                      marginBottom: '0.2rem',
                                    }}
                                  >
                                    <span style={{ color: '#cbd5e1' }}>Total Mark:</span>
                                    <strong style={{ color: '#38bdf8' }}>{data.total} / 100</strong>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '1.5rem',
                                      marginBottom: '0.2rem',
                                    }}
                                  >
                                    <span style={{ color: '#cbd5e1' }}>Continuous Assessment:</span>
                                    <strong>{data.ca} / 40</strong>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '1.5rem',
                                      marginBottom: '0.2rem',
                                    }}
                                  >
                                    <span style={{ color: '#cbd5e1' }}>Examination:</span>
                                    <strong>{data.exam} / 60</strong>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '1.5rem',
                                      marginTop: '0.35rem',
                                      paddingTop: '0.35rem',
                                      borderTop: '1px solid #334155',
                                    }}
                                  >
                                    <span style={{ color: '#cbd5e1' }}>Grade / Remark:</span>
                                    <strong style={{ color: '#4ade80' }}>
                                      {data.grade} ({data.remark})
                                    </strong>
                                  </div>
                                </>
                              ) : (
                                <div style={{ color: '#94a3b8' }}>No recorded terminal results</div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Pass Line (50)',
                        position: 'insideBottomRight',
                        fill: '#d97706',
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Distinction (75)',
                        position: 'insideTopRight',
                        fill: '#059669',
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#000080"
                      strokeWidth={3.5}
                      dot={{ r: 6, fill: '#000080', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#1d4ed8' }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="ca"
                      stroke="#0284c7"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#0284c7' }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="exam"
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#16a34a' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cross-Subject Competency for Current Term */}
            <div className="aa-chart-card">
              <div className="aa-chart-card-header">
                <div>
                  <h3 className="aa-chart-title">
                    <BarChart2 size={20} style={{ color: '#4f46e5' }} />
                    Cross-Subject Distribution
                  </h3>
                  <p className="aa-chart-subtitle">
                    Competency profile across all subjects in {selectedTerm}.
                  </p>
                </div>
              </div>

              {crossSubjectData.length === 0 ? (
                <div className="aa-empty-state" style={{ height: 280 }}>
                  <div className="aa-empty-icon">
                    <BookOpen size={24} />
                  </div>
                  <p>No subject broadsheet compiled for {selectedTerm}.</p>
                </div>
              ) : (
                <div style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={0}
                    initialDimension={{ width: 350, height: 320 }}
                  >
                    <BarChart
                      data={crossSubjectData}
                      layout="vertical"
                      margin={{ top: 10, right: 25, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#475569"
                        fontSize={11}
                        width={90}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '0.8rem',
                        }}
                        formatter={(val: any) => [`${val} / 100`, 'Total Score']}
                      />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                        {crossSubjectData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name.toLowerCase() === selectedSubject.toLowerCase()
                                ? '#000080'
                                : entry.total >= 75
                                  ? '#16a34a'
                                  : entry.total >= 60
                                    ? '#2563eb'
                                    : entry.total >= 50
                                      ? '#f59e0b'
                                      : '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ════════ ANALYTICS INSIGHT BOX ════════ */}
          <div className="aa-insight-card">
            <div className="aa-insight-icon">
              <Sparkles size={20} />
            </div>
            <div className="aa-insight-text">
              <h4>Academic Progression Insight & Observations</h4>
              <p>
                {subjectKpis.delta > 0 ? (
                  <>
                    Strong academic growth demonstrated in <strong>{selectedSubject}</strong> with a{' '}
                    <strong>+{subjectKpis.delta}% gain</strong> across consecutive terms. The
                    balance between continuous assessment ({subjectKpis.latestCa}/40) and terminal
                    examination ({subjectKpis.latestExam}/60) reflects consistent classroom
                    engagement and subject mastery.
                  </>
                ) : subjectKpis.delta < 0 ? (
                  <>
                    A performance variance of <strong>{subjectKpis.delta}%</strong> was observed in{' '}
                    <strong>{selectedSubject}</strong> compared to prior records. Targeted review of
                    the terminal exam score component ({subjectKpis.latestExam}/60) is recommended
                    to identify areas requiring instructional reinforcement.
                  </>
                ) : (
                  <>
                    Stable academic consistency maintained across the active sessions in{' '}
                    <strong>{selectedSubject}</strong> with a cumulative average of{' '}
                    <strong>{subjectKpis.annualAverage}%</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* ════════ TABULAR BREAKDOWN TABLE ════════ */}
          <div className="aa-table-panel">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  Terminal Broadsheet Breakdown: {selectedSubject}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Detailed mark distribution across the 3 academic terms for {session}.
                </p>
              </div>
            </div>

            <div className="aa-table-wrapper">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Academic Term</th>
                    <th>Continuous Assessment (40)</th>
                    <th>Terminal Exam (60)</th>
                    <th>Total Score (100)</th>
                    <th>Grade</th>
                    <th>Teacher Remark</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {progressionData.map((pt, idx) => (
                    <tr key={pt.termKey}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {pt.termName} ({pt.termShort})
                      </td>
                      <td>
                        {pt.hasData ? (
                          <strong style={{ color: '#0284c7' }}>{pt.ca} / 40</strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <strong style={{ color: '#16a34a' }}>{pt.exam} / 60</strong>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#000080' }}>
                            {pt.total} / 100
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span className={`aa-grade-badge aa-grade-${pt.grade}`}>
                            {pt.grade}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>
                      <td>
                        {pt.hasData ? (
                          <span style={{ color: '#475569', fontWeight: 500 }}>{pt.remark}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            Not yet compiled
                          </span>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Internal mini icon
function ClockIcon({ size = 16 }: { size?: number }) {
  return <Calendar size={size} />;
}

export default AcademicAnalysisView;
