import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const data = await api.get('/system/schools');
      setSchools(data);
    } catch (err) {
      console.error("Failed to load schools for overview", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="overview-loading">Loading platform metrics...</div>;
  }

  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => !s.isSuspended).length;
  const suspendedSchools = schools.filter(s => s.isSuspended).length;
  const totalStudents = schools.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);

  const statusData = [
    { name: 'Active', value: activeSchools },
    { name: 'Suspended', value: suspendedSchools }
  ];
  const COLORS = ['#22c55e', '#ef4444'];

  const studentData = schools.map(s => ({
    name: s.tenantId,
    students: s.studentCount || 0
  })).sort((a, b) => b.students - a.students);

  return (
    <div className="system-overview">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Provisioned Schools</h3>
          <div className="value">{totalSchools}</div>
        </div>
        <div className="metric-card">
          <h3>Total Students (Platform)</h3>
          <div className="value">{totalStudents}</div>
        </div>
        <div className="metric-card">
          <h3>Active Schools</h3>
          <div className="value success">{activeSchools}</div>
        </div>
        <div className="metric-card">
          <h3>Suspended Schools</h3>
          <div className="value danger">{suspendedSchools}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>School Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Students per School (Top)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
              <BarChart data={studentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#3b82f6" name="Total Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
