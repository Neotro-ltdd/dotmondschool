import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import '../students/Management.css';

interface GateLog {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  classId: string | null;
  level: string;
  dateScanned: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: string;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

const GateAttendanceLog: React.FC = () => {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // New Filters
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');

  const fetchClasses = async () => {
    try {
      const classData = await api.get('/setup/classes');
      setClasses(classData);
    } catch (err) {
      console.error("Failed to load classes");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/logs?date=${filterDate}`);
      setLogs(res || []);
    } catch (err) {
      console.error('Failed to fetch gate attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterDate]);

  let filteredLogs = logs;
  if (filterSearch) {
    const searchLower = filterSearch.toLowerCase();
    filteredLogs = filteredLogs.filter(s => 
      s.studentName.toLowerCase().includes(searchLower) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchLower))
    );
  }
  if (filterLevel) {
    filteredLogs = filteredLogs.filter(s => s.level === filterLevel);
  }
  if (filterClassId) {
    filteredLogs = filteredLogs.filter(s => s.classId === filterClassId);
  }

  // Generate options for classes based on selected level
  const classOptions = filterLevel ? classes.filter(c => c.level === filterLevel) : classes;

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gate Attendance Logs</h1>
          <p className="text-sm text-gray-500">View real-time scans from the gatekeepers</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label>Search Student:</label>
          <input 
            type="text" 
            value={filterSearch} 
            onChange={(e) => setFilterSearch(e.target.value)} 
            className="filter-select" 
            placeholder="Name or Reg. Number..."
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Level:</label>
          <select 
            value={filterLevel} 
            onChange={(e) => { setFilterLevel(e.target.value); setFilterClassId(''); }} 
            className="filter-select"
          >
            <option value="">All Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Class:</label>
          <select 
            value={filterClassId} 
            onChange={(e) => setFilterClassId(e.target.value)} 
            className="filter-select"
          >
            <option value="">All Classes</option>
            {classOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{`${cls.level} ${cls.name} ${cls.section}`}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Date (Old Records):</label>
          <input 
            type="date" 
            className="filter-select" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container glass-panel">
        {loading ? (
          <div className="loading-text">Loading logs...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-text">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.studentId}>
                    <td>
                      <strong>{log.studentName}</strong>
                      <div className="text-muted text-sm">{log.registrationNumber}</div>
                    </td>
                    <td><span className="badge badge-info">{log.className}</span></td>
                    <td>
                      {log.clockInTime ? new Date(log.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td>
                      {log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'Present' ? 'badge-success' : 'badge-secondary'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GateAttendanceLog;
