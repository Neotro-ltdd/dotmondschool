import React from 'react';
import { StatCard } from './StatCard';
import { Award, Users, GraduationCap, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PrincipalDashboardViewProps {
  principalData?: any;
  loading?: boolean;
}

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({ principalData, loading }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading Executive Principal Dashboard...</div>;
  }

  return (
    <div className="principal-dashboard-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total Enrollment" 
          value={principalData?.totalStudents ?? 605} 
          icon={GraduationCap} 
          topColor="#000080" 
          subText="Active students"
        />
        <StatCard 
          label="Pending Batch Approvals" 
          value={principalData?.pendingApprovals ?? 3} 
          icon={Award} 
          topColor="#F59E0B" 
          subText="Awaiting principal sign-off"
        />
        <StatCard 
          label="School Mean Score" 
          value={`${principalData?.schoolMean ?? 68.4}%`} 
          icon={CheckCircle} 
          topColor="#059669" 
          subText="Overall academic average"
        />
        <StatCard 
          label="Teaching Staff" 
          value={principalData?.totalStaff ?? 48} 
          icon={Users} 
          topColor="#7C3AED" 
          subText="Active educators"
        />
      </div>

      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
          Principal Approval Actions
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/approvals" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '8px', background: '#000080', color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>
            <Award size={20} /> Review & Approve Term Result Sheets
          </Link>
          <Link to="/dashboard/reports" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '8px', background: '#F3F4F6', color: '#1F2937', textDecoration: 'none', fontWeight: 600 }}>
            Executive School Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboardView;
