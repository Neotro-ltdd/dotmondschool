import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import './Dashboard.css';

// Mock Data for Charts
const attendanceData = [
  { name: 'Week 1', attendance: 88 },
  { name: 'Week 2', attendance: 90 },
  { name: 'Week 3', attendance: 92 },
  { name: 'Week 4', attendance: 94.2 },
];

const feeData = [
  { name: 'Collected', value: 82 },
  { name: 'Pending', value: 18 },
];
const feeColors = ['#10b981', '#f43f5e'];
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#2dd4bf', '#fbbf24', '#f87171'];

const populationData = [
  { name: 'Population', Students: 1248, Teachers: 84 },
];

export default function Overview() {
  const { userRole } = useAuth();
  const { schoolName } = useTenant();
  
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
          const { api } = await import('../../services/api');
          const res = await api.get('/finance/dashboard');
          setAccountantData(res);
        } catch (err) {
          console.error("Failed to fetch accountant dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAccountantData();
    } else if (userRole === 'Teacher') {
      const fetchTeacherData = async () => {
        try {
          setLoading(true);
          const { api } = await import('../../services/api');
          const res = await api.get('/academics/teacher/dashboard');
          setTeacherData(res);
        } catch (err) {
          console.error("Failed to fetch teacher dashboard data", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTeacherData();
    } else if (userRole === 'Admin') {
      const fetchAdminData = async () => {
        try {
          setLoading(true);
          const { api } = await import('../../services/api');
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
          const { api } = await import('../../services/api');
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
          const { api } = await import('../../services/api');
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
  
  return (
    <div className="overview-page">
      <div className="dashboard-header-text">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening at {schoolName}.</p>
      </div>

      {userRole === 'Principal' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : principalData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="stats-grid">
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>🎓</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Student Population</p>
                    <h3 className="stat-value">{principalData.metrics.totalStudents}</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>👩‍🏫</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Teaching Staff</p>
                    <h3 className="stat-value">{principalData.metrics.totalTeachers}</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
                  <div className="stat-content">
                    <p className="stat-label">Average Attendance (Today)</p>
                    <h3 className="stat-value">{principalData.metrics.averageAttendance}%</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⏳</div>
                  <div className="stat-content">
                    <p className="stat-label">Pending Approvals</p>
                    <h3 className="stat-value">{principalData.metrics.pendingApprovals}</h3>
                  </div>
                </div>
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="chart-card glass-panel">
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

                <div className="chart-card glass-panel">
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
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '0.5rem', color: '#38bdf8' }}>{cls.className}</h4>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {cls.students.map((student: any, sIdx: number) => (
                              <li key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>💰</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Collected</p>
                    <h3 className="stat-value">{accountantData ? formatCurrency(accountantData.totalCollected) : '---'}</h3>
                  </div>
                </div>
                
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⏳</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Unpaid</p>
                    <h3 className="stat-value">{accountantData ? formatCurrency(accountantData.totalUnpaid) : '---'}</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⚠️</div>
                  <div className="stat-content">
                    <p className="stat-label">Highest Unpaid Class</p>
                    <h3 className="stat-value">{accountantData?.highestUnpaidClass?.name || '---'}</h3>
                    <p className="stat-trend negative">{accountantData?.highestUnpaidClass?.percentage || 0}% unpaid</p>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>🔍</div>
                  <div className="stat-content">
                    <p className="stat-label">Pending Verifications</p>
                    <h3 className="stat-value">{accountantData?.pendingVerifications || 0}</h3>
                  </div>
                </div>
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="chart-card glass-panel">
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

                <div className="chart-card glass-panel">
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

              <div className="chart-card glass-panel" style={{ width: '100%' }}>
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
      ) : userRole === 'Teacher' ? (
        <div className="analytics-section">
          {loading ? <p>Loading your dashboard...</p> : teacherData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Class Teacher Section */}
              {teacherData.isClassTeacher && teacherData.classTeacherMetrics && (
                <div className="class-teacher-section">
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f8fafc' }}>
                    Form Class Overview ({teacherData.classTeacherMetrics.className})
                  </h2>
                  <div className="stats-grid">
                    <div className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>🎓</div>
                      <div className="stat-content">
                        <p className="stat-label">Total Students</p>
                        <h3 className="stat-value">{teacherData.classTeacherMetrics.totalStudents}</h3>
                      </div>
                    </div>
                    
                    <div className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
                      <div className="stat-content">
                        <p className="stat-label">Present Today</p>
                        <h3 className="stat-value">{teacherData.classTeacherMetrics.attendanceToday.present}</h3>
                      </div>
                    </div>

                    <div className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>❌</div>
                      <div className="stat-content">
                        <p className="stat-label">Absent Today</p>
                        <h3 className="stat-value">{teacherData.classTeacherMetrics.attendanceToday.absent}</h3>
                      </div>
                    </div>

                    <div className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>📝</div>
                      <div className="stat-content">
                        <p className="stat-label">Pending Remarks</p>
                        <h3 className="stat-value">{teacherData.classTeacherMetrics.pendingRemarks}</h3>
                      </div>
                    </div>
                  </div>

                  {teacherData.classTeacherMetrics.topStudents && teacherData.classTeacherMetrics.topStudents.length > 0 && (
                    <div className="widget-card glass-panel" style={{ marginTop: '1.5rem' }}>
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
                </div>
              )}

              {/* Subject Teacher Section */}
              {teacherData.isSubjectTeacher && teacherData.subjectTeacherMetrics && (
                <div className="subject-teacher-section">
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f8fafc' }}>
                    Subject Teacher Overview
                  </h2>
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>📚</div>
                      <div className="stat-content">
                        <p className="stat-label">Total Assigned Classes</p>
                        <h3 className="stat-value">{teacherData.subjectTeacherMetrics.totalAllocations}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="widget-card glass-panel" style={{ marginTop: '1.5rem' }}>
                    <div className="widget-header">
                      <h3>Your Subjects & Classes</h3>
                    </div>
                    <div className="widget-body">
                      <ul className="activity-list">
                        {teacherData.subjectTeacherMetrics.allocations.map((a: any, idx: number) => (
                          <li className="activity-item" key={idx}>
                            <div className="activity-icon" style={{ fontSize: '1.2rem' }}>📌</div>
                            <div className="activity-details">
                              <p><strong>{a.subjectName}</strong> in <strong>{a.className}</strong></p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback if no assignments */}
              {!teacherData.isClassTeacher && !teacherData.isSubjectTeacher && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                  <h3>Welcome, {teacherData.teacherName || 'Teacher'}</h3>
                  <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>You are not currently assigned as a Form Master or Subject Teacher to any active classes.</p>
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
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>🎓</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Active Students</p>
                    <h3 className="stat-value">{adminData.metrics.totalStudents}</h3>
                  </div>
                </div>
                
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>👥</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Staff</p>
                    <h3 className="stat-value">{adminData.metrics.totalStaff}</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🏫</div>
                  <div className="stat-content">
                    <p className="stat-label">Classes & Subjects</p>
                    <h3 className="stat-value">{adminData.metrics.totalClasses} / {adminData.metrics.totalSubjects}</h3>
                  </div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>📅</div>
                  <div className="stat-content">
                    <p className="stat-label">Current Term Status</p>
                    <h3 className="stat-value" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{adminData.metrics.currentTermStatus}</h3>
                  </div>
                </div>
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="chart-card glass-panel">
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

                <div className="chart-card glass-panel">
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
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>👥</div>
                  <div className="stat-content">
                    <p className="stat-label">Total Students</p>
                    <h3 className="stat-value">{vendorData.totalStudents}</h3>
                  </div>
                </div>
                
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🖨️</div>
                  <div className="stat-content">
                    <p className="stat-label">Printed ID Cards</p>
                    <h3 className="stat-value">{vendorData.printedCards}</h3>
                  </div>
                </div>
                
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⏳</div>
                  <div className="stat-content">
                    <p className="stat-label">Pending Cards</p>
                    <h3 className="stat-value">{vendorData.pendingCards}</h3>
                  </div>
                </div>
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="chart-card glass-panel">
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
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>🎓</div>
            <div className="stat-content">
              <p className="stat-label">Total Students</p>
              <h3 className="stat-value">1,248</h3>
              <p className="stat-trend positive">↑ 12% from last month</p>
            </div>
          </div>
          
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>👨‍🏫</div>
            <div className="stat-content">
              <p className="stat-label">Active Teachers</p>
              <h3 className="stat-value">84</h3>
              <p className="stat-trend positive">↑ 2 new this term</p>
            </div>
          </div>
          
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>🏫</div>
            <div className="stat-content">
              <p className="stat-label">Total Classes</p>
              <h3 className="stat-value">42</h3>
              <p className="stat-trend neutral">No changes</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>📉</div>
            <div className="stat-content">
              <p className="stat-label">Average Attendance</p>
              <h3 className="stat-value">94.2%</h3>
              <p className="stat-trend negative">↓ 1.5% from last week</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
