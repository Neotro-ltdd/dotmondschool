import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Users,
  GraduationCap,
  CheckCircle,
  Calendar,
  BookOpen,
  LayoutDashboard,
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

interface PrincipalDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  isHolidayMode?: boolean;
  resumptionDate?: string;
  principalData?: any;
  loading?: boolean;
}

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({
  userName = 'Principal',
  userTitle = 'Dr.',
  session = '2026/2027',
  displayTerm = 'First Term',
  isHolidayMode,
  resumptionDate,
  principalData,
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

  const totalStudents =
    principalData?.metrics?.totalStudents ?? principalData?.totalStudents ?? 269;
  const totalStaff = principalData?.metrics?.totalStaff ?? principalData?.totalStaff ?? 19;
  const totalClasses = principalData?.metrics?.totalClasses ?? principalData?.totalClasses ?? 14;
  const totalSubjects =
    principalData?.metrics?.totalSubjects ?? principalData?.totalSubjects ?? 118;
  const pendingApprovals = principalData?.pendingApprovals ?? 3;

  if (loading) {
    return <div className="p-6 text-center">Loading Executive Principal Overview...</div>;
  }

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
              {getGreeting()}, {formatDisplayName(userTitle, userName)} 👋
            </h2>
            <p>
              Academic Leadership & Executive Governance Control: Review result sheet broadsheets,
              approve term grade distributions, and monitor institution performance standards.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/approvals" className="banner-btn banner-btn-primary">
              <Award size={16} /> Result Approvals
            </Link>
            <Link to="/dashboard/reports" className="banner-btn banner-btn-outline">
              <BookOpen size={16} /> Executive Reports
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      <div className="stats-grid grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          trendTag={{ type: 'positive', text: '● 100% Active' }}
          subText="Teaching & Administrative"
        />

        <StatCard
          label="CLASSES & SUBJECTS"
          value={`${totalClasses} / ${totalSubjects}`}
          icon={BookOpen}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Operational' }}
          subText="Academic Infrastructure"
        />

        <StatCard
          label="PENDING BATCH APPROVALS"
          value={pendingApprovals}
          icon={Award}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: `● ${pendingApprovals} Awaiting Sign-off` }}
          subText="Term Broadsheets"
        />
      </div>

      {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
      <div className="quick-shortcuts-section">
        <div className="shortcuts-header">
          <div>
            <h3>Academic Governance & Executive Shortcuts</h3>
            <p>
              Direct access to result approvals, staff rosters, and institutional performance
              reports.
            </p>
          </div>
          <span className="quick-action-pill">Quick Actions</span>
        </div>

        <div className="shortcuts-grid">
          <Link to="/dashboard/approvals" className="shortcut-card">
            <div className="shortcut-icon">
              <Award size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Result Sign-Off</h4>
              <p>Approve class broadsheets</p>
            </div>
          </Link>

          <Link to="/dashboard/reports" className="shortcut-card">
            <div className="shortcut-icon">
              <BookOpen size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Executive Reports</h4>
              <p>School performance analytics</p>
            </div>
          </Link>

          <Link to="/dashboard/teachers" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Faculty Roster</h4>
              <p>View teachers & assignments</p>
            </div>
          </Link>

          <Link to="/dashboard/students" className="shortcut-card">
            <div className="shortcut-icon">
              <GraduationCap size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Student Directory</h4>
              <p>Search enrolled student files</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════ CHARTS GRID ════════ */}
      <div className="charts-grid">
        {/* Result Sheet Approval Status */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>
              <Award size={18} style={{ color: '#000080' }} /> Result Sheet Approvals
            </h3>
            <span>Distribution</span>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 260 }}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: 15 },
                    { name: 'Pending Review', value: pendingApprovals },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#000080" />
                  <Cell fill="#F59E0B" />
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
                {15 + pendingApprovals}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                }}
              >
                Total Classes
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>
                Approved: <strong>15</strong>
              </span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
              <span>
                Pending: <strong>{pendingApprovals}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Academic Level Mean Score Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>
              <LayoutDashboard size={18} style={{ color: '#10B981' }} /> Class Level Performance
            </h3>
            <span>Average Scores</span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 260 }}>
              <BarChart
                data={[
                  { name: 'JSS 1', Average: 71 },
                  { name: 'JSS 2', Average: 68 },
                  { name: 'JSS 3', Average: 74 },
                  { name: 'SSS 1', Average: 65 },
                  { name: 'SSS 2', Average: 70 },
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="Average" fill="#000080" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>
                Top Level: <strong>JSS 3 (74%)</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboardView;
