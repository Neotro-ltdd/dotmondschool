import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import './SchoolManagement.css';
import { useDialog } from '../../../context/DialogContext';
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Bell,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  Save,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Users,
  Mail,
  Lock,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface SchoolDetail {
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

export default function SchoolManagement() {
  const { showAlert, showConfirm } = useDialog();
  const { id } = useParams<{ id: string }>(); // tenantId from route

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // School Profile & SuperAdmin Credentials State
  const [schoolNameState, setSchoolNameState] = useState('');
  const [adminEmailState, setAdminEmailState] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [superAdminEmailState, setSuperAdminEmailState] = useState('');
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  // Notification Settings State
  const [customSenderName, setCustomSenderName] = useState('');
  const [isSmsEnabled, setIsSmsEnabled] = useState(true);
  const [savingSms, setSavingSms] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, [id]);

  const fetchSchool = async () => {
    try {
      const res = await api.get(`/system/schools/${id}`);
      setSchool(res);
      setSchoolNameState(res.schoolName || '');
      setAdminEmailState(res.adminEmail || res.directorEmail || '');
      setSuperAdminEmailState(res.superAdminEmail || '');
      setCustomSenderName(res.customSenderName || '');
      setIsSmsEnabled(res.isSmsEnabled ?? true);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!school) return;
    try {
      await api.post(`/system/schools/${school.id}/toggle-status`, {});
      fetchSchool();
    } catch (err) {
      console.error(err);
      showAlert('Failed to toggle status');
    }
  };

  const handleSchoolSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSavingSchool(true);
    try {
      await api.put(`/system/schools/${school.id}`, {
        schoolName: schoolNameState,
        adminEmail: adminEmailState,
        superAdminEmail: superAdminEmailState.trim() || null,
        newAdminPassword: newAdminPassword.trim() || undefined,
        newSuperAdminPassword: newSuperAdminPassword.trim() || undefined,
      });
      showAlert('School profile and SuperAdmin account updated successfully.');
      setNewAdminPassword('');
      setNewSuperAdminPassword('');
      fetchSchool();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to update school credentials');
    } finally {
      setSavingSchool(false);
    }
  };

  const handleSmsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSavingSms(true);
    try {
      await api.put(`/system/schools/${school.id}/sms-config`, {
        customSenderName,
        isSmsEnabled,
      });
      showAlert('Notification settings saved successfully.');
      fetchSchool();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Failed to update SMS config');
    } finally {
      setSavingSms(false);
    }
  };

  const handleBackup = async () => {
    if (!school) return;
    try {
      await api.post(`/system/schemas/${school.tenantId}/backup`, {});
      showAlert(`Backup queued successfully for ${school.tenantId}.`);
    } catch (err) {
      console.error(err);
      showAlert('Failed to queue backup');
    }
  };

  const handleRestore = async () => {
    if (!school) return;
    if (
      !(await showConfirm(
        `Are you sure you want to restore ${school.tenantId} from backup? This will overwrite active data.`,
      ))
    )
      return;
    try {
      await api.post(`/system/schemas/${school.tenantId}/restore`, {});
      showAlert(`Restore queued successfully for ${school.tenantId}.`);
    } catch (err) {
      console.error(err);
      showAlert('Failed to queue restore');
    }
  };

  const handleWipe = async () => {
    if (!school) return;
    const confirmWipe = await showConfirm(
      `⚠️ DANGER: Are you sure you want to wipe all active data for ${school.tenantId}? ` +
        `This is for testing purposes. Make sure you have a backup!`,
    );
    if (!confirmWipe) return;

    try {
      await api.post(`/system/schemas/${school.tenantId}/wipe-data`, {});
      showAlert(`Data wiped successfully for ${school.tenantId}. You can now test the restore!`);
      fetchSchool();
    } catch (err) {
      console.error(err);
      showAlert('Failed to wipe data');
    }
  };

  if (loading) {
    return (
      <div className="school-loading-state">
        <div className="school-loading-spinner" />
        <span>Loading Tenant Details & Subscription Config...</span>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="school-management-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Link to="/system-admin/schools" className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Registered Schools</span>
        </Link>
        <h2 style={{ color: '#ef4444', marginTop: '2rem' }}>School Tenant Not Found</h2>
        <p style={{ color: '#94a3b8' }}>The requested tenant ID could not be located in the platform registry.</p>
      </div>
    );
  }

  const dbLimitMB = 10240;
  const progressPercent = Math.min((school.sizeMB / dbLimitMB) * 100, 100);

  return (
    <div className="school-management-container">
      <Link to="/system-admin/schools" className="btn-back">
        <ArrowLeft size={16} />
        <span>Back to Registered Schools</span>
      </Link>

      <div className="school-management-header">
        <div className="school-header-main">
          <div className="school-avatar-icon">
            {school.schoolName ? school.schoolName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="school-title-group">
            <h1>
              <span>{school.schoolName}</span>
              <span className="tenant-pill-badge">{school.tenantId}</span>
              <span className={`status-badge-pill ${school.isSuspended ? 'suspended' : 'active'}`}>
                <span className="status-dot" />
                {school.isSuspended ? 'Suspended' : 'Active'}
              </span>
            </h1>
            <p>Manage platform settings, superadmin access, notifications, and schema database operations.</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Card 1: School Profile & Status */}
        <div className="settings-card">
          <div className="settings-card-header platform">
            <div className="icon-wrap">
              <Building2 size={20} />
            </div>
            <div className="settings-card-header-text">
              <h3>School Status & Operational Info</h3>
              <p>Tenant registration details & system access state</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div>
                <div className="setting-info-label">
                  <Sparkles size={14} />
                  Tenant ID
                </div>
                <p className="setting-info-value" style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                  {school.tenantId}
                </p>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-info-label">
                  <Calendar size={14} />
                  Date Registered
                </div>
                <p className="setting-info-value">
                  {new Date(school.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-info-label">
                  <Users size={14} />
                  Active Enrolled Students
                </div>
                <p className="setting-info-value">{school.studentCount} Students Enrolled</p>
              </div>
            </div>

            <div className="setting-row" style={{ marginTop: '0.75rem', paddingTop: '1rem' }}>
              <div>
                <div className="setting-info-label">
                  <ShieldCheck size={14} />
                  Account Access Status
                </div>
                <p className="setting-info-value">
                  {school.isSuspended ? 'Suspended' : 'Active & Operational'}
                </p>
                <p className="setting-info-subtext">
                  {school.isSuspended
                    ? 'Currently suspended. Users cannot log in or access tenant portal.'
                    : 'Active and fully operational across all features.'}
                </p>
              </div>
              <label className="switch" title="Toggle Tenant Account Status">
                <input type="checkbox" checked={!school.isSuspended} onChange={toggleStatus} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Edit School Credentials & SuperAdmin Setup */}
        <div className="settings-card">
          <div className="settings-card-header account">
            <div className="icon-wrap">
              <KeyRound size={20} />
            </div>
            <div className="settings-card-header-text">
              <h3>School & SuperAdmin Account</h3>
              <p>Configure institution profile & platform credentials</p>
            </div>
          </div>
          <div className="settings-card-body">
            <form id="school-credentials-form" onSubmit={handleSchoolSave}>
              <div className="form-group-vertical">
                <label>
                  <Building2 size={14} />
                  Full School Name
                </label>
                <input
                  type="text"
                  required
                  value={schoolNameState}
                  onChange={(e) => setSchoolNameState(e.target.value)}
                  placeholder="e.g. Dotmond School"
                />
              </div>

              <div className="form-group-vertical">
                <label>
                  <Mail size={14} />
                  Director / Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmailState}
                  onChange={(e) => setAdminEmailState(e.target.value)}
                  placeholder="director@school.com"
                />
              </div>

              <div className="form-group-vertical">
                <label>
                  <Lock size={14} />
                  Reset Director Password (Optional)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="superadmin-section-divider">
                <div className="form-group-vertical">
                  <label className="accent-label">
                    <ShieldCheck size={14} />
                    Developer SuperAdmin Email
                  </label>
                  <input
                    type="email"
                    value={superAdminEmailState}
                    onChange={(e) => setSuperAdminEmailState(e.target.value)}
                    placeholder="superadmin@dotmond.sch.ng (Saved in System DB)"
                  />
                  <div className="superadmin-badge-note">
                    Saved in System DB (dbo). Hidden from school Staff table.
                  </div>
                </div>

                <div className="form-group-vertical" style={{ marginTop: '1rem' }}>
                  <label className="accent-label">
                    <Lock size={14} />
                    Set / Reset SuperAdmin Password
                  </label>
                  <input
                    type="password"
                    value={newSuperAdminPassword}
                    onChange={(e) => setNewSuperAdminPassword(e.target.value)}
                    placeholder="Leave blank to keep current (Default: SuperAdmin123!)"
                  />
                </div>
              </div>
            </form>
          </div>
          <div className="settings-card-footer">
            <button
              type="submit"
              form="school-credentials-form"
              disabled={savingSchool}
              className="btn-save"
            >
              <Save size={16} />
              <span>{savingSchool ? 'Saving Credentials...' : 'Save Credentials & SuperAdmin Account'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Notification Settings */}
        <div className="settings-card">
          <div className="settings-card-header notification">
            <div className="icon-wrap">
              <Bell size={20} />
            </div>
            <div className="settings-card-header-text">
              <h3>Notification Settings</h3>
              <p>Outbound SMS gateway and custom sender identity</p>
            </div>
          </div>
          <div className="settings-card-body">
            <form id="sms-form" onSubmit={handleSmsSave}>
              <div className="form-group-vertical">
                <label>
                  <Smartphone size={14} />
                  Custom SMS Sender Name
                </label>
                <input
                  type="text"
                  value={customSenderName}
                  onChange={(e) => setCustomSenderName(e.target.value)}
                  placeholder="e.g. RMS-HIGH"
                  maxLength={11}
                />
                <small>Max 11 characters. Appears as SMS sender ID on parent mobile devices.</small>
              </div>

              <div className="setting-row" style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                <div>
                  <div className="setting-info-label">
                    <Bell size={14} />
                    Enable Outbound SMS Services
                  </div>
                  <p className="setting-info-subtext">
                    Allow this school tenant to send automated outbound SMS notifications to parents and staff.
                  </p>
                </div>
                <label className="switch" title="Toggle Outbound SMS">
                  <input
                    type="checkbox"
                    checked={isSmsEnabled}
                    onChange={(e) => setIsSmsEnabled(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </form>
          </div>
          <div className="settings-card-footer">
            <button type="submit" form="sms-form" disabled={savingSms} className="btn-save">
              <Save size={16} />
              <span>{savingSms ? 'Saving Configuration...' : 'Save Notification Settings'}</span>
            </button>
          </div>
        </div>

        {/* Card 4: Database & Maintenance */}
        <div className="settings-card">
          <div className="settings-card-header database">
            <div className="icon-wrap">
              <HardDrive size={20} />
            </div>
            <div className="settings-card-header-text">
              <h3>Database & Schema Maintenance</h3>
              <p>Tenant storage metrics, backups & disaster recovery</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="db-progress-container">
              <div className="db-progress-header">
                <span>
                  <HardDrive size={14} />
                  Database Size Usage
                </span>
                <small>{school.sizeMB.toFixed(2)} MB / 10 GB</small>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.max(progressPercent, 1)}%` }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Allocated Storage</small>
                <small style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                  {progressPercent.toFixed(1)}% Used
                </small>
              </div>
            </div>

            <div className="maintenance-actions-grid">
              <button onClick={handleBackup} className="btn-maint btn-maint-backup">
                <RotateCcw size={16} />
                <span>Backup Database Now</span>
              </button>

              <button onClick={handleRestore} className="btn-maint btn-maint-restore">
                <ShieldAlert size={16} />
                <span>Restore from Backup</span>
              </button>

              <button onClick={handleWipe} className="btn-maint btn-maint-danger">
                <AlertTriangle size={16} />
                <span>Wipe All Active Data (Testing Mode)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
