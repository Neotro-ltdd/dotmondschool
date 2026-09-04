import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  Download, 
  Search, 
  UserCheck, 
  UserX, 
  Clock, 
  Eye, 
  Filter, 
  RefreshCw,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../../services/api';
import './AttendanceReport.css';

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section?: string;
}

interface AttendanceReportDto {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  totalExpectedDays: number;
  totalPresent: number;
  totalAbsent: number;
  attendancePercentage: number;
}

interface StudentAttendanceHistoryDto {
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: 'Present' | 'Departed' | 'Absent' | string;
}

export default function AttendanceReport() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [session, setSession] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('First Term');
  
  const [reportData, setReportData] = useState<AttendanceReportDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Daily History Modal State
  const [selectedStudent, setSelectedStudent] = useState<AttendanceReportDto | null>(null);
  const [historyLogs, setHistoryLogs] = useState<StudentAttendanceHistoryDto[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Fetch Class List
  useEffect(() => {
    api.get('/setup/classes')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setClasses(list);
      })
      .catch((err) => {
        console.error("Failed to load classes for attendance filter:", err);
      });
  }, []);

  // Fetch Attendance Summary Report
  const fetchReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      if (selectedClassId) params.append('ClassId', selectedClassId);
      if (searchQuery.trim()) params.append('Search', searchQuery.trim());
      if (session) params.append('Session', session);
      if (term) params.append('Term', term);

      const queryString = params.toString();
      const endpoint = queryString ? `/reports/attendance?${queryString}` : '/reports/attendance';

      const response: any = await api.get(endpoint);
      const data = Array.isArray(response) ? response : (response?.data || []);
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to fetch attendance report:", err);
      setErrorMsg(err?.message || err?.response?.data?.message || "Failed to load attendance report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedClassId, session, term]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  // CSV Export Handler
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedClassId) params.append('ClassId', selectedClassId);
      if (searchQuery.trim()) params.append('Search', searchQuery.trim());
      if (session) params.append('Session', session);
      if (term) params.append('Term', term);
      params.append('ExportAsCsv', 'true');

      const baseUrl = import.meta.env.VITE_API_URL || 'https://api.easyworka.com';
      const downloadUrl = `${baseUrl}/api/reports/attendance?${params.toString()}`;

      // Fetch blob with Authorization Header
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
      alert("Could not export attendance CSV report.");
    } finally {
      setIsExporting(false);
    }
  };

  // Open History Modal for a Student
  const handleOpenHistory = async (student: AttendanceReportDto) => {
    setSelectedStudent(student);
    setIsHistoryLoading(true);
    setHistoryLogs([]);

    try {
      const params = new URLSearchParams();
      if (session) params.append('session', session);
      if (term) params.append('term', term);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `/reports/attendance/student/${student.studentId}?${queryString}`
        : `/reports/attendance/student/${student.studentId}`;

      const response: any = await api.get(endpoint);
      const logs = Array.isArray(response) ? response : (response?.data || []);
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Failed to load student history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Executive Summary Aggregations
  const stats = useMemo(() => {
    const totalStudents = reportData.length;
    const totalPresentSum = reportData.reduce((acc, curr) => acc + curr.totalPresent, 0);
    const totalAbsentSum = reportData.reduce((acc, curr) => acc + curr.totalAbsent, 0);
    const avgPercentage = totalStudents > 0 
      ? Math.round(reportData.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / totalStudents * 10) / 10 
      : 0;

    return { totalStudents, totalPresentSum, totalAbsentSum, avgPercentage };
  }, [reportData]);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="attendance-report-page">
      {/* Header Banner */}
      <div className="attendance-header-banner">
        <div>
          <h1><Calendar size={28} /> Attendance & Absentee Analytics</h1>
          <p>Real-time attendance summary with automated daily 5:00 PM absentee logs</p>
        </div>
        <div className="header-action-group">
          <button 
            onClick={handleExportCsv} 
            disabled={isExporting || reportData.length === 0} 
            className="btn-export-csv"
            title="Download CSV report"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleSearchSubmit} className="attendance-filter-bar">
        <div className="attendance-filter-group">
          <label><Filter size={14} /> Class</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.level} {c.name} {c.section || ''}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter-group">
          <label><Calendar size={14} /> Session</label>
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
          </select>
        </div>

        <div className="attendance-filter-group">
          <label><Clock size={14} /> Term</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>

        <div className="attendance-filter-group">
          <label><Search size={14} /> Search Student</label>
          <input 
            type="text" 
            placeholder="Name or Reg Number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-apply-filters" style={{ background: '#000080', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}>
          <Search size={16} /> Search
        </button>
      </form>

      {/* Executive Summary Stat Cards */}
      <div className="stat-grid-executive">
        <div className="stat-card-executive">
          <div className="stat-title-exec">Students Monitored <Users size={16} color="#000080" /></div>
          <div className="stat-value-exec">{stats.totalStudents}</div>
          <div className="stat-sub-exec">Active Enrolled Roster</div>
        </div>

        <div className="stat-card-executive">
          <div className="stat-title-exec">Avg. Attendance <CheckCircle2 size={16} color="#16a34a" /></div>
          <div className="stat-value-exec" style={{ color: stats.avgPercentage >= 80 ? '#16a34a' : '#d97706' }}>
            {stats.avgPercentage}%
          </div>
          <div className="stat-sub-exec">Class Participation Rate</div>
        </div>

        <div className="stat-card-executive">
          <div className="stat-title-exec">Present Days Count <UserCheck size={16} color="#2563eb" /></div>
          <div className="stat-value-exec">{stats.totalPresentSum}</div>
          <div className="stat-sub-exec">Scanned Gate Clock-Ins</div>
        </div>

        <div className="stat-card-executive">
          <div className="stat-title-exec">Absent Days Count <UserX size={16} color="#dc2626" /></div>
          <div className="stat-value-exec" style={{ color: '#dc2626' }}>{stats.totalAbsentSum}</div>
          <div className="stat-sub-exec">Includes Automated 5 PM Snapshots</div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="attendance-table-card">
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 0.75rem', color: '#000080' }} />
            <p style={{ fontWeight: 600 }}>Loading attendance summary report...</p>
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600 }}>{errorMsg}</p>
          </div>
        ) : reportData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>No attendance records found for the selected criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg Number</th>
                  <th>Class</th>
                  <th>Expected Days</th>
                  <th>Days Present</th>
                  <th>Days Absent</th>
                  <th>Attendance %</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => {
                  const pct = row.attendancePercentage;
                  const barColor = pct >= 85 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626';

                  return (
                    <tr key={row.studentId}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.studentName}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {row.registrationNumber}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.className}</td>
                      <td style={{ fontWeight: 600 }}>{row.totalExpectedDays}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>{row.totalPresent}</td>
                      <td style={{ fontWeight: 700, color: '#991b1b' }}>{row.totalAbsent}</td>
                      <td>
                        <div className="progress-pill-container">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                          </div>
                          <span className="progress-text" style={{ color: barColor }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleOpenHistory(row)} className="btn-view-logs">
                          <Eye size={14} /> History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Daily History Modal */}
      {selectedStudent && (
        <div className="modal-backdrop-glass" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <div>
                <h2>{selectedStudent.studentName}</h2>
                <p>Reg: <strong>{selectedStudent.registrationNumber}</strong> | Class: <strong>{selectedStudent.className}</strong></p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="btn-modal-close">
                <X size={18} />
              </button>
            </div>

            {isHistoryLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem', color: '#000080' }} />
                <p style={{ fontWeight: 600 }}>Loading daily attendance log...</p>
              </div>
            ) : historyLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p>No individual daily scans recorded for this period.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="attendance-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In Time</th>
                      <th>Clock Out Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.map((log, idx) => {
                      const st = log.status.toLowerCase();
                      const badgeClass = st === 'present' ? 'present' : st === 'departed' ? 'departed' : 'absent';

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{log.date}</td>
                          <td>{formatTime(log.clockInTime)}</td>
                          <td>{formatTime(log.clockOutTime)}</td>
                          <td>
                            <span className={`history-status-badge ${badgeClass}`}>
                              {st === 'present' && <CheckCircle2 size={12} />}
                              {st === 'departed' && <Clock size={12} />}
                              {st === 'absent' && <UserX size={12} />}
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
