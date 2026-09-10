import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Award,
  Calendar,
  CheckCircle,
  BookOpen,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import StatCard from './StatCard';
import { getParentDisplayName } from '../../../utils/nameFormatter';
import { API_ROOT } from '../../../services/api';
import HolidayBanner from '../../ui/HolidayBanner';

interface ParentDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  isHolidayMode?: boolean;
  resumptionDate?: string;
  parentData?: any;
  loading?: boolean;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  userName = 'Parent / Guardian',
  session = '2026/2027',
  displayTerm = 'First Term',
  isHolidayMode,
  resumptionDate,
  parentData,
  loading,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour >= 4 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDateFormatted = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const kids: any[] = Array.isArray(parentData)
    ? parentData
    : parentData?.kids || [];

  const wardCount = kids.length;
  const hasOwing = parentData?.hasOwing ?? false;
  const totalOwing = parentData?.totalOwing ?? 0;
  const clearedCount = parentData?.clearedCount ?? (hasOwing ? 0 : wardCount);
  const owingCount = parentData?.owingCount ?? (hasOwing ? wardCount : 0);
  const attendanceRate = parentData?.averageAttendance ?? 96;

  // Resolve parent display name:
  // If parent name is not provided or auto-generated username, use child's surname with "Mr & Mrs"
  const resolvedParentName =
    parentData?.computedParentName || getParentDisplayName(userName, kids);

  const getPhotoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  if (loading) {
    return <div className="p-6 text-center" style={{ color: '#64748b' }}>Loading Parent Overview...</div>;
  }

  const clearancePercentage = wardCount > 0 ? Math.round((clearedCount / wardCount) * 100) : 100;

  return (
    <div className="overview-page">
      <HolidayBanner isHolidayMode={isHolidayMode} resumptionDate={resumptionDate} />
      
      {/* ════════ EXECUTIVE HERO BANNER ════════ */}
      <div className="dashboard-banner">
        <div className="banner-header-row">
          <span className="banner-date-pill">
            <Calendar size={14} /> {currentDateFormatted}
          </span>
          <span className="banner-status-pill">
            {session} Session • {displayTerm}
          </span>
        </div>

        <div className="banner-content">
          <div className="banner-text">
            <h2>
              {getGreeting()}, {resolvedParentName} 👋
            </h2>
            <p>
              Parent & Guardian Portal: Access ward academic report cards, continuous assessment
              scores, term tuition payment receipts, and attendance logs.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/parent-hub" className="banner-btn banner-btn-primary">
              <Award size={16} /> View Ward Report Cards
            </Link>
            <Link to="/dashboard/parent-hub" className="banner-btn banner-btn-outline">
              <CreditCard size={16} /> Pay & Download Receipts
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      <div className="stats-grid">
        <StatCard
          label="LINKED WARDS"
          value={wardCount}
          icon={Users}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: `● ${wardCount} Active Ward${wardCount === 1 ? '' : 's'}` }}
          subText={kids.length > 0 ? kids.map((k: any) => k.firstName).join(', ') : 'Registered Student Files'}
        />

        <StatCard
          label="FEE PAYMENT STATUS"
          value={hasOwing ? 'Action Required' : 'Cleared'}
          icon={CreditCard}
          topColor={hasOwing ? '#D97706' : '#000080'}
          iconBg={hasOwing ? '#FEF3C7' : '#EFF6FF'}
          iconColor={hasOwing ? '#D97706' : '#000080'}
          trendTag={
            hasOwing
              ? { type: 'negative', text: '● Tuition Outstanding' }
              : { type: 'positive', text: '● Fully Paid' }
          }
          subText={
            hasOwing
              ? totalOwing > 0
                ? `₦${totalOwing.toLocaleString()} Balance Pending`
                : 'Pending Tuition Clearance'
              : 'Current Term Tuition Cleared'
          }
        />

        <StatCard
          label="TERM REPORT CARDS"
          value={hasOwing ? 'Locked' : 'Available'}
          icon={Award}
          topColor={hasOwing ? '#DC2626' : '#000080'}
          iconBg={hasOwing ? '#FEE2E2' : '#EFF6FF'}
          iconColor={hasOwing ? '#DC2626' : '#000080'}
          trendTag={
            hasOwing
              ? { type: 'negative', text: '● Fee Clearance Required' }
              : { type: 'positive', text: '● Approved Results' }
          }
          subText={hasOwing ? 'Clear Fees To Unlock Results' : 'Finalized Broadsheets'}
        />

        <StatCard
          label="WARD ATTENDANCE RATE"
          value={`${attendanceRate}%`}
          icon={CheckCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Regular Attendance' }}
          subText="Classroom Daily Log"
        />
      </div>

      {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
      <div className="quick-shortcuts-section">
        <div className="shortcuts-header">
          <div>
            <h3>Parent Quick Actions & Ward Shortcuts</h3>
            <p>Direct access to academic results, fee receipts, and ward details.</p>
          </div>
          <span className="quick-action-pill">Quick Actions</span>
        </div>

        <div className="shortcuts-grid">
          <Link to="/dashboard/parent-hub" className="shortcut-card">
            <div className="shortcut-icon">
              <Award size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Report Cards</h4>
              <p>View termly result sheets</p>
            </div>
          </Link>

          <Link to="/dashboard/parent-hub" className="shortcut-card">
            <div className="shortcut-icon">
              <CreditCard size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Fee Clearance</h4>
              <p>Pay & download receipts</p>
            </div>
          </Link>

          <Link to="/dashboard/parent-hub" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Ward Profile</h4>
              <p>View student records</p>
            </div>
          </Link>

          <Link to="/dashboard/parent-hub" className="shortcut-card">
            <div className="shortcut-icon">
              <BookOpen size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Attendance Logs</h4>
              <p>Review class attendance</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════ CHARTS & WARDS GRID ════════ */}
      <div className="charts-grid">
        {/* Fee Payment Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>
              <CreditCard size={18} style={{ color: '#000080' }} /> Tuition Clearance Breakdown
            </h3>
            <span>Status</span>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 260 }}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cleared Wards', value: clearedCount > 0 ? clearedCount : (owingCount === 0 ? 1 : 0) },
                    { name: 'Pending Balance', value: owingCount },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#000080" />
                  <Cell fill="#D97706" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: '#0F172A',
                  display: 'block',
                  lineHeight: 1,
                }}
              >
                {clearancePercentage}%
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                }}
              >
                {hasOwing ? 'Cleared' : 'Cleared'}
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>
                Cleared Wards: <strong>{clearedCount}</strong>
              </span>
            </div>
            {owingCount > 0 && (
              <div className="chart-pill-item">
                <span className="chart-pill-dot" style={{ background: '#D97706' }}></span>
                <span>
                  Pending Tuition: <strong>{owingCount}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Real Linked Wards Directory Card */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>
              <Users size={18} style={{ color: '#000080' }} /> Enrolled Wards Directory
            </h3>
            <Link
              to="/dashboard/parent-hub"
              style={{
                fontSize: '0.8rem',
                color: '#000080',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Manage in Hub <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ minHeight: 260, display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
            {kids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <User size={36} style={{ color: '#cbd5e1', margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No enrolled wards linked to this account.</p>
              </div>
            ) : (
              kids.map((kid: any) => {
                const photo = getPhotoUrl(kid.passportUrl);
                const kidFeeSummary = parentData?.feeSummaries?.find((f: any) => f.kidId === kid.id);
                const isKidOwing = kidFeeSummary ? kidFeeSummary.isOwing : !kid.isCleared;

                return (
                  <div
                    key={kid.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {photo ? (
                        <img
                          src={photo}
                          alt={kid.firstName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#000080',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {(kid.firstName?.[0] || 'S') + (kid.surname?.[0] || '')}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                          {kid.surname} {kid.firstName} {kid.otherNames || ''}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {kid.className || 'Student'} • <span style={{ fontFamily: 'monospace' }}>{kid.registrationNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          background: isKidOwing ? '#fef3c7' : '#ecfdf5',
                          color: isKidOwing ? '#b45309' : '#047857',
                        }}
                      >
                        {isKidOwing ? 'Tuition Pending' : 'Tuition Cleared'}
                      </span>
                      <Link
                        to="/dashboard/parent-hub"
                        style={{
                          background: '#000080',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        View Hub
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardView;
