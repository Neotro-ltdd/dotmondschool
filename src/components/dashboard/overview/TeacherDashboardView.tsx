import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  UserCheck, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Award,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';

interface TeacherDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  teacherData?: any;
  loading?: boolean;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  userName = 'Teacher',
  userTitle = 'Mr.',
  session = '2026/2027',
  displayTerm = 'First Term',
  teacherData,
  loading
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const assignedClass = teacherData?.assignedClass ?? 'JSS 2 Silver';
  const studentCount = teacherData?.studentCount ?? 38;
  const submittedSubjects = teacherData?.submittedSubjects ?? 4;
  const totalSubjects = teacherData?.totalSubjects ?? 5;
  const attendanceToday = teacherData?.attendanceToday ?? true;

  if (loading) {
    return <div className="p-6 text-center">Loading Teacher Overview...</div>;
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
              Academic Instructional Hub: Manage subject continuous assessment, classroom attendance logs, and student performance broadsheets.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/attendance" className="banner-btn banner-btn-primary">
              <UserCheck size={16} /> Take Attendance
            </Link>
            <Link to="/dashboard/results" className="banner-btn banner-btn-outline">
              <BookOpen size={16} /> Enter Assessment Scores
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      <div className="stats-grid">
        <StatCard 
          label="ASSIGNED CLASS"
          value={assignedClass}
          icon={BookOpen}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Form Teacher' }}
          subText="Primary Class Roster"
        />

        <StatCard 
          label="STUDENTS IN CLASS"
          value={studentCount}
          icon={Users}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Enrolled' }}
          subText="Active Class Students"
        />

        <StatCard 
          label="SCORE ENTRIES SUBMITTED"
          value={`${submittedSubjects} / ${totalSubjects}`}
          icon={CheckCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: `${Math.round((submittedSubjects / totalSubjects) * 100)}% Complete` }}
          subText="Subjects Finalized"
        />

        <StatCard 
          label="DAILY ATTENDANCE LOG"
          value={attendanceToday ? 'Recorded Today' : 'Pending Today'}
          icon={FileText}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: attendanceToday ? 'positive' : 'negative', text: attendanceToday ? '● Completed' : '● Action Required' }}
          subText="Classroom Daily Verification"
        />
      </div>

      {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
      <div className="quick-shortcuts-section">
        <div className="shortcuts-header">
          <div>
            <h3>Teacher Operations & Quick Actions</h3>
            <p>Direct instructional workflows for continuous assessment and attendance.</p>
          </div>
          <span className="quick-action-pill">Quick Actions</span>
        </div>

        <div className="shortcuts-grid">
          <Link to="/dashboard/attendance" className="shortcut-card">
            <div className="shortcut-icon">
              <UserCheck size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Daily Attendance</h4>
              <p>QR code & manual check-in</p>
            </div>
          </Link>

          <Link to="/dashboard/results" className="shortcut-card">
            <div className="shortcut-icon">
              <BookOpen size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Subject Scores</h4>
              <p>Enter CA & Examination marks</p>
            </div>
          </Link>

          <Link to="/dashboard/admin/students" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Classroom Roster</h4>
              <p>View student records & bio-data</p>
            </div>
          </Link>

          <Link to="/dashboard/approvals" className="shortcut-card">
            <div className="shortcut-icon">
              <Award size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Class Broadsheet</h4>
              <p>Compute & review term grades</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════ CHARTS GRID ════════ */}
      <div className="charts-grid">
        {/* Score Submission Completion */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><BookOpen size={18} style={{ color: '#000080' }} /> Subject Score Submission</h3>
            <span>Completion</span>
          </div>
          
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Submitted', value: submittedSubjects },
                    { name: 'Pending', value: totalSubjects - submittedSubjects }
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
                {Math.round((submittedSubjects / totalSubjects) * 100)}%
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Completed
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Submitted: <strong>{submittedSubjects}</strong></span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
              <span>Pending: <strong>{totalSubjects - submittedSubjects}</strong></span>
            </div>
          </div>
        </div>

        {/* Class Subject Performance Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><LayoutDashboard size={18} style={{ color: '#10B981' }} /> Subject Average Scores</h3>
            <span>Class Performance</span>
          </div>
          
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={[
                  { name: 'Mathematics', Score: 78 },
                  { name: 'English', Score: 84 },
                  { name: 'Basic Science', Score: 72 },
                  { name: 'Civic Ed.', Score: 89 }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                <Bar dataKey="Score" fill="#000080" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Highest Avg: <strong>Civic Ed. (89%)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardView;
