import React from 'react';
import { StatCard } from './StatCard';
import { ShieldCheck, UserCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VendorDashboardViewProps {
  vendorData?: any;
  loading?: boolean;
}

export const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({ vendorData, loading }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading Gate Control Metrics...</div>;
  }

  return (
    <div className="vendor-dashboard-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="QR Check-ins Today" 
          value={vendorData?.totalScansToday ?? 142} 
          icon={UserCheck} 
          topColor="#000080" 
          subText="Students & Staff verified"
        />
        <StatCard 
          label="Gate Status" 
          value="Active Verification" 
          icon={ShieldCheck} 
          topColor="#059669" 
          subText="Real-time QR Scanner Ready"
        />
      </div>

      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
          Security & Access Terminal
        </h3>
        <Link to="/dashboard/vendor" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '8px', background: '#000080', color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>
          <UserCheck size={18} /> Launch Gate Scanner Terminal
        </Link>
      </div>
    </div>
  );
};

export default VendorDashboardView;
