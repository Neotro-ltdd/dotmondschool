import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  UserCheck, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Award,
  Users,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';
import { formatDisplayName } from '../../../utils/nameFormatter';

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

  const isClassTeacher = teacherData?.isClassTeacher ?? false;
  const isSubjectTeacher = teacherData?.isSubjectTeacher ?? true;

  const formattedDisplayName = formatDisplayName(userTitle, userName);

  // Dynamic welcome message based on roles
  const getWelcomeSubtitle = () => {
    if (isClassTeacher && isSubjectTeacher) {
      return 'Academic Instructional Hub: Manage form class attendance, termly evaluation, and subject continuous assessment scores.';
    } else if (isClassTeacher) {
      return 'Class Form Teacher Workstation: Manage class records, review daily attendance, and record termly affective evaluation.';
    } else {
      return 'Subject Instruction Portal: Manage subject topics, continuous assessment scores, grade distributions, and class rosters.';
    }
  };

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
              {getGreeting()}, {formattedDisplayName} 👋
            </h2>
            <p>
              {getWelcomeSubtitle()}
            </p>
          </div>

          <div className="banner-actions">
            {isClassTeacher && (
              <Link to="/dashboard/teacher/attendance" className="banner-btn banner-btn-primary">
                <UserCheck size={16} /> Take Attendance
              </Link>
            )}
            {isSubjectTeacher && (
              <Link 
                to="/dashboard/teacher/assessment" 
                className={isClassTeacher ? "banner-btn banner-btn-outline" : "banner-btn banner-btn-primary"}
              >
                <BookOpen size={16} /> Enter Assessment Scores
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      {(() => {
        if (!isClassTeacher && isSubjectTeacher) {
          // Subject Teacher View
          const totalAllocations = teacherData?.subjectTeacherMetrics?.totalAllocations ?? (teacherData?.totalAllocations || 0);
          const totalSubjectStudents = teacherData?.subjectTeacherMetrics?.totalStudents ?? 0;
          const allocationsList = teacherData?.subjectTeacherMetrics?.allocations || [];
          const distinctClassesCount = new Set(allocationsList.map((a: any) => a.className)).size;

          return (
            <div className="stats-grid">
              <StatCard 
                label="ASSIGNED SUBJECTS"
                value={totalAllocations}
                icon={BookOpen}
                topColor="#000080"
                iconBg="#EFF6FF"
                iconColor="#000080"
                trendTag={{ type: 'positive', text: '● Active Subjects' }}
                subText="Subject Allocations"
              />

              <StatCard 
                label="TOTAL SUBJECT STUDENTS"
                value={totalSubjectStudents}
                icon={Users}
                topColor="#000080"
                iconBg="#EFF6FF"
                iconColor="#000080"
                trendTag={{ type: 'positive', text: `${distinctClassesCount} Class Arms` }}
                subText="Assigned Roster Count"
              />

              <StatCard 
                label="CLASSES TAUGHT"
                value={distinctClassesCount}
                icon={GraduationCap}
                topColor="#000080"
                iconBg="#EFF6FF"
                iconColor="#000080"
                trendTag={{ type: 'neutral', text: 'Active Streams' }}
                subText="Class Allocations"
              />

              <StatCard 
                label="C.A. SCORE ENTRY STATUS"
                value="Active"
                icon={FileText}
                topColor="#000080"
                iconBg="#EFF6FF"
                iconColor="#000080"
                trendTag={{ type: 'positive', text: 'Continuous Assessment' }}
                subText="Termly Assessment Portal"
              />
            </div>
          );
        }

        // Form Teacher OR Both
        const assignedClass = teacherData?.classTeacherMetrics?.className ?? 'JSS 2 Silver';
        const studentCount = teacherData?.classTeacherMetrics?.totalStudents ?? 38;
        const attendanceToday = teacherData?.classTeacherMetrics?.attendanceToday?.percentage ?? 0;
        const pendingRemarks = teacherData?.classTeacherMetrics?.pendingRemarks ?? 0;

        return (
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
              label="TODAY'S ATTENDANCE"
              value={`${attendanceToday}%`}
              icon={CheckCircle}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{ type: 'positive', text: `Present: ${teacherData?.classTeacherMetrics?.attendanceToday?.present ?? 0}` }}
              subText="Daily Gate & Register"
            />

            <StatCard 
              label="PENDING REMARKS"
              value={pendingRemarks}
              icon={FileText}
              topColor="#000080"
              iconBg="#EFF6FF"
              iconColor="#000080"
              trendTag={{ type: pendingRemarks > 0 ? 'negative' : 'positive', text: pendingRemarks > 0 ? '● Action Required' : '● Completed' }}
              subText="Classroom Affective Log"
            />
          </div>
        );
      })()}

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
          {isClassTeacher && (
            <Link to="/dashboard/teacher/attendance" className="shortcut-card">
              <div className="shortcut-icon">
                <UserCheck size={20} />
              </div>
              <div className="shortcut-info">
                <h4>Daily Attendance</h4>
                <p>QR code & manual check-in</p>
              </div>
            </Link>
          )}

          <Link to="/dashboard/teacher/assessment" className="shortcut-card">
            <div className="shortcut-icon">
              <BookOpen size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Subject Scores</h4>
              <p>Enter CA & Examination marks</p>
            </div>
          </Link>

          <Link to="/dashboard/teacher/my-class" className="shortcut-card">
            <div className="shortcut-icon">
              <Users size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Classroom Roster</h4>
              <p>View student records & bio-data</p>
            </div>
          </Link>

          <Link to="/dashboard/teacher/results" className="shortcut-card">
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
    </div>
  );
};

export default TeacherDashboardView;
