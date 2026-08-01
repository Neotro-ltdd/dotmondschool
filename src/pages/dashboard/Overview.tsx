import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Users, GraduationCap, LayoutDashboard, AlertCircle, CheckCircle, FileText, Activity, MapPin } from 'lucide-react';
import SlideOver from '../../components/ui/SlideOver';
import './Dashboard.css';

// Mock Data for Charts
const feeColors = ['#10b981', '#f43f5e'];
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#2dd4bf', '#fbbf24', '#f87171'];

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, trend, trendText }: any) => (
  <div className="stat-card">
    <div className="stat-header">
      <p className="stat-label">{label}</p>
      <div className="stat-icon-square" style={{ background: iconBg, color: iconColor }}>
        <Icon size={20} />
      </div>
    </div>
    <div className="stat-value-container">
      <h3 className="stat-value">{value}</h3>
    </div>
    {(trend !== undefined || trendText) && (
      <div className="stat-trend-container">
        {trend !== undefined && (
          <span className={`trend-pill ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {trendText && <span className="trend-text">{trendText}</span>}
      </div>
    )}
  </div>
);

export default function Overview() {
  const { userRole, userName, userTitle } = useAuth();
  const { schoolName } = useTenant();
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
          const res = await api.get('/setup/students/vendor/stats');
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

  // format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
        return 'Admin : Manage staffs, Student Records, Setup, and overall institutional governance.';
      case 'Teacher':
        return 'Class Teacher : Manage your class records, review attendance register, and input termly affective ratings.';
      case 'SubjectTeacher':
        return 'Subject Teacher : Manage your subject details, continuous assessments, and student score distributions.';
      case 'Accountant':
        return 'Accountant : Manage student fee billing, reconcile tuition payments, perform manual clearances, and oversee POS transactions.';
      case 'Principal':
        return 'Principal : Monitor institutional analytics, oversee teacher performance, review attendance trends, and approve termly broadsheets.';
      case 'Vendor':
        return 'Vendor : Manage campus merchandise sales, inventory items, digital ID card verification, and student store receipts.';
      case 'Parent':
        return 'Parent : View termly academic result sheets, monitor daily gate check-in attendance records, and review school fee billings.';
      default:
        return `Welcome to the ${schoolName || 'Dotmond School'} Operations Portal. Manage students, track metrics, and review activities.`;
    }
  };

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  return (
    <div className="overview-page">
      {/* Dashboard Banner */}
      <div className="dashboard-banner">
        <div className="banner-date-pill">
          <Calendar size={14} />
          {todayDate}
        </div>
        <div className="banner-content">
          <div className="banner-text">
            <h2>{getGreeting()}, {getFormattedName()} 👋</h2>
            <p>{getRoleWelcomeMessage()}</p>
          </div>
          <div className="banner-actions">
            {userRole === 'Accountant' && (
              <Link to="/dashboard/operations/manual-clearance" className="banner-btn banner-btn-primary">
                <CheckCircle size={18} /> Manual Clearance
              </Link>
            )}
            {userRole === 'Teacher' && (
              <Link to="/dashboard/teacher/attendance" className="banner-btn banner-btn-primary">
                <CheckCircle size={18} /> Attendance Register
              </Link>
            )}
            {userRole === 'SubjectTeacher' && (
              <Link to="/dashboard/teacher/assessment" className="banner-btn banner-btn-primary">
                <FileText size={18} /> Enter Assessments
              </Link>
            )}
            {(userRole === 'Admin' || userRole === 'SystemAdmin' || userRole === 'Superadmin') && (
              <Link to="/dashboard/teachers" className="banner-btn banner-btn-primary">
                <Users size={18} /> Manage Staff
              </Link>
            )}
            {userRole === 'Principal' && (
              <Link to="/dashboard/approvals" className="banner-btn banner-btn-primary">
                <CheckCircle size={18} /> Review Approvals
              </Link>
            )}
            {userRole === 'Vendor' && (
              <Link to="/dashboard/vendor-hub" className="banner-btn banner-btn-primary">
                <FileText size={18} /> Printing Hub
              </Link>
            )}
            <button 
              type="button"
              className="banner-btn banner-btn-outline" 
              onClick={() => setShowActivityLog(true)}
            >
              <Activity size={18} /> Recent System Activity
            </button>
          </div>
        </div>
      </div>

      {userRole === 'Principal' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : principalData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="stats-grid">
                <StatCard 
                  label="Total Students" 
                  value={principalData.metrics.totalStudents} 
                  icon={GraduationCap} 
                  iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
                />
                <StatCard 
                  label="Teaching Staff" 
                  value={principalData.metrics.totalTeachers} 
                  icon={Users} 
                  iconBg="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" 
                />
                <StatCard 
                  label="Avg Attendance" 
                  value={`${principalData.metrics.averageAttendance}%`} 
                  icon={CheckCircle} 
                  iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" 
                  trendText="Today"
                />
                <StatCard 
                  label="Pending Approvals" 
                  value={principalData.metrics.pendingApprovals} 
                  icon={AlertCircle} 
                  iconBg="rgba(239, 68, 68, 0.1)" iconColor="#ef4444" 
                />
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="chart-card">
                  <h3>Attendance Trend (Last 7 Days)</h3>
                  <div style={{ height: 250, marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={principalData.attendanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis domain={[0, 100]} stroke="#888" tickFormatter={(val) => `${val}%`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Fee Collection Status</h3>
                  <div style={{ height: 250, marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={principalData.feeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {principalData.feeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={feeColors[index % feeColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatCurrency(val)} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="widget-card glass-panel" style={{ gridColumn: '1 / -1' }}>
                <div className="widget-header">
                  <h3>Top 3 Students Per Class (Latest Approved)</h3>
                </div>
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {principalData.topStudentsPerClass && principalData.topStudentsPerClass.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                      {principalData.topStudentsPerClass.map((cls: any, idx: number) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '0.5rem', color: '#38bdf8' }}>{cls.className}</h4>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {cls.students.map((student: any, sIdx: number) => (
                              <li key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <span>{student.position}. {student.studentName}</span>
                                <span style={{ fontWeight: 'bold' }}>{student.averageScore.toFixed(1)}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : <p>No approved results found yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : userRole === 'Accountant' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : accountantData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="stats-grid">
                <StatCard 
                  label="Total Collected" 
                  value={accountantData ? formatCurrency(accountantData.totalCollected) : '---'} 
                  icon={CheckCircle} 
                  iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" 
                />
                <StatCard 
                  label="Total Unpaid" 
                  value={accountantData ? formatCurrency(accountantData.totalUnpaid) : '---'} 
                  icon={AlertCircle} 
                  iconBg="rgba(239, 68, 68, 0.1)" iconColor="#ef4444" 
                />
                <StatCard 
                  label="Highest Unpaid Class" 
                  value={accountantData?.highestUnpaidClass?.name || '---'} 
                  icon={Users} 
                  iconBg="rgba(245, 158, 11, 0.1)" iconColor="#f59e0b"
                  trendText={`${accountantData?.highestUnpaidClass?.percentage || 0}% unpaid`}
                  trend={-1} 
                />
                <StatCard 
                  label="Pending Verifications" 
                  value={accountantData?.pendingVerifications || 0} 
                  icon={FileText} 
                  iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
                />
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="chart-card">
                  <h3>Fee Payment Metrics</h3>
                  {accountantData?.feePaymentMetrics && accountantData.feePaymentMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={accountantData.feePaymentMetrics} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {accountantData.feePaymentMetrics.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p>No data available</p>}
                </div>

                <div className="chart-card">
                  <h3>Revenue by Payment Method</h3>
                  {accountantData?.revenueByMethod && accountantData.revenueByMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={accountantData.revenueByMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {accountantData.revenueByMethod.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatCurrency(val)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p>No data available</p>}
                </div>
              </div>

              <div className="chart-card" style={{ width: '100%' }}>
                <h3>Fees Collected vs Pending by Class</h3>
                {accountantData?.feesPaidByClass && accountantData.feesPaidByClass.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={accountantData.feesPaidByClass}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `₦${val / 1000}k`} />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Legend />
                      <Line type="monotone" dataKey="unpaid" name="Unpaid Fees" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p>No data available</p>}
              </div>
            </div>
          )}
        </div>
      ) : (userRole === 'Teacher' || userRole === 'SubjectTeacher') ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : teacherData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Unified Teacher Section */}
              {(teacherData.isClassTeacher || teacherData.isSubjectTeacher) && (
                <div className="unified-teacher-section">
                  <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#0f172a' }}>
                    Teacher Overview {teacherData.isClassTeacher ? `(Form: ${teacherData.classTeacherMetrics.className})` : ''}
                  </h2>
                  <div className="stats-grid">
                    {teacherData.isClassTeacher && (
                      <>
                        <StatCard 
                          label="Form Class Students" 
                          value={teacherData.classTeacherMetrics.totalStudents} 
                          icon={Users} 
                          iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
                        />
                        <StatCard 
                          label="Form Attendance" 
                          value={`${teacherData.classTeacherMetrics.attendanceToday.percentage || 0}%`} 
                          icon={CheckCircle} 
                          iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" 
                          trendText={`Present: ${teacherData.classTeacherMetrics.attendanceToday.present}`}
                        />
                        <StatCard 
                          label="Pending Remarks" 
                          value={teacherData.classTeacherMetrics.pendingRemarks} 
                          icon={FileText} 
                          iconBg="rgba(245, 158, 11, 0.1)" iconColor="#f59e0b" 
                        />
                      </>
                    )}

                    {teacherData.isSubjectTeacher && (
                      <>
                        <StatCard 
                          label="Subject Allocations" 
                          value={teacherData.subjectTeacherMetrics.totalAllocations} 
                          icon={GraduationCap} 
                          iconBg="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" 
                        />
                        <StatCard 
                          label="Students Taught" 
                          value={teacherData.subjectTeacherMetrics.totalStudents} 
                          icon={Users} 
                          iconBg="rgba(236, 72, 153, 0.1)" iconColor="#ec4899" 
                        />
                      </>
                    )}
                  </div>

                  {/* Detailed Widgets */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {teacherData.isClassTeacher && teacherData.classTeacherMetrics.topStudents && teacherData.classTeacherMetrics.topStudents.length > 0 && (
                      <div className="widget-card glass-panel" style={{ background: 'white' }}>
                        <div className="widget-header">
                          <h3>Top 5 Students (Latest Results)</h3>
                        </div>
                        <div className="widget-body">
                          <table className="table data-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Position</th>
                                <th>Student Name</th>
                                <th>Average Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacherData.classTeacherMetrics.topStudents.map((s: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{s.position || (idx + 1)}</td>
                                  <td>{s.studentName}</td>
                                  <td>{s.averageScore.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {teacherData.isSubjectTeacher && (
                      <div className="widget-card glass-panel" style={{ background: 'white' }}>
                        <div className="widget-header">
                          <h3>Your Subjects &amp; Classes</h3>
                        </div>
                        <div className="widget-body">
                          <ul className="activity-list">
                            {teacherData.subjectTeacherMetrics.allocations.map((a: any, idx: number) => (
                              <li className="activity-item" key={idx}>
                                <div className="activity-icon"><MapPin size={18} /></div>
                                <div className="activity-details">
                                  <p><strong>{a.subjectName}</strong> in <strong>{a.className}</strong></p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback if no assignments */}
              {!teacherData.isClassTeacher && !teacherData.isSubjectTeacher && (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Welcome, {teacherData.teacherName || 'Teacher'}</h3>
                  <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>You are not currently assigned as a Class Teacher or Subject Teacher to any active classes.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : userRole === 'Admin' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : adminData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div className="stats-grid">
                <StatCard 
                  label="Total Active Students" 
                  value={adminData.metrics.totalStudents} 
                  icon={GraduationCap} 
                  iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
                />
                <StatCard 
                  label="Total Staff" 
                  value={adminData.metrics.totalStaff} 
                  icon={Users} 
                  iconBg="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" 
                />
                <StatCard 
                  label="Classes & Subjects" 
                  value={`${adminData.metrics.totalClasses} / ${adminData.metrics.totalSubjects}`} 
                  icon={LayoutDashboard} 
                  iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" 
                />
                <StatCard 
                  label="Current Term Status" 
                  value={adminData.metrics.currentTermStatus} 
                  icon={Calendar} 
                  iconBg="rgba(245, 158, 11, 0.1)" iconColor="#f59e0b" 
                />
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="chart-card">
                  <h3>System Users Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Active Students', value: adminData.metrics.totalStudents },
                          { name: 'Total Staff', value: adminData.metrics.totalStaff }
                        ]} 
                        cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label
                      >
                        <Cell fill="#38bdf8" />
                        <Cell fill="#a855f7" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-card">
                  <h3>Academic Infrastructure</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={[{ name: 'Infrastructure', Classes: adminData.metrics.totalClasses, Subjects: adminData.metrics.totalSubjects }]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Legend verticalAlign="bottom" height={36}/>
                      <Bar dataKey="Classes" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Subjects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      ) : userRole === 'Vendor' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : vendorData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="stats-grid">
                <StatCard 
                  label="Total Students" 
                  value={vendorData.totalStudents} 
                  icon={Users} 
                  iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
                />
                <StatCard 
                  label="Printed ID Cards" 
                  value={vendorData.printedCards} 
                  icon={CheckCircle} 
                  iconBg="rgba(16, 185, 129, 0.1)" iconColor="#10b981" 
                />
                <StatCard 
                  label="Pending Cards" 
                  value={vendorData.pendingCards} 
                  icon={AlertCircle} 
                  iconBg="rgba(245, 158, 11, 0.1)" iconColor="#f59e0b" 
                />
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="chart-card">
                  <h3>ID Card Printing Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Printed Cards', value: vendorData.printedCards },
                          { name: 'Pending Cards', value: vendorData.pendingCards }
                        ]} 
                        cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" label
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard 
            label="Total Students" 
            value="1,248" 
            icon={GraduationCap} 
            iconBg="rgba(56, 189, 248, 0.1)" iconColor="#38bdf8" 
            trend={12} trendText="from last month"
          />
          <StatCard 
            label="Active Teachers" 
            value="84" 
            icon={Users} 
            iconBg="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" 
            trend={2} trendText="new this term"
          />
          <StatCard 
            label="Total Classes" 
            value="42" 
            icon={LayoutDashboard} 
            iconBg="rgba(234, 179, 8, 0.1)" iconColor="#eab308" 
            trend={0} trendText="No changes"
          />
          <StatCard 
            label="Average Attendance" 
            value="94.2%" 
            icon={Activity} 
            iconBg="rgba(239, 68, 68, 0.1)" iconColor="#ef4444" 
            trend={-1.5} trendText="from last week"
          />
        </div>
      )}

      {/* Demonstration of the sleek SlideOver UX for forms & details */}
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
            style={{ background: '#10203F', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Close Panel
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { title: "Student Record Created", desc: "Adefolarin Bakare was newly enrolled into JSS 2 Silver.", time: "10 minutes ago", status: "Success", color: "#10b981" },
            { title: "Fee Clearance Verified", desc: "Manual clearance approved for student NGN 150,000 tuition via Bank Transfer.", time: "2 hours ago", status: "Verified", color: "#38bdf8" },
            { title: "Report Card Template Updated", desc: "Termly Grading Criteria adjusted to standard 40/60 distribution.", time: "Yesterday at 4:15 PM", status: "Updated", color: "#818cf8" },
            { title: "System Login Recorded", desc: `Successful administrative sign-in by ${userName || 'Super Admin'} from standard IP.`, time: "Yesterday at 9:00 AM", status: "Security", color: "#f59e0b" },
            { title: "Bulk SMS Broadcast", desc: "Mid-term resumption notification sent to 269 parents.", time: "3 days ago", status: "Broadcast", color: "#10203F" }
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E3E7EF', backgroundColor: '#FAFCFE', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#10203F', fontSize: '1rem' }}>{item.title}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, background: `${item.color}15`, padding: '4px 8px', borderRadius: '6px' }}>
                  {item.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>{item.desc}</p>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </SlideOver>

    </div>
  );
}
