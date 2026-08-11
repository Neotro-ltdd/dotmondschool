import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Award, 
  Calendar, 
  CheckCircle, 
  BookOpen, 
  LayoutDashboard 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';

interface ParentDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  parentData?: any[];
  loading?: boolean;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  userName = 'Parent / Guardian',
  userTitle = 'Mr.',
  session = '2026/2027',
  displayTerm = 'First Term',
  parentData = [],
  loading
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const wardCount = parentData.length || 2;

  if (loading) {
    return <div className="p-6 text-center">Loading Parent Overview...</div>;
  }

  return (
    <div className="overview-page">
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
              Good Afternoon, {userTitle ? `${userTitle} ` : ''}{userName} 👋
            </h2>
            <p>
              Parent & Guardian Portal: Access ward academic report cards, continuous assessment scores, term tuition payment receipts, and attendance logs.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/parent" className="banner-btn banner-btn-primary">
              <Award size={16} /> View Ward Report Cards
            </Link>
            <Link to="/dashboard/parent" className="banner-btn banner-btn-outline">
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
          trendTag={{ type: 'positive', text: '● Enrolled Wards' }}
          subText="Registered Student Files"
        />

        <StatCard 
          label="FEE PAYMENT STATUS"
          value="Cleared"
          icon={CreditCard}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Fully Paid' }}
          subText="Current Term Tuition"
        />

        <StatCard 
          label="TERM REPORT CARDS"
          value="Available"
          icon={Award}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Approved Results' }}
          subText="Finalized Broadsheets"
        />

        <StatCard 
          label="WARD ATTENDANCE RATE"
          value="96%"
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
          <Link to="/dashboard/parent" className="shortcut-card">
            <div className="shortcut-icon">
              <Award size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Report Cards</h4>
              <p>View termly result sheets</p>
            </div>
          </Link>

          <Link to="/dashboard/parent" className="shortcut-card">
            <div className="shortcut-icon">
              <CreditCard size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Fee Clearance</h4>
              <p>Pay & download receipts</p>
            </div>
          </Link>

          <Link to="/dashboard/parent" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Ward Profile</h4>
              <p>View student records</p>
            </div>
          </Link>

          <Link to="/dashboard/parent" className="shortcut-card">
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

      {/* ════════ CHARTS GRID ════════ */}
      <div className="charts-grid">
        {/* Fee Payment Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><CreditCard size={18} style={{ color: '#000080' }} /> Tuition Clearance</h3>
            <span>Status</span>
          </div>
          
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Cleared Wards', value: wardCount },
                    { name: 'Pending Balance', value: 0 }
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
                100%
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Cleared
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Cleared Wards: <strong>{wardCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Ward Subject Grades Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><LayoutDashboard size={18} style={{ color: '#10B981' }} /> Ward Academic Performance</h3>
            <span>Subject Averages</span>
          </div>
          
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={[
                  { name: 'Maths', Score: 85 },
                  { name: 'English', Score: 90 },
                  { name: 'Science', Score: 78 },
                  { name: 'Civics', Score: 92 }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                <Bar dataKey="Score" fill="#000080" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Top Grade: <strong>Civics (92%)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardView;
