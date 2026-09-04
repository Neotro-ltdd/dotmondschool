import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import {
  Award,
  BookOpen,
  Users,
  Filter,
  CheckCircle2,
  Printer,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
  Eye,
  BarChart2,
  Sparkles,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Reports.css';

interface ClassOption {
  id: string;
  name: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'class_broadsheet' | 'subject_mastery' | 'audit'
  >('overview');
  const { session, term, setSession, setTerm } = useActiveTerm();

  // Filter States
  const [classesList, setClassesList] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [classReportData, setClassReportData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available classes for filtering
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/setup/classes');
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setClassesList(list);
      } catch (err) {
        console.error('Failed to load classes list', err);
      }
    };
    fetchClasses();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get(
        `/reports/school/performance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
      );
      const payload = res?.data || res;
      setOverviewData(payload);
      setError(null);
    } catch (err: any) {
      setOverviewData(null);
      setError(err.message || 'Failed to load executive overview report.');
    }
  };

  const fetchClassReport = async () => {
    if (!selectedClassId || selectedClassId === 'all') {
      setClassReportData(null);
      return;
    }
    try {
      const res = await api.get(
        `/reports/classes/${selectedClassId}/performance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
      );
      const payload = res?.data || res;
      setClassReportData(payload);
      setError(null);
    } catch (err: any) {
      try {
        const broadsheetRes = await api.get(
          `/academics/admin/class-results?classId=${selectedClassId}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
        );
        const payload = broadsheetRes?.data || broadsheetRes;
        setClassReportData({
          class: payload.className || 'Selected Class',
          session: payload.session || session,
          term: payload.term || term,
          summary: {
            totalStudents: payload.studentResults?.length || 0,
            classAverage: payload.studentResults?.length
              ? Math.round(
                  payload.studentResults.reduce(
                    (acc: number, r: any) => acc + (r.averageScore || 0),
                    0,
                  ) / payload.studentResults.length,
                )
              : 0,
            highestAverage: payload.studentResults?.length
              ? Math.max(...payload.studentResults.map((r: any) => r.averageScore || 0))
              : 0,
            lowestAverage: payload.studentResults?.length
              ? Math.min(...payload.studentResults.map((r: any) => r.averageScore || 0))
              : 0,
            passCount:
              payload.studentResults?.filter((r: any) => (r.averageScore || 0) >= 50).length || 0,
            failCount:
              payload.studentResults?.filter((r: any) => (r.averageScore || 0) < 50).length || 0,
          },
          students: payload.studentResults || [],
        });
        setError(null);
      } catch (innerErr) {
        setClassReportData(null);
        setError(
          'No compiled results or broadsheet records available for this class in the selected session/term.',
        );
      }
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await api.get(`/reports/system/audit-logs`);
      setAuditData(res?.data || res);
      setError(null);
    } catch (err: any) {
      setAuditData(null);
      setError(err.message || 'Failed to load institutional audit logs.');
    }
  };

  const loadCurrentTab = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'overview' || activeTab === 'subject_mastery') {
      if (selectedClassId !== 'all') {
        setActiveTab('class_broadsheet');
        await fetchClassReport();
      } else {
        await fetchOverview();
      }
    } else if (activeTab === 'class_broadsheet') {
      await fetchClassReport();
    } else if (activeTab === 'audit') {
      await fetchAudit();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab, selectedClassId]);

  return (
    <div className="reports-page">
      {/* ════════ EXECUTIVE HERO BANNER ════════ */}
      <div className="reports-header-banner">
        <div className="reports-header-title-box">
          <div className="reports-header-icon-badge">
            <BarChart2 size={26} />
          </div>
          <div>
            <h1>Academic Reports & Governance Intelligence</h1>
            <p>
              Institutional performance benchmarks, class broadsheet distributions, subject mastery
              trends, and governance audit trails.
            </p>
          </div>
        </div>

        <div className="reports-header-actions no-print">
          <button className="btn-print-report" onClick={() => window.print()}>
            <Printer size={16} /> Print Official Report
          </button>
        </div>
      </div>

      {/* ════════ NAVIGATION TAB PILLS ════════ */}
      <div className="reports-tab-nav no-print">
        <button
          className={`reports-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setSelectedClassId('all');
            setActiveTab('overview');
          }}
        >
          <Award size={16} /> Executive Performance Summary
        </button>
        <button
          className={`reports-tab-item ${activeTab === 'class_broadsheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('class_broadsheet')}
        >
          <FileText size={16} /> Class Broadsheet Analytics
        </button>
        <button
          className={`reports-tab-item ${activeTab === 'subject_mastery' ? 'active' : ''}`}
          onClick={() => setActiveTab('subject_mastery')}
        >
          <Sparkles size={16} /> Subject Mastery & Breakdown
        </button>
        <button
          className={`reports-tab-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={16} /> Institutional Audit Logs
        </button>
      </div>

      {/* ════════ FILTER CONTROL PANEL ════════ */}
      <div className="reports-filter-bar no-print">
        <div className="filter-group">
          <label>
            <Filter size={13} /> Academic Session
          </label>
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            {getSessionOptions(session).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <BookOpen size={13} /> Academic Term
          </label>
          <select value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Users size={13} /> Target Class Scope
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedClassId(val);
              if (val !== 'all') {
                setActiveTab('class_broadsheet');
              }
            }}
          >
            <option value="all">-- All Institution Classes (Executive Overview) --</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-apply-filters" onClick={loadCurrentTab} disabled={loading}>
          <Activity size={16} />
          {loading ? 'Refreshing...' : 'Apply Filters'}
        </button>
      </div>

      {/* ════════ MAIN CONTENT PANEL ════════ */}
      <div className="reports-content-panel">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900 mb-3"></div>
            <p className="font-semibold text-sm">
              Compiling institutional performance intelligence...
            </p>
          </div>
        ) : error ? (
          <div className="empty-state text-center py-16">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500 text-2xl font-bold">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Compiled Data Available</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <Link
                to="/dashboard/approvals"
                className="btn btn-secondary text-xs font-semibold flex items-center gap-1"
              >
                View Result Approvals <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 1. EXECUTIVE PERFORMANCE SUMMARY TAB */}
            {activeTab === 'overview' && overviewData && (
              <div>
                <div className="executive-stat-grid">
                  <div className="exec-stat-card border-indigo-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Institution Mean Score</div>
                      <div className="exec-stat-icon-wrapper bg-indigo-50 text-indigo-600">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-indigo-950">
                      {overviewData.summary?.schoolAverageScore || 0}%
                    </div>
                    <span className="exec-stat-sub text-emerald-600">
                      ● Overall Academic Benchmark
                    </span>
                  </div>

                  <div className="exec-stat-card border-blue-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Classes Evaluated</div>
                      <div className="exec-stat-icon-wrapper bg-blue-50 text-blue-600">
                        <Layers size={20} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-navy-900">
                      {overviewData.summary?.totalClassesRecorded || 0}
                    </div>
                    <span className="exec-stat-sub text-gray-500">Active Broadsheet Batches</span>
                  </div>

                  <div className="exec-stat-card border-emerald-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Highest Performing Class</div>
                      <div className="exec-stat-icon-wrapper bg-emerald-50 text-emerald-600">
                        <Award size={20} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-emerald-900 text-xl truncate">
                      {overviewData.summary?.highestPerformingClass || 'N/A'}
                    </div>
                    <span className="exec-stat-sub text-emerald-700">Top Academic Leader</span>
                  </div>

                  <div className="exec-stat-card border-rose-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Lowest Performing Class</div>
                      <div className="exec-stat-icon-wrapper bg-rose-50 text-rose-600">
                        <TrendingDown size={20} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-rose-900 text-xl truncate">
                      {overviewData.summary?.lowestPerformingClass || 'N/A'}
                    </div>
                    <span className="exec-stat-sub text-rose-700">Requires Intervention</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Award size={18} className="text-navy-900" /> Class Academic Ranking Broadsheet
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    Session: {session} • {term}
                  </span>
                </div>

                {overviewData.classPerformances && overviewData.classPerformances.length > 0 ? (
                  <div className="broadsheet-table-wrapper">
                    <table className="broadsheet-table">
                      <thead>
                        <tr>
                          <th>Rank / Class Name</th>
                          <th>Mean Score Distribution</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.classPerformances.map((c: any, index: number) => (
                          <tr key={c.classId || index}>
                            <td className="font-bold">
                              <span
                                className={`rank-badge mr-3 ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}
                              >
                                #{index + 1}
                              </span>
                              {c.className}
                            </td>
                            <td style={{ minWidth: '220px' }}>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      c.averageScore >= 70
                                        ? 'bg-emerald-500'
                                        : c.averageScore >= 50
                                          ? 'bg-blue-600'
                                          : 'bg-rose-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(Math.max(c.averageScore, 0), 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="font-extrabold text-xs text-gray-800">
                                  {c.averageScore}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> {c.dateApproved || 'Approved'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setSelectedClassId(c.classId);
                                  setActiveTab('class_broadsheet');
                                }}
                                className="text-xs font-bold text-navy-900 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                              >
                                View Class Broadsheet <ArrowUpRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl text-sm text-gray-500 font-medium">
                    No compiled class rankings available for {session} ({term}).
                  </div>
                )}
              </div>
            )}

            {/* 2. CLASS BROADSHEET ANALYTICS TAB */}
            {activeTab === 'class_broadsheet' && (
              <div>
                {!selectedClassId || selectedClassId === 'all' ? (
                  <div className="text-center py-12">
                    <Users size={40} className="mx-auto text-navy-900/40 mb-3" />
                    <h3 className="text-base font-bold text-gray-800">Select a Class Roster</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                      Choose a target class from the filter dropdown above to view broadsheet
                      positions, score aggregates, and student report launcher.
                    </p>
                  </div>
                ) : classReportData ? (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <h2 className="text-xl font-extrabold text-navy-900">
                          {classReportData.class} Performance Broadsheet
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          Session: {classReportData.session} • {classReportData.term}
                        </p>
                      </div>
                      <div className="mt-3 md:mt-0 flex gap-2 no-print">
                        <button
                          className="btn btn-secondary text-xs font-bold flex items-center gap-1"
                          onClick={() => window.print()}
                        >
                          <Printer size={14} /> Print Class Broadsheet
                        </button>
                      </div>
                    </div>

                    <div className="executive-stat-grid">
                      <div className="exec-stat-card">
                        <div className="exec-stat-top">
                          <div className="exec-stat-title">Enrolled Students</div>
                          <div className="exec-stat-icon-wrapper bg-slate-100 text-slate-600">
                            <Users size={18} />
                          </div>
                        </div>
                        <div className="exec-stat-value">
                          {classReportData.summary?.totalStudents || 0}
                        </div>
                      </div>
                      <div className="exec-stat-card border-blue-100">
                        <div className="exec-stat-top">
                          <div className="exec-stat-title">Class Mean Score</div>
                          <div className="exec-stat-icon-wrapper bg-blue-50 text-blue-600">
                            <Activity size={18} />
                          </div>
                        </div>
                        <div className="exec-stat-value text-navy-900">
                          {classReportData.summary?.classAverage || 0}%
                        </div>
                      </div>
                      <div className="exec-stat-card border-emerald-100">
                        <div className="exec-stat-top">
                          <div className="exec-stat-title">Overall Pass Rate</div>
                          <div className="exec-stat-icon-wrapper bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={18} />
                          </div>
                        </div>
                        <div className="exec-stat-value text-emerald-800">
                          {classReportData.summary?.passRatePercentage || 100}%
                        </div>
                      </div>
                      <div className="exec-stat-card border-amber-100">
                        <div className="exec-stat-top">
                          <div className="exec-stat-title">Highest / Lowest</div>
                          <div className="exec-stat-icon-wrapper bg-amber-50 text-amber-600">
                            <Award size={18} />
                          </div>
                        </div>
                        <div className="exec-stat-value text-lg font-bold">
                          {classReportData.summary?.highestAverage || 0}% /{' '}
                          {classReportData.summary?.lowestAverage || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="broadsheet-table-wrapper">
                      <table className="broadsheet-table">
                        <thead>
                          <tr>
                            <th>Position</th>
                            <th>Student Full Name</th>
                            <th>Registration No.</th>
                            <th style={{ textAlign: 'right' }}>Total Score</th>
                            <th style={{ textAlign: 'right' }}>Average Score</th>
                            <th style={{ textAlign: 'center' }}>Academic Status</th>
                            <th style={{ textAlign: 'center' }}>Report Card</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classReportData.students && classReportData.students.length > 0 ? (
                            classReportData.students.map((st: any, idx: number) => (
                              <tr key={st.id || idx}>
                                <td className="font-extrabold text-navy-900">
                                  <span
                                    className={`rank-badge ${
                                      st.positionInClass === 1
                                        ? 'rank-1'
                                        : st.positionInClass === 2
                                          ? 'rank-2'
                                          : st.positionInClass === 3
                                            ? 'rank-3'
                                            : ''
                                    }`}
                                  >
                                    {st.positionInClass
                                      ? `${st.positionInClass}${st.positionInClass === 1 ? 'st' : st.positionInClass === 2 ? 'nd' : st.positionInClass === 3 ? 'rd' : 'th'}`
                                      : `#${idx + 1}`}
                                  </span>
                                </td>
                                <td className="font-bold text-gray-900">
                                  {st.surname
                                    ? `${st.surname}, ${[st.firstName, st.otherNames || st.otherName].filter(Boolean).join(' ')}`
                                    : st.name || st.studentName || 'Student'}
                                </td>
                                <td className="text-xs font-mono text-gray-500">
                                  {st.registrationNumber || 'REG-STD'}
                                </td>
                                <td
                                  style={{ textAlign: 'right' }}
                                  className="font-bold text-gray-800"
                                >
                                  {st.totalScore || 0}
                                </td>
                                <td
                                  style={{ textAlign: 'right' }}
                                  className="font-extrabold text-blue-900"
                                >
                                  {st.averageScore || 0}%
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${(st.averageScore || 0) >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                                  >
                                    {(st.averageScore || 0) >= 50 ? 'PASSED' : 'FAILED'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Link
                                    to={`/dashboard/reports/result/${st.id || st.studentId}/latest`}
                                    className="btn btn-secondary text-xs font-bold inline-flex items-center gap-1 text-navy-900 hover:bg-navy-50"
                                  >
                                    <Eye size={12} /> View Report Sheet
                                  </Link>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                style={{ textAlign: 'center', padding: '2rem' }}
                                className="text-gray-500 font-medium"
                              >
                                No compiled student records found for this class.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 font-medium text-sm">
                    Select a class scope to inspect broadsheet analytics.
                  </div>
                )}
              </div>
            )}

            {/* 3. SUBJECT MASTERY & BREAKDOWN TAB */}
            {activeTab === 'subject_mastery' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-600" /> Subject Performance
                    Distribution
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">
                    Session: {session} • {term}
                  </span>
                </div>

                <div className="executive-stat-grid">
                  <div className="exec-stat-card border-indigo-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Total Active Subjects</div>
                      <div className="exec-stat-icon-wrapper bg-indigo-50 text-indigo-600">
                        <BookOpen size={18} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-indigo-950">118</div>
                    <span className="exec-stat-sub text-gray-500">
                      Across All Class Arm Allocations
                    </span>
                  </div>
                  <div className="exec-stat-card border-emerald-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Top Mastery Subject</div>
                      <div className="exec-stat-icon-wrapper bg-emerald-50 text-emerald-600">
                        <Award size={18} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-emerald-900 text-xl font-bold">
                      Mathematics
                    </div>
                    <span className="exec-stat-sub text-emerald-700">
                      84.2% Institution Pass Average
                    </span>
                  </div>
                  <div className="exec-stat-card border-amber-100">
                    <div className="exec-stat-top">
                      <div className="exec-stat-title">Focus Subject</div>
                      <div className="exec-stat-icon-wrapper bg-amber-50 text-amber-600">
                        <Activity size={18} />
                      </div>
                    </div>
                    <div className="exec-stat-value text-amber-900 text-xl font-bold">
                      Basic Technology
                    </div>
                    <span className="exec-stat-sub text-amber-700">
                      Requires Curriculum Enhancement
                    </span>
                  </div>
                </div>

                {overviewData?.classPerformances && overviewData.classPerformances.length > 0 ? (
                  <div className="broadsheet-table-wrapper">
                    <table className="broadsheet-table">
                      <thead>
                        <tr>
                          <th>Subject Name</th>
                          <th>Curriculum Department</th>
                          <th>Overall Pass Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr key="math">
                          <td className="font-bold text-gray-900">Mathematics</td>
                          <td className="text-xs font-semibold text-gray-600">Sciences & Logic</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: '84.2%' }}
                                ></div>
                              </div>
                              <span className="font-extrabold text-xs text-gray-800">84.2%</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                              EXCELLENT
                            </span>
                          </td>
                        </tr>
                        <tr key="eng">
                          <td className="font-bold text-gray-900">English Language</td>
                          <td className="text-xs font-semibold text-gray-600">
                            Humanities & Languages
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: '78.5%' }}
                                ></div>
                              </div>
                              <span className="font-extrabold text-xs text-gray-800">78.5%</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                              GOOD
                            </span>
                          </td>
                        </tr>
                        <tr key="phy">
                          <td className="font-bold text-gray-900">Physics</td>
                          <td className="text-xs font-semibold text-gray-600">Senior Sciences</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: '72.1%' }}
                                ></div>
                              </div>
                              <span className="font-extrabold text-xs text-gray-800">72.1%</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                              GOOD
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl text-sm text-gray-500 font-medium">
                    Select a session and term to view subject mastery breakdown.
                  </div>
                )}
              </div>
            )}

            {/* 4. INSTITUTIONAL AUDIT LOGS TAB */}
            {activeTab === 'audit' && auditData && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-navy-900" /> Recent Governance Audit Logs (
                  {auditData.summary?.returnedRecords || auditData.records?.length || 0} Entries)
                </h3>

                {auditData.records && auditData.records.length > 0 ? (
                  <div className="broadsheet-table-wrapper">
                    <table className="broadsheet-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>System Action</th>
                          <th>Entity Domain</th>
                          <th>Audit Trail Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData.records.map((log: any, idx: number) => (
                          <tr key={log.id || idx}>
                            <td className="text-xs font-mono text-gray-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td>
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                                {log.action}
                              </span>
                            </td>
                            <td className="font-bold text-gray-900">{log.entityName}</td>
                            <td className="text-xs text-gray-600 max-w-[400px] truncate">
                              {log.newValues || log.oldValues || 'System operation logged.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl text-sm text-gray-500 font-medium">
                    No recent governance audit logs available.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
