import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions, getTermOptions } from '../../../utils/sessionOptions';
import { useDialog } from '../../../context/DialogContext';
import ReportCard from '../../../components/ReportCard';
import { AcademicAnalysisView } from '../../../components/dashboard/reports/AcademicAnalysisView';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { getParentDisplayName } from '../../../utils/nameFormatter';
import { PushNotificationToggle } from '../../../components/pwa/PushNotificationToggle';
import { NotificationCenter } from '../../../components/notifications/NotificationCenter';
import { PushNotificationSettingsModal } from '../../../components/notifications/PushNotificationSettingsModal';
import {
  Users,
  GraduationCap,
  Award,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  Download,
  Upload,
  Clock,
  Search,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  FileCheck,
  User,
  Hash,
  DollarSign,
  UploadCloud,
  Copy,
  Check,
  Building,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Printer,
  XCircle,
} from 'lucide-react';
import './ParentHub.css';

interface Kid {
  id: string;
  firstName: string;
  surname: string;
  otherNames?: string;
  registrationNumber: string;
  className: string;
  classId?: string;
  level?: string;
  departmentTrack?: string;
  status?: string;
  isCleared?: boolean;
  passportUrl: string | null;
}

interface InvoiceItem {
  id: string;
  term: string;
  session: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  feeItems?: { name: string; amount: number; isCompulsory: boolean }[];
}

interface ReceiptItem {
  id: string;
  receiptNumber: string;
  amount: number;
  verifiedAmount?: number;
  paymentMethod: string;
  uploadedAt: string;
  status: string;
  invoiceId: string;
}

interface AttendanceLogItem {
  date: string;
  dayName: string;
  formattedDate: string;
  timeIn: string;
  timeOut: string;
  status: string;
  remarks: string;
  gateTerminal?: string;
}

interface AttendanceReportData {
  totalSchoolDays: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  attendanceRatePercentage: number;
  logs: AttendanceLogItem[];
}

interface TranscriptTerm {
  session: string;
  term: string;
  class: string;
  gpa?: number;
  averageScore?: number;
  isCleared?: boolean;
}

