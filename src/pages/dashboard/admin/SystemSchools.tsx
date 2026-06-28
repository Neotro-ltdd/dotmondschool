import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './SystemSchools.css';

interface School {
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

export default function SystemSchools() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // New School Form
    const [tenantId, setTenantId] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('Admin123!');
    const [provisioning, setProvisioning] = useState(false);

    const fetchSchools = async () => {
        try {
            const res = await api.get('/system/schools');
            setSchools(res || []);
        } catch (err) {
            console.error(err);
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
                adminPassword
            });
            
            setShowModal(false);
            fetchSchools();
            setTenantId('');
            setSchoolName('');
            setAdminEmail('');
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to provision school");
        } finally {
            setProvisioning(false);
        }
    };

    return (
        <div className="system-schools-container">
            <div className="schools-header-actions" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Registered Schools</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="btn-primary">
                    + Provision New School
                </button>
            </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tenant ID</th>
                                <th>School Name</th>
                                <th>Students</th>
                                <th>Storage (MB)</th>
                                <th>Created</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                            ) : (schools || []).map(school => (
                                <tr key={school.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{school.tenantId}</td>
                                    <td style={{ fontWeight: 'bold' }}>{school.schoolName}</td>
                                    <td>{school.studentCount}</td>
                                    <td>{school.sizeMB?.toFixed(2) || '0.00'}</td>
                                    <td>{new Date(school.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${school.isSuspended ? 'suspended' : 'active'}`}>
                                            {school.isSuspended ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            onClick={() => navigate(`/system-admin/schools/${school.tenantId}`)}
                                            className="action-btn" style={{ background: '#0f172a', color: 'white' }}>
                                            ⚙️ Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Provision Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Provision New School</h2>
                            <form onSubmit={handleProvision}>
                                <div className="form-group">
                                    <label>Tenant ID (Short Code)</label>
                                    <input type="text" required value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="e.g. mps" />
                                </div>
                                <div className="form-group">
                                    <label>Full School Name</label>
                                    <input type="text" required value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="e.g. Modern Primary School" />
                                </div>
                                <div className="form-group">
                                    <label>Default Admin Email</label>
                                    <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@mps.com" />
                                </div>
                                <div className="form-group">
                                    <label>Default Admin Password</label>
                                    <input type="text" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={provisioning} className="btn-primary" style={{ opacity: provisioning ? 0.5 : 1 }}>
                                        {provisioning ? 'Provisioning...' : 'Provision School'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

        </div>
    );
}
