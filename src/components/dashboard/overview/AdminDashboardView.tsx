import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  LayoutDashboard, 
  Calendar, 
  Activity, 
  BookOpen, 
  CreditCard,
  Award,
  Palmtree
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';
import { formatDisplayName } from '../../../utils/nameFormatter';

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

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  userName = 'Admin',
  userTitle,
  session = '2026/2027',
  displayTerm = 'First Term',
  isHolidayMode = true,
  resumptionDate,
  adminData,
  loading,
  onToggleActivityLog
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
    day: 'numeric'
  });

  const totalStudents = adminData?.metrics?.totalStudents ?? 269;
  const totalStaff = adminData?.metrics?.totalStaff ?? 19;
  const totalClasses = adminData?.metrics?.totalClasses ?? 14;
  const totalSubjects = adminData?.metrics?.totalSubjects ?? 118;

  if (loading) {
    return <div className="p-6 text-center">Loading Executive Overview...</div>;
  }

  return (
    <div className="overview-page">
      {/* ════════ HOLIDAY OPERATIONAL NOTICE BANNER ════════ */}
      {isHolidayMode && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1px solid #FCD34D',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#F59E0B', color: '#FFF', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palmtree size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.95rem' }}>
                🌴 School is Currently on Holiday
              </div>
              <div style={{ fontSize: '0.825rem', color: '#B45309' }}>
                Academic term break is active. Normal classes resume on <strong>{resumptionDate || 'September 14, 2026'}</strong>.
              </div>
            </div>
          </div>
          <span style={{
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #F59E0B',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            Status: Holiday Break
          </span>
        </div>
      )}

      {/* ════════ EXECUTIVE HERO BANNER (BLUE) ════════ */}
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
              {getGreeting()}, {formatDisplayName(userTitle, userName || 'Admin')} 👋
            </h2>
            <p>
              Institutional Governance & Operations Control Hub: Oversee staff, student records, academics, and system setup.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/admin/staff" className="banner-btn banner-btn-primary">
              <Users size={16} /> Staff Management
            </Link>
            {onToggleActivityLog && (
              <button 
                type="button" 
                onClick={onToggleActivityLog} 
                className="banner-btn banner-btn-outline"
              >
                <Activity size={16} /> System Activity
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
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
          trendTag={{ type: 'positive', text: '● 100% Active' }}
          subText="Teaching & Administrative"
        />

        <StatCard 
          label="CLASSES & SUBJECTS"
          value={`${totalClasses} / ${totalSubjects}`}
          icon={LayoutDashboard}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Operational' }}
          subText="Academic Infrastructure"
        />

        <StatCard 
          label="CURRENT TERM STATUS"
          value={`${session} ${displayTerm} – ${isHolidayMode ? 'Holiday' : 'In Session'}`}
          icon={Calendar}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: isHolidayMode ? '🌴 Holiday / Closed' : '● In Session' }}
          subText="Termly Operational Status"
        />
      </div>

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
          <Link to="/dashboard/admin/students" className="shortcut-card">
            <div className="shortcut-icon">
              <GraduationCap size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Student Directory</h4>
              <p>View & manage students</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/staff" className="shortcut-card">
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
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><Users size={18} style={{ color: '#000080' }} /> System Users Breakdown</h3>
            <span>Distribution</span>
          </div>
          
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Active Students', value: totalStudents },
                    { name: 'Total Staff', value: totalStaff }
                  ]} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={65} 
                  outerRadius={95} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  <Cell fill="#000080" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Count Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', display: 'block', lineHeight: 1 }}>
                {totalStudents + totalStaff}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Users
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Students: <strong>{totalStudents}</strong></span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#10B981' }}></span>
              <span>Staff: <strong>{totalStaff}</strong></span>
            </div>
          </div>
        </div>

        {/* Academic Infrastructure Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><LayoutDashboard size={18} style={{ color: '#F59E0B' }} /> Academic Infrastructure</h3>
            <span>Classes & Subjects</span>
          </div>
          
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={[{ name: 'Active Infrastructure', Classes: totalClasses, Subjects: totalSubjects }]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} cursor={{ fill: 'rgba(0,0,128,0.04)' }} />
                <Bar dataKey="Classes" fill="#000080" radius={[6, 6, 0, 0]} barSize={55} />
                <Bar dataKey="Subjects" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={55} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Classes: <strong>{totalClasses}</strong></span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
              <span>Subjects: <strong>{totalSubjects}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
