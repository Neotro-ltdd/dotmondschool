import React from 'react';
import { StatCard } from './StatCard';
import { Users, CreditCard, Award, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ParentDashboardViewProps {
  parentData?: any[];
  loading?: boolean;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ parentData = [], loading }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading Ward Overview...</div>;
  }

  return (
    <div className="parent-dashboard-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Linked Wards" 
          value={parentData.length || 2} 
          icon={Users} 
          topColor="#000080" 
          subText="Students registered under parent"
        />
        <StatCard 
          label="Fee Status" 
          value="Cleared" 
          icon={CreditCard} 
          topColor="#059669" 
          subText="Current term balance"
        />
        <StatCard 
          label="Latest Report Cards" 
          value="Available" 
          icon={Award} 
          topColor="#2563EB" 
          subText="Approved results ready"
        />
      </div>

      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
          Ward Actions & Quick Access
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/parent" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '8px', background: '#000080', color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>
            <Award size={18} /> View Ward Report Cards
          </Link>
          <Link to="/dashboard/parent" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '8px', background: '#F3F4F6', color: '#1F2937', textDecoration: 'none', fontWeight: 600 }}>
            <CreditCard size={18} /> Pay & Download Fee Receipts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardView;
