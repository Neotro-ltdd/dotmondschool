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
  Info,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  AlertCircle,
  X,
  Send
} from 'lucide-react';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  email: string;
  role?: string;
  staffCode?: string;
}

interface EmailChangeRequestItem {
  id: string;
  staffId: string;
  identityUserId: string;
  oldEmail: string;
  newEmail: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  staffName: string;
  staffCode: string;
  staffRole: string;
}

const AVAILABLE_ROLES = [
  { id: 'Director', name: 'Director', description: 'Executive oversight, school-wide management, and approval authority', icon: Shield, color: 'admin' },
  { id: 'Admin', name: 'Admin', description: 'Full system management, staff setup, and operations governance', icon: ShieldCheck, color: 'admin' },
  { id: 'Principal', name: 'Principal', description: 'Academic administration, report approvals, and school leadership', icon: Shield, color: 'admin' },
  { id: 'Accountant', name: 'Accountant', description: 'Fee billing, ledger management, online verification & POS', icon: DollarSign, color: 'accountant' },
  { id: 'Teacher', name: 'Form Teacher', description: 'Class roster management, attendance registers, and grade submission', icon: BookOpen, color: 'teacher' },
  { id: 'SubjectTeacher', name: 'Subject Teacher', description: 'Subject assessment entry and score recording', icon: UserCheck, color: 'teacher' },
  { id: 'Vendor', name: 'Vendor', description: 'Store orders, item dispatch, and receipt fulfillment', icon: Users, color: 'vendor' },
];

