import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Filter, 
  Printer, 
  Download, 
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react';
import './StaffAttendanceReport.css';

interface StaffAttendanceItem {
  staffId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  role: string;
  staffCategory: string;
  employmentType: string;
  clockInTime: string | null;
  status: string;
  avatarUrl: string;
}

interface StaffAttendanceReportData {
  date: string;
  totalActiveStaff: number;
  totalPresentToday: number;
  totalAbsentToday: number;
  teachingPresent: number;
  nonTeachingPresent: number;
  contractPresent: number;
  staffAttendanceList: StaffAttendanceItem[];
}

export default function StaffAttendanceReport() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data, isLoading, refetch, isRefetching } = useQuery<StaffAttendanceReportData>({
    queryKey: ['staff-attendance-report', selectedDate, categoryFilter],
    queryFn: async () => {
      const res = await api.get(`/api/attendance/staff-report?date=${selectedDate}&category=${categoryFilter}`);
      return res;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const filteredList = data?.staffAttendanceList.filter(item => {
    const matchesSearch = 
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  }) || [];

  return (
    <div className="staff-attendance-report-page">
      {/* Header Banner */}
      <div className="report-header-banner">
        <div>
          <h1 className="report-title">
            <Users size={24} style={{ marginRight: '10px', color: 'var(--secondary-color, #FACC15)' }} />
            Staff Attendance & Clock-In Log
          </h1>
          <p className="report-subtitle">
            One-way gate arrival tracking for Teaching, Non-Teaching, and Contract Staff members. Restricted to Superadmin, Admin, and Account.
          </p>
        </div>
        <div className="report-actions">
          <button className="btn-report-action" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={16} className={isRefetching ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn-report-action primary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="report-filter-bar">
        <div className="filter-group">
          <label><Calendar size={15} /> Select Attendance Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-date-input"
          />
        </div>

        <div className="filter-group">
          <label><Filter size={15} /> Staff Classification:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select-input"
          >
            <option value="All">All Staff Categories</option>
            <option value="Teaching">Teaching Staff</option>
            <option value="NonTeaching">Non-Teaching Staff</option>
            <option value="Contract">Contract Staff</option>
          </select>
        </div>

        <div className="filter-group search">
          <input 
            type="text" 
            placeholder="Search by staff name, designation, email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="report-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper active-staff">
            <Users size={22} />
          </div>
          <div>
            <span className="stat-label">Total Active Staff</span>
            <h2 className="stat-value">{data?.totalActiveStaff || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper present">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="stat-label">Clocked In Today</span>
            <h2 className="stat-value present">{data?.totalPresentToday || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper absent">
            <UserX size={22} />
          </div>
          <div>
            <span className="stat-label">Not Clocked In</span>
            <h2 className="stat-value absent">{data?.totalAbsentToday || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper breakdown">
            <Briefcase size={22} />
          </div>
          <div>
            <span className="stat-label">Category Breakdown</span>
            <div className="breakdown-pills">
              <span className="pill teaching">Teaching: {data?.teachingPresent || 0}</span>
              <span className="pill non-teaching">Non-Teach: {data?.nonTeachingPresent || 0}</span>
              <span className="pill contract">Contract: {data?.contractPresent || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="report-table-card">
        <div className="table-card-header">
          <h3>Daily Arrival Records ({selectedDate})</h3>
          <span className="record-count-badge">{filteredList.length} Staff Records</span>
        </div>

        {isLoading ? (
          <div className="table-loading-container">
            <RefreshCw size={24} className="spin" />
            <span>Loading staff attendance records...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="table-empty-container">
            <UserX size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No staff attendance records found for this date & filter selection.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="staff-attendance-table">
              <thead>
                <tr>
                  <th>Staff Profile</th>
                  <th>Designation / Roles</th>
                  <th>Category</th>
                  <th>Employment</th>
                  <th>Clock-In Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((staff) => (
                  <tr key={staff.staffId}>
                    <td>
                      <div className="staff-profile-cell">
                        <img 
                          src={staff.avatarUrl || '/images/default-avatar.png'} 
                          alt={staff.fullName} 
                          className="staff-avatar-img"
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute('src', '/images/default-avatar.png');
                          }}
                        />
                        <div>
                          <strong className="staff-name">{staff.fullName}</strong>
                          <span className="staff-contact">{staff.email} • {staff.phoneNumber}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="staff-role-cell">
                        <strong className="designation-text">{staff.designation}</strong>
                        <div className="role-tags">
                          {staff.role.split(',').map((r, i) => (
                            <span key={i} className="role-badge">{r.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`category-badge ${staff.staffCategory.toLowerCase()}`}>
                        {staff.staffCategory === 'NonTeaching' ? 'Non-Teaching' : staff.staffCategory}
                      </span>
                    </td>

                    <td>
                      <span className="employment-badge">{staff.employmentType}</span>
                    </td>

                    <td>
                      {staff.clockInTime ? (
                        <div className="time-cell">
                          <Clock size={14} className="time-icon" />
                          <span>
                            {new Date(staff.clockInTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="time-cell-absent">—</span>
                      )}
                    </td>

                    <td>
                      {staff.status === 'Present' ? (
                        <span className="status-badge present">
                          <CheckCircle size={14} /> Clocked In
                        </span>
                      ) : (
                        <span className="status-badge absent">
                          <XCircle size={14} /> Not Clocked In
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
