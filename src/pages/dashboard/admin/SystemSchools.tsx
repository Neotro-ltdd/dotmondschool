import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import './SystemSchools.css';
import { useDialog } from '../../../context/DialogContext';
import {
  Building2,
  GraduationCap,
  CheckCircle2,
  PlusCircle,
  Search,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Mail,
  Lock,
  HardDrive,
  Users,
  X,
  Sparkles,
} from 'lucide-react';

interface School {
  id: number;
  tenantId: string;
  schoolName: string;
  adminEmail?: string;
  directorEmail?: string;
  superAdminEmail?: string;
  isSuspended: boolean;
  createdAt: string;
  studentCount: number;
  sizeMB: number;
  customSenderName?: string;
  isSmsEnabled: boolean;
}

export default function SystemSchools() {
  const { showAlert } = useDialog();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // New School Provision Form State
  const [tenantId, setTenantId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin123!');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('SuperAdmin123!');
  const [provisioning, setProvisioning] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system/schools');
      setSchools(res || []);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load provisioned schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    try {
      await api.post('/system/provision-school', {
        tenantId,
        schoolName,
        adminEmail,
        adminPassword,
        superAdminEmail: superAdminEmail.trim() || undefined,
        superAdminPassword: superAdminPassword.trim() || undefined,
      });

      setShowModal(false);
      showAlert(`School tenant "${schoolName}" provisioned successfully!`);
      fetchSchools();
      setTenantId('');
      setSchoolName('');
      setAdminEmail('');
      setSuperAdminEmail('');
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to provision school');
    } finally {
      setProvisioning(false);
    }
  };

  const filteredSchools = (schools || []).filter(
    (s) =>
      s.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tenantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.superAdminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => !s.isSuspended).length;
  const totalStudents = schools.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);
  const totalStorageMB = schools.reduce((acc, curr) => acc + (curr.sizeMB || 0), 0);

  return (
    <div className="system-schools-container">
      {/* Banner / Page Header */}
      <div className="schools-header-banner">
        <div className="schools-banner-text">
          <h1>
            <Building2 size={28} style={{ color: '#38bdf8' }} />
            <span>Provisioned School Institutions</span>
          </h1>
          <p>Manage multi-tenant school databases, storage allocations, and SuperAdmin account credentials.</p>
        </div>
        <div className="schools-banner-actions">
          <button onClick={fetchSchools} className="btn-refresh" title="Refresh list">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary-action">
            <PlusCircle size={18} />
            <span>Provision New School</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics Row */}
      <div className="schools-quick-stats">
        <div className="stat-card-mini">
          <div className="stat-content">
            <h4>Total Institutions</h4>
            <p>{totalSchools}</p>
          </div>
          <div className="stat-icon">
            <Building2 size={20} />
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-content">
            <h4>Enrolled Students</h4>
            <p>{totalStudents.toLocaleString()}</p>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <GraduationCap size={20} />
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-content">
            <h4>Active Tenants</h4>
            <p style={{ color: '#34d399' }}>{activeSchools}</p>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-content">
            <h4>Storage Consumed</h4>
            <p>{totalStorageMB.toFixed(1)} MB</p>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <HardDrive size={20} />
          </div>
        </div>
      </div>

      {/* Filter / Search Controls Row */}
      <div className="schools-controls-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by school name, tenant ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Dark Glassmorphism Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>TENANT ID</th>
              <th>INSTITUTION NAME</th>
              <th>SUPERADMIN EMAIL</th>
              <th>STUDENTS</th>
              <th>STORAGE (MB)</th>
              <th>REGISTERED</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="schools-loading-state">
                    <div className="schools-loading-spinner" />
                    <span>Loading provisioned tenant records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredSchools.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  No provisioned school tenants found matching "{searchTerm}".
                </td>
              </tr>
            ) : (
              filteredSchools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <span className="tenant-code-badge">{school.tenantId}</span>
                  </td>
                  <td>
                    <div className="school-cell">
                      <div className="school-avatar">
                        {school.schoolName ? school.schoolName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <span className="school-name-text">{school.schoolName}</span>
                    </div>
                  </td>
                  <td>
                    {school.superAdminEmail ? (
                      <span className="superadmin-email-text">
                        <Mail size={13} />
                        {school.superAdminEmail}
                      </span>
                    ) : (
                      <span className="superadmin-not-set">Not Configured</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                      {school.studentCount || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                      {school.sizeMB?.toFixed(2) || '0.00'} MB
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {new Date(school.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${school.isSuspended ? 'suspended' : 'active'}`}>
                      <span className="tag-dot" />
                      {school.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/system-admin/schools/${school.tenantId}`)}
                      className="btn-manage-table"
                      title="Manage tenant details & subscription"
                    >
                      <Sliders size={14} />
                      <span>Manage & Edit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Scoped Dark Glassmorphism Provisioning Modal */}
      {showModal && (
        <div className="provision-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="provision-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="provision-modal-header">
              <div className="provision-header-title-wrap">
                <div className="provision-header-icon">
                  <PlusCircle size={22} />
                </div>
                <div className="provision-header-text">
                  <h2>Provision New School Tenant</h2>
                  <p>Setup tenant database schema & superadmin access credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-close-provision"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvision}>
              <div className="provision-form-group">
                <label>
                  <Sparkles size={14} />
                  Tenant ID (Short Code)
                </label>
                <input
                  type="text"
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="e.g. mps"
                />
              </div>

              <div className="provision-form-group">
                <label>
                  <Building2 size={14} />
                  Full School Name
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Modern Primary School"
                />
              </div>

              <div className="provision-form-group">
                <label>
                  <Mail size={14} />
                  Director / Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="director@mps.com"
                />
              </div>

              <div className="provision-form-group">
                <label>
                  <Lock size={14} />
                  Director / Admin Password
                </label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              <div className="provision-superadmin-box">
                <div className="superadmin-box-badge">
                  <ShieldCheck size={14} />
                  Developer SuperAdmin (Optional)
                </div>

                <div className="provision-form-group">
                  <label className="accent-label">
                    <Mail size={14} />
                    Developer SuperAdmin Email
                  </label>
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="superadmin@mps.com (Not in Staff table)"
                  />
                </div>

                <div className="provision-form-group" style={{ marginBottom: 0 }}>
                  <label className="accent-label">
                    <Lock size={14} />
                    Developer SuperAdmin Password
                  </label>
                  <input
                    type="text"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    placeholder="SuperAdmin123!"
                  />
                </div>
              </div>

              <div className="provision-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="btn-primary-action"
                  style={{ opacity: provisioning ? 0.6 : 1 }}
                >
                  <PlusCircle size={16} />
                  <span>{provisioning ? 'Provisioning School...' : 'Provision School'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