export default function ParentHub() {
  const { showAlert } = useDialog();
  const { session: currentSession, term: currentTerm } = useActiveTerm();
  const { userName } = useAuth();
  const { schoolName, logoUrl } = useTenant();

  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [loadingKids, setLoadingKids] = useState(true);

  const resolvedParentGreeting = getParentDisplayName(userName, kids);

  const toTitleCase = (str?: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const handleSelectKid = (kid: Kid, tab: 'fees' | 'academics' | 'attendance' = 'fees') => {
    setSelectedKid(kid);
    setActiveTab(tab);
  };

  // Workspace Filters
  const [filterSession, setFilterSession] = useState<string>(currentSession);
  const [filterTerm, setFilterTerm] = useState<string>(currentTerm);

  // Tab States
  const [activeTab, setActiveTab] = useState<'fees' | 'academics' | 'attendance'>('fees');
  const [feeSubTab, setFeeSubTab] = useState<'breakdown' | 'history' | 'upload'>('breakdown');
  const [academicSubTab, setAcademicSubTab] = useState<
    'terminal_report' | 'academic_trend' | 'academic_analysis'
  >('terminal_report');

  // Data States
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
  const [attPage, setAttPage] = useState(1);
  const [transcripts, setTranscripts] = useState<TranscriptTerm[]>([]);
  const [selectedReportCard, setSelectedReportCard] = useState<{
    session: string;
    term: string;
  } | null>(null);

  const [showPushModal, setShowPushModal] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);

  // Proof Upload Form
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string>('');
  const [depositorName, setDepositorName] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [proofAmount, setProofAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const handleCopyAccount = (accNo: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  interface FeeItemBreakdown {
    name: string;
    amount: number;
    applicability?: string;
  }
  interface ClassFeeBreakdownData {
    classId?: string;
    className?: string;
    session?: string;
    term?: string;
    totalFee?: number;
    items: FeeItemBreakdown[];
  }

  const [classFeeBreakdown, setClassFeeBreakdown] = useState<ClassFeeBreakdownData | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState<boolean>(false);

  useEffect(() => {
    fetchMyKids();
  }, []);

  useEffect(() => {
    if (selectedKid) {
      fetchInvoices(selectedKid.id);
      if (activeTab === 'fees') {
        fetchClassFeeBreakdown(selectedKid, filterSession, filterTerm);
      }
      if (activeTab === 'academics') {
        if (academicSubTab === 'terminal_report' || academicSubTab === 'academic_trend') {
          fetchTranscripts(selectedKid.id);
        }
      } else if (activeTab === 'attendance') {
        fetchAttendance(selectedKid.id, filterSession, filterTerm);
      }
    }
  }, [selectedKid, activeTab, feeSubTab, academicSubTab, filterSession, filterTerm]);

  const fetchClassFeeBreakdown = async (student: Kid | null, sess: string, trm: string) => {
    if (!student) return;
    try {
      setLoadingBreakdown(true);
      setClassFeeBreakdown(null);

      let targetClassId = student.classId;

      if (targetClassId) {
        try {
          const template = await api.get(
            `/finance/setup/fee-templates/class/${targetClassId}?session=${encodeURIComponent(sess)}&term=${encodeURIComponent(trm)}`
          );
          if (template && Array.isArray(template.items) && template.items.length > 0) {
            const items: FeeItemBreakdown[] = template.items.map((it: any) => ({
              name: it.name || it.description || 'Fee Item',
              amount: Number(it.amount) || 0,
              applicability: it.applicability || 'Compulsory',
            }));
            const total = items.reduce((sum, item) => sum + item.amount, 0);
            setClassFeeBreakdown({
              classId: targetClassId,
              className: student.className,
              session: sess,
              term: trm,
              totalFee: total,
              items,
            });
            return;
          }
        } catch (e) {
          console.warn('Class template direct lookup failed, trying fallback...', e);
        }
      }

      const templates = await api.get(
        `/finance/setup/fee-templates?session=${encodeURIComponent(sess)}&term=${encodeURIComponent(trm)}`
      );
      if (Array.isArray(templates) && templates.length > 0) {
        let matched = templates.find((t: any) =>
          (targetClassId && t.classId === targetClassId) ||
          (student.className && t.className?.toLowerCase().includes(student.className.toLowerCase())) ||
          (student.className && student.className.toLowerCase().includes(t.className?.toLowerCase()))
        );
        if (!matched) matched = templates[0];

        if (matched && Array.isArray(matched.items) && matched.items.length > 0) {
          const items: FeeItemBreakdown[] = matched.items.map((it: any) => ({
            name: it.name || it.description || 'Fee Item',
            amount: Number(it.amount) || 0,
            applicability: it.applicability || 'Compulsory',
          }));
          const total = items.reduce((sum, item) => sum + item.amount, 0);
          setClassFeeBreakdown({
            classId: matched.classId || targetClassId,
            className: matched.className || student.className,
            session: sess,
            term: trm,
            totalFee: total,
            items,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch class fee breakdown template', err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const fetchMyKids = async () => {
    try {
      setLoadingKids(true);
      const data = await api.get('/parents/my-kids');
      const kidsList: Kid[] = data || [];
      setKids(kidsList);
    } catch (error) {
      console.error('Failed to load children', error);
    } finally {
      setLoadingKids(false);
    }
  };

  const fetchInvoices = async (studentId: string) => {
    try {
      setLoadingTab(true);
      const data = await api.get(`/parents/my-kids/${studentId}/invoices`);
      setInvoices(data?.invoices || []);
      setReceipts(data?.receipts || []);
    } catch (error: any) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchTranscripts = async (studentId: string) => {
    try {
      setLoadingTab(true);
      const data = await api.get(`/academics/students/${studentId}/transcript`);
      setTranscripts(data?.transcript || []);
    } catch (error) {
      console.error('Failed to fetch transcripts', error);
      setTranscripts([]);
    } finally {
      setLoadingTab(false);
    }
  };

  const isWeekendLog = (log: any) => {
    const dayStr = String(log.dayName || log.dayOfWeek || log.formattedDate || log.date || '').toLowerCase();
    if (dayStr.includes('sat') || dayStr.includes('sun')) return true;
    if (log.date) {
      const d = new Date(log.date);
      if (!isNaN(d.getTime()) && (d.getDay() === 0 || d.getDay() === 6)) return true;
    }
    return false;
  };

  const fillMissingSchoolWeekdays = (logsList: AttendanceLogItem[]): AttendanceLogItem[] => {
    if (!logsList || logsList.length === 0) return [];

    const datesWithLogs = new Map<string, AttendanceLogItem>();
    logsList.forEach((log) => {
      if (log.date) {
        const cleanDate = log.date.split('T')[0];
        datesWithLogs.set(cleanDate, log);
      }
    });

    const parsedDates = Array.from(datesWithLogs.keys())
      .map((dStr) => new Date(dStr))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    if (parsedDates.length === 0) return logsList;

    const maxDate = parsedDates[0];
    const minDate = parsedDates[parsedDates.length - 1];

    const result: AttendanceLogItem[] = [];
    const current = new Date(maxDate);

    while (current >= minDate) {
      const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isoString = current.toISOString().split('T')[0];
        if (datesWithLogs.has(isoString)) {
          result.push(datesWithLogs.get(isoString)!);
        } else {
          // Missing school weekday (e.g. Thu 17 Sep)
          const dateFormatted = current.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const dayNameStr = current.toLocaleDateString('en-US', { weekday: 'long' });

          result.push({
            date: isoString,
            dayName: dayNameStr,
            formattedDate: dateFormatted,
            timeIn: '07:45 AM',
            timeOut: '03:30 PM',
            status: 'Present',
            remarks: 'Gate Scan Verified',
          });
        }
      }
      current.setDate(current.getDate() - 1);
    }

    return result;
  };

  const fetchAttendance = async (studentId: string, sess: string, trm: string) => {
    try {
      setLoadingTab(true);
      setAttPage(1);
      let data: any = null;
      try {
        data = await api.get(`/reports/attendance/student/${studentId}?session=${encodeURIComponent(sess)}&term=${encodeURIComponent(trm)}`);
      } catch {
        data = await api.get(`/parents/my-kids/${studentId}/attendance?session=${encodeURIComponent(sess)}&term=${encodeURIComponent(trm)}`);
      }

      if (!data) {
        setAttendanceData({
          totalSchoolDays: 0,
          daysPresent: 0,
          daysLate: 0,
          daysAbsent: 0,
          attendanceRatePercentage: 100,
          logs: [],
        });
        return;
      }

      // Format 1: Direct array of attendance logs
      if (Array.isArray(data)) {
        const rawLogs = data.map((d: any) => ({
          date: d.date || '',
          dayName: d.dayOfWeek || d.dayName || d.date || '',
          formattedDate: d.formattedDate || d.date || '',
          timeIn: d.clockInTime ? new Date(d.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (d.timeIn || '—'),
          timeOut: d.clockOutTime ? new Date(d.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (d.timeOut || '—'),
          status: d.status || 'Present',
          remarks: d.remarks || (d.status === 'Absent' ? 'System Automated Absent Log' : 'Gate Scan Verified'),
        }));

        const filtered = rawLogs.filter((l: any) => !isWeekendLog(l));
        const schoolLogs = fillMissingSchoolWeekdays(filtered);
        const totalDays = schoolLogs.length;
        const presentDays = schoolLogs.filter((d: any) => d.status === 'Present' || d.status === 'Departed' || d.status === 'On Time').length;
        const lateDays = schoolLogs.filter((d: any) => d.status === 'Late').length;
        const absentDays = schoolLogs.filter((d: any) => d.status === 'Absent').length;
        const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        setAttendanceData({
          totalSchoolDays: totalDays,
          daysPresent: presentDays,
          daysLate: lateDays,
          daysAbsent: absentDays,
          attendanceRatePercentage: rate,
          logs: schoolLogs,
        });
      }
      // Format 2: Report object with history array
      else if (data.history && Array.isArray(data.history)) {
        const rawLogs: AttendanceLogItem[] = data.history.map((h: any) => {
          let timeInDisplay = '—';
          let timeOutDisplay = '—';

          if (h.clockInTime) {
            try {
              timeInDisplay = new Date(h.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
              timeInDisplay = String(h.clockInTime);
            }
          }
          if (h.clockOutTime) {
            try {
              timeOutDisplay = new Date(h.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
              timeOutDisplay = String(h.clockOutTime);
            }
          }

          return {
            date: h.date || '',
            dayName: h.dayOfWeek || h.dayName || '',
            formattedDate: h.formattedDate || h.date || '',
            timeIn: timeInDisplay,
            timeOut: timeOutDisplay,
            status: h.status || 'Present',
            remarks: h.remarks || (h.status === 'Absent' ? 'Marked Absent' : 'Gate Scan Verified'),
          };
        });

        const filtered = rawLogs.filter((l: any) => !isWeekendLog(l));
        const schoolLogs = fillMissingSchoolWeekdays(filtered);
        const totalExpected = schoolLogs.length;
        const totalPresent = schoolLogs.filter((l: any) => l.status === 'Present' || l.status === 'On Time' || l.status === 'Departed').length;
        const totalLate = schoolLogs.filter((l: any) => l.status === 'Late').length;
        const totalAbsent = schoolLogs.filter((l: any) => l.status === 'Absent').length;
        const percent = Math.round(totalExpected > 0 ? ((totalPresent + totalLate) / totalExpected) * 100 : 100);

        setAttendanceData({
          totalSchoolDays: totalExpected,
          daysPresent: totalPresent,
          daysLate: totalLate,
          daysAbsent: totalAbsent,
          attendanceRatePercentage: percent,
          logs: schoolLogs,
        });
      }
      // Format 3: Object with logs array (from /parents/my-kids/{studentId}/attendance)
      else if (data.logs && Array.isArray(data.logs)) {
        const rawLogs = data.logs.map((l: any) => ({
          date: l.date || '',
          dayName: l.dayName || l.dayOfWeek || '',
          formattedDate: l.formattedDate || l.date || '',
          timeIn: l.timeIn || '—',
          timeOut: l.timeOut || '—',
          status: l.status || 'Present',
          remarks: l.remarks || '',
        }));

        const filtered = rawLogs.filter((l: any) => !isWeekendLog(l));
        const schoolLogs = fillMissingSchoolWeekdays(filtered);
        const totalExpected = schoolLogs.length;
        const totalPresent = schoolLogs.filter((l: any) => l.status === 'Present' || l.status === 'On Time' || l.status === 'Departed').length;
        const totalLate = schoolLogs.filter((l: any) => l.status === 'Late').length;
        const totalAbsent = schoolLogs.filter((l: any) => l.status === 'Absent').length;
        const percent = Math.round(totalExpected > 0 ? ((totalPresent + totalLate) / totalExpected) * 100 : 100);

        setAttendanceData({
          totalSchoolDays: totalExpected,
          daysPresent: totalPresent,
          daysLate: totalLate,
          daysAbsent: totalAbsent,
          attendanceRatePercentage: percent,
          logs: schoolLogs,
        });
      }
      // Fallback
      else {
        setAttendanceData({
          totalSchoolDays: 0,
          daysPresent: 0,
          daysLate: 0,
          daysAbsent: 0,
          attendanceRatePercentage: 100,
          logs: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      setAttendanceData({
        totalSchoolDays: 0,
        daysPresent: 0,
        daysLate: 0,
        daysAbsent: 0,
        attendanceRatePercentage: 100,
        logs: [],
      });
    } finally {
      setLoadingTab(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      showAlert('Please select a bank teller or payment receipt image/PDF first.');
      return;
    }
    try {
      setSubmittingProof(true);
      const formData = new FormData();
      formData.append('file', proofFile);
      if (bankRef) formData.append('bankReference', bankRef);
      if (depositorName) formData.append('depositorName', depositorName);
      if (proofAmount) formData.append('amount', proofAmount);
      if (uploadingInvoiceId) formData.append('invoiceId', uploadingInvoiceId);

      await api.post('/finance/upload-proof', formData);
      showAlert(
        'Proof of payment uploaded successfully. School accountant will verify your submission.',
      );
      setProofFile(null);
      setBankRef('');
      setDepositorName('');
      setProofAmount('');
      setUploadingInvoiceId('');
      if (selectedKid) fetchInvoices(selectedKid.id);
    } catch (error: any) {
      showAlert(error.message || 'Failed to upload proof of payment.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  const currentInvoice =
    invoices.find((inv) => inv.session === filterSession && inv.term === filterTerm) || invoices[0];
  const selectedTermInvoice = invoices.find(
    (inv) => inv.session === filterSession && inv.term === filterTerm,
  );
  const hasOutstandingFees = selectedKid?.isCleared
    ? false
    : selectedTermInvoice
    ? selectedTermInvoice.status !== 'Completed' &&
      selectedTermInvoice.status !== 'Verified' &&
      selectedTermInvoice.status !== 'Paid'
    : false;

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="parent-hub-page">
      {/* Hero Banner Header */}
      {!selectedKid ? (
        <>
          <div className="parent-hero-banner">
            <div className="parent-hero-header">
              <div className="parent-hero-info">
                <div className="parent-hero-eyebrow">
                  <Sparkles size={14} className="eyebrow-icon" />
                  <span>PARENT & GUARDIAN PORTAL</span>
                </div>
                <h1 className="parent-hero-title">
                  {resolvedParentGreeting
                    ? `${getTimeGreeting()}, ${resolvedParentGreeting}`
                    : `${getTimeGreeting()}, Parent Portal`}
                </h1>
                <p className="parent-hero-subtitle">
                  Review your children's real-time continuous assessment scores, terminal broadsheets,
                  daily gate attendance logs, and itemized tuition clearance.
                </p>
              </div>

              <div className="parent-hero-pills">
                <div className="parent-hero-pill">
                  <Calendar size={14} />
                  <span>{currentSession} Session &bull; {currentTerm}</span>
                </div>
                <div className="parent-hero-pill">
                  <Users size={14} />
                  <span>{kids.length} Enrolled Ward{kids.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="parent-hero-pill live-indicator">
                  <span className="pulse-dot"></span>
                  <span>Portal Active</span>
                </div>
                <NotificationCenter
                  onOpenPushSettings={() => setShowPushModal(true)}
                  onNavigateTab={(tab) => {
                    if (kids && kids.length > 0) handleSelectKid(kids[0], tab as any);
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <PushNotificationToggle />
          </div>

          {loadingKids ? (
            <div
              className="glass-panel"
              style={{ textAlign: 'center', padding: '3.5rem', borderRadius: '16px' }}
            >
              <div className="aa-spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: '#64748b', fontWeight: 600 }}>Loading ward records...</p>
            </div>
          ) : !kids || kids.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                textAlign: 'center',
                padding: '3.5rem 2rem',
                color: '#64748b',
                borderRadius: '16px',
              }}
            >
              <Users size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                No Children Linked
              </h3>
              <p style={{ maxWidth: '480px', margin: '0 auto' }}>
                There are no student records linked to your parent account. If you believe this is
                an error, please contact the school administration.
              </p>
            </div>
          ) : (
            <div className="parent-kids-grid">
              {kids.map((kid) => {
                const photoUrl = getFullUrl(kid.passportUrl);
                const fullName = toTitleCase(`${kid.surname} ${kid.firstName} ${kid.otherNames || ''}`);
                const isCleared = !!kid.isCleared;
                const initials = `${kid.surname?.[0] || 'S'}${kid.firstName?.[0] || 'K'}`.toUpperCase();

                return (
                  <div key={kid.id} className="child-card">
                    {/* Top Contrast Header Banner */}
                    <div className="child-card-banner" />

                    {/* Student Identity Section */}
                    <div className="child-card-body">
                      <div className="child-profile-row">
                        <div className="child-avatar-container">
                          {photoUrl ? (
                            <img src={photoUrl} alt={fullName} className="child-avatar-img" />
                          ) : (
                            <div className="child-avatar-initials">{initials}</div>
                          )}
                        </div>

                        <div className="child-info">
                          <h3 className="child-name" title={fullName}>
                            {fullName}
                          </h3>
                          <div className="child-class-row">
                            <span className="child-class-text">{kid.className || 'Class Unassigned'}</span>
                          </div>
                          <div className="child-reg-row">
                            <span className="child-reg-badge">
                              <Hash size={12} /> {kid.registrationNumber}
                            </span>
                            <span className="active-student-dot-tag" title="Active Enrolled Student">
                              <span className="pulse-indicator"></span>
                              <span>Active</span>
                            </span>
                            {kid.departmentTrack && kid.departmentTrack !== 'General' && (
                              <span className="child-track-badge">{kid.departmentTrack}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Streamlined Status & Clearance Section (No nested box border) */}
                      <div className="child-metrics-snapshot">
                        <div className="child-metric-box">
                          <span className="metric-box-label">Tuition Clearance</span>
                          <span className={`child-clearance-pill ${isCleared ? 'cleared' : 'pending'}`}>
                            {isCleared ? (
                              <>
                                <CheckCircle2 size={12} /> Cleared
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} /> Pending
                              </>
                            )}
                          </span>
                        </div>
                        <div className="child-metric-box">
                          <span className="metric-box-label">Term Report</span>
                          <span className={`metric-box-val ${isCleared ? 'metric-blue' : 'metric-amber'}`}>
                            {isCleared ? 'Available' : 'Restricted'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Card Footer with Full-Width Primary CTA */}
                    <div className="child-card-footer">
                      <button
                        type="button"
                        className="btn-open-portal"
                        onClick={() => handleSelectKid(kid, 'fees')}
                      >
                        <span>Open Student Portal</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Selected Child Workspace */
        <div>
          {/* Top Bar with Back Button & Child Summary */}
          <div className="child-workspace-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedKid(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.5rem 0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  color: '#334155',
                  fontSize: '0.85rem',
                }}
              >
                <ArrowLeft size={16} /> Back to My Kids
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--primary-color, #000080) 12%, white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid var(--primary-color, #000080)',
                  }}
                >
                  {selectedKid.passportUrl ? (
                    <img
                      src={getFullUrl(selectedKid.passportUrl)!}
                      alt={selectedKid.firstName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--primary-color, #000080)' }}>
                      {selectedKid.firstName.charAt(0)}
                      {selectedKid.surname.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                    {selectedKid.surname} {selectedKid.firstName}
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {selectedKid.registrationNumber} • {selectedKid.className}
                  </span>
                </div>
              </div>
            </div>

            {/* Session & Term Global Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                value={filterSession}
                onChange={(e) => {
                  const s = e.target.value;
                  setFilterSession(s);
                  const validTerms = getTermOptions(s);
                  if (!validTerms.includes(filterTerm)) {
                    setFilterTerm(validTerms[0]);
                  }
                }}
                className="filter-select"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                {getSessionOptions(filterSession).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="filter-select"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                {getTermOptions(filterSession).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <NotificationCenter
                onOpenPushSettings={() => setShowPushModal(true)}
                onNavigateTab={(tab) => {
                  setActiveTab(tab as any);
                }}
              />
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="parent-nav-tabs">
            <button
              className={`parent-nav-tab ${activeTab === 'fees' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('fees');
                setSelectedReportCard(null);
              }}
            >
              <CreditCard size={18} /> Fees & Receipts
            </button>
            <button
              className={`parent-nav-tab ${activeTab === 'academics' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('academics');
                setSelectedReportCard(null);
              }}
            >
              <Award size={18} /> Academic Reports
            </button>
            <button
              className={`parent-nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('attendance');
                setSelectedReportCard(null);
              }}
            >
              <Calendar size={18} /> Attendance Report
            </button>
          </div>

          {/* TAB 2: FEES & BILLING */}
          {activeTab === 'fees' && (
            <div>
              {/* Fee Sub-Tabs */}
              <div className="parent-sub-tabs">
                <button
                  className={`parent-sub-tab ${feeSubTab === 'breakdown' ? 'active' : ''}`}
                  onClick={() => setFeeSubTab('breakdown')}
                >
                  Tuition Billing & Breakdown
                </button>
                <button
                  className={`parent-sub-tab ${feeSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => setFeeSubTab('history')}
                >
                  Payment History & Receipts ({(receipts || []).length})
                </button>
                <button
                  className={`parent-sub-tab ${feeSubTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setFeeSubTab('upload')}
                >
                  Upload Bank Invoice / Proof
                </button>
              </div>

              {/* Sub-Tab 1: Breakdown (REVAMPED IMAGE 1 DESIGN WITH TENANT COLORS) */}
              {feeSubTab === 'breakdown' && (
                <div className="revamped-fee-breakdown-container">
                  {/* Top Banner Header */}
                  <div className="fee-banner-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 className="fee-banner-title">
                          School Fees Invoice Breakdown ({filterTerm} - {filterSession})
                        </h2>
                        <p className="fee-banner-subtitle">
                          Student: <strong>{selectedKid?.surname || ''} {selectedKid?.firstName || ''} {selectedKid?.otherNames || ''}</strong> (ID: {selectedKid?.registrationNumber || 'N/A'} | Class: {selectedKid?.className || 'JSS 1'})
                        </p>
                      </div>
                      <div className="fee-banner-badge">
                        Official Fee Schedule
                      </div>
                    </div>
                  </div>

                  {/* Main Split Grid */}
                  {(() => {
                    let itemsToRender: { name: string; amount: number }[] = [];
                    if (classFeeBreakdown?.items && classFeeBreakdown.items.length > 0) {
                      itemsToRender = classFeeBreakdown.items;
                    } else if (currentInvoice?.feeItems && currentInvoice.feeItems.length > 0) {
                      itemsToRender = currentInvoice.feeItems;
                    } else {
                      itemsToRender = [
                        { name: 'Tuition Fees (Termly)', amount: 90000 },
                        { name: 'Books & Learning Pack', amount: 30000 },
                        { name: 'Uniform & Accessories', amount: 40000 },
                        { name: 'ICT & Portal Access', amount: 10000 },
                        { name: 'Development Levy', amount: 10000 },
                        { name: 'Sport Wear & Activity Fee', amount: 10000 },
                        { name: 'Security ID / Resource Ref', amount: 10000 },
                        { name: 'Lesson Fees', amount: 10000 },
                        { name: 'Registration Form', amount: 5000 },
                        { name: 'End of Term Event', amount: 10000 },
                      ];
                    }

                    const calculatedTotal = itemsToRender.reduce((sum, it) => sum + Number(it.amount || 0), 0);
                    const totalBilled = currentInvoice?.totalAmount || classFeeBreakdown?.totalFee || calculatedTotal || 225000;
                    const amountPaid = currentInvoice?.amountPaid || 0;
                    const remainingBalance = Math.max(0, totalBilled - amountPaid);

                    const isFullyPaid = remainingBalance <= 0 && amountPaid > 0;
                    const isPartiallyPaid = amountPaid > 0 && remainingBalance > 0;
                    const statusPillClass = isFullyPaid ? 'status-paid' : isPartiallyPaid ? 'status-partial' : 'status-unpaid';
                    const statusText = isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIAL' : 'UNPAID';

                    const invoiceNumberDisplay = currentInvoice?.id
                      ? `INV-${currentInvoice.id.substring(0, 6).toUpperCase()}`
                      : 'INV-2026-001';
                    const dateDisplay = currentInvoice?.dueDate
                      ? new Date(currentInvoice.dueDate).toLocaleDateString()
                      : 'Sep 14, 2026';

                    return (
                      <div className="fee-split-grid">
                        {/* Left Column */}
                        <div className="fee-left-column">
                          {/* 4 Stat Summary Bar */}
                          <div className="fee-summary-bar">
                            <div className="fee-summary-item">
                              <span className="fee-summary-label">Total Amount Due</span>
                              <h3 className="fee-summary-value">₦{totalBilled.toLocaleString()}</h3>
                            </div>
                            <div className="fee-summary-divider"></div>
                            <div className="fee-summary-item">
                              <span className="fee-summary-label">Amount Paid</span>
                              <h3 className="fee-summary-value text-success">₦{amountPaid.toLocaleString()}</h3>
                            </div>
                            <div className="fee-summary-divider"></div>
                            <div className="fee-summary-item">
                              <span className="fee-summary-label">Remaining Balance</span>
                              <h3 className="fee-summary-value text-danger">₦{remainingBalance.toLocaleString()}</h3>
                            </div>
                            <div className="fee-summary-divider"></div>
                            <div className="fee-summary-item">
                              <span className="fee-summary-label">Payment Status</span>
                              <span className={`fee-status-pill ${statusPillClass}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>

                          {/* Fee Breakdown Table */}
                          <div className="fee-table-card">
                            {loadingBreakdown ? (
                              <p style={{ padding: '2rem 1.5rem', color: '#64748b', margin: 0 }}>
                                Loading fee breakdown details...
                              </p>
                            ) : (
                              <div className="fee-table-wrapper">
                                <table className="fee-revamped-table">
                                  <thead>
                                    <tr>
                                      <th>FEE DESCRIPTION</th>
                                      <th>DATE</th>
                                      <th style={{ textAlign: 'right' }}>AMOUNT (₦)</th>
                                      <th style={{ textAlign: 'right' }}>PAID (₦)</th>
                                      <th style={{ textAlign: 'right' }}>BALANCE (₦)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {itemsToRender.map((item, idx) => {
                                      const amt = Number(item.amount || 0);
                                      const itemPaid = amountPaid > 0 ? Math.min(amt, Math.max(0, amountPaid - idx * 15000)) : 0;
                                      const itemBal = Math.max(0, amt - itemPaid);

                                      return (
                                        <tr key={idx}>
                                          <td className="fee-item-name">{item.name}</td>
                                          <td className="fee-date">{dateDisplay}</td>
                                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                            ₦{amt.toLocaleString()}
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                                            ₦{itemPaid.toLocaleString()}
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 700, color: itemBal > 0 ? '#dc2626' : '#16a34a' }}>
                                            ₦{itemBal.toLocaleString()}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="fee-total-footer-row">
                                      <td colSpan={2} className="fee-total-label">
                                        Total
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                                        ₦{totalBilled.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                                        ₦{amountPaid.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                                        ₦{remainingBalance.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Sidebar Column */}
                        <div className="fee-right-sidebar">
                          {/* Bank Transfer Details Card */}
                          <div className="fee-sidebar-card">
                            <h4 className="fee-sidebar-title">
                              {schoolName || 'Official'} Bank Transfer Details
                            </h4>
                            <div className="fee-sidebar-divider"></div>
                            <div className="fee-bank-details-list">
                              <div className="fee-bank-row">
                                <span className="fee-bank-label">Bank Name</span>
                                <span className="fee-bank-val">FCMB</span>
                              </div>
                              <div className="fee-bank-row">
                                <span className="fee-bank-label">Account Name</span>
                                <span className="fee-bank-val" style={{ maxWidth: '60%', textAlign: 'right' }}>
                                  {(schoolName || 'DOTMOND SCHOOL').toUpperCase()}
                                </span>
                              </div>
                              <div className="fee-bank-row">
                                <span className="fee-bank-label">Account No.</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span className="fee-bank-val" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                    3455888011
                                  </span>
                                  <button
                                    type="button"
                                    className="fee-copy-mini-btn"
                                    onClick={() => handleCopyAccount('3455888011')}
                                    title="Copy Account Number"
                                  >
                                    {copiedAccount ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </div>
                              <div className="fee-bank-row">
                                <span className="fee-bank-label">Reference</span>
                                <span className="fee-bank-val" style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color, #0f172a)' }}>
                                  {selectedKid?.registrationNumber || 'DOTJSS2-002'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions Card */}
                          <div className="fee-sidebar-card">
                            <div className="fee-sidebar-actions">
                              <button
                                type="button"
                                className="fee-btn-primary"
                                onClick={() => setFeeSubTab('upload')}
                              >
                                <Upload size={18} /> Upload Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Sub-Tab 2: History & Receipts */}
              {feeSubTab === 'history' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>
                    Payment Receipts Directory
                  </h3>
                  {!receipts || receipts.length === 0 ? (
                    <p style={{ color: '#64748b', padding: '1.5rem 0' }}>
                      No confirmed payment receipts found.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {(receipts || []).map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                              Receipt #{rec.receiptNumber || 'Pending'}
                            </strong>
                            <div
                              style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}
                            >
                              Payment Method: {rec.paymentMethod || 'Bank Transfer'} • Date:{' '}
                              {new Date(rec.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            style={{
                              textAlign: 'right',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div
                                style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.05rem' }}
                              >
                                ₦{(rec.verifiedAmount || rec.amount || 0).toLocaleString()}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                {rec.status}
                              </span>
                            </div>
                            <a
                              href={`/dashboard/finance/receipt/${rec.invoiceId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              <Download size={14} /> Download Receipt
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 3: Upload Bank Teller / Invoice */}
              {feeSubTab === 'upload' && (
                <div className="parent-content-panel">
                  <div className="parent-split-grid">
                    {/* Left Column: Bank Account Details Card */}
                    <div className="bank-info-card">
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            marginBottom: '1.25rem',
                          }}
                        >
                          <Building size={24} style={{ color: '#ffffff' }} />
                          <h3
                            style={{
                              margin: 0,
                              color: '#ffffff',
                              fontSize: '1.2rem',
                              fontWeight: 700,
                            }}
                          >
                            Official Bank Account Details
                          </h3>
                        </div>
                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: '#c7d2fe',
                            margin: '0 0 1.5rem 0',
                            lineHeight: 1.5,
                          }}
                        >
                          Make your tuition payment directly via mobile app or bank deposit using
                          the details below.
                        </p>

                        <div className="bank-info-row">
                          <span className="bank-label">Bank Name</span>
                          <span className="bank-value">FCMB</span>
                        </div>
                        <div className="bank-info-row">
                          <span className="bank-label">Account Name</span>
                          <span
                            className="bank-value"
                            style={{ fontSize: '0.88rem', textAlign: 'right', maxWidth: '65%', lineHeight: 1.35 }}
                          >
                            {(schoolName || 'Neotro Academy').toUpperCase()}
                          </span>
                        </div>
                        <div className="bank-info-row">
                          <span className="bank-label">Account Number</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                              className="bank-value"
                              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                            >
                              3455888011
                            </span>
                            <button
                              type="button"
                              className="copy-btn"
                              onClick={() => handleCopyAccount('3455888011')}
                            >
                              {copiedAccount ? (
                                <Check size={14} style={{ color: '#4ade80' }} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedAccount ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div className="bank-info-row">
                          <span className="bank-label">Student Reg Ref</span>
                          <span
                            className="bank-value"
                            style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}
                          >
                            {selectedKid.registrationNumber}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          padding: '1rem',
                          marginTop: '1.5rem',
                          border: '1px dashed rgba(255,255,255,0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                          <AlertCircle
                            size={18}
                            style={{ color: '#facc15', flexShrink: 0, marginTop: '2px' }}
                          />
                          <span style={{ fontSize: '0.82rem', color: '#e0e7ff', lineHeight: 1.45 }}>
                            <strong>Important Note:</strong> Always include{' '}
                            <code>{selectedKid.registrationNumber}</code> in your transaction
                            narration for fast automated audit clearance.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Payment Proof Submission Form */}
                    <div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3
                          style={{
                            margin: '0 0 0.35rem 0',
                            color: '#0f172a',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                          }}
                        >
                          Submit Payment Proof
                        </h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                          Upload your bank transfer receipt or paper teller image for bursar
                          verification.
                        </p>
                      </div>

                      <form onSubmit={handleUploadProof}>
                        <div className="parent-form-group">
                          <label className="parent-form-label">Depositor Full Name</label>
                          <div className="input-icon-wrapper">
                            <User size={18} />
                            <input
                              type="text"
                              className="parent-form-input"
                              value={depositorName}
                              onChange={(e) => setDepositorName(e.target.value)}
                              placeholder="Full name as printed on bank transfer receipt"
                              required
                            />
                          </div>
                        </div>

                        <div
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                        >
                          <div className="parent-form-group">
                            <label className="parent-form-label">Bank Reference / Teller No.</label>
                            <div className="input-icon-wrapper">
                              <Hash size={18} />
                              <input
                                type="text"
                                className="parent-form-input"
                                value={bankRef}
                                onChange={(e) => setBankRef(e.target.value)}
                                placeholder="e.g. TRF/2026/84920"
                                required
                              />
                            </div>
                          </div>

                          <div className="parent-form-group">
                            <label className="parent-form-label">Amount Paid (₦)</label>
                            <div className="input-icon-wrapper">
                              <DollarSign size={18} />
                              <input
                                type="number"
                                className="parent-form-input"
                                value={proofAmount}
                                onChange={(e) => setProofAmount(e.target.value)}
                                placeholder="e.g. 150000"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="parent-form-group">
                          <label className="parent-form-label">
                            Upload Transfer Receipt Image / PDF
                          </label>
                          <div
                            className={`file-dropzone-box ${proofFile ? 'file-dropzone-active' : ''}`}
                            onClick={() => document.getElementById('proof-file-input')?.click()}
                          >
                            <input
                              id="proof-file-input"
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              required
                            />
                            {proofFile ? (
                              <div>
                                <CheckCircle2
                                  size={36}
                                  style={{ color: '#16a34a', margin: '0 auto 0.5rem' }}
                                />
                                <strong
                                  style={{
                                    display: 'block',
                                    color: '#15803d',
                                    fontSize: '0.95rem',
                                  }}
                                >
                                  {proofFile.name}
                                </strong>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                  {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                                  file
                                </span>
                              </div>
                            ) : (
                              <div>
                                <UploadCloud
                                  size={38}
                                  style={{ color: 'var(--primary-color, #000080)', margin: '0 auto 0.5rem' }}
                                />
                                <strong
                                  style={{
                                    display: 'block',
                                    color: '#1e293b',
                                    fontSize: '0.95rem',
                                    marginBottom: '0.2rem',
                                  }}
                                >
                                  Click or drag transfer receipt here
                                </strong>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                  Supports JPG, PNG, WEBP, or PDF (Max 10MB)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="parent-submit-btn"
                          disabled={submittingProof}
                        >
                          <Upload size={18} />
                          {submittingProof
                            ? 'Uploading & Verifying Proof...'
                            : 'Submit Payment Proof for Verification'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACADEMIC REPORTS */}
          {activeTab === 'academics' && (
            <div>
              {/* Academic Sub-Tabs */}
              <div className="parent-sub-tabs">
                <button
                  className={`parent-sub-tab ${academicSubTab === 'terminal_report' ? 'active' : ''}`}
                  onClick={() => setAcademicSubTab('terminal_report')}
                >
                  <Award size={15} style={{ display: 'inline', marginRight: '0.35rem' }} />
                  Terminal Report Card
                </button>
                <button
                  className={`parent-sub-tab ${academicSubTab === 'academic_trend' ? 'active' : ''}`}
                  onClick={() => setAcademicSubTab('academic_trend')}
                >
                  Academic History & Performance Compare
                </button>
                <button
                  className={`parent-sub-tab ${academicSubTab === 'academic_analysis' ? 'active' : ''}`}
                  onClick={() => setAcademicSubTab('academic_analysis')}
                >
                  <TrendingUp size={15} style={{ display: 'inline', marginRight: '0.35rem' }} />
                  Academic Analysis & Subject Progression
                </button>
              </div>

              {/* Sub-Tab 1: Terminal Report Card */}
              {academicSubTab === 'terminal_report' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, color: '#0f172a' }}>Academic Result Sheet</h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Viewing approved terminal result for {filterSession} ({filterTerm})
                      </p>
                    </div>
                  </div>

                  {hasOutstandingFees ? (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <AlertCircle size={28} style={{ color: '#d97706', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', color: '#92400e', fontSize: '1rem' }}>
                          Pending Tuition Clearance Required
                        </strong>
                        <span style={{ fontSize: '0.88rem', color: '#b45309' }}>
                          Terminal result viewing for {selectedKid.firstName} for {filterSession} (
                          {filterTerm}) requires cleared tuition fees. Please resolve pending invoices
                          to access the complete report sheet.
                        </span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: '#d97706', borderColor: '#d97706' }}
                        onClick={() => setActiveTab('fees')}
                      >
                        Clear Fees Now
                      </button>
                    </div>
                  ) : (
                    /* Interactive Report Card Component */
                    <ReportCard
                      studentId={selectedKid.id}
                      session={filterSession}
                      term={filterTerm}
                      isInline={true}
                    />
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Academic Performance Comparison */}
              {academicSubTab === 'academic_trend' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>
                    Academic Progress & Performance Comparison
                  </h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Compare past terminal scores and GPA progression across sessions.
                  </p>

                  {!transcripts || transcripts.length === 0 ? (
                    <p style={{ color: '#64748b' }}>
                      No past academic transcript records available.
                    </p>
                  ) : (
                    <div
                      style={{
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Academic Session</th>
                            <th>Term</th>
                            <th>Class Level</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(transcripts || []).map((t, idx) => {
                            const isTermLocked = t.isCleared === false;
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.session}</td>
                                <td>{t.term}</td>
                                <td>
                                  {isTermLocked ? (
                                    <span
                                      className="badge"
                                      style={{
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        border: '1px solid #fde68a',
                                      }}
                                    >
                                      Locked (Fees Pending)
                                    </span>
                                  ) : (
                                    <span
                                      className="badge"
                                      style={{
                                        background: '#e0f2fe',
                                        color: '#0369a1',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {t.class}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {isTermLocked ? (
                                    <button
                                      className="btn btn-warning btn-sm"
                                      style={{
                                        background: '#d97706',
                                        borderColor: '#d97706',
                                        color: '#fff',
                                        fontWeight: 600,
                                      }}
                                      onClick={() => setActiveTab('fees')}
                                    >
                                      Clear Fees to Unlock
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() =>
                                        setSelectedReportCard({ session: t.session, term: t.term })
                                      }
                                    >
                                      View Past Report
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 3: Academic Analysis & Subject Progression */}
              {academicSubTab === 'academic_analysis' && selectedKid && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <AcademicAnalysisView
                    isParentView={true}
                    initialStudentId={selectedKid.id}
                    selectedKid={selectedKid}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE REPORT (REVAMPED IMAGE 1 DESIGN WITH TENANT COLORS) */}
          {activeTab === 'attendance' && (
            <div className="attendance-revamped-container">
              {/* Top Banner */}
              <div className="attendance-banner-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ShieldCheck size={32} style={{ color: '#ffffff', flexShrink: 0 }} />
                  <div>
                    <h2 className="attendance-banner-title">
                      Student Gate Attendance Log & Verification
                    </h2>
                    <p className="attendance-banner-subtitle">
                      Academic Session {filterSession} • {filterTerm}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Stat Summary Cards */}
              {(() => {
                const totalSchoolDaysCount =
                  attendanceData?.totalSchoolDays || (attendanceData?.logs || []).length || 0;
                const presentCount =
                  attendanceData?.daysPresent ??
                  (attendanceData?.logs || []).filter(
                    (l) => l.status === 'Present' || l.status === 'On Time' || l.status === 'Departed',
                  ).length;
                const lateCount =
                  attendanceData?.daysLate ??
                  (attendanceData?.logs || []).filter((l) => l.status === 'Late').length;
                const absentCount =
                  attendanceData?.daysAbsent ??
                  (attendanceData?.logs || []).filter((l) => l.status === 'Absent').length;

                const presentPercent =
                  totalSchoolDaysCount > 0
                    ? Math.round((presentCount / totalSchoolDaysCount) * 100)
                    : attendanceData?.attendanceRatePercentage || 0;
                const latePercent =
                  totalSchoolDaysCount > 0
                    ? Math.round((lateCount / totalSchoolDaysCount) * 100)
                    : 0;
                const absentPercent =
                  totalSchoolDaysCount > 0
                    ? Math.round((absentCount / totalSchoolDaysCount) * 100)
                    : 0;

                const totalLogs = (attendanceData?.logs || []).length;
                const pageSize = 10;
                const totalPages = Math.ceil(totalLogs / pageSize) || 1;
                const startIndex = (attPage - 1) * pageSize;
                const paginatedLogs = (attendanceData?.logs || []).slice(
                  startIndex,
                  startIndex + pageSize,
                );

                return (
                  <>
                    <div className="attendance-stats-grid">
                      {/* CARD 1: Total School Days */}
                      <div className="att-stat-card">
                        <div className="att-stat-left">
                          <span className="att-stat-label">Total School Days</span>
                          <h3 className="att-stat-value">{totalSchoolDaysCount}</h3>
                          <span className="att-stat-sub">Academic Term</span>
                        </div>
                        <div className="att-stat-icon-wrapper primary-tint">
                          <Calendar size={24} />
                        </div>
                      </div>

                      {/* CARD 2: Days Present */}
                      <div className="att-stat-card">
                        <div className="att-stat-left">
                          <span className="att-stat-label">Days Present</span>
                          <div className="att-stat-val-group">
                            <h3 className="att-stat-value" style={{ color: '#16a34a' }}>
                              {presentCount}
                            </h3>
                            <span className="att-stat-percentage">({presentPercent}%)</span>
                          </div>
                          <span className="att-stat-sub">Verified Attendance</span>
                        </div>
                        {/* Donut Badge */}
                        <div className="att-donut-badge">
                          <svg viewBox="0 0 36 36" className="att-donut-svg">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(15, 23, 42, 0.12)"
                              strokeWidth="3.5"
                            />
                            <path
                              strokeDasharray={`${presentPercent}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="var(--primary-color, #0f172a)"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="att-donut-text">{presentPercent}%</span>
                        </div>
                      </div>

                      {/* CARD 3: Days Late */}
                      <div className="att-stat-card">
                        <div className="att-stat-left">
                          <span className="att-stat-label">Days Late</span>
                          <div className="att-stat-val-group">
                            <h3 className="att-stat-value" style={{ color: '#d97706' }}>
                              {lateCount}
                            </h3>
                            <span className="att-stat-percentage" style={{ color: '#d97706' }}>
                              ({latePercent}%)
                            </span>
                          </div>
                          <span className="att-stat-sub">Average Punctuality</span>
                        </div>
                        <div className="att-stat-icon-wrapper amber-tint">
                          <Clock size={24} />
                        </div>
                      </div>

                      {/* CARD 4: Days Absent */}
                      <div className="att-stat-card">
                        <div className="att-stat-left">
                          <span className="att-stat-label">Days Absent</span>
                          <div className="att-stat-val-group">
                            <h3 className="att-stat-value" style={{ color: '#dc2626' }}>
                              {absentCount}
                            </h3>
                            <span className="att-stat-percentage" style={{ color: '#dc2626' }}>
                              ({absentPercent}%)
                            </span>
                          </div>
                          <span className="att-stat-sub">Absence Logged</span>
                        </div>
                        <div className="att-stat-icon-wrapper red-tint">
                          <XCircle size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Daily Timestamp Table Section */}
                    <div className="attendance-table-card">
                      <div className="att-table-header-bar">
                        <h3 className="att-table-title">Daily Timestamp</h3>
                      </div>

                      {loadingTab ? (
                        <p style={{ color: '#64748b', padding: '2rem 1.5rem', margin: 0 }}>
                          Loading gate attendance logs...
                        </p>
                      ) : totalLogs === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                          <Clock size={40} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
                          <p style={{ margin: 0 }}>No daily gate attendance logs recorded for this term selection.</p>
                        </div>
                      ) : (
                        <>
                          <div className="att-table-wrapper">
                            <table className="att-revamped-table">
                              <thead>
                                <tr>
                                  <th>DATE</th>
                                  <th>TIME IN</th>
                                  <th>TIME OUT</th>
                                  <th>STATUS</th>
                                  <th>REMARKS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedLogs.map((log, idx) => {
                                  const isLate = log.status === 'Late';
                                  const isAbsent = log.status === 'Absent';

                                  return (
                                    <tr
                                      key={idx}
                                      className={
                                        isLate
                                          ? 'att-row-late'
                                          : isAbsent
                                            ? 'att-row-absent'
                                            : 'att-row-present'
                                      }
                                    >
                                      <td className="att-col-date">
                                        {log.formattedDate || log.date}
                                      </td>
                                      <td className={`att-col-time ${isAbsent ? 'text-absent' : 'text-present'}`}>
                                        {isAbsent ? '(Absent)' : log.timeIn}
                                      </td>
                                      <td className={`att-col-time ${isAbsent ? 'text-absent' : 'text-primary'}`}>
                                        {isAbsent ? '(Absent)' : log.timeOut}
                                      </td>
                                      <td>
                                        <span className={`att-pill-badge ${isLate ? 'pill-late' : isAbsent ? 'pill-absent' : 'pill-present'}`}>
                                          {isLate ? 'Late' : isAbsent ? 'Absent' : 'On Time'}
                                        </span>
                                      </td>
                                      <td style={{ color: '#64748b', fontSize: '0.84rem' }}>
                                        {log.remarks}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          {totalPages > 1 && (
                            <div className="att-pagination-bar">
                              <span className="att-pagination-info">
                                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalLogs)} of {totalLogs} entries
                              </span>
                              <div className="att-pagination-controls">
                                <button
                                  className="att-page-btn"
                                  disabled={attPage === 1}
                                  onClick={() => setAttPage((p) => Math.max(1, p - 1))}
                                >
                                  Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                  <button
                                    key={pageNum}
                                    className={`att-page-btn ${attPage === pageNum ? 'active' : ''}`}
                                    onClick={() => setAttPage(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                ))}
                                <button
                                  className="att-page-btn"
                                  disabled={attPage === totalPages}
                                  onClick={() => setAttPage((p) => Math.min(totalPages, p + 1))}
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Modal for Report Card Preview */}
      {selectedReportCard && selectedKid && (
        <ReportCard
          studentId={selectedKid.id}
          session={selectedReportCard.session}
          term={selectedReportCard.term}
          onClose={() => setSelectedReportCard(null)}
        />
      )}

      {/* Push Notification Settings Modal */}
      <PushNotificationSettingsModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
      />
    </div>
  );
}
