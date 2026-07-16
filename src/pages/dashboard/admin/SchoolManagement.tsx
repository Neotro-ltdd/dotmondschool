import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import './SchoolManagement.css';
import { useDialog } from '../../../context/DialogContext';


interface SchoolDetail {
    id: number;
    tenantId: string;
    schoolName: string;
    isSuspended: boolean;
    createdAt: string;
    studentCount: number;
    sizeMB: number;
    customSenderName?: string;
    isSmsEnabled: boolean;
}

export default function SchoolManagement() {
  const { showAlert, showConfirm } = useDialog();

    const { id } = useParams<{ id: string }>(); // This will be the tenantId from the route
    const [school, setSchool] = useState<SchoolDetail | null>(null);
    const [loading, setLoading] = useState(true);
    
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
            setCustomSenderName(res.customSenderName || '');
            setIsSmsEnabled(res.isSmsEnabled ?? true);
        } catch (err) {
            console.error(err);
            showAlert("Failed to load school details");
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
            showAlert("Failed to toggle status");
        }
    };

    const handleSmsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school) return;
        setSavingSms(true);
        try {
            await api.put(`/system/schools/${school.id}/sms-config`, {
                customSenderName,
                isSmsEnabled
            });
            showAlert("Notification settings saved successfully.");
            fetchSchool();
        } catch (err: any) {
            console.error(err);
            showAlert(err.message || "Failed to update SMS config");
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
            showAlert("Failed to queue backup");
        }
    };

    const handleRestore = async () => {
        if (!school) return;
        if (!await showConfirm(`Are you sure you want to restore ${school.tenantId} from backup? This will overwrite active data.`)) return;
        try {
            await api.post(`/system/schemas/${school.tenantId}/restore`, {});
            showAlert(`Restore queued successfully for ${school.tenantId}.`);
        } catch (err) {
            console.error(err);
            showAlert("Failed to queue restore");
        }
    };

    const handleWipe = async () => {
        if (!school) return;
        const confirmWipe = await showConfirm(
            `⚠️ DANGER: Are you sure you want to wipe all active data for ${school.tenantId}? ` +
            `This is for testing purposes. Make sure you have a backup!`
        );
        if (!confirmWipe) return;

        try {
            await api.post(`/system/schemas/${school.tenantId}/wipe-data`, {});
            showAlert(`Data wiped successfully for ${school.tenantId}. You can now test the restore!`);
            fetchSchool();
        } catch (err) {
            console.error(err);
            showAlert("Failed to wipe data");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading school details...</div>;
    if (!school) return <div style={{ padding: '2rem' }}>School not found.</div>;

    // Calculate percentage of 10GB for progress bar (assuming 10GB limit)
    const dbLimitMB = 10240;
    const progressPercent = Math.min((school.sizeMB / dbLimitMB) * 100, 100);

    return (
        <div className="school-management-container">
            <Link to="/system-admin/schools" className="btn-back" style={{ marginBottom: '1.5rem' }}>
                ← Back to Schools
            </Link>

            <div className="school-management-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage platform settings and configurations for {school.schoolName}</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* Card 1: Platform Settings / Profile */}
                <div className="settings-card">
                    <div className="settings-card-header platform">
                        <div className="icon">⚙️</div>
                        <h3>School Profile</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Tenant ID</h4>
                                <p>{school.tenantId}</p>
                            </div>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Date Registered</h4>
                                <p>{new Date(school.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Active Students</h4>
                                <p>{school.studentCount} enrolled</p>
                            </div>
                        </div>
                        <div className="setting-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <div className="setting-info">
                                <h4>Account Status</h4>
                                <p>{school.isSuspended ? "Currently suspended. Users cannot log in." : "Active and fully operational."}</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={!school.isSuspended} 
                                    onChange={toggleStatus} 
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Card 2: Notification Settings */}
                <div className="settings-card">
                    <div className="settings-card-header notification">
                        <div className="icon">🔔</div>
                        <h3>Notification Settings</h3>
                    </div>
                    <div className="settings-card-body">
                        <form id="sms-form" onSubmit={handleSmsSave}>
                            <div className="form-group-vertical">
                                <label>Custom Sender Name</label>
                                <input 
                                    type="text" 
                                    value={customSenderName} 
                                    onChange={e => setCustomSenderName(e.target.value)} 
                                    placeholder="e.g. RMS-HIGH"
                                    maxLength={11}
                                />
                                <small>Max 11 characters. Appears as sender on parent's phone.</small>
                            </div>

                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Enable SMS Services</h4>
                                    <p>Allow this school to send outbound SMS</p>
                                </div>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={isSmsEnabled} 
                                        onChange={e => setIsSmsEnabled(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </form>
                    </div>
                    <div className="settings-card-footer">
                        <button type="submit" form="sms-form" disabled={savingSms} className="btn-save">
                            {savingSms ? 'Saving...' : 'Save Notification Settings'}
                        </button>
                    </div>
                </div>

                {/* Card 3: Database & Maintenance */}
                <div className="settings-card">
                    <div className="settings-card-header database">
                        <div className="icon">🗄️</div>
                        <h3>Database & Maintenance</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="db-progress-container">
                            <div className="db-progress-header">
                                <span>Database Size</span>
                                <small>{school.sizeMB.toFixed(2)} MB / 10 GB</small>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${Math.max(progressPercent, 1)}%` }}></div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button onClick={handleBackup} className="btn-outline-green">
                                Backup Database Now
                            </button>
                            <button onClick={handleRestore} className="btn-outline-red">
                                Restore from Backup
                            </button>
                            <button onClick={handleWipe} className="btn-outline-red" style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #ef4444' }}>
                                Wipe All Active Data (For Testing)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
