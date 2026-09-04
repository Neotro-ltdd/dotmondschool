import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import './GateAttendanceLog.css';
import {
  Scan,
  UserCheck,
  Clock,
  LogOut,
  Search,
  RefreshCw,
  List,
  LayoutGrid,
  Calendar,
  MessageCircle,
  Phone,
  Check,
} from 'lucide-react';

interface GateLog {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  classId: string | null;
  level: string;
  dateScanned: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: string;
  parentName?: string | null;
  parentPhoneNumber?: string | null;
  arrivalWhatsappMessage?: string | null;
  arrivalWhatsappUrl?: string | null;
  departureWhatsappMessage?: string | null;
  departureWhatsappUrl?: string | null;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

const GateAttendanceLog: React.FC = () => {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filters & View Controls
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Tracks which WhatsApp messages were already opened/sent.
  // Key: `${studentId}|${dateScanned}|arrival|departure`. Persisted so refresh keeps buttons grey.
  const [sentMap, setSentMap] = useState<Record<string, boolean>>(() => {
  try {
  const raw = localStorage.getItem('gate-wa-sent');
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  // SAFETY: gate-wa-sent is only ever written by markWaSent() below, which
  // always serializes a Record<string, boolean>. If storage is corrupted
  // externally, worst case is a bad lookup (falsy), not a crash.
  return parsed as Record<string, boolean>;
} catch {
  return {};
}
  });

  useEffect(() => {
    try {
      localStorage.setItem('gate-wa-sent', JSON.stringify(sentMap));
    } catch {
      // ignore storage errors
    }
  }, [sentMap]);

  const fetchClasses = async () => {
    try {
      const classData = await api.get('/setup/classes');
      setClasses(classData);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/logs?date=${filterDate}`);
      setLogs(res || []);
    } catch (err) {
      console.error('Failed to fetch gate attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterDate]);

  const getStudentInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const normalizePhoneForWhatsApp = (phone?: string | null): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    // Convert local Nigerian format 080... -> 23480...
    if (digits.length === 11 && digits.startsWith('0')) return `234${digits.slice(1)}`;
    if (digits.length === 10 && digits.startsWith('0')) return `234${digits.slice(1)}`;
    return digits;
  };

  const buildWhatsappUrl = (phone?: string | null, message?: string | null): string | null => {
    if (!message) return null;
    const normalized = normalizePhoneForWhatsApp(phone);
    if (!normalized) return null;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsappLink = (log: GateLog, type: 'arrival' | 'departure'): string | null => {
    if (type === 'arrival') {
      // Prefer backend URL, but repair it if it contains a local-format number
      if (log.arrivalWhatsappUrl) {
        try {
          const url = new URL(log.arrivalWhatsappUrl);
          const rawPhone = url.pathname.replace('/', '');
          const fixed = normalizePhoneForWhatsApp(rawPhone);
          if (fixed && fixed !== rawPhone) {
            const text = url.searchParams.get('text') || log.arrivalWhatsappMessage || '';
            return `https://wa.me/${fixed}?text=${encodeURIComponent(text)}`;
          }
        } catch {
          // fall through to builder
        }
        // If URL parses fine (or unparseable), still ensure message is embedded
        if (log.arrivalWhatsappMessage && !log.arrivalWhatsappUrl.includes('text=')) {
          return buildWhatsappUrl(log.parentPhoneNumber, log.arrivalWhatsappMessage);
        }
        if (
          log.arrivalWhatsappUrl.includes('wa.me') ||
          log.arrivalWhatsappUrl.includes('whatsapp')
        ) {
          return log.arrivalWhatsappUrl;
        }
      }
      return buildWhatsappUrl(log.parentPhoneNumber, log.arrivalWhatsappMessage);
    }
    if (log.departureWhatsappUrl) {
      try {
        const url = new URL(log.departureWhatsappUrl);
        const rawPhone = url.pathname.replace('/', '');
        const fixed = normalizePhoneForWhatsApp(rawPhone);
        if (fixed && fixed !== rawPhone) {
          const text = url.searchParams.get('text') || log.departureWhatsappMessage || '';
          return `https://wa.me/${fixed}?text=${encodeURIComponent(text)}`;
        }
      } catch {
        // fall through
      }
      if (
        log.departureWhatsappUrl.includes('wa.me') ||
        log.departureWhatsappUrl.includes('whatsapp')
      ) {
        return log.departureWhatsappUrl;
      }
    }
    return buildWhatsappUrl(log.parentPhoneNumber, log.departureWhatsappMessage);
  };

  const getSentKey = (log: GateLog, type: 'arrival' | 'departure'): string =>
    `${log.studentId}|${log.dateScanned || filterDate}|${type}`;

  const isSent = (log: GateLog, type: 'arrival' | 'departure'): boolean =>
    !!sentMap[getSentKey(log, type)];

  const markAsSent = (log: GateLog, type: 'arrival' | 'departure') => {
    const key = getSentKey(log, type);
    setSentMap((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const renderWaButton = (log: GateLog, type: 'arrival' | 'departure') => {
    const url = getWhatsappLink(log, type);
    const hasScan = type === 'arrival' ? !!log.clockInTime : !!log.clockOutTime;
    const label = type === 'arrival' ? 'Arrival WhatsApp' : 'Exit WhatsApp';
    const message =
      type === 'arrival' ? log.arrivalWhatsappMessage : log.departureWhatsappMessage;
    const btnClass = type === 'arrival' ? 'wa-btn-arrival' : 'wa-btn-departure';

    if (isSent(log, type)) {
      return (
        <span className="wa-btn wa-btn-sent" title="Already sent — message opened in WhatsApp">
          <Check size={14} />
          {label} • Sent
        </span>
      );
    }

    if (url && hasScan) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`wa-btn ${btnClass}`}
          title={message || `Send ${type} notification`}
          onClick={() => markAsSent(log, type)}
        >
          <MessageCircle size={14} />
          {label}
        </a>
      );
    }

    return (
      <span
        className="wa-btn wa-btn-disabled"
        title={!hasScan ? (type === 'arrival' ? 'No clock-in yet' : 'No clock-out yet') : 'No message available'}
      >
        <MessageCircle size={14} />
        {label}
      </span>
    );
  };

  let filteredLogs = logs;
  if (filterSearch) {
    const searchLower = filterSearch.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (s) =>
        s.studentName.toLowerCase().includes(searchLower) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchLower)),
    );
  }
  if (filterLevel) {
    filteredLogs = filteredLogs.filter((s) => s.level === filterLevel);
  }
  if (filterClassId) {
    filteredLogs = filteredLogs.filter((s) => s.classId === filterClassId);
  }

  const classOptions = filterLevel ? classes.filter((c) => c.level === filterLevel) : classes;

  // Metrics
  const totalScans = logs.length;
  const presentCount = logs.filter((l) => l.clockInTime && !l.clockOutTime).length;
  const lateCount = logs.filter((l) => l.status?.toLowerCase().includes('late')).length;
  const departedCount = logs.filter((l) => !!l.clockOutTime).length;

  return (
    <div className="gate-page-container">
      {/* Page Header */}
      <div className="gate-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="gate-page-title">Gate Attendance Logs</h1>
            <span
              style={{
                background: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span className="status-dot"></span> Live Gate Feed
            </span>
          </div>
          <p className="gate-page-subtitle">
            Real-time gatekeeper scans, barcode check-ins, and student arrival/departure timestamps
          </p>
        </div>

        <button className="btn-refresh-feed" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing Logs...' : 'Refresh Live Feed'}
        </button>
      </div>

      {/* KPI Metrics Banner */}
      <div className="gate-metrics-grid">
        <div className="gate-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Scans Logged</span>
            <span className="metric-number">{totalScans}</span>
          </div>
          <div className="metric-icon-badge scans">
            <Scan size={24} />
          </div>
        </div>

        <div className="gate-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">On Campus (Timed In)</span>
            <span className="metric-number">{presentCount}</span>
          </div>
          <div className="metric-icon-badge present">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="gate-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Late Arrivals</span>
            <span className="metric-number" style={{ color: '#B45309' }}>
              {lateCount}
            </span>
          </div>
          <div className="metric-icon-badge late">
            <Clock size={24} />
          </div>
        </div>

        <div className="gate-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Departed (Timed Out)</span>
            <span className="metric-number">{departedCount}</span>
          </div>
          <div className="metric-icon-badge departed">
            <LogOut size={24} />
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="gate-controls-card">
        <div className="gate-search-group">
          <div className="gate-search-box">
            <Search className="gate-search-icon" size={16} />
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
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setFilterClassId('');
            }}
          >
            <option value="">All Academic Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          {/* Class Filter */}
          <select
            className="select-filter-input"
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
          >
            <option value="">All Classes</option>
            {classOptions.map((cls) => (
              <option
                key={cls.id}
                value={cls.id}
              >{`${cls.level} ${cls.name} ${cls.section || ''}`}</option>
            ))}
          </select>

          {/* Date Picker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="#64748B" />
            <input
              type="date"
              className="select-filter-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ padding: '0.6rem 0.85rem' }}
            />
          </div>
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

      {/* Main Content Area */}
      {loading ? (
        <div
          className="gate-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          Fetching real-time gate logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div
          className="gate-table-wrapper"
          style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}
        >
          No gate attendance records found for {filterDate}.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="gate-table-wrapper">
          <table className="executive-gate-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Registration No.</th>
                <th>Class Room</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Gate Status</th>
                <th>Send to WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.studentId}>
                  <td>
                    <div className="teacher-profile-cell">
                      <div className="teacher-avatar">{getStudentInitials(log.studentName)}</div>
                      <span className="teacher-name-title">{log.studentName}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                      {log.registrationNumber || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {log.className || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    {log.clockInTime ? (
                      <span
                        style={{
                          fontWeight: 800,
                          color: '#047857',
                          background: '#ECFDF5',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                        }}
                      >
                        {new Date(log.clockInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>-</span>
                    )}
                  </td>
                  <td>
                    {log.clockOutTime ? (
                      <span
                        style={{
                          fontWeight: 800,
                          color: '#1E40AF',
                          background: '#EFF6FF',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                        }}
                      >
                        {new Date(log.clockOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${log.status === 'Present' || log.clockInTime ? 'active' : 'inactive'}`}
                    >
                      <span
                        className={
                          log.status === 'Present' || log.clockInTime
                            ? 'status-dot'
                            : 'status-dot-inactive'
                        }
                      ></span>
                      {log.status || (log.clockInTime ? 'Timed In' : 'Absent')}
                    </span>
                  </td>
                  <td>
                    <div className="wa-notify-cell">
                      {(log.parentName || log.parentPhoneNumber) && (
                        <div className="wa-parent-info" title={log.parentPhoneNumber || ''}>
                          <Phone size={12} />
                          <span>
                            {log.parentName || 'Parent'}
                            {log.parentPhoneNumber ? ` • ${log.parentPhoneNumber}` : ''}
                          </span>
                        </div>
                      )}
                      <div className="wa-btn-row">
                        {renderWaButton(log, 'arrival')}
                        {renderWaButton(log, 'departure')}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="gate-grid-wrapper">
          {filteredLogs.map((log) => (
            <div key={log.studentId} className="gate-grid-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div className="teacher-profile-cell">
                  <div className="teacher-avatar">{getStudentInitials(log.studentName)}</div>
                  <div>
                    <span className="teacher-name-title" style={{ fontSize: '1.05rem' }}>
                      {log.studentName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: '#64748B',
                        display: 'block',
                        marginTop: '0.1rem',
                      }}
                    >
                      {log.registrationNumber || 'No Reg. ID'}
                    </span>
                  </div>
                </div>

                <span
                  className={`status-pill ${log.status === 'Present' || log.clockInTime ? 'active' : 'inactive'}`}
                >
                  {log.status || (log.clockInTime ? 'Timed In' : 'Absent')}
                </span>
              </div>

              <div
                style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: '#EFF6FF',
                    color: '#1E40AF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                  }}
                >
                  {log.className || 'Unassigned'}
                </span>

                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <span style={{ display: 'block', color: '#047857', fontWeight: 800 }}>
                    In:{' '}
                    {log.clockInTime
                      ? new Date(log.clockInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: '#1E40AF',
                      fontWeight: 800,
                      marginTop: '0.1rem',
                    }}
                  >
                    Out:{' '}
                    {log.clockOutTime
                      ? new Date(log.clockOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="wa-grid-footer">
                {(log.parentName || log.parentPhoneNumber) && (
                  <div className="wa-parent-info" title={log.parentPhoneNumber || ''}>
                    <Phone size={12} />
                    <span>
                      {log.parentName || 'Parent'}
                      {log.parentPhoneNumber ? ` • ${log.parentPhoneNumber}` : ''}
                    </span>
                  </div>
                )}
                <div className="wa-btn-row wa-btn-row-grid">
                  {renderWaButton(log, 'arrival')}
                  {renderWaButton(log, 'departure')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GateAttendanceLog;
