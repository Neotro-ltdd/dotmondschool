import React, { useState, useEffect, useRef } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import './AdminReviewResults.css';
import {
  Users,
  TrendingUp,
  Award,
  ShieldCheck,
  Search,
  RotateCcw,
  MoreVertical,
  FileText,
  Printer,
  BarChart2,
  List,
  LayoutGrid,
} from 'lucide-react';

interface StudentResultItem {
  id: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  principalRemarks?: string;
  classTeacherRemarks?: string;
}

interface BatchResultResponse {
  batchId: string;
  status: string;
  results: StudentResultItem[];
}

interface ClassItem {
  id: string;
  name: string;
  level?: string;
}

export default function AdminReviewResults() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [data, setData] = useState<BatchResultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showConfirm, showAlert } = useDialog();

  // Controls & Filters
  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

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

  const fetchClasses = async () => {
    try {
      const res = await api.get('/setup/classes');
      setClasses(res);
      if (res && res.length > 0 && !selectedClassId) {
        setSelectedClassId(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchResults = async () => {
    if (!selectedClassId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/academics/admin/class-results?classId=${selectedClassId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );

      if (!res.batchId || res.batchId === '00000000-0000-0000-0000-000000000000') {
        setData(null);
        setError('No results found or results have not been compiled yet for this term.');
      } else {
        setData(res);
      }
    } catch (err: any) {
      setData(null);
      setError(err.message || 'Failed to load class results.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!data?.batchId) return;

    const confirmed = await showConfirm(
      'Are you sure you want to reset and delete this compilation for this class? This will return the class to a pre-compiled state.',
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.delete(`/academics/results/reset/${data.batchId}`);
      await showAlert('Results have been successfully reset.', { type: 'success' });
      fetchResults();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to reset results.', { type: 'danger' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchResults();
    }
  }, [filterSession, filterTerm, selectedClassId]);

  const getStudentInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Filtered student results
  const rawResults = data?.results || [];
  const filteredResults = [...rawResults]
    .filter((r) => {
      const text = `${r.studentName} ${r.positionInClass} ${r.averageScore}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => a.positionInClass - b.positionInClass);

  // Metrics
  const totalStudents = rawResults.length;
  const classAvg =
    totalStudents > 0
      ? (rawResults.reduce((acc, curr) => acc + curr.averageScore, 0) / totalStudents).toFixed(2)
      : '0.00';
  const topResult =
    rawResults.length > 0
      ? [...rawResults].sort((a, b) => a.positionInClass - b.positionInClass)[0]
      : null;
  const batchStatus = data?.status || 'Pending';

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="review-page-container">
      {/* Page Header */}
      <div className="review-page-header">
        <div>
          <h1 className="review-page-title">Review Class Results</h1>
          <p className="review-page-subtitle">
            Preview, audit, and inspect compiled academic performance rosters across classes
          </p>
        </div>
        {data?.batchId && (
          <button className="btn-reset-compilation" onClick={handleReset} disabled={loading}>
            <RotateCcw size={16} /> Reset Class Compilation
          </button>
        )}
      </div>

      {/* KPI Metrics Banner */}
      <div className="review-metrics-grid">
        <div className="review-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Class Students</span>
            <span className="metric-number">{totalStudents}</span>
          </div>
          <div className="metric-icon-badge students">
            <Users size={24} />
          </div>
        </div>

        <div className="review-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Class Average Score</span>
            <span className="metric-number">{classAvg}%</span>
          </div>
          <div className="metric-icon-badge average">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="review-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Highest Score (1st)</span>
            <span className="metric-number" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
              {topResult ? `${topResult.averageScore}%` : 'N/A'}
            </span>
          </div>
          <div className="metric-icon-badge topscore">
            <Award size={24} />
          </div>
        </div>

        <div className="review-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Batch Approval Status</span>
            <span
              className="metric-number"
              style={{
                fontSize: '1.2rem',
                marginTop: '0.4rem',
                color: batchStatus === 'Approved' ? '#047857' : '#B45309',
              }}
            >
              {batchStatus}
            </span>
          </div>
          <div className="metric-icon-badge status">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="review-controls-card">
        <div className="review-search-group">
          <div className="review-search-box">
            <Search className="review-search-icon" size={16} />
            <input
              type="text"
              placeholder="Search student name or rank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Class Select Dropdown */}
          <select
            className="select-filter-input"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Session Selector */}
          <select
            className="select-filter-input"
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
          >
            {getSessionOptions(filterSession).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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

      {/* Main Roster Area */}
      {loading ? (
        <div
          className="review-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          Loading compiled results...
        </div>
      ) : !data || !data.results || data.results.length === 0 ? (
        <div
          className="review-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          No compiled results available for <strong>{selectedClass?.name || 'this class'}</strong>{' '}
          in {filterSession} ({filterTerm}).
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="review-table-wrapper" ref={dropdownRef}>
          <table className="executive-review-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Total Score</th>
                <th>Term Average</th>
                <th>Class Position</th>
                <th>Batch Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => {
                const isDropdownOpen = openDropdownId === r.id;
                const reportUrl = `/dashboard/reports/result/${r.studentId}/${data.batchId}`;

                return (
                  <tr key={r.id}>
                    <td>
                      <div className="teacher-profile-cell">
                        <div className="teacher-avatar">{getStudentInitials(r.studentName)}</div>
                        <span className="teacher-name-title">{r.studentName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                        {r.totalScore}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#000080', fontSize: '0.95rem' }}>
                        {r.averageScore.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span
                        className={`rank-badge ${r.positionInClass === 1 ? 'rank-1' : r.positionInClass === 2 ? 'rank-2' : r.positionInClass === 3 ? 'rank-3' : 'rank-general'}`}
                      >
                        {r.positionInClass === 1
                          ? '🥇 1st Position'
                          : r.positionInClass === 2
                            ? '🥈 2nd Position'
                            : r.positionInClass === 3
                              ? '🥉 3rd Position'
                              : `${formatOrdinal(r.positionInClass)} Position`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${batchStatus === 'Approved' ? 'active' : 'inactive'}`}
                      >
                        <span
                          className={
                            batchStatus === 'Approved' ? 'status-dot' : 'status-dot-inactive'
                          }
                        ></span>
                        {batchStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-dropdown-container">
                        <button
                          className="btn-action-dots"
                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : r.id)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {isDropdownOpen && (
                          <div className="action-dropdown-menu">
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dropdown-action-item"
                              onClick={() => setOpenDropdownId(null)}
                            >
                              <FileText size={15} color="#000080" /> View Report Card
                            </a>
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dropdown-action-item"
                              onClick={() => setOpenDropdownId(null)}
                            >
                              <Printer size={15} color="#475569" /> Print Report Card
                            </a>
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
        <div className="review-grid-wrapper" ref={dropdownRef}>
          {filteredResults.map((r) => {
            const isDropdownOpen = openDropdownId === r.id;
            const reportUrl = `/dashboard/reports/result/${r.studentId}/${data.batchId}`;

            return (
              <div key={r.id} className="review-grid-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div className="teacher-profile-cell">
                    <div className="teacher-avatar">{getStudentInitials(r.studentName)}</div>
                    <div>
                      <span className="teacher-name-title" style={{ fontSize: '1.05rem' }}>
                        {r.studentName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748B',
                          display: 'block',
                          marginTop: '0.1rem',
                        }}
                      >
                        {selectedClass?.name || 'Class Room'}
                      </span>
                    </div>
                  </div>

                  <div className="action-dropdown-container">
                    <button
                      className="btn-action-dots"
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : r.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {isDropdownOpen && (
                      <div className="action-dropdown-menu">
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dropdown-action-item"
                          onClick={() => setOpenDropdownId(null)}
                        >
                          <FileText size={15} color="#000080" /> View Report Card
                        </a>
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dropdown-action-item"
                          onClick={() => setOpenDropdownId(null)}
                        >
                          <Printer size={15} color="#475569" /> Print Report Card
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#64748B',
                        display: 'block',
                      }}
                    >
                      Total Marks
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      {r.totalScore} pts
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#64748B',
                        display: 'block',
                      }}
                    >
                      Term Average
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000080' }}>
                      {r.averageScore.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <span
                    className={`rank-badge ${r.positionInClass === 1 ? 'rank-1' : r.positionInClass === 2 ? 'rank-2' : r.positionInClass === 3 ? 'rank-3' : 'rank-general'}`}
                  >
                    {r.positionInClass === 1
                      ? '🥇 1st Position'
                      : r.positionInClass === 2
                        ? '🥈 2nd Position'
                        : r.positionInClass === 3
                          ? '🥉 3rd Position'
                          : `${formatOrdinal(r.positionInClass)} Position`}
                  </span>

                  <span
                    className={`status-pill ${batchStatus === 'Approved' ? 'active' : 'inactive'}`}
                  >
                    {batchStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
