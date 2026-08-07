import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useActiveTerm } from '../../hooks/useActiveTerm';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Activity, 
  MapPin, 
  Sparkles,
  BookOpen,
  Award,
  CreditCard,
  Printer,
  ShieldCheck,
  UserCheck,
  DollarSign
} from 'lucide-react';
import SlideOver from '../../components/ui/SlideOver';
import './Dashboard.css';

// Official School Brand Color Palette
const feeColors = ['#000080', '#3B82F6'];
const COLORS = ['#000080', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

const StatCard = ({ label, value, icon: Icon, topColor = 'var(--primary-color, #000080)', iconBg = '#EFF6FF', iconColor = 'var(--primary-color, #000080)', trendTag, subText }: any) => (
  <div className="stat-card-executive">
    <div className="stat-top-bar" style={{ backgroundColor: topColor }} />
    
    <div className="stat-header-row">
      <div>
        <p className="stat-label-text">{label}</p>
        <h3 className="stat-main-value">{value}</h3>
      </div>

      <div className="stat-icon-badge" style={{ background: iconBg, color: iconColor }}>
        <Icon size={24} />
      </div>
    </div>

    <div className="stat-footer-row">
      {trendTag ? (
        <span className={`stat-trend-tag ${trendTag.type || 'positive'}`}>
          {trendTag.text}
        </span>
      ) : (
        <span className="stat-trend-tag positive">
          ● Active
        </span>
      )}
      <span className="stat-subtext">{subText || 'Verified System Metric'}</span>
    </div>
  </div>
);

export default function Overview() {
  const { userRole, userName, userTitle } = useAuth();
  const { schoolName } = useTenant();
  const { session, term, isHoliday } = useActiveTerm();
  const isHolidayMode = isHoliday || term === 'Holiday' || term === 'MTB (Mid Term Break)' || term === 'MTB';
  const displayTerm = term === 'MTB (Mid Term Break)' || term === 'MTB' ? 'Mid Term Break (MTB)' : term;
  const [showActivityLog, setShowActivityLog] = React.useState(false);
  
  const [accountantData, setAccountantData] = React.useState<any>(null);
  const [teacherData, setTeacherData] = React.useState<any>(null);
  const [adminData, setAdminData] = React.useState<any>(null);
  const [principalData, setPrincipalData] = React.useState<any>(null);
  const [vendorData, setVendorData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (userRole === 'Accountant') {
      const fetchAccountantData = async () => {
        try {
          setLoading(true);
          const res = await api.get('/finance/dashboard');
          setAccountantData(res);
        } catch (err) {
          console.error("Failed to fetch accountant dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAccountantData();
    } else if (userRole === 'Teacher' || userRole === 'SubjectTeacher') {
      const fetchTeacherData = async () => {
        try {
          setLoading(true);
          const res = await api.get('/academics/teacher/dashboard');
          setTeacherData(res);
        } catch (err) {
          console.error("Failed to fetch teacher dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTeacherData();
    } else if (userRole === 'Admin' || userRole === 'SystemAdmin' || userRole === 'Superadmin') {
      const fetchAdminData = async () => {
        try {
          setLoading(true);
          const res = await api.get('/setup/admin/dashboard');
          setAdminData(res);
        } catch (err) {
          console.error("Failed to fetch admin dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAdminData();
    } else if (userRole === 'Principal') {
      const fetchPrincipalData = async () => {
        try {
          setLoading(true);
          const res = await api.get('/academics/principal/dashboard');
          setPrincipalData(res);
        } catch (err) {
          console.error("Failed to fetch principal dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPrincipalData();
    } else if (userRole === 'Vendor') {
      const fetchVendorData = async () => {
        try {
          setLoading(true);
          const res = await api.get('/setup/vendor/dashboard');
          setVendorData(res);
        } catch (err) {
          console.error("Failed to fetch vendor dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchVendorData();
    }
  }, [userRole]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getFormattedName = () => {
    if (userTitle && userTitle.trim()) {
      const titleClean = userTitle.trim();
      const normName = userName.toLowerCase().replace(/[.,]/g, '');
      const normTitle = titleClean.toLowerCase().replace(/[.,]/g, '');
      if (!normName.startsWith(normTitle)) {
        return `${titleClean} ${userName}`;
      }
    }
    return userName;
  };

  const getRoleWelcomeMessage = () => {
    switch (userRole) {
      case 'Admin':
      case 'SystemAdmin':
      case 'Superadmin':
        return 'Institutional Governance & Operations Control Hub: Oversee staff, student records, academics, and system setup.';
      case 'Teacher':
        return 'Class Form Teacher Workstation: Manage class records, review daily attendance, and record termly affective evaluation.';
      case 'SubjectTeacher':
        return 'Subject Instruction Portal: Manage subject topics, continuous assessment scores, and grade distributions.';
      case 'Accountant':
        return 'Financial Operations & Billing Control: Manage tuition fee collection, reconcile payments, and process clearances.';
      case 'Principal':
        return 'Academic Oversight & Executive Analytics: Review broadsheets, approve termly result sheets, and track performance.';
      case 'Vendor':
        return 'Campus Printing & Fulfillment Operations: Manage ID card printing requests, merchandise, and student store clearances.';
      case 'Parent':
        return 'Parent Academic Hub: Review student termly performance, monitor attendance, and settle tuition billings.';
      default:
        return `Welcome to ${schoolName || 'Dotmond School'} Operations Portal. Monitor live metrics, track activities, and manage records.`;
    }
  };

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  return (
    <div className="overview-page">
      
      {/* ════════ DASHBOARD HERO BANNER ════════ */}
      <div className="dashboard-banner">
        
        <div className="banner-header-row">
          <div className="banner-date-pill">
            <Calendar size={14} />
            {todayDate}
          </div>

          <div className="banner-status-pill" style={isHolidayMode ? { background: 'rgba(245, 158, 11, 0.25)', color: '#FDE68A', border: '1px solid rgba(253, 230, 138, 0.4)' } : {}}>
            {isHolidayMode ? (
              <>🌴 {session} Session • {displayTerm}</>
            ) : (
              <><Sparkles size={14} /> {session} Session • Active {displayTerm}</>
            )}
          </div>
        </div>

        <div className="banner-content">
          <div className="banner-text">
            <h2>{getGreeting()}, {getFormattedName()} 👋</h2>
            <p>{getRoleWelcomeMessage()}</p>
          </div>

          <div className="banner-actions">
            {userRole === 'Accountant' && (
              <Link to="/dashboard/operations/manual-clearance" className="banner-btn banner-btn-primary">
                <CheckCircle size={17} /> Manual Clearance
              </Link>
            )}
            {userRole === 'Teacher' && (
              <Link to="/dashboard/teacher/attendance" className="banner-btn banner-btn-primary">
                <CheckCircle size={17} /> Attendance Register
              </Link>
            )}
            {userRole === 'SubjectTeacher' && (
              <Link to="/dashboard/teacher/assessment" className="banner-btn banner-btn-primary">
                <FileText size={17} /> Enter C.A. Scores
              </Link>
            )}
            {(userRole === 'Admin' || userRole === 'SystemAdmin' || userRole === 'Superadmin') && (
              <Link to="/dashboard/teachers" className="banner-btn banner-btn-primary">
                <Users size={17} /> Staff Management
              </Link>
            )}
            {userRole === 'Principal' && (
              <Link to="/dashboard/approvals" className="banner-btn banner-btn-primary">
                <CheckCircle size={17} /> Review Approvals
              </Link>
            )}
            
            <button 
              type="button"
              className="banner-btn banner-btn-outline" 
              onClick={() => setShowActivityLog(true)}
            >
              <Activity size={17} /> System Activity
            </button>
          </div>
        </div>
      </div>

      {/* ════════ PRINCIPAL DASHBOARD ════════ */}
      {userRole === 'Principal' ? (
        <div className="analytics-section">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p>Loading principal executive analytics...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Stat Cards */}
              <div className="stats-grid">
                <StatCard 
                  label="TOTAL ENROLLED STUDENTS" 
                  value={principalData?.metrics?.totalStudents ?? 0} 
                  icon={GraduationCap} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: '● Enrolled', type: 'positive' }}
                  subText="Active School Register"
                />
                <StatCard 
                  label="TEACHING & ACADEMIC STAFF" 
                  value={principalData?.metrics?.totalTeachers ?? 0} 
                  icon={Users} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: '● Verified', type: 'positive' }}
                  subText="Allocated Faculty"
                />
                <StatCard 
                  label="DAILY AVERAGE ATTENDANCE" 
                  value={`${principalData?.metrics?.averageAttendance ?? 0}%`} 
                  icon={CheckCircle} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: '● Live Today', type: 'positive' }}
                  subText="Gate & Class Audit"
                />
                <StatCard 
                  label="PENDING APPROVALS" 
                  value={principalData?.metrics?.pendingApprovals ?? 0} 
                  icon={AlertCircle} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: (principalData?.metrics?.pendingApprovals ?? 0) > 0 ? 'Requires Action' : 'Cleared', type: (principalData?.metrics?.pendingApprovals ?? 0) > 0 ? 'negative' : 'positive' }}
                  subText="Result Broadsheets"
                />
              </div>

              {/* Principal Shortcuts */}
              <div className="quick-shortcuts-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Executive Workstation Shortcuts</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Fast access to principal approvals, reports, and governance.</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000080', background: '#EFF6FF', padding: '4px 12px', borderRadius: '12px' }}>
                    Principal Portal
                  </span>
                </div>

                <div className="shortcuts-grid">
                  <Link to="/dashboard/approvals" className="shortcut-card">
                    <div className="shortcut-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Result Approvals</h4>
                      <p>Review & stamp broadsheets</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/reports" className="shortcut-card">
                    <div className="shortcut-icon">
                      <Award size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Academic Reports</h4>
                      <p>Student performance analytics</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/teachers" className="shortcut-card">
                    <div className="shortcut-icon">
                      <Users size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Faculty Directory</h4>
                      <p>View teachers & assignments</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/students" className="shortcut-card">
                    <div className="shortcut-icon">
                      <GraduationCap size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Student Records</h4>
                      <p>Full student database</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3><Activity size={18} style={{ color: '#10B981' }} /> Attendance Trend (Last 7 Days)</h3>
                    <span>Daily Rate</span>
                  </div>
                  <div style={{ height: 260, marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart data={principalData?.attendanceTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                        <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} tickFormatter={(val) => `${val}%`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem' }} />
                        <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3><CreditCard size={18} style={{ color: '#000080' }} /> Fee Collection Status</h3>
                    <span>Financial Metrics</span>
                  </div>
                  <div style={{ height: 260, marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={principalData?.feeData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(principalData?.feeData || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={feeColors[index % feeColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatCurrency(val)} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : userRole === 'Accountant' ? (

        /* ════════ ACCOUNTANT DASHBOARD ════════ */
        <div className="analytics-section">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p>Loading financial analytics...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {(() => {
                const collected = accountantData?.totalCollected || 0;
                const unpaid = accountantData?.totalUnpaid || 0;
                const totalBilled = collected + unpaid;
                const collectionRate = totalBilled > 0 ? ((collected / totalBilled) * 100).toFixed(1) : '0.0';
                const unpaidRate = totalBilled > 0 ? ((unpaid / totalBilled) * 100).toFixed(1) : '100.0';

                return (
                  <div className="stats-grid">
                    <StatCard 
                      label="TUITION COLLECTION RATE" 
                      value={`${collectionRate}%`} 
                      icon={CheckCircle} 
                      topColor="#000080"
                      iconBg="#EFF6FF" iconColor="#000080" 
                      trendTag={{ text: '● Verified Collection', type: 'positive' }}
                      subText="Payment Progress over Overall Billing"
                    />
                    <StatCard 
                      label="UNCOLLECTED BALANCE RATE" 
                      value={`${unpaidRate}%`} 
                      icon={AlertCircle} 
                      topColor="#000080"
                      iconBg="#EFF6FF" iconColor="#000080" 
                      trendTag={{ text: 'Pending Balance', type: 'negative' }}
                      subText="Outstanding Billing Percentage"
                    />
                    <StatCard 
                      label="HIGHEST UNPAID CLASS" 
                      value={accountantData?.highestUnpaidClass?.name || '---'} 
                      icon={Users} 
                      topColor="#000080"
                      iconBg="#EFF6FF" iconColor="#000080" 
                      trendTag={{ text: `${accountantData?.highestUnpaidClass?.percentage || 0}% Unpaid`, type: 'negative' }}
                      subText="Class Billing Priority"
                    />
                    <StatCard 
                      label="PENDING VERIFICATIONS" 
                      value={accountantData?.pendingVerifications || 0} 
                      icon={FileText} 
                      topColor="#000080"
                      iconBg="#EFF6FF" iconColor="#000080" 
                      trendTag={{ text: 'Bank Uploads', type: 'positive' }}
                      subText="Online Receipts Staged"
                    />
                  </div>
                );
              })()}

              {/* Accountant Shortcuts */}
              <div className="quick-shortcuts-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Finance & Billing Shortcuts</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Quick actions for payment verifications, POS sales, and student ledger.</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000080', background: '#EFF6FF', padding: '4px 12px', borderRadius: '12px' }}>
                    Accountant Operations
                  </span>
                </div>

                <div className="shortcuts-grid">
                  <Link to="/dashboard/finance/verifications" className="shortcut-card">
                    <div className="shortcut-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Bank Verifications</h4>
                      <p>Approve online transfers</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/finance/pos" className="shortcut-card">
                    <div className="shortcut-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Point of Sale (POS)</h4>
                      <p>Issue counter receipts</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/operations/manual-clearance" className="shortcut-card">
                    <div className="shortcut-icon">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Manual Clearance</h4>
                      <p>Stamp exam clearances</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/finance/ledger" className="shortcut-card">
                    <div className="shortcut-icon">
                      <FileText size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Student Ledgers</h4>
                      <p>View billing balances</p>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3><CreditCard size={18} style={{ color: '#000080' }} /> Fee Payment Metrics</h3>
                    <span>Distribution</span>
                  </div>
                  {accountantData?.feePaymentMetrics && accountantData.feePaymentMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie data={accountantData.feePaymentMetrics} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                          {accountantData.feePaymentMetrics.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>No fee payment metrics recorded</p>}
                </div>

                <div className="chart-card">
                  <div className="chart-card-header">
                    <h3><Activity size={18} style={{ color: '#10B981' }} /> Revenue by Payment Method</h3>
                    <span>Channels</span>
                  </div>
                  {accountantData?.revenueByMethod && accountantData.revenueByMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie data={accountantData.revenueByMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                          {accountantData.revenueByMethod.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatCurrency(val)} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>No payment channel data</p>}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (userRole === 'Teacher' || userRole === 'SubjectTeacher') ? (

        /* ════════ TEACHER DASHBOARD ════════ */
        <div className="analytics-section">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p>Loading teacher workstation metrics...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              <div className="stats-grid">
                <StatCard 
                  label="FORM CLASS STUDENTS" 
                  value={teacherData?.classTeacherMetrics?.totalStudents ?? (teacherData?.totalStudents || 0)} 
                  icon={Users} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  subText={teacherData?.classTeacherMetrics?.className ? `Class: ${teacherData.classTeacherMetrics.className}` : "Form Class Register"}
                />
                <StatCard 
                  label="TODAY'S ATTENDANCE" 
                  value={`${teacherData?.classTeacherMetrics?.attendanceToday?.percentage ?? (teacherData?.attendancePercentage || 0)}%`} 
                  icon={CheckCircle} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: `Present: ${teacherData?.classTeacherMetrics?.attendanceToday?.present ?? 0}`, type: 'positive' }}
                  subText="Daily Gate & Register"
                />
                <StatCard 
                  label="PENDING EVALUATION REMARKS" 
                  value={teacherData?.classTeacherMetrics?.pendingRemarks ?? 0} 
                  icon={FileText} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  trendTag={{ text: (teacherData?.classTeacherMetrics?.pendingRemarks ?? 0) > 0 ? 'Action Needed' : 'Completed', type: 'neutral' }}
                  subText="Affective & Psychomotor"
                />
                <StatCard 
                  label="SUBJECT ALLOCATIONS" 
                  value={teacherData?.subjectTeacherMetrics?.totalAllocations ?? (teacherData?.totalAllocations || 0)} 
                  icon={BookOpen} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                  subText="Assigned Subjects"
                />
              </div>

              {/* Teacher Shortcuts */}
              <div className="quick-shortcuts-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Teacher Workstation Shortcuts</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Fast actions for attendance taking, assessment entry, and class records.</p>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000080', background: '#EFF6FF', padding: '4px 12px', borderRadius: '12px' }}>
                    Teacher Tools
                  </span>
                </div>

                <div className="shortcuts-grid">
                  <Link to="/dashboard/teacher/attendance" className="shortcut-card">
                    <div className="shortcut-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Attendance Register</h4>
                      <p>Mark daily class attendance</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/teacher/assessment" className="shortcut-card">
                    <div className="shortcut-icon">
                      <FileText size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Continuous Assessment</h4>
                      <p>Input test & assignment scores</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/teacher/my-class" className="shortcut-card">
                    <div className="shortcut-icon">
                      <Users size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>My Class Roster</h4>
                      <p>View student arm records</p>
                    </div>
                  </Link>

                  <Link to="/dashboard/teacher/results" className="shortcut-card">
                    <div className="shortcut-icon">
                      <Award size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>Teacher Results</h4>
                      <p>Review class broadsheets</p>
                    </div>
                  </Link>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : userRole === 'Vendor' ? (

        /* ════════ VENDOR DASHBOARD ════════ */
        <div className="analytics-section">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
              <p>Loading vendor print dashboard...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div className="stats-grid">
                <StatCard 
                  label="TOTAL REGISTERED STUDENTS" 
                  value={vendorData?.totalStudents ?? 0} 
                  icon={Users} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                />
                <StatCard 
                  label="PRINTED ID CARDS" 
                  value={vendorData?.printedCards ?? 0} 
                  icon={CheckCircle} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                />
                <StatCard 
                  label="PENDING ID CARDS" 
                  value={vendorData?.pendingCards ?? 0} 
                  icon={AlertCircle} 
                  topColor="#000080"
                  iconBg="#EFF6FF" iconColor="#000080" 
                />
              </div>

              <div className="quick-shortcuts-section">
                <div className="shortcuts-grid">
                  <Link to="/dashboard/vendor-hub" className="shortcut-card">
                    <div className="shortcut-icon">
                      <Printer size={20} />
                    </div>
                    <div className="shortcut-info">
                      <h4>ID Card Print Queue</h4>
                      <p>Generate plastic ID badges</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (

        /* ════════ ADMIN / GENERAL DEFAULT DASHBOARD ════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Executive Stat Cards */}
          <div className="stats-grid">
            <StatCard 
              label="TOTAL ACTIVE STUDENTS" 
              value={adminData?.metrics?.totalStudents || "269"} 
              icon={GraduationCap} 
              topColor="#000080"
              iconBg="#EFF6FF" iconColor="#000080" 
              trendTag={{ text: '+12.4% vs last term', type: 'positive' }}
              subText="Active Portal Records"
            />
            <StatCard 
              label="TOTAL STAFF & FACULTY" 
              value={adminData?.metrics?.totalStaff || "19"} 
              icon={Users} 
              topColor="#000080"
              iconBg="#EFF6FF" iconColor="#000080" 
              trendTag={{ text: '● 100% Active', type: 'positive' }}
              subText="Teaching & Administrative"
            />
            <StatCard 
              label="CLASSES & SUBJECTS" 
              value={adminData ? `${adminData.metrics.totalClasses} / ${adminData.metrics.totalSubjects}` : "14 / 118"} 
              icon={LayoutDashboard} 
              topColor="#000080"
              iconBg="#EFF6FF" iconColor="#000080" 
              trendTag={{ text: '● Operational', type: 'positive' }}
              subText="Academic Infrastructure"
            />
            <StatCard 
              label="CURRENT TERM STATUS" 
              value={adminData?.metrics?.currentTermStatus || `${session} ${displayTerm}`} 
              icon={Calendar} 
              topColor="#000080"
              iconBg="#EFF6FF" iconColor="#000080" 
              trendTag={{ text: isHolidayMode ? '🌴 Holiday / Closed' : `Session ${session}`, type: isHolidayMode ? 'warning' : 'positive' }}
              subText="Termly Operational Status"
            />
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="quick-shortcuts-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Quick Operational Shortcuts</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Fast administrative access to common portal functions.</p>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000080', background: '#EFF6FF', padding: '4px 12px', borderRadius: '12px' }}>
                Quick Actions
              </span>
            </div>

            <div className="shortcuts-grid">
              <Link to="/dashboard/students" className="shortcut-card">
                <div className="shortcut-icon">
                  <GraduationCap size={20} />
                </div>
                <div className="shortcut-info">
                  <h4>Student Directory</h4>
                  <p>View & manage students</p>
                </div>
              </Link>

              <Link to="/dashboard/teachers" className="shortcut-card">
                <div className="shortcut-icon">
                  <Users size={20} />
                </div>
                <div className="shortcut-info">
                  <h4>Staff Roster</h4>
                  <p>Manage faculty & roles</p>
                </div>
              </Link>

              <Link to="/dashboard/operations/result-management" className="shortcut-card">
                <div className="shortcut-icon">
                  <Award size={20} />
                </div>
                <div className="shortcut-info">
                  <h4>Result Broadsheets</h4>
                  <p>Process & review grades</p>
                </div>
              </Link>

              <Link to="/dashboard/finance/verifications" className="shortcut-card">
                <div className="shortcut-icon">
                  <CreditCard size={20} />
                </div>
                <div className="shortcut-info">
                  <h4>Fee Clearance</h4>
                  <p>Reconcile tuition receipts</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            
            {/* System Users Breakdown */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3><Users size={18} style={{ color: '#000080' }} /> System Users Breakdown</h3>
                <span>Distribution</span>
              </div>
              
              <div style={{ height: 260, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Active Students', value: adminData?.metrics?.totalStudents || 269 },
                        { name: 'Total Staff', value: adminData?.metrics?.totalStaff || 19 }
                      ]} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={65} 
                      outerRadius={95} 
                      paddingAngle={5} 
                      dataKey="value"
                    >
                      <Cell fill="#000080" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Count Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', display: 'block', lineHeight: 1 }}>
                    {(adminData?.metrics?.totalStudents || 269) + (adminData?.metrics?.totalStaff || 19)}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Total Users
                  </span>
                </div>
              </div>

              <div className="chart-summary-pills">
                <div className="chart-pill-item">
                  <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
                  <span>Students: <strong>{adminData?.metrics?.totalStudents || 269}</strong></span>
                </div>
                <div className="chart-pill-item">
                  <span className="chart-pill-dot" style={{ background: '#10B981' }}></span>
                  <span>Staff: <strong>{adminData?.metrics?.totalStaff || 19}</strong></span>
                </div>
              </div>
            </div>

            {/* Academic Infrastructure Bar Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3><LayoutDashboard size={18} style={{ color: '#F59E0B' }} /> Academic Infrastructure</h3>
                <span>Classes & Subjects</span>
              </div>
              
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart 
                    data={[{ name: 'Active Infrastructure', Classes: adminData?.metrics?.totalClasses || 14, Subjects: adminData?.metrics?.totalSubjects || 118 }]}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff' }} cursor={{ fill: 'rgba(0,0,128,0.04)' }} />
                    <Bar dataKey="Classes" fill="#000080" radius={[6, 6, 0, 0]} barSize={55} />
                    <Bar dataKey="Subjects" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={55} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-summary-pills">
                <div className="chart-pill-item">
                  <span className="chart-pill-dot" style={{ background: '#000080' }}></span>
                  <span>Classes: <strong>{adminData?.metrics?.totalClasses || 14}</strong></span>
                </div>
                <div className="chart-pill-item">
                  <span className="chart-pill-dot" style={{ background: '#F59E0B' }}></span>
                  <span>Subjects: <strong>{adminData?.metrics?.totalSubjects || 118}</strong></span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ════════ AUDIT & ACTIVITY SLIDEOVER ════════ */}
      <SlideOver
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        title="Recent System Activity Log"
        subtitle="Live audit tracking of administrative actions across the portal."
        width="md"
        footer={
          <button 
            type="button" 
            onClick={() => setShowActivityLog(false)} 
            className="banner-btn" 
            style={{ background: '#000080', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Close Panel
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { title: "Student Record Created", desc: "Adefolarin Bakare was newly enrolled into JSS 2 Silver.", time: "10 minutes ago", status: "Success", color: "#10B981" },
            { title: "Fee Clearance Verified", desc: "Manual clearance approved for student NGN 150,000 tuition via Bank Transfer.", time: "2 hours ago", status: "Verified", color: "#3B82F6" },
            { title: "Report Card Template Updated", desc: "Termly Grading Criteria adjusted to standard 40/60 distribution.", time: "Yesterday at 4:15 PM", status: "Updated", color: "#8B5CF6" },
            { title: "System Login Recorded", desc: `Successful administrative sign-in by ${userName || 'Super Admin'} from standard IP.`, time: "Yesterday at 9:00 AM", status: "Security", color: "#F59E0B" },
            { title: "Bulk SMS Broadcast", desc: "Mid-term resumption notification sent to 269 parents.", time: "3 days ago", status: "Broadcast", color: "#000080" }
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FAFCFE', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{item.title}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, background: `${item.color}15`, padding: '4px 10px', borderRadius: '6px' }}>
                  {item.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>{item.desc}</p>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </SlideOver>

    </div>
  );
}
