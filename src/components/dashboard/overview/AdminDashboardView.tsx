import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  LayoutDashboard,
  Calendar,
  Activity,
  BookOpen,
  CreditCard,
  Sunrise,
  Sun,
  Sunset,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from './StatCard';
import { formatDisplayName } from '../../../utils/nameFormatter';
import HolidayBanner from '../../ui/HolidayBanner';

interface AdminDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  isHolidayMode?: boolean;
  resumptionDate?: string;
  adminData?: any;
  loading?: boolean;
  onToggleActivityLog?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = memo(
  ({
    userName = 'Admin',
    userTitle,
    session = '2026/2027',
    displayTerm = 'First Term',
    isHolidayMode = true,
    resumptionDate,
    adminData,
    loading,
    onToggleActivityLog,
  }) => {
    const [currentDate, setCurrentDate] = useState(() => new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentDate(new Date());
      }, 60000);
      return () => clearInterval(timer);
    }, []);

    const greeting = useMemo(() => {
      const hour = currentDate.getHours();
      if (hour >= 4 && hour < 12) return { text: 'Good Morning', Icon: Sunrise };
      if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun };
      return { text: 'Good Evening', Icon: Sunset };
    }, [currentDate]);

    const currentDateFormatted = useMemo(
      () =>
        currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      [currentDate],
    );

    const { totalStudents, totalStaff, totalClasses, totalSubjects, totalUsers } = useMemo(() => {
      const students = adminData?.metrics?.totalStudents ?? 269;
      const staff = adminData?.metrics?.totalStaff ?? 19;
      const classes = adminData?.metrics?.totalClasses ?? 14;
      const subjects = adminData?.metrics?.totalSubjects ?? 118;
      return {
        totalStudents: students,
        totalStaff: staff,
        totalClasses: classes,
        totalSubjects: subjects,
        totalUsers: students + staff,
      };
    }, [adminData]);

    const userBreakdown = useMemo(
      () => [
        { name: 'Active Students', value: totalStudents, fill: '#000080' },
        { name: 'Total Staff', value: totalStaff, fill: '#0EA5E9' },
      ],
      [totalStudents, totalStaff],
    );

    const infraBreakdown = useMemo(
      () => [
        { name: 'Classes', value: totalClasses, fill: '#000080' },
        { name: 'Subjects', value: totalSubjects, fill: '#F59E0B' },
      ],
      [totalClasses, totalSubjects],
    );

    if (loading) {
      return (
        <div className="overview-page" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading executive overview…</span>
          <div className="dashboard-banner" aria-hidden="true">
            <div className="skeleton-block" style={{ height: 120 }} />
          </div>
          <div className="dashboard-skeleton-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block" style={{ height: 150 }} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="overview-page">
        <h1 className="sr-only">
          Executive dashboard — {session} {displayTerm}
        </h1>
        {/* ════════ HOLIDAY OPERATIONAL NOTICE BANNER ════════ */}
        <HolidayBanner isHolidayMode={isHolidayMode} resumptionDate={resumptionDate} />

        {/* ════════ EXECUTIVE HERO BANNER (BLUE) ════════ */}
        <section className="dashboard-banner" aria-labelledby="dashboard-banner-title">
          <div className="banner-header-row">
            <span className="banner-date-pill">
              <Calendar size={14} aria-hidden="true" /> {currentDateFormatted}
            </span>
            <span className="banner-status-pill">
              <Sparkles size={14} aria-hidden="true" />
              {session} Session • {displayTerm}
            </span>
          </div>

          <div className="banner-content">
            <div className="banner-text">
              <h2 id="dashboard-banner-title">
                {greeting.text}, {formatDisplayName(userTitle, userName || 'Admin')}
              </h2>
              <p>
                Institutional Governance & Operations Control Hub: Oversee staff, student records,
                academics, and system setup.
              </p>
            </div>

            <div className="banner-actions">
              <Link to="/dashboard/teachers" className="banner-btn banner-btn-primary">
                <Users size={16} aria-hidden="true" /> Staff Management
              </Link>
              {onToggleActivityLog && (
                <button
                  type="button"
                  onClick={onToggleActivityLog}
                  className="banner-btn banner-btn-outline"
                  aria-haspopup="dialog"
                >
                  <Activity size={16} aria-hidden="true" /> System Activity
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
        <section aria-label="Key institutional metrics">
          <div className="stats-grid">
            <StatCard
              label="TOTAL ACTIVE STUDENTS"
              value={totalStudents}
              icon={GraduationCap}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{ type: 'positive', text: '+12.4% vs last term' }}
              subText="Active Portal Records"
            />

            <StatCard
              label="TOTAL STAFF & FACULTY"
              value={totalStaff}
              icon={Users}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{ type: 'positive', text: '100% Active' }}
              subText="Teaching & Administrative"
            />

            <StatCard
              label="CLASSES & SUBJECTS"
              value={`${totalClasses} / ${totalSubjects}`}
              icon={LayoutDashboard}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{ type: 'positive', text: 'Operational' }}
              subText="Academic Infrastructure"
            />

            <StatCard
              label="CURRENT TERM STATUS"
              value={isHolidayMode ? 'Holiday' : 'In Session'}
              icon={Calendar}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{
                type: isHolidayMode ? 'neutral' : 'positive',
                text: isHolidayMode ? `${displayTerm} • Closed` : `${displayTerm} • Open`,
              }}
              subText={session}
            />
          </div>
        </section>

        {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
        <div className="quick-shortcuts-section">
          <div className="shortcuts-header">
            <div>
              <h3>Quick Operational Shortcuts</h3>
              <p>Fast administrative access to common portal functions.</p>
            </div>
            <span className="quick-action-pill">Quick Actions</span>
          </div>

          <div className="shortcuts-grid">
            <Link to="/dashboard/students" className="shortcut-card">
              <div className="shortcut-icon">
                <GraduationCap size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Student Directory</h4>
                <p>View & manage students</p>
              </div>
            </Link>

            <Link to="/dashboard/teachers" className="shortcut-card">
              <div className="shortcut-icon">
                <Users size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Staff Roster</h4>
                <p>Manage faculty & roles</p>
              </div>
            </Link>

            <Link to="/dashboard/approvals" className="shortcut-card">
              <div className="shortcut-icon">
                <BookOpen size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Result Broadsheets</h4>
                <p>Process & review grades</p>
              </div>
            </Link>

            <Link to="/dashboard/finance/verifications" className="shortcut-card">
              <div className="shortcut-icon">
                <CreditCard size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Fee Clearance</h4>
                <p>Reconcile tuition receipts</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ════════ CHARTS GRID ════════ */}
        <div className="charts-grid">
          {/* System Users Breakdown */}
          <figure
            className="chart-card"
            aria-label={`System users: ${totalStudents} students, ${totalStaff} staff, ${totalUsers} total`}
          >
            <figcaption className="chart-card-header">
              <h3>
                <Users size={18} style={{ color: '#000080' }} aria-hidden="true" /> System Users
                Breakdown
              </h3>
              <span>Distribution</span>
            </figcaption>

            <div style={{ height: 260, position: 'relative' }} aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={userBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {userBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
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

              {/* Donut Center Count Overlay */}
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
                  {totalUsers}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                  }}
                >
                  Total Users
                </span>
              </div>
            </div>

            <div className="chart-summary-pills">
              <div className="chart-pill-item">
                <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
                <span>
                  Students: <strong>{totalStudents}</strong>
                </span>
              </div>
              <div className="chart-pill-item">
                <span className="chart-pill-dot" style={{ background: '#0EA5E9' }}></span>
                <span>
                  Staff: <strong>{totalStaff}</strong>
                </span>
              </div>
            </div>
            <table className="sr-only">
              <caption>System users breakdown values</caption>
              <tbody>
                <tr>
                  <th scope="row">Active Students</th>
                  <td>{totalStudents}</td>
                </tr>
                <tr>
                  <th scope="row">Total Staff</th>
                  <td>{totalStaff}</td>
                </tr>
              </tbody>
            </table>
          </figure>

          {/* Academic Infrastructure Bar Chart */}
          <figure
            className="chart-card"
            aria-label={`Academic infrastructure: ${totalClasses} classes, ${totalSubjects} subjects`}
          >
            <figcaption className="chart-card-header">
              <h3>
                <LayoutDashboard size={18} style={{ color: '#F59E0B' }} aria-hidden="true" />{' '}
                Academic Infrastructure
              </h3>
              <span>Classes & Subjects</span>
            </figcaption>

            <div style={{ height: 260 }} aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                  data={infraBreakdown}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} interval={0} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    allowDecimals={false}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                    }}
                    cursor={{ fill: 'rgba(0,0,128,0.04)' }}
                  />
                  <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} barSize={55}>
                    {infraBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-summary-pills">
              <div className="chart-pill-item">
                <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
                <span>
                  Classes: <strong>{totalClasses}</strong>
                </span>
              </div>
              <div className="chart-pill-item">
                <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
                <span>
                  Subjects: <strong>{totalSubjects}</strong>
                </span>
              </div>
            </div>
            <table className="sr-only">
              <caption>Academic infrastructure values</caption>
              <tbody>
                <tr>
                  <th scope="row">Classes</th>
                  <td>{totalClasses}</td>
                </tr>
                <tr>
                  <th scope="row">Subjects</th>
                  <td>{totalSubjects}</td>
                </tr>
              </tbody>
            </table>
          </figure>
        </div>
      </div>
    );
  },
);

AdminDashboardView.displayName = 'AdminDashboardView';

export default AdminDashboardView;
