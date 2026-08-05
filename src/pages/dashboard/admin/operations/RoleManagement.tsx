import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import './RoleManagement.css';
import { useDialog } from '../../../../context/DialogContext';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  DollarSign, 
  BookOpen, 
  Search, 
  User, 
  Info 
} from 'lucide-react';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  email: string;
  role?: string;
}

const AVAILABLE_ROLES = [
  { id: 'Admin', name: 'Admin', description: 'Full system management, staff setup, and operations governance', icon: ShieldCheck, color: 'admin' },
  { id: 'Accountant', name: 'Accountant', description: 'Fee billing, ledger management, online verification & POS', icon: DollarSign, color: 'accountant' },
  { id: 'Teacher', name: 'Form Teacher', description: 'Class roster management, attendance registers, and grade submission', icon: BookOpen, color: 'teacher' },
  { id: 'SubjectTeacher', name: 'Subject Teacher', description: 'Subject assessment entry and score recording', icon: UserCheck, color: 'teacher' },
  { id: 'Vendor', name: 'Vendor', description: 'Store orders, item dispatch, and receipt fulfillment', icon: Users, color: 'vendor' },
];

export default function RoleManagement() {
  const { showAlert, showConfirm } = useDialog();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [roleEmail, setRoleEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [managingRole, setManagingRole] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await api.get('/setup/staff');
      setTeachers(data || []);
    } catch (err) {
      console.error("Failed to load teachers for role management", err);
    }
  };

  const handleManageRole = async (action: 'Assign' | 'Unassign') => {
    if (!roleEmail) {
      showAlert('Please select a staff member.');
      return;
    }
    const staffMember = teachers.find(t => t.email === roleEmail);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.surname}` : roleEmail;

    if (!await showConfirm(`Are you sure you want to ${action.toLowerCase()} the ${selectedRole} role for ${staffName}?`)) return;
    
    try {
      setManagingRole(true);
      const res = await api.post('/identity/manage-role', {
        email: roleEmail,
        roleName: selectedRole,
        action: action
      });
      showAlert(res.message || `Successfully ${action.toLowerCase()}ed role.`);
      fetchTeachers();
    } catch (err: any) {
      showAlert(err.message || `Failed to ${action.toLowerCase()} role.`);
    } finally {
      setManagingRole(false);
    }
  };

  const getInitials = (firstName: string, surname: string) => {
    const f = firstName ? firstName[0] : '';
    const s = surname ? surname[0] : '';
    return `${f}${s}`.toUpperCase() || 'ST';
  };

  const selectedRoleMeta = AVAILABLE_ROLES.find(r => r.id === selectedRole) || AVAILABLE_ROLES[0];

  const filteredTeachers = teachers.filter(t => {
    if (!searchFilter) return true;
    const lower = searchFilter.toLowerCase();
    return (
      t.firstName?.toLowerCase().includes(lower) ||
      t.surname?.toLowerCase().includes(lower) ||
      t.email?.toLowerCase().includes(lower) ||
      (t.role && t.role.toLowerCase().includes(lower))
    );
  });

  // Metrics
  const totalStaff = teachers.length;
  const adminCount = teachers.filter(t => t.role === 'Admin' || t.role === 'Principal').length;
  const accountantCount = teachers.filter(t => t.role === 'Accountant').length;
  const teacherCount = teachers.filter(t => !t.role || t.role === 'Teacher' || t.role === 'SubjectTeacher').length;

  return (
    <div className="role-page-container">
      {/* Page Header */}
      <div className="role-page-header">
        <div>
          <h1 className="role-page-title">Role & Access Management</h1>
          <p className="role-page-subtitle">Configure system security roles, permission scopes, and staff operational access</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="role-metrics-grid">
        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Registered Staff</span>
            <span className="metric-number">{totalStaff}</span>
          </div>
          <div className="metric-icon-badge staff">
            <Users size={24} />
          </div>
        </div>

        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">System Admins</span>
            <span className="metric-number" style={{ color: '#6B21A8' }}>{adminCount}</span>
          </div>
          <div className="metric-icon-badge admin">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Finance & Bursary</span>
            <span className="metric-number" style={{ color: '#047857' }}>{accountantCount}</span>
          </div>
          <div className="metric-icon-badge finance">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Academic Instructors</span>
            <span className="metric-number" style={{ color: '#B45309' }}>{teacherCount}</span>
          </div>
          <div className="metric-icon-badge academic">
            <BookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Two-Column Workspace Layout */}
      <div className="role-workspace-grid">
        {/* Left Column: Role Assignment Form */}
        <div className="role-card-wrapper">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="#000080" /> Role Assignment Control
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Grant or revoke operational privileges for staff users.
            </p>
          </div>

          {/* Select Teacher Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
              Target Staff Member
            </label>
            <select 
              className="select-filter-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              value={roleEmail} 
              onChange={(e) => setRoleEmail(e.target.value)} 
            >
              <option value="">-- Select a Staff Member --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.email}>
                  {`${t.firstName} ${t.surname} (${t.email})`}
                </option>
              ))}
            </select>
          </div>

          {/* Select Role Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
              Select Security Role
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {AVAILABLE_ROLES.map(role => {
                const IconComp = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-color, #000080)' : '1px solid #E2E8F0',
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: isSelected ? '#000080' : '#E2E8F0', 
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>

                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>
                        {role.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', lineHeight: 1.3 }}>
                        {role.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Info Box */}
          <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
            <Info size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Role changes update security tokens immediately upon next user login.</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button 
              className="btn-assign-action new" 
              onClick={() => handleManageRole('Assign')} 
              disabled={managingRole}
              style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
            >
              <ShieldCheck size={16} />
              {managingRole ? 'Processing...' : 'Assign Role'}
            </button>

            <button 
              className="btn-assign-action change" 
              onClick={() => handleManageRole('Unassign')} 
              disabled={managingRole}
              style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', border: '1px solid #FECDD3', color: '#E11D48', background: '#FFF1F2' }}
            >
              <ShieldAlert size={16} />
              Unassign Role
            </button>
          </div>
        </div>

        {/* Right Column: Staff Security Directory */}
        <div className="role-card-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Staff Security Directory</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Audit staff members and their active operational permissions
              </p>
            </div>

            <div className="clearance-search-box" style={{ minWidth: '220px' }}>
              <Search className="clearance-search-icon" size={15} />
              <input 
                type="text" 
                placeholder="Search staff or email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ padding: '0.5rem 0.85rem 0.5rem 2.2rem', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="executive-role-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th style={{ textAlign: 'center' }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td>
                        <div className="teacher-profile-cell">
                          <div className="teacher-avatar">
                            {getInitials(teacher.firstName, teacher.surname)}
                          </div>
                          <span className="teacher-name-title">{`${teacher.firstName} ${teacher.surname}`}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                          {teacher.email}
                        </span>
                      </td>
                      <td>
                        <span className={`role-badge-pill ${(teacher.role || 'Teacher').toLowerCase()}`}>
                          <Shield size={12} />
                          {teacher.role || 'Teacher'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setRoleEmail(teacher.email);
                            if (teacher.role) setSelectedRole(teacher.role);
                          }}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          Select Staff
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
