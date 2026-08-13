import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserCheck, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Users, 
  LayoutDashboard 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';
import { formatDisplayName } from '../../../utils/nameFormatter';
import HolidayBanner from '../../ui/HolidayBanner';

interface VendorDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  isHolidayMode?: boolean;
  resumptionDate?: string;
  vendorData?: any;
  loading?: boolean;
}

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({
  userName = 'Security Personnel',
  userTitle = 'Officer',
  session = '2026/2027',
  displayTerm = 'First Term',
  isHolidayMode,
  resumptionDate,
  vendorData,
  loading
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

  const totalScansToday = vendorData?.totalScansToday ?? 142;

  if (loading) {
    return <div className="p-6 text-center">Loading Security Gate Overview...</div>;
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
              Gate Control & Access Security Terminal: Real-time QR identity verification, student & staff entry logging, and campus perimeter access control.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/vendor" className="banner-btn banner-btn-primary">
              <UserCheck size={16} /> Launch QR Gate Scanner
            </Link>
            <Link to="/dashboard/attendance" className="banner-btn banner-btn-outline">
              <FileText size={16} /> Access Logs
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      <div className="stats-grid">
        <StatCard 
          label="QR CHECK-INS TODAY"
          value={totalScansToday}
          icon={UserCheck}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Scans Active' }}
          subText="Students & Staff Verified"
        />

        <StatCard 
          label="GATE ACCESS TERMINAL"
          value="Online"
          icon={ShieldCheck}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Scanner Ready' }}
          subText="Real-time Verification"
        />

        <StatCard 
          label="UNAUTHORIZED ALERTS"
          value="0"
          icon={AlertCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● All Clear' }}
          subText="Perimeter Alerts"
        />

        <StatCard 
          label="VISITOR PASSES ISSUED"
          value="28"
          icon={Users}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Temporary Passes' }}
          subText="Daily Campus Visitors"
        />
      </div>

      {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
      <div className="quick-shortcuts-section">
        <div className="shortcuts-header">
          <div>
            <h3>Security & Access Operations</h3>
            <p>Direct access to QR verification terminals and access logs.</p>
          </div>
          <span className="quick-action-pill">Quick Actions</span>
        </div>

        <div className="shortcuts-grid">
          <Link to="/dashboard/vendor" className="shortcut-card">
            <div className="shortcut-icon">
              <UserCheck size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Launch Scanner</h4>
              <p>Scan student ID QR codes</p>
            </div>
          </Link>

          <Link to="/dashboard/attendance" className="shortcut-card">
            <div className="shortcut-icon">
              <FileText size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Gate Log History</h4>
              <p>Review daily entry timestamps</p>
            </div>
          </Link>

          <Link to="/dashboard/vendor" className="shortcut-card">
            <div className="shortcut-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="shortcut-info">
              <h4>ID Verification</h4>
              <p>Verify staff & student passes</p>
            </div>
          </Link>

          <Link to="/dashboard/vendor" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Visitor Logs</h4>
              <p>Register guest entries</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════ CHARTS GRID ════════ */}
      <div className="charts-grid">
        {/* Verification Status Donut */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><ShieldCheck size={18} style={{ color: '#000080' }} /> Gate Verification Status</h3>
            <span>Distribution</span>
          </div>
          
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Verified Entry', value: totalScansToday },
                    { name: 'Manual Override', value: 12 }
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
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', display: 'block', lineHeight: 1 }}>
                {totalScansToday + 12}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Entries
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>QR Verified: <strong>{totalScansToday}</strong></span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
              <span>Manual: <strong>12</strong></span>
            </div>
          </div>
        </div>

        {/* Peak Gate Check-in Volume Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><LayoutDashboard size={18} style={{ color: '#10B981' }} /> Peak Check-in Volume</h3>
            <span>Hourly Trend</span>
          </div>
          
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={[
                  { name: '7:00 AM', Scans: 45 },
                  { name: '7:30 AM', Scans: 82 },
                  { name: '8:00 AM', Scans: 28 },
                  { name: '2:00 PM', Scans: 55 }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                <Bar dataKey="Scans" fill="#000080" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Peak Hour: <strong>7:30 AM (82 scans)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardView;
