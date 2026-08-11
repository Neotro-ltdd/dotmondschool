import React from 'react';
import { StatCard } from './StatCard';
import { CreditCard, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface AccountantDashboardViewProps {
  accountantData?: any;
  loading?: boolean;
}

export const AccountantDashboardView: React.FC<AccountantDashboardViewProps> = ({ accountantData, loading }) => {
  const feeColors = ['#000080', '#3B82F6', '#EF4444'];
  const pieData = [
    { name: 'Fully Paid', value: accountantData?.fullyPaidCount ?? 420 },
    { name: 'Pending Verification', value: accountantData?.pendingCount ?? 65 },
    { name: 'Unpaid Invoices', value: accountantData?.unpaidCount ?? 120 }
  ];

  if (loading) {
    return <div className="p-4 text-center">Loading Financial Metrics...</div>;
  }

  return (
    <div className="accountant-dashboard-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total Revenue Collected" 
          value={`₦${(accountantData?.totalCollected ?? 45200000).toLocaleString()}`} 
          icon={DollarSign} 
          topColor="#059669" 
          subText="Current term revenue"
        />
        <StatCard 
          label="Pending Verification" 
          value={`₦${(accountantData?.pendingAmount ?? 3850000).toLocaleString()}`} 
          icon={AlertCircle} 
          topColor="#F59E0B" 
          subText={`${accountantData?.pendingCount ?? 65} invoices awaiting check`}
        />
        <StatCard 
          label="Outstanding Balance" 
          value={`₦${(accountantData?.outstandingAmount ?? 8400000).toLocaleString()}`} 
          icon={CreditCard} 
          topColor="#EF4444" 
          subText="Unpaid student fees"
        />
        <StatCard 
          label="Clearance Rate" 
          value={`${accountantData?.clearanceRate ?? 78}%`} 
          icon={CheckCircle} 
          topColor="#000080" 
          subText="Fully cleared students"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
            Fee Collection Status Breakdown
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={feeColors[index % feeColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
            Financial Operations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/dashboard/finance/payments" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
              <CreditCard size={20} color="#059669" /> Verify Incoming Proofs of Payment
            </Link>
            <Link to="/dashboard/finance/invoices" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
              <FileText size={20} color="#000080" /> Generate Term Invoices & Templates
            </Link>
            <Link to="/dashboard/reports" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#1F2937', fontWeight: 600 }}>
              <DollarSign size={20} color="#7C3AED" /> Fee Clearance & Audit Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboardView;
