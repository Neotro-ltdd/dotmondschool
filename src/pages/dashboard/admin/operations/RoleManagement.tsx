import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  email: string;
}

export default function RoleManagement() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [roleEmail, setRoleEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [managingRole, setManagingRole] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await api.get('/setup/teachers');
      setTeachers(data);
    } catch (err) {
      console.error("Failed to load teachers for role management", err);
    }
  };

  const handleManageRole = async (action: 'Assign' | 'Unassign') => {
    if (!roleEmail) {
      alert('Please select a teacher.');
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} the ${selectedRole} role for ${roleEmail}?`)) return;
    
    try {
      setManagingRole(true);
      const res = await api.post('/identity/manage-role', {
        email: roleEmail,
        roleName: selectedRole,
        action: action
      });
      alert(res.message || `Successfully ${action.toLowerCase()}ed role.`);
      setRoleEmail(''); // Clear email on success
    } catch (err: any) {
      alert(err.message || `Failed to ${action.toLowerCase()} role.`);
    } finally {
      setManagingRole(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-subtitle">Assign or unassign roles for users within the system.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>User Role Assignment</h2>
          <p style={{ marginBottom: '1.5rem' }}>Select a teacher and the role to assign or unassign.</p>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Select Teacher</label>
            <select 
              className="form-control" 
              value={roleEmail} 
              onChange={(e) => setRoleEmail(e.target.value)} 
            >
              <option value="">-- Choose a Teacher --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.email}>{`${t.surname} ${t.firstName} (${t.email})`}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Select Role</label>
            <select 
              className="form-control" 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Accountant">Accountant</option>
              <option value="Class Teacher">Class Teacher</option>
              <option value="Subject Teacher">Subject Teacher</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>
          
          <div className="action-row" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => handleManageRole('Assign')} disabled={managingRole}>
              {managingRole ? 'Processing...' : 'Assign Role'}
            </button>
            <button className="btn btn-outline" onClick={() => handleManageRole('Unassign')} disabled={managingRole} style={{ color: '#ff4136', borderColor: '#ff4136' }}>
              Unassign Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