export default function RoleManagement() {
  const { showAlert, showConfirm } = useDialog();

  const [activeTab, setActiveTab] = useState<'roles' | 'email-requests'>('roles');

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [roleEmail, setRoleEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [managingRole, setManagingRole] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Email Change Requests State
  const [emailRequests, setEmailRequests] = useState<EmailChangeRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Direct Staff Email Edit Modal State
  const [directEditModalOpen, setDirectEditModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [directNewEmail, setDirectNewEmail] = useState<string>('');
  const [directUpdating, setDirectUpdating] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchEmailRequests();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await api.get('/setup/staff');
      setTeachers(data || []);
    } catch (err) {
      console.error("Failed to load teachers for role management", err);
    }
  };

  const fetchEmailRequests = async () => {
    try {
      setRequestsLoading(true);
      const data = await api.get('/setup/staff/email-change-requests');
      setEmailRequests(data || []);
    } catch (err) {
      console.error("Failed to load email change requests", err);
    } finally {
      setRequestsLoading(false);
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

  const handleApproveEmailRequest = async (req: EmailChangeRequestItem) => {
    if (!await showConfirm(`Approve email update for ${req.staffName} from ${req.oldEmail} to ${req.newEmail}? Their existing password will be preserved.`)) return;

    try {
      setProcessingId(req.id);
      const res = await api.post(`/setup/staff/email-change-requests/${req.id}/process`, {
        approve: true
      });
      showAlert(res.message || `Email updated successfully to ${req.newEmail}.`);
      fetchEmailRequests();
      fetchTeachers();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || 'Failed to process approval.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEmailRequest = async (req: EmailChangeRequestItem) => {
    const reasonPrompt = window.prompt("Enter rejection reason (optional):", "Incorrect email request");
    if (reasonPrompt === null) return; // User cancelled

    try {
      setProcessingId(req.id);
      const res = await api.post(`/setup/staff/email-change-requests/${req.id}/process`, {
        approve: false,
        rejectionReason: reasonPrompt
      });
      showAlert(res.message || 'Email change request rejected.');
      fetchEmailRequests();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || 'Failed to reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDirectEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      showAlert('Please select a staff member to edit.');
      return;
    }
    if (!directNewEmail || !directNewEmail.trim()) {
      showAlert('Please enter a valid email address.');
      return;
    }

    const staffMember = teachers.find(t => t.id === selectedStaffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.surname}` : 'Staff Member';

    if (!await showConfirm(`Directly update email for ${staffName} to ${directNewEmail.trim()}? Their existing password will be preserved.`)) return;

    try {
      setDirectUpdating(true);
      const res = await api.put(`/setup/staff/${selectedStaffId}/update-email`, {
        newEmail: directNewEmail.trim()
      });
      showAlert(res.message || `Staff email updated successfully to ${directNewEmail.trim()}.`);
      setDirectEditModalOpen(false);
      setSelectedStaffId('');
      setDirectNewEmail('');
      fetchTeachers();
      fetchEmailRequests();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || 'Failed to update staff email.');
    } finally {
      setDirectUpdating(false);
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

  const filteredRequests = emailRequests.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    if (!searchFilter) return matchesStatus;
    const lower = searchFilter.toLowerCase();
    return matchesStatus && (
      r.staffName?.toLowerCase().includes(lower) ||
      r.oldEmail?.toLowerCase().includes(lower) ||
      r.newEmail?.toLowerCase().includes(lower) ||
      r.staffCode?.toLowerCase().includes(lower)
    );
  });

  // Metrics
  const totalStaff = teachers.length;
  const adminCount = teachers.filter(t => t.role === 'Admin' || t.role === 'Principal').length;
  const pendingRequestsCount = emailRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="role-page-container">
      {/* Page Header */}
      <div className="role-page-header">
        <div>
          <h1 className="role-page-title">User & Access Governance</h1>
          <p className="role-page-subtitle">Manage system roles, staff permissions, and profile email change requests</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
              background: activeTab === 'roles' ? '#000080' : 'transparent',
              color: activeTab === 'roles' ? '#FFFFFF' : '#64748B',
              boxShadow: activeTab === 'roles' ? '0 2px 8px rgba(0,0,128,0.2)' : 'none'
            }}
          >
            <Shield size={16} />
            Role Assignment
          </button>
          
          <button
            onClick={() => setActiveTab('email-requests')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
              background: activeTab === 'email-requests' ? '#000080' : 'transparent',
              color: activeTab === 'email-requests' ? '#FFFFFF' : '#64748B',
              boxShadow: activeTab === 'email-requests' ? '0 2px 8px rgba(0,0,128,0.2)' : 'none',
              position: 'relative'
            }}
          >
            <Mail size={16} />
            Staff Email Change Requests
            {pendingRequestsCount > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '999px',
                lineHeight: 1
              }}>
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="role-metrics-grid">
        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Staff Profiles</span>
            <span className="metric-number">{totalStaff}</span>
          </div>
          <div className="metric-icon-badge staff">
            <Users size={24} />
          </div>
        </div>

        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Admins & Principals</span>
            <span className="metric-number" style={{ color: '#6B21A8' }}>{adminCount}</span>
          </div>
          <div className="metric-icon-badge admin">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="role-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Pending Email Requests</span>
            <span className="metric-number" style={{ color: pendingRequestsCount > 0 ? '#DC2626' : '#047857' }}>
              {pendingRequestsCount}
            </span>
          </div>
          <div className="metric-icon-badge finance">
            <Mail size={24} />
          </div>
        </div>
      </div>

      {/* ════════════════ TAB 1: ROLE ASSIGNMENT CONTROL ════════════════ */}
      {activeTab === 'roles' && (
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
                    <div 
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #000080' : '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '8px', 
                        background: isSelected ? '#000080' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconComp size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{role.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: '1.3' }}>{role.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                disabled={managingRole}
                onClick={() => handleManageRole('Assign')}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontWeight: 700, fontSize: '0.88rem', background: '#000080' }}
              >
                {managingRole ? 'Processing...' : `Assign ${selectedRole}`}
              </button>
              <button
                disabled={managingRole}
                onClick={() => handleManageRole('Unassign')}
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.75rem', fontWeight: 700, fontSize: '0.88rem', color: '#DC2626', borderColor: '#FCA5A5' }}
              >
                {managingRole ? 'Processing...' : `Revoke ${selectedRole}`}
              </button>
            </div>

          </div>

          {/* Right Column: Active Staff Directory */}
          <div className="role-card-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Staff Roles Directory</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#64748B' }}>Overview of active staff accounts and assigned privileges</p>
              </div>

              {/* Search filter */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Filter staff..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', maxHeight: '480px', overflowY: 'auto' }}>
              {filteredTeachers.map(staff => (
                <div 
                  key={staff.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #F1F5F9',
                    background: '#F8FAFC'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#000080',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getInitials(staff.firstName, staff.surname)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                        {`${staff.surname}, ${staff.firstName}`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{staff.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: staff.role === 'Admin' || staff.role === 'Principal' ? '#F3E8FF' : '#E0F2FE',
                      color: staff.role === 'Admin' || staff.role === 'Principal' ? '#6B21A8' : '#0369A1'
                    }}>
                      {staff.role || 'Teacher'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ════════════════ TAB 2: EMAIL CHANGE REQUESTS ════════════════ */}
      {activeTab === 'email-requests' && (
        <div className="role-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <Mail size={22} color="#000080" /> Staff Email Change Requests
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                Review and approve staff email updates. Preserves existing passwords seamlessly.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Direct Edit Staff Email Button */}
              <button
                onClick={() => {
                  setSelectedStaffId('');
                  setDirectNewEmail('');
                  setDirectEditModalOpen(true);
                }}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1rem',
                  fontSize: '0.83rem',
                  fontWeight: 700,
                  borderColor: '#000080',
                  color: '#000080'
                }}
              >
                <Edit size={16} />
                Direct Edit Staff Email
              </button>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: statusFilter === st ? '#FFFFFF' : 'transparent',
                      color: statusFilter === st ? '#000080' : '#64748B',
                      boxShadow: statusFilter === st ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {requestsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
              Loading email change requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <Mail size={36} style={{ color: '#94A3B8', marginBottom: '0.5rem' }} />
              <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 700 }}>No Email Requests Found</h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                {statusFilter === 'ALL' ? 'No staff members have submitted email change requests yet.' : `No ${statusFilter.toLowerCase()} requests match your filter.`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Staff Member</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Current Email</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Requested New Email</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Reason & Date</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{req.staffName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#000080', background: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                            {req.staffCode}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{req.staffRole}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontWeight: 600 }}>
                        {req.oldEmail}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#0F172A', fontWeight: 700 }}>
                        {req.newEmail}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                        <div style={{ color: '#334155', fontWeight: 500, fontSize: '0.82rem', lineHeight: '1.3' }}>
                          {req.reason}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} />
                          {new Date(req.requestedAt).toLocaleDateString()} at {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {req.status === 'Pending' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            <Clock size={13} /> Pending Review
                          </span>
                        )}
                        {req.status === 'Approved' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            <CheckCircle2 size={13} /> Approved
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#991B1B', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            <XCircle size={13} /> Rejected
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {req.status === 'Pending' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleApproveEmailRequest(req)}
                              className="btn"
                              style={{
                                padding: '0.45rem 0.85rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: '#166534',
                                color: '#FFFFFF',
                                borderRadius: '6px'
                              }}
                            >
                              Approve & Update
                            </button>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleRejectEmailRequest(req)}
                              className="btn btn-outline"
                              style={{
                                padding: '0.45rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#DC2626',
                                borderColor: '#FCA5A5',
                                borderRadius: '6px'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Processed
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
      )}

      {/* ════════════════ DIRECT STAFF EMAIL EDIT MODAL ════════════════ */}
      {directEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#000080',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Edit size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Direct Staff Email Edit</h3>
              </div>
              <button
                onClick={() => setDirectEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleDirectEditSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  SELECT STAFF MEMBER <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedStaffId(id);
                    const found = teachers.find(t => t.id === id);
                    if (found) {
                      setDirectNewEmail(found.email || '');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Staff Profile --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {`${t.surname}, ${t.firstName} (${t.email})`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaffId && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', display: 'block', marginBottom: '0.4rem' }}>
                    NEW EMAIL ADDRESS <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter new email address"
                    value={directNewEmail}
                    onChange={e => setDirectNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #000080',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.78rem',
                color: '#166534'
              }}>
                <strong>🔒 Security Assurance:</strong> The staff member's password hash will be preserved intact. They will log in using this updated email address with their existing password.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDirectEditModalOpen(false)}
                  className="btn btn-outline"
                  disabled={directUpdating}
                  style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={directUpdating || !selectedStaffId}
                  className="btn"
                  style={{
                    padding: '0.65rem 1.4rem',
                    fontWeight: 700,
                    background: '#000080',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <Send size={15} />
                  {directUpdating ? 'Updating...' : 'Update Staff Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
