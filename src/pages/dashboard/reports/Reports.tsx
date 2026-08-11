import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { 
  BarChart3, 
  Award, 
  Users, 
  BookOpen, 
  Filter, 
  CheckCircle2, 
  TrendingUp, 
  Printer, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Reports.css';

interface ClassOption {
  id: string;
  name: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'class_broadsheet' | 'finance' | 'audit'>('overview');
  const { session, term, setSession, setTerm } = useActiveTerm();

  // Filter States
  const [classesList, setClassesList] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  // Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [classReportData, setClassReportData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
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
        console.error("Failed to load classes list", err);
      }
    };
    fetchClasses();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get(`/reports/school/performance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      const payload = res?.data || res;
      setOverviewData(payload);
      setError(null);
    } catch (err: any) {
      setOverviewData(null);
      setError(err.message || "Failed to load school overview report.");
    }
  };

  const fetchClassReport = async () => {
    if (!selectedClassId || selectedClassId === 'all') {
      setClassReportData(null);
      return;
    }
    try {
      const res = await api.get(`/reports/classes/${selectedClassId}/performance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      const payload = res?.data || res;
      setClassReportData(payload);
      setError(null);
    } catch (err: any) {
      // Fallback: try fetching class broadsheet batch via admin API
      try {
        const broadsheetRes = await api.get(`/academics/admin/class-results?classId=${selectedClassId}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
        const payload = broadsheetRes?.data || broadsheetRes;
        setClassReportData({
          class: payload.className || "Selected Class",
          session: payload.session || session,
          term: payload.term || term,
          summary: {
            totalStudents: payload.studentResults?.length || 0,
            classAverage: payload.studentResults?.length ? Math.round(payload.studentResults.reduce((acc: number, r: any) => acc + (r.averageScore || 0), 0) / payload.studentResults.length) : 0,
            highestAverage: payload.studentResults?.length ? Math.max(...payload.studentResults.map((r: any) => r.averageScore || 0)) : 0,
            lowestAverage: payload.studentResults?.length ? Math.min(...payload.studentResults.map((r: any) => r.averageScore || 0)) : 0,
            passCount: payload.studentResults?.filter((r: any) => (r.averageScore || 0) >= 50).length || 0,
            failCount: payload.studentResults?.filter((r: any) => (r.averageScore || 0) < 50).length || 0
          },
          students: payload.studentResults || []
        });
        setError(null);
      } catch (innerErr) {
        setClassReportData(null);
        setError("No compiled results or performance data available for this class in the selected session/term.");
      }
    }
  };

  const fetchFinance = async () => {
    try {
      const res = await api.get(`/reports/finance/fee-clearance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      setFinanceData(res?.data || res);
      setError(null);
    } catch (err: any) {
      setFinanceData(null);
      setError(err.message || "Failed to load fee clearance report.");
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await api.get(`/reports/system/audit-logs`);
      setAuditData(res?.data || res);
      setError(null);
    } catch (err: any) {
      setAuditData(null);
      setError(err.message || "Failed to load audit logs.");
    }
  };

  const loadCurrentTab = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'overview') {
      if (selectedClassId !== 'all') {
        setActiveTab('class_broadsheet');
        await fetchClassReport();
      } else {
        await fetchOverview();
      }
    } else if (activeTab === 'class_broadsheet') {
      await fetchClassReport();
    } else if (activeTab === 'finance') {
      await fetchFinance();
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
      {/* HEADER SECTION */}
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-navy-900" size={26} />
            Academic Reporting & Performance Analytics
          </h1>
          <p className="page-subtitle text-gray-500 text-sm mt-1">
            Institutional performance metrics, class broadsheets, fee clearance status, and audit logs.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0 no-print">
          <button className="btn btn-secondary flex items-center gap-1.5" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="tabs-container mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button 
          className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'active bg-navy-900 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
          onClick={() => { setSelectedClassId('all'); setActiveTab('overview'); }}
        >
          <Award size={16} /> School Performance Overview
        </button>
        <button 
          className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'class_broadsheet' ? 'active bg-navy-900 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
          onClick={() => setActiveTab('class_broadsheet')}
        >
          <FileText size={16} /> Class Performance Broadsheet
        </button>
        <button 
          className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'finance' ? 'active bg-navy-900 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
          onClick={() => setActiveTab('finance')}
        >
          <TrendingUp size={16} /> Fee Clearance Status
        </button>
        <button 
          className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'audit' ? 'active bg-navy-900 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={16} /> System Audit Logs
        </button>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="report-controls glass-panel p-4 mb-6 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
        <div className="form-group flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Filter size={12} /> Academic Session
          </label>
          <select 
            value={session} 
            onChange={(e) => setSession(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition"
          >
            {getSessionOptions(session).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <BookOpen size={12} /> Academic Term
          </label>
          <select 
            value={term} 
            onChange={(e) => setTerm(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition"
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>

        <div className="form-group flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Users size={12} /> Filter by Class
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition"
          >
            <option value="all">-- All Classes (School Summary) --</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-navy-900 text-white hover:bg-navy-800 transition" 
          onClick={loadCurrentTab} 
          disabled={loading}
        >
          {loading ? "Generating..." : "Apply Filters"}
        </button>
      </div>

      {/* MAIN TAB CONTENT */}
      <div className="tab-content glass-panel p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900 mb-3"></div>
            <p className="font-medium text-sm">Compiling institutional performance report...</p>
          </div>
        ) : error ? (
          <div className="empty-state text-center py-16">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500 text-2xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Compiled Data Available</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/dashboard/approvals" className="btn btn-secondary text-xs flex items-center gap-1">
                Check Result Approvals <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 1. SCHOOL OVERVIEW TAB */}
            {activeTab === 'overview' && overviewData && (
              <div className="report-section">
                <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-blue-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">School Mean Score</h3>
                    <div className="stat-value text-2xl font-bold text-navy-900">{overviewData.summary?.schoolAverageScore || 0}%</div>
                    <span className="text-[11px] text-emerald-600 font-medium">● Overall Institutional Average</span>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-indigo-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Classes Compiled</h3>
                    <div className="stat-value text-2xl font-bold text-indigo-900">{overviewData.summary?.totalClassesRecorded || 0}</div>
                    <span className="text-[11px] text-gray-500">Active Roster Classes</span>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-emerald-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Highest Performing Class</h3>
                    <div className="stat-value text-lg font-bold text-emerald-800 truncate">{overviewData.summary?.highestPerformingClass || 'N/A'}</div>
                    <span className="text-[11px] text-emerald-600 font-medium">Top Academic Ranking</span>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-rose-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Lowest Performing Class</h3>
                    <div className="stat-value text-lg font-bold text-rose-800 truncate">{overviewData.summary?.lowestPerformingClass || 'N/A'}</div>
                    <span className="text-[11px] text-rose-600 font-medium">Requires Faculty Support</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Award size={18} className="text-navy-900" /> Class Academic Rankings
                  </h3>
                  <span className="text-xs text-gray-500">Session: {session} • {term}</span>
                </div>

                {overviewData.classPerformances && overviewData.classPerformances.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="data-table w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-200">
                        <tr>
                          <th className="p-3">Rank / Class</th>
                          <th className="p-3">Average Score Performance</th>
                          <th className="p-3">Compilation Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {overviewData.classPerformances.map((c: any, index: number) => (
                          <tr key={c.classId || index} className="hover:bg-gray-50/80 transition">
                            <td className="p-3 font-semibold text-gray-900">
                              <span className="inline-block w-6 h-6 rounded-full bg-navy-100 text-navy-900 text-xs font-bold text-center leading-6 mr-2">
                                #{index + 1}
                              </span>
                              {c.className}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      c.averageScore >= 70 ? 'bg-emerald-500' : c.averageScore >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                                    }`} 
                                    style={{ width: `${Math.min(Math.max(c.averageScore, 0), 100)}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-xs text-gray-700 min-w-[45px]">{c.averageScore}%</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> {c.dateApproved || 'Approved'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => {
                                  setSelectedClassId(c.classId);
                                  setActiveTab('class_broadsheet');
                                }} 
                                className="text-xs font-semibold text-navy-900 hover:text-blue-700 inline-flex items-center gap-1"
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
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No class rank performance entries compiled for {session} ({term}) yet.
                  </div>
                )}
              </div>
            )}

            {/* 2. CLASS PERFORMANCE BROADSHEET TAB */}
            {activeTab === 'class_broadsheet' && (
              <div className="report-section">
                {!selectedClassId || selectedClassId === 'all' ? (
                  <div className="text-center py-12">
                    <Users size={36} className="mx-auto text-gray-400 mb-2" />
                    <h3 className="text-base font-bold text-gray-700">Select a Specific Class</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                      Choose a class from the filter dropdown above to view student positions, cumulative scores, and report card links.
                    </p>
                  </div>
                ) : classReportData ? (
                  <div>
                    {/* Class Broadsheet Header & KPIs */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <h2 className="text-xl font-bold text-navy-900">{classReportData.class} Broadsheet Performance</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Session: {classReportData.session} • {classReportData.term}</p>
                      </div>
                      <div className="mt-3 md:mt-0 flex gap-2">
                        <button className="btn btn-secondary text-xs flex items-center gap-1" onClick={() => window.print()}>
                          <Printer size={14} /> Print Broadsheet
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                        <span className="text-xs text-gray-500 block">Total Students</span>
                        <span className="text-xl font-bold text-gray-800">{classReportData.summary?.totalStudents || 0}</span>
                      </div>
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-center">
                        <span className="text-xs text-blue-600 block">Class Average</span>
                        <span className="text-xl font-bold text-navy-900">{classReportData.summary?.classAverage || 0}%</span>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-center">
                        <span className="text-xs text-emerald-600 block">Pass Rate</span>
                        <span className="text-xl font-bold text-emerald-800">{classReportData.summary?.passRatePercentage || 100}%</span>
                      </div>
                      <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-center">
                        <span className="text-xs text-amber-700 block">Highest / Lowest</span>
                        <span className="text-sm font-bold text-gray-800">{classReportData.summary?.highestAverage || 0}% / {classReportData.summary?.lowestAverage || 0}%</span>
                      </div>
                    </div>

                    {/* Broadsheet Roster Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="data-table w-full text-left text-sm border-collapse">
                        <thead className="bg-navy-900 text-white text-xs font-semibold">
                          <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Reg Number</th>
                            <th className="p-3 text-right">Total Score</th>
                            <th className="p-3 text-right">Average Score</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {classReportData.students && classReportData.students.length > 0 ? (
                            classReportData.students.map((st: any, idx: number) => (
                              <tr key={st.id || idx} className="hover:bg-gray-50 transition">
                                <td className="p-3 font-bold text-navy-900">
                                  {st.positionInClass ? `${st.positionInClass}${st.positionInClass === 1 ? 'st' : st.positionInClass === 2 ? 'nd' : st.positionInClass === 3 ? 'rd' : 'th'}` : `#${idx + 1}`}
                                </td>
                                <td className="p-3 font-semibold text-gray-900">
                                  {st.surname ? `${st.surname}, ${st.firstName}` : st.name || st.studentName || 'Student'}
                                </td>
                                <td className="p-3 text-xs text-gray-500 font-mono">
                                  {st.registrationNumber || 'REG-STD'}
                                </td>
                                <td className="p-3 text-right font-bold text-gray-800">
                                  {st.totalScore || 0}
                                </td>
                                <td className="p-3 text-right font-bold text-blue-900">
                                  {st.averageScore || 0}%
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${(st.averageScore || 0) >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {(st.averageScore || 0) >= 50 ? 'PASSED' : 'FAILED'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <Link 
                                    to={`/dashboard/reports/result/${st.id || st.studentId}/latest`} 
                                    className="btn btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1 text-navy-900 hover:bg-navy-50"
                                  >
                                    <Eye size={12} /> View Report
                                  </Link>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-sm text-gray-500">
                                No compiled student records found for this class.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    Select a class to generate detailed student performance broadsheet.
                  </div>
                )}
              </div>
            )}

            {/* 3. FEE CLEARANCE STATUS TAB */}
            {activeTab === 'finance' && financeData && (
              <div className="report-section">
                <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Expected Fees</h3>
                    <div className="stat-value text-2xl font-bold text-gray-900">₦{(financeData.summary?.totalAmountExpected || 0).toLocaleString()}</div>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-emerald-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Revenue Collected</h3>
                    <div className="stat-value text-2xl font-bold text-emerald-700">₦{(financeData.summary?.totalAmountReceived || 0).toLocaleString()}</div>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-blue-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Fully Cleared Students</h3>
                    <div className="stat-value text-2xl font-bold text-blue-900">{financeData.summary?.fullyPaidCount || 0}</div>
                  </div>

                  <div className="stat-card p-4 rounded-xl border border-gray-100 bg-rose-50/40">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Outstanding Debtors</h3>
                    <div className="stat-value text-2xl font-bold text-rose-700">{financeData.summary?.unpaidCount || 0}</div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-600" /> Student Fee Clearance Roster
                </h3>

                {financeData.records && financeData.records.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="data-table w-full text-left text-sm border-collapse">
                      <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-200">
                        <tr>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Class</th>
                          <th className="p-3">Amount Due</th>
                          <th className="p-3">Amount Paid</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {financeData.records.map((r: any, idx: number) => (
                          <tr key={r.studentId || idx} className="hover:bg-gray-50 transition">
                            <td className="p-3">
                              <strong className="text-gray-900">{r.studentName}</strong>
                              <div className="text-xs text-gray-400">{r.registrationNumber}</div>
                            </td>
                            <td className="p-3 text-gray-700">{r.class}</td>
                            <td className="p-3 font-semibold text-gray-800">₦{(r.amountDue || 0).toLocaleString()}</td>
                            <td className="p-3 font-semibold text-emerald-700">₦{(r.amountPaid || 0).toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No fee clearance records found for this term.
                  </div>
                )}
              </div>
            )}

            {/* 4. SYSTEM AUDIT LOGS TAB */}
            {activeTab === 'audit' && auditData && (
              <div className="report-section">
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-navy-900" /> Recent System Audit Logs ({auditData.summary?.returnedRecords || auditData.records?.length || 0} Entries)
                </h3>

                {auditData.records && auditData.records.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="data-table w-full text-left text-sm border-collapse">
                      <thead className="bg-gray-50 text-gray-600 font-semibold text-xs border-b border-gray-200">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Entity</th>
                          <th className="p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditData.records.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="hover:bg-gray-50 transition">
                            <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-gray-900">{log.entityName}</td>
                            <td className="p-3 text-xs text-gray-500 max-w-[400px] truncate">
                              {log.newValues || log.oldValues || 'System operation executed.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No recent audit log entries retrieved.
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
