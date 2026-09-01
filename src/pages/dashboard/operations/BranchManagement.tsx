import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import './BranchManagement.css';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  Search, 
  X, 
  Loader2,
  Building,
  AlertCircle
} from 'lucide-react';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phoneNumber: string;
  email: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: string;
}

export const BranchManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phoneNumber: '',
    email: '',
    isMainBranch: false,
  });

  // Fetch Branches
  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/setup/branches');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    },
  });

  // Create Branch Mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/setup/branches', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showNotification('Campus branch created successfully!', 'success');
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showNotification(err.message || err.response?.data?.message || 'Failed to create campus branch.', 'error');
    },
  });

  // Update Branch Mutation
  const updateMutation = useMutation({
    mutationFn: async (branch: Branch) => {
      const res = await api.put(`/setup/branches/${branch.id}`, branch);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showNotification('Campus details updated successfully!', 'success');
      setEditingBranch(null);
    },
    onError: (err: any) => {
      showNotification(err.message || err.response?.data?.message || 'Failed to update campus branch.', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phoneNumber: '',
      email: '',
      isMainBranch: false,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('Campus name is required.', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name.trim()) {
      showNotification('Campus name is required.', 'error');
      return;
    }
    updateMutation.mutate(editingBranch);
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const mainBranch = branches.find(b => b.isMainBranch);

  return (
    <div className="branch-page-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', marginLeft: '0.5rem' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="branch-page-header">
        <div>
          <h1 className="branch-page-title">Campus & Branch Management</h1>
          <p className="branch-page-subtitle">Manage multiple school campuses, locations, addresses, and branch setups under one unified system.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="btn-primary-action"
        >
          <Plus size={16} />
          Add New Campus
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="branch-metrics-grid">
        <div className="branch-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Campuses</span>
            <span className="metric-number">{branches.length}</span>
          </div>
          <div className="metric-icon-badge total">
            <Building size={24} />
          </div>
        </div>

        <div className="branch-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Primary Campus</span>
            <span className="metric-number" style={{ fontSize: '1.25rem', marginTop: '0.35rem' }}>
              {mainBranch?.name || (branches.length > 0 ? branches[0].name : 'Main Campus')}
            </span>
          </div>
          <div className="metric-icon-badge primary">
            <Star size={24} />
          </div>
        </div>

        <div className="branch-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Status</span>
            <span className="metric-number" style={{ color: '#047857' }}>
              {branches.filter(b => b.isActive).length} Active
            </span>
          </div>
          <div className="metric-icon-badge active">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="branch-main-card">
        <div className="card-header-bar">
          <div className="card-title-box">
            <h2 className="card-title">Registered School Campuses</h2>
            <p className="card-subtitle">Overview of all active and inactive branch locations for this school institution.</p>
          </div>

          <div className="branch-search-input">
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search campus name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={20} className="animate-spin" />
            <span>Loading registered school campuses...</span>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <Building2 size={42} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {searchTerm ? 'No Campuses Match Your Search' : 'No School Campuses Added Yet'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
              {searchTerm 
                ? `No branch records were found matching "${searchTerm}".`
                : 'Click "+ Add New Campus" above to configure your primary campus and satellite locations.'}
            </p>
          </div>
        ) : (
          <div className="branch-grid-container">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className={`campus-item-card ${branch.isMainBranch ? 'is-main' : ''}`}
              >
                {branch.isMainBranch && (
                  <div className="campus-badge-main">
                    <Star size={12} fill="#B45309" />
                    Primary Campus
                  </div>
                )}

                <div className="campus-card-header">
                  <div className="campus-code-box">
                    {branch.code ? branch.code.substring(0, 3) : 'SCH'}
                  </div>
                  <div className="campus-title-area">
                    <h3 className="campus-name">{branch.name}</h3>
                    <span className="campus-code-sub">Code: {branch.code || 'MAIN'}</span>
                  </div>
                </div>

                <div className="campus-detail-list">
                  <div className="campus-detail-row">
                    <MapPin size={15} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{branch.address || 'Address not specified'}</span>
                  </div>

                  {branch.phoneNumber && (
                    <div className="campus-detail-row">
                      <Phone size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span>{branch.phoneNumber}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="campus-detail-row">
                      <Mail size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span>{branch.email}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    background: branch.isActive ? '#ECFDF5' : '#F1F5F9',
                    color: branch.isActive ? '#047857' : '#64748B'
                  }}>
                    {branch.isActive ? 'Active Campus' : 'Inactive'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingBranch(branch)}
                    className="btn-cancel"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <Edit3 size={13} style={{ marginRight: '4px' }} /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD CAMPUS MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3>Add New School Campus</h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-body">
              <div className="form-group">
                <label>Campus / Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Campus / Ikeja Annex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MAIN, IKJ"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="form-control-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 08012345678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="form-control-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Campus Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Physical street address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div className="form-group">
                <label>Official Branch Email</label>
                <input
                  type="email"
                  placeholder="e.g. branch@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <input
                  type="checkbox"
                  id="isMainBranch"
                  checked={formData.isMainBranch}
                  onChange={(e) => setFormData({ ...formData, isMainBranch: e.target.checked })}
                />
                <label htmlFor="isMainBranch" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer', textTransform: 'none' }}>
                  Set as Primary School Campus
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-submit"
                >
                  {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMPUS MODAL */}
      {editingBranch && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-header">
              <h3>Edit Campus Details</h3>
              <button 
                type="button"
                onClick={() => setEditingBranch(null)}
                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="modal-body">
              <div className="form-group">
                <label>Campus / Branch Name *</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Branch Code</label>
                  <input
                    type="text"
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                    className="form-control-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={editingBranch.phoneNumber}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phoneNumber: e.target.value })}
                    className="form-control-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Campus Address *</label>
                <textarea
                  rows={2}
                  required
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div className="form-group">
                <label>Official Branch Email</label>
                <input
                  type="email"
                  value={editingBranch.email}
                  onChange={(e) => setEditingBranch({ ...editingBranch, email: e.target.value })}
                  className="form-control-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <input
                  type="checkbox"
                  id="editIsMainBranch"
                  checked={editingBranch.isMainBranch}
                  onChange={(e) => setEditingBranch({ ...editingBranch, isMainBranch: e.target.checked })}
                />
                <label htmlFor="editIsMainBranch" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', cursor: 'pointer', textTransform: 'none' }}>
                  Set as Primary School Campus
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-submit"
                >
                  {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
