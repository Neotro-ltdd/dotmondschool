import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  Filter,
  Clock,
  Search,
  Download,
  Briefcase,
  Sparkles,
  CheckCircle,
  XCircle,
  QrCode,
  Mail,
  Send,
  X,
} from 'lucide-react';
import '../Dashboard.css';

interface StaffAttendanceItem {
  staffId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  role: string;
  staffCategory: string;
  employmentType: string;
  clockInTime?: string;
  status: string;
  avatarUrl: string;
}

interface StaffAttendanceReportData {
  date: string;
  totalActiveStaff: number;
  totalPresentToday: number;
  totalAbsentToday: number;
  totalHolidayToday?: number;
  isHolidayOrBreak?: boolean;
  holidayNotice?: string;
  teachingPresent: number;
  nonTeachingPresent: number;
  contractPresent: number;
  staffAttendanceList: StaffAttendanceItem[];
}

export default function StaffAttendanceReport() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<StaffAttendanceReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🧪 Temporary Test Email Modal State
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('');
  const [sendingTestMail, setSendingTestMail] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendTestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    try {
      setSendingTestMail(true);
      setTestFeedback(null);
      const res = await api.post(`/attendance/trigger-weekly-staff-email?testEmail=${encodeURIComponent(testEmail.trim())}`, {});
      if (res && res.sent) {
        setTestFeedback({
          type: 'success',
          message: `Test weekly report successfully sent to ${testEmail}! Check your inbox.`,
        });
      } else {
        setTestFeedback({
          type: 'error',
          message: res?.reason || 'Failed to dispatch test email.',
        });
      }
    } catch (err: any) {
      console.error('Test email error', err);
      setTestFeedback({
        type: 'error',
        message: err?.message || 'Failed to send test email.',
      });
    } finally {
      setSendingTestMail(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/attendance/staff-report?date=${selectedDate}&category=${encodeURIComponent(selectedCategory)}`,
      );
      setReportData(res);
    } catch (err: any) {
      console.error('Failed to load staff attendance report', err);
      setError(err.message || 'Failed to load staff attendance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, selectedCategory]);

  const filteredList = (reportData?.staffAttendanceList || []).filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      item.status === statusFilter ||
      (statusFilter === 'On Holiday' &&
        (item.status === 'On Holiday' || item.status === 'Weekend Off'));
    return matchesSearch && matchesStatus;
  });

  const formatClockInTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="overview-page" style={{ padding: '24px' }}>
      {/* ════════ EXECUTIVE HEADER ════════ */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'color-mix(in srgb, var(--primary-color, #000080) 10%, white)',
              color: 'var(--primary-color, #000080)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            <Sparkles size={14} /> Executive Audit & Institutional Oversight
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Staff Morning Tap-In Attendance Report
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Daily gate attendance monitoring across Teaching, Non-Teaching, and Contract faculty.
          </p>
        </div>

        {/* Action Buttons & Filters bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/gate-scanner')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary-color, #000080)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <QrCode size={16} /> Open Gate Scanner
          </button>

          {/* 🧪 Temporary Test Email Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setShowTestModal(true);
              setTestFeedback(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0F1F5C',
              color: '#F0CC55',
              border: '1px solid #D4AF37',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 31, 92, 0.2)',
            }}
          >
            <Mail size={16} /> Send Test Weekly Email
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              padding: '6px 12px',
              borderRadius: '8px',
            }}
          >
            <Calendar size={16} color="#64748B" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0F172A',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              padding: '6px 12px',
              borderRadius: '8px',
            }}
          >
            <Filter size={16} color="#64748B" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Categories</option>
              <option value="Teaching">Teaching Staff</option>
              <option value="NonTeaching">Non-Teaching Staff</option>
              <option value="Contract">Contract Staff</option>
            </select>
          </div>
        </div>
      </div>

      {/* School Holiday / Non-Working Day Notice Banner */}
      {reportData?.isHolidayOrBreak && (
        <div
          style={{
            background: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#6B21A8',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          <Calendar size={18} />
          <span>
            <strong>Holiday Notice:</strong> Selected date ({reportData.date}) is a{' '}
            <strong>{reportData.holidayNotice || 'School Holiday / Non-Working Day'}</strong>. Staff
            tap-in gate scans are optional and un-scanned staff are designated{' '}
            <strong>On Holiday</strong> rather than Absent.
          </span>
        </div>
      )}

      {/* ════════ EXECUTIVE METRIC CARDS ════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Total Active Roster
            </span>
            <div
              style={{
                background: 'color-mix(in srgb, var(--primary-color, #000080) 10%, white)',
                padding: '8px',
                borderRadius: '10px',
                color: 'var(--primary-color, #000080)',
              }}
            >
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
            {loading ? '...' : (reportData?.totalActiveStaff ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Registered Staff Members
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Present Today (Tap-In)
            </span>
            <div
              style={{
                background: '#ECFDF5',
                padding: '8px',
                borderRadius: '10px',
                color: '#059669',
              }}
            >
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
            {loading ? '...' : (reportData?.totalPresentToday ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
            {reportData && reportData.totalActiveStaff > 0
              ? `${Math.round((reportData.totalPresentToday / reportData.totalActiveStaff) * 100)}% Turnout Rate`
              : '0% Turnout'}
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {reportData?.isHolidayOrBreak ? 'On Holiday / Off Duty' : 'Absent Today'}
            </span>
            <div
              style={{
                background: reportData?.isHolidayOrBreak ? '#FAF5FF' : '#FEF2F2',
                padding: '8px',
                borderRadius: '10px',
                color: reportData?.isHolidayOrBreak ? '#7E22CE' : '#DC2626',
              }}
            >
              {reportData?.isHolidayOrBreak ? <Calendar size={20} /> : <UserX size={20} />}
            </div>
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: reportData?.isHolidayOrBreak ? '#7E22CE' : '#DC2626',
            }}
          >
            {loading
              ? '...'
              : reportData?.isHolidayOrBreak
                ? (reportData?.totalHolidayToday ?? reportData?.totalActiveStaff ?? 0)
                : (reportData?.totalAbsentToday ?? 0)}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: reportData?.isHolidayOrBreak ? '#7E22CE' : '#DC2626',
              fontWeight: 600,
              marginTop: '4px',
            }}
          >
            {reportData?.isHolidayOrBreak
              ? 'School Holiday / Non-Working Day'
              : 'No morning gate scan'}
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Category Breakdown
            </span>
            <div
              style={{
                background: '#FAF5FF',
                padding: '8px',
                borderRadius: '10px',
                color: '#7E22CE',
              }}
            >
              <Briefcase size={20} />
            </div>
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div>
              Teaching:{' '}
              <strong style={{ color: '#0F172A' }}>{reportData?.teachingPresent ?? 0}</strong>{' '}
              present
            </div>
            <div>
              Non-Teaching:{' '}
              <strong style={{ color: '#0F172A' }}>{reportData?.nonTeachingPresent ?? 0}</strong>{' '}
              present
            </div>
            <div>
              Contract:{' '}
              <strong style={{ color: '#0F172A' }}>{reportData?.contractPresent ?? 0}</strong>{' '}
              present
            </div>
          </div>
        </div>
      </div>

      {/* ════════ SEARCH & DATA TABLE ════════ */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: '8px',
              width: '280px',
            }}
          >
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search staff name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Status:</span>
            <button
              onClick={() => setStatusFilter('All')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'All' ? 'var(--primary-color, #000080)' : '#F1F5F9',
                color: statusFilter === 'All' ? '#FFF' : '#475569',
              }}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('Present')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'Present' ? '#059669' : '#F1F5F9',
                color: statusFilter === 'Present' ? '#FFF' : '#475569',
              }}
            >
              Present ({reportData?.totalPresentToday ?? 0})
            </button>
            {reportData?.isHolidayOrBreak ? (
              <button
                onClick={() => setStatusFilter('On Holiday')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    statusFilter === 'On Holiday' || statusFilter === 'Weekend Off'
                      ? '#7E22CE'
                      : '#F1F5F9',
                  color:
                    statusFilter === 'On Holiday' || statusFilter === 'Weekend Off'
                      ? '#FFF'
                      : '#475569',
                }}
              >
                On Holiday ({reportData?.totalHolidayToday ?? reportData?.totalActiveStaff ?? 0})
              </button>
            ) : (
              <button
                onClick={() => setStatusFilter('Absent')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: statusFilter === 'Absent' ? '#DC2626' : '#F1F5F9',
                  color: statusFilter === 'Absent' ? '#FFF' : '#475569',
                }}
              >
                Absent ({reportData?.totalAbsentToday ?? 0})
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading Staff Morning Attendance Logs...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No staff attendance logs found for the selected filters on {selectedDate}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Staff Member</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Designation / Role</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Contact Info</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Tap-In Time</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((staff, idx) => (
                  <tr
                    key={staff.staffId || idx}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'var(--primary-color, #000080)',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {staff.fullName.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: '#0F172A' }}>{staff.fullName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{staff.designation}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Role: {staff.role}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          background:
                            staff.staffCategory === 'Teaching'
                              ? '#EFF6FF'
                              : staff.staffCategory === 'Contract'
                                ? '#FAF5FF'
                                : '#F1F5F9',
                          color:
                            staff.staffCategory === 'Teaching'
                              ? '#1D4ED8'
                              : staff.staffCategory === 'Contract'
                                ? '#7E22CE'
                                : '#475569',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {staff.staffCategory}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#334155' }}>{staff.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {staff.phoneNumber}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {staff.status === 'Present' ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 700,
                            color: '#059669',
                            background: '#ECFDF5',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          <Clock size={14} /> {formatClockInTime(staff.clockInTime)}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {staff.status === 'Present' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          <CheckCircle size={14} /> Present
                        </span>
                      ) : staff.status === 'On Holiday' || staff.status === 'Weekend Off' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#7E22CE',
                            background: '#FAF5FF',
                            border: '1px solid #E9D5FF',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        >
                          <Calendar size={13} /> {staff.status}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#DC2626',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          <XCircle size={14} /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════ 🧪 TEMPORARY TEST EMAIL POP-UP MODAL ════════ */}
      {showTestModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: '#0F1F5C',
                color: '#FFFFFF',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '4px solid #D4AF37',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={22} color="#F0CC55" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Send Test Executive Report
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                    Verify email delivery & template preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendTestReport} style={{ padding: '24px' }}>
              <p style={{ fontSize: '0.88rem', color: '#475569', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
                Enter your email address below to receive an immediate sample dispatch of the Friday Executive Weekly Staff Attendance Digest.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="testEmailInput"
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#0F1F5C',
                    marginBottom: '6px',
                  }}
                >
                  Recipient Email Address
                </label>
                <input
                  id="testEmailInput"
                  type="email"
                  required
                  placeholder="e.g. director@dotmondschools.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  If left blank or omitted, report will be sent to default Executive roles.
                </span>
              </div>

              {testFeedback && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    background: testFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: testFeedback.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${testFeedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  }}
                >
                  {testFeedback.message}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingTestMail}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0F1F5C',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: sendingTestMail ? 'not-allowed' : 'pointer',
                    opacity: sendingTestMail ? 0.7 : 1,
                  }}
                >
                  <Send size={15} /> {sendingTestMail ? 'Dispatching Email...' : 'Send Test Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
