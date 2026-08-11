import React from 'react';
import { StatCard } from './StatCard';
import { BookOpen, UserCheck, CheckCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeacherDashboardViewProps {
  teacherData?: any;
  loading?: boolean;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ teacherData, loading }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading Teacher Metrics...</div>;
  }

  return (
    <div className="teacher-dashboard-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Assigned Class" 
          value={teacherData?.assignedClass ?? 'JSS 2A'} 
          icon={BookOpen} 
          topColor="#000080" 
          subText="Form Teacher Role"
        />
        <StatCard 
          label="Students in Class" 
          value={teacherData?.studentCount ?? 38} 
          icon={UserCheck} 
          topColor="#2563EB" 
          subText="Enrolled for term"
        />
        <StatCard 
          label="Score Entries Submitted" 
          value={`${teacherData?.submittedSubjects ?? 4}/${teacherData?.totalSubjects ?? 5}`} 
          icon={CheckCircle} 
          topColor="#059669" 
          subText="Subjects finalized"
        />
        <StatCard 
          label="Attendance Recorded" 
          value={teacherData?.attendanceToday ? 'Recorded Today' : 'Pending Today'} 
          icon={FileText} 
          topColor="#7C3AED" 
          subText="Daily attendance log"
        />
      </div>

      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
          Teacher Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Link to="/dashboard/attendance" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
            <UserCheck size={20} color="#000080" /> Take Daily Attendance (QR / Manual)
          </Link>
          <Link to="/dashboard/results" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
            <BookOpen size={20} color="#2563EB" /> Enter Subject Assessment Scores
          </Link>
          <Link to="/dashboard/reports" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
            <FileText size={20} color="#059669" /> Class Performance & Broadsheet
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardView;
