import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Sliders,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import './SystemOverview.css';

interface SchoolData {
  id: number;
  tenantId: string;
  schoolName: string;
  isSuspended: boolean;
  studentCount: number;
}

export default function SystemOverview() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/schools');
      setSchools(data || []);
    } catch (err) {
      console.error('Failed to load schools for overview', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overview-loading-state">
        <div className="loading-spinner" />
        <span>Loading Platform Control Metrics...</span>
      </div>
    );
  }

  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => !s.isSuspended).length;
  const suspendedSchools = schools.filter((s) => s.isSuspended).length;
  const totalStudents = schools.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);

  const statusData = [
    { name: 'Active', value: activeSchools },
    { name: 'Suspended', value: suspendedSchools },
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const studentData = schools
    .map((s) => ({
      name: s.schoolName || s.tenantId,
      tenantId: s.tenantId,
      students: s.studentCount || 0,
    }))
    .sort((a, b) => b.students - a.students);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{item.payload.name || item.name}</p>

          <p className="tooltip-val">
            {item.name === 'Active' || item.name === 'Suspended' ? 'Status' : 'Students'}:{' '}
            <strong style={{ color: item.color || '#38bdf8' }}>{item.value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="system-overview-container">
      {/* Banner / Title Header */}
      <div className="overview-banner">
        <div className="banner-text">
          <h1>Platform Operations Dashboard</h1>
          <p>Real-time analytics across all onboarded school tenants and campus deployments.</p>
        </div>
        <div className="banner-actions">
          <button onClick={fetchSchools} className="btn-refresh" title="Refresh metrics">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/system-admin/schools?provision=true', { state: { openProvisionModal: true } })}
            className="btn-primary-action"
          >
            <PlusCircle size={16} />
            <span>Provision School</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card cyan-theme">
          <div className="metric-header">
            <span className="metric-title">TOTAL SCHOOLS</span>
            <div className="metric-icon-wrap">
              <Building2 size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val">{totalSchools}</span>
            <span className="metric-pill success">
              <TrendingUp size={12} />
              100% Active
            </span>
          </div>
          <p className="metric-subtext">Provisioned tenant databases</p>
        </div>

        <div className="metric-card indigo-theme">
          <div className="metric-header">
            <span className="metric-title">TOTAL STUDENTS</span>
            <div className="metric-icon-wrap">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val">{totalStudents.toLocaleString()}</span>
            <span className="metric-pill info">
              <Sparkles size={12} />
              Platform Total
            </span>
          </div>
          <p className="metric-subtext">Enrolled across tenant campuses</p>
        </div>

        <div className="metric-card emerald-theme">
          <div className="metric-header">
            <span className="metric-title">ACTIVE TENANTS</span>
            <div className="metric-icon-wrap">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val success">{activeSchools}</span>
            <span className="metric-pill success">Operational</span>
          </div>
          <p className="metric-subtext">Zero operational blocks</p>
        </div>

        <div className="metric-card rose-theme">
          <div className="metric-header">
            <span className="metric-title">SUSPENDED TENANTS</span>
            <div className="metric-icon-wrap">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-val danger">{suspendedSchools}</span>
            <span className="metric-pill neutral">Clean Health</span>
          </div>
          <p className="metric-subtext">0 flagged accounts</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        {/* Donut Chart - Status Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>School Status Distribution</h3>
              <p>Active vs suspended tenant organizations</p>
            </div>
            <div className="chart-badge">
              <ShieldCheck size={14} />
              Health Matrix
            </div>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(15, 23, 42, 0.8)"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Stat Overlay */}
            <div className="donut-center-label">
              <span className="donut-center-num">{activeSchools} / {totalSchools}</span>
              <span className="donut-center-sub">Active Schools</span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="custom-legend">
            <div className="legend-item">
              <span className="legend-dot active-dot" />
              <span className="legend-label">Active ({activeSchools})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot suspended-dot" />
              <span className="legend-label">Suspended ({suspendedSchools})</span>
            </div>
          </div>
        </div>

        {/* Bar Chart - Student Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Students per School Campus</h3>
              <p>Top tenant institutions ranked by active student count</p>
            </div>
            <div className="chart-badge">
              <GraduationCap size={14} />
              Capacity Breakdown
            </div>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={studentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="students"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Snapshot Tenant Summary Table */}
      <div className="tenant-snapshot-card">
        <div className="snapshot-header">
          <div>
            <h3>Provisioned Institutions Summary</h3>
            <p>Direct system access and tenant schema overview</p>
          </div>
          <button
            onClick={() => navigate('/system-admin/schools')}
            className="btn-view-all"
          >
            <span>Manage All Schools</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="snapshot-table">
            <thead>
              <tr>
                <th>SCHOOL NAME</th>
                <th>TENANT ID</th>
                <th>ENROLLED STUDENTS</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div className="school-name-cell">
                      <div className="school-avatar-mini">
                        {school.schoolName ? school.schoolName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <span className="school-name-text">{school.schoolName}</span>
                    </div>
                  </td>
                  <td>
                    <code className="tenant-code-badge">{school.tenantId}</code>
                  </td>
                  <td>
                    <strong className="student-count-text">{school.studentCount || 0} Students</strong>
                  </td>
                  <td>
                    <span className={`status-tag ${school.isSuspended ? 'suspended' : 'active'}`}>
                      <span className="tag-dot" />
                      {school.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/system-admin/schools`)}
                      className="table-action-btn"
                    >
                      <Sliders size={14} />
                      <span>Manage Subscription</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
