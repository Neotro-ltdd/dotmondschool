import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Award, 
  LayoutDashboard 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import StatCard from './StatCard';

interface AccountantDashboardViewProps {
  userName?: string;
  userTitle?: string;
  session?: string;
  displayTerm?: string;
  accountantData?: any;
  loading?: boolean;
}

export const AccountantDashboardView: React.FC<AccountantDashboardViewProps> = ({
  userName = 'Accountant',
  userTitle = 'Mr.',
  session = '2026/2027',
  displayTerm = 'First Term',
  accountantData,
  loading
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalCollected = accountantData?.totalCollected ?? 45200000;
  const pendingAmount = accountantData?.pendingAmount ?? 3850000;
  const pendingCount = accountantData?.pendingCount ?? 65;
  const outstandingAmount = accountantData?.outstandingAmount ?? 8400000;
  const clearanceRate = accountantData?.clearanceRate ?? 78;

  const fullyPaidCount = accountantData?.fullyPaidCount ?? 420;
  const unpaidCount = accountantData?.unpaidCount ?? 120;

  if (loading) {
    return <div className="p-6 text-center">Loading Bursary Overview...</div>;
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
              Bursary & Financial Control Operations Hub: Oversee tuition fee collections, payment verifications, student invoice clearance, and financial audit reports.
            </p>
          </div>

          <div className="banner-actions">
            <Link to="/dashboard/finance/verifications" className="banner-btn banner-btn-primary">
              <CreditCard size={16} /> Verify Payments
            </Link>
            <Link to="/dashboard/finance/invoices" className="banner-btn banner-btn-outline">
              <FileText size={16} /> Term Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE STAT CARDS GRID ════════ */}
      <div className="stats-grid">
        <StatCard 
          label="TOTAL REVENUE COLLECTED"
          value={`₦${totalCollected.toLocaleString()}`}
          icon={DollarSign}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Term Collections' }}
          subText="Verified Receipts"
        />

        <StatCard 
          label="PENDING VERIFICATION"
          value={`₦${pendingAmount.toLocaleString()}`}
          icon={AlertCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: `● ${pendingCount} Awaiting Check` }}
          subText="Proof of Payments"
        />

        <StatCard 
          label="OUTSTANDING BALANCE"
          value={`₦${outstandingAmount.toLocaleString()}`}
          icon={CreditCard}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Uncollected Fees' }}
          subText="Pending Student Tuition"
        />

        <StatCard 
          label="FEES CLEARANCE RATE"
          value={`${clearanceRate}%`}
          icon={CheckCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Fully Cleared' }}
          subText="Cleared Student Roster"
        />
      </div>

      {/* ════════ QUICK OPERATIONAL SHORTCUTS ════════ */}
      <div className="quick-shortcuts-section">
        <div className="shortcuts-header">
          <div>
            <h3>Bursary Operations & Financial Workflows</h3>
            <p>Direct access to fee verification, invoicing, and clearance auditing.</p>
          </div>
          <span className="quick-action-pill">Quick Actions</span>
        </div>

        <div className="shortcuts-grid">
          <Link to="/dashboard/finance/verifications" className="shortcut-card">
            <div className="shortcut-icon">
              <CreditCard size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Payment Verification</h4>
              <p>Approve bank transfer proofs</p>
            </div>
          </Link>

          <Link to="/dashboard/finance/invoices" className="shortcut-card">
            <div className="shortcut-icon">
              <FileText size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Generate Invoices</h4>
              <p>Issue termly fee schedules</p>
            </div>
          </Link>

          <Link to="/dashboard/reports" className="shortcut-card">
            <div className="shortcut-icon">
              <DollarSign size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Clearance Audits</h4>
              <p>Generate fee status reports</p>
            </div>
          </Link>

          <Link to="/dashboard/finance/setup" className="shortcut-card">
            <div className="shortcut-icon">
              <Award size={20} />
            </div>
            <div className="shortcut-info">
              <h4>Tuition Setups</h4>
              <p>Configure termly fee structures</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════ CHARTS GRID ════════ */}
      <div className="charts-grid">
        {/* Fee Collection Breakdown Donut Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><DollarSign size={18} style={{ color: '#000080' }} /> Fee Collection Breakdown</h3>
            <span>Distribution</span>
          </div>
          
          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Fully Paid', value: fullyPaidCount },
                    { name: 'Pending Verification', value: pendingCount },
                    { name: 'Unpaid Invoices', value: unpaidCount }
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
                  <Cell fill="#EF4444" />
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
                {fullyPaidCount + pendingCount + unpaidCount}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Invoices
              </span>
            </div>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Paid: <strong>{fullyPaidCount}</strong></span>
            </div>
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
              <span>Pending: <strong>{pendingCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3><LayoutDashboard size={18} style={{ color: '#10B981' }} /> Monthly Revenue Collection</h3>
            <span>Collection Trend</span>
          </div>
          
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={[
                  { name: 'May', Amount: 8500000 },
                  { name: 'Jun', Amount: 12400000 },
                  { name: 'Jul', Amount: 15800000 },
                  { name: 'Aug', Amount: 8500000 }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₦${val / 1000000}M`} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Collection']} />
                <Bar dataKey="Amount" fill="#000080" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary-pills">
            <div className="chart-pill-item">
              <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
              <span>Peak Month: <strong>July (₦15.8M)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboardView;
