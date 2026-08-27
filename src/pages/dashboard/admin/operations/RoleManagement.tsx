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
  Send,
  Sliders,
  Plus,
  Save
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
  { id: 'Chairman', name: 'Chairman', description: 'Executive academic & result oversight (financial access restricted by default)', icon: Shield, color: 'admin' },
  { id: 'Admin', name: 'Admin', description: 'Full system management, staff setup, and operations governance', icon: ShieldCheck, color: 'admin' },
  { id: 'Principal', name: 'Principal', description: 'Academic administration, report approvals, and school leadership', icon: Shield, color: 'admin' },
  { id: 'Accountant', name: 'Accountant', description: 'Fee billing, ledger management, online verification & POS', icon: DollarSign, color: 'accountant' },
  { id: 'Teacher', name: 'Form Teacher', description: 'Class roster management, attendance registers, and grade submission', icon: BookOpen, color: 'teacher' },
  { id: 'SubjectTeacher', name: 'Subject Teacher', description: 'Subject assessment entry and score recording', icon: UserCheck, color: 'teacher' },
  { id: 'Vendor', name: 'Vendor', description: 'Store orders, item dispatch, and receipt fulfillment', icon: Users, color: 'vendor' },
];

export default function RoleManagement() {
  const { showAlert, showConfirm } = useDialog();

  const [activeTab, setActiveTab] = useState<'roles' | 'email-requests' | 'permissions'>('roles');

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

  // RBAC Permission Matrix State
  const [rbacRoles, setRbacRoles] = useState<string[]>([]);
  const [rbacModules, setRbacModules] = useState<any[]>([]);
  const [rbacMappings, setRbacMappings] = useState<Record<string, string[]>>({});
  const [selectedMatrixRole, setSelectedMatrixRole] = useState<string>('Chairman');
  const [matrixLoading, setMatrixLoading] = useState<boolean>(false);
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);

  // Custom Role Modal State
  const [customRoleModalOpen, setCustomRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchEmailRequests();
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    try {
      setMatrixLoading(true);
      const res: any = await api.get('/identity/role-permissions');
      if (res) {
        setRbacRoles(res.roles || []);
        setRbacModules(res.modules || []);
        setRbacMappings(res.mappings || {});
        if (res.roles && res.roles.length > 0 && !res.roles.includes(selectedMatrixRole)) {
          setSelectedMatrixRole(res.roles[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load role permissions matrix", err);
    } finally {
      setMatrixLoading(false);
    }
  };

  const handleTogglePermission = (roleName: string, permKey: string) => {
    setRbacMappings(prev => {
      const currentPerms = prev[roleName] || [];
      const updated = currentPerms.includes(permKey)
        ? currentPerms.filter(k => k !== permKey)
        : [...currentPerms, permKey];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleBulkModuleToggle = (roleName: string, modulePermKeys: string[], enableAll: boolean) => {
    setRbacMappings(prev => {
      const currentPerms = prev[roleName] || [];
      let updated: string[];
      if (enableAll) {
        updated = Array.from(new Set([...currentPerms, ...modulePermKeys]));
      } else {
        updated = currentPerms.filter(k => !modulePermKeys.includes(k));
      }
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSaveRolePermissions = async () => {
    try {
      setSavingPermissions(true);
      const currentPerms = rbacMappings[selectedMatrixRole] || [];
      const res: any = await api.post('/identity/save-role-permissions', {
        roleName: selectedMatrixRole,
        permissions: currentPerms
      });
      showAlert(res.message || `Successfully saved permissions for '${selectedMatrixRole}'.`);
      fetchRolePermissions();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || 'Failed to save permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      showAlert('Please enter a valid role name.');
      return;
    }

    try {
      setCreatingRole(true);
      const res: any = await api.post('/identity/create-custom-role', {
        roleName: newRoleName.trim(),
        description: newRoleDesc.trim()
      });
      showAlert(res.message || `Custom role '${newRoleName.trim()}' created.`);
      setCustomRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      await fetchRolePermissions();
      setSelectedMatrixRole(newRoleName.trim());
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || 'Failed to create custom role.');
    } finally {
      setCreatingRole(false);
    }
  };

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

      {/* TAB 1: ROLE ASSIGNMENT */}
      {activeTab === 'roles' && (
        <>
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
                <span className="metric-label">Admin / Principal Users</span>
                <span className="metric-number">{adminCount}</span>
              </div>
              <div className="metric-icon-badge admin">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="role-metric-card">
              <div className="metric-info-box">
                <span className="metric-label">Pending Email Requests</span>
                <span className="metric-number">{pendingRequestsCount}</span>
              </div>
              <div className="metric-icon-badge academic">
                <Mail size={24} />
              </div>
            </div>
          </div>

          <div className="role-workspace-grid">
            {/* Left Control Card */}
            <div className="role-card-wrapper">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Assign User Role</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>Grant or revoke specialized permissions for portal staff</p>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Select Target Staff
                </label>
                <select
                  value={roleEmail}
                  onChange={e => setRoleEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.email}>
                      {`${t.surname}, ${t.firstName} (${t.email})`} {t.role ? `[Role: ${t.role}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  Select Target Role
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Role Meta Description Box */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <Info size={18} style={{ color: '#000080', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'block' }}>{selectedRoleMeta.name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>{selectedRoleMeta.description}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleManageRole('Assign')}
                  disabled={managingRole || !roleEmail}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    fontWeight: 700,
                    background: '#000080',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <UserCheck size={16} />
                  Assign Role
                </button>
                <button
                  onClick={() => handleManageRole('Unassign')}
                  disabled={managingRole || !roleEmail}
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    fontWeight: 700,
                    color: '#EF4444',
                    borderColor: '#FECACA'
                  }}
                >
                  Revoke Role
                </button>
              </div>
            </div>

            {/* Right Roster Table */}
            <div className="role-card-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Active Staff Role Roster</h3>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem 0.45rem 2rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="executive-role-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Email Address</th>
                      <th>Current Role</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: '#EEF2FF',
                              color: '#000080',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {getInitials(t.firstName, t.surname)}
                            </div>
                            <div>
                              <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{`${t.surname}, ${t.firstName}`}</span>
                              {t.staffCode && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.staffCode}</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#475569', fontWeight: 500 }}>{t.email}</td>
                        <td>
                          <span className={`role-badge-pill ${t.role ? t.role.toLowerCase() : 'user'}`}>
                            {t.role || 'Staff User'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedStaffId(t.id);
                              setDirectNewEmail(t.email);
                              setDirectEditModalOpen(true);
                            }}
                            className="btn-link"
                            style={{ fontSize: '0.8rem', fontWeight: 700, color: '#000080', cursor: 'pointer', background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit size={14} />
                            Edit Email
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: PERMISSION CONTROL MATRIX */}
      {activeTab === 'permissions' && (
        <div className="permission-matrix-container">
          {/* Role Toolbar */}
          <div className="permission-roles-toolbar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Select Role to Configure</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>Choose an existing role or create a custom role to toggle specific feature access</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setCustomRoleModalOpen(true)}
                  className="btn btn-outline"
                  style={{ fontWeight: 700, padding: '0.6rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Plus size={16} />
                  Add Custom Role
                </button>
                
                <button
                  onClick={handleSaveRolePermissions}
                  disabled={savingPermissions}
                  className="btn"
                  style={{
                    fontWeight: 700,
                    padding: '0.6rem 1.25rem',
                    background: '#10B981',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <Save size={16} />
                  {savingPermissions ? 'Saving...' : 'Save Role Permissions'}
                </button>
              </div>
            </div>

            {/* Role Chips Bar */}
            <div className="permission-roles-flex">
              {rbacRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedMatrixRole(role)}
                  className={`permission-role-chip ${selectedMatrixRole === role ? 'active' : ''}`}
                >
                  <Shield size={14} />
                  {role}
                  <span style={{
                    fontSize: '0.72rem',
                    opacity: 0.85,
                    background: selectedMatrixRole === role ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    marginLeft: '4px'
                  }}>
                    {(rbacMappings[role] || []).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Role Meta Card */}
          <div className="permission-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                <Shield size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>{selectedMatrixRole} Role Governance</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  {(rbacMappings[selectedMatrixRole] || []).length} permissions currently enabled for {selectedMatrixRole} users
                </span>
              </div>
            </div>

            {/* Rule Callout Banner for Chairman */}
            {selectedMatrixRole === 'Chairman' && (
              <div className="permission-rule-banner">
                <AlertCircle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Client Specification:</strong> Chairman role has executive academic & result oversight, but financial module permissions (`finance.*` and `reports.finance`) are restricted by default.
                </div>
              </div>
            )}
          </div>

          {/* Modules Grid */}
          {matrixLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              Loading permission matrix configuration...
            </div>
          ) : (
            <div className="permission-modules-grid">
              {rbacModules.map(mod => {
                const moduleKeys = mod.permissions.map((p: any) => p.key);
                const activeRoleKeys = rbacMappings[selectedMatrixRole] || [];
                const isAllSelected = moduleKeys.every((k: string) => activeRoleKeys.includes(k));

                return (
                  <div key={mod.moduleId} className="permission-module-card">
                    {/* Header */}
                    <div className="permission-module-header">
                      <div className="permission-module-title">
                        <BookOpen size={17} style={{ color: '#000080' }} />
                        {mod.moduleName}
                      </div>

                      <button
                        onClick={() => handleBulkModuleToggle(selectedMatrixRole, moduleKeys, !isAllSelected)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: isAllSelected ? '#EF4444' : '#000080',
                          cursor: 'pointer'
                        }}
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {/* Permissions List */}
                    <div className="permission-items-list">
                      {mod.permissions.map((perm: any) => {
                        const isChecked = activeRoleKeys.includes(perm.key);

                        return (
                          <div key={perm.key} className="permission-item-row">
                            <div className="permission-item-info">
                              <div className="permission-item-name">
                                {perm.name}
                                <span className="permission-key-tag">{perm.key}</span>
                              </div>
                              <div className="permission-item-desc">{perm.description}</div>
                            </div>

                            <input
                              type="checkbox"
                              className="toggle-switch-input"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(selectedMatrixRole, perm.key)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAFF EMAIL CHANGE REQUESTS */}
      {activeTab === 'email-requests' && (
        <div className="role-card-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Staff Profile Email Change Requests</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>Review and approve staff email modifications submitted from profile settings</p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: statusFilter === st ? '#000080' : '#FFFFFF',
                    color: statusFilter === st ? '#FFFFFF' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="executive-role-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Old Email Address</th>
                  <th>New Email Address</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{r.staffName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.staffCode} ({r.staffRole})</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B' }}>{r.oldEmail}</td>
                    <td style={{ color: '#0F172A', fontWeight: 700 }}>{r.newEmail}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: r.status === 'Approved' ? '#DCFCE7' : r.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                        color: r.status === 'Approved' ? '#15803D' : r.status === 'Rejected' ? '#B91C1C' : '#B45309'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleApproveEmailRequest(r)}
                            disabled={processingId === r.id}
                            className="btn"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: '#10B981', color: '#FFFFFF', fontWeight: 700 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectEmailRequest(r)}
                            disabled={processingId === r.id}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: '#EF4444', borderColor: '#FECACA', fontWeight: 700 }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {customRoleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#000080',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Plus size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create Custom Role</h3>
              </div>
              <button
                onClick={() => setCustomRoleModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  ROLE TITLE <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VicePrincipal, Bursar, SchoolNurse"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                  ROLE DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this custom role is responsible for..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCustomRoleModalOpen(false)}
                  className="btn btn-outline"
                  disabled={creatingRole}
                  style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole || !newRoleName.trim()}
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
                  <Plus size={15} />
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT STAFF EMAIL EDIT MODAL */}
      {directEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)'
          }}>
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
                    padding: '0.75rem 0.85rem',
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
                      padding: '0.75rem 0.85rem',
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
