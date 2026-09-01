import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
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
  Sparkles,
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

  // Toast / Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
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
  const { data: branches = [], isLoading, isError } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/setup/branches');
      return res.data;
    },
  });

  // Create Branch Mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/setup/branches', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showNotification('Campus branch created successfully!', 'success');
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to create campus branch.', 'error');
    },
  });

  // Update Branch Mutation
  const updateMutation = useMutation({
    mutationFn: async (branch: Branch) => {
      const res = await api.put(`/setup/branches/${branch.id}`, branch);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showNotification('Campus details updated successfully!', 'success');
      setEditingBranch(null);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to update campus branch.', 'error');
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 text-sm font-semibold max-w-md animate-in slide-in-from-top-2 duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
            : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{notification.message}</span>
          <button 
            type="button"
            onClick={() => setNotification(null)} 
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Decorative Glow Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Branch Enterprise Setup
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Campus & Branch Management</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Configure school campuses, locations, campus addresses, and branch-specific setups under one unified tenant portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="relative z-10 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95 transition-all flex items-center gap-2 text-sm shrink-0 border border-blue-400/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Add New Campus
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Campuses</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{branches.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <Star className="w-7 h-7 fill-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Primary Campus</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-1">
              {mainBranch?.name || (branches.length > 0 ? branches[0].name : 'Not Configured')}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Status</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {branches.filter(b => b.isActive).length} Operational
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Registered School Campuses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Overview of all active and inactive branch locations for this school institution.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search campus name, code, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Content States */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading registered school campuses...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-inner">
              <Building2 className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {searchTerm ? 'No Campuses Match Your Search' : 'No School Campuses Added Yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {searchTerm 
                  ? `No branch records were found matching "${searchTerm}". Try clearing your search.`
                  : 'Add your primary campus and secondary branch locations to enable location-based fee setups, staff management, and student ID cards.'}
              </p>
            </div>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, isMainBranch: true, name: 'Main Campus' }));
                  setIsAddModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Primary Campus
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className={`relative bg-white dark:bg-slate-900/80 rounded-3xl p-6 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between ${
                  branch.isMainBranch
                    ? 'border-blue-500/60 shadow-blue-500/5 ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-700/80'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20 uppercase tracking-wider shrink-0">
                      {branch.code ? branch.code.substring(0, 3) : 'MAIN'}
                    </div>

                    <div className="flex items-center gap-2">
                      {branch.isMainBranch && (
                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          Primary Campus
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${
                        branch.isActive 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Campus Info */}
                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {branch.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Campus Code: <span className="font-mono bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">{branch.code || 'MAIN'}</span>
                    </p>
                  </div>

                  {/* Contact & Location Details */}
                  <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{branch.address || 'Address not specified'}</span>
                    </div>

                    {branch.phoneNumber && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">{branch.phoneNumber}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">{branch.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(branch)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD CAMPUS MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Add New School Campus</h3>
                  <p className="text-xs text-blue-200">Register a new branch or campus location</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Campus / Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annex Campus / Ikeja Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAIN, ANX, IKJ"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08012345678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Campus Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Full physical street address for this campus location..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Official Branch Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. branch@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="isMainBranch"
                  checked={formData.isMainBranch}
                  onChange={(e) => setFormData({ ...formData, isMainBranch: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="isMainBranch" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Primary School Campus
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMPUS MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Edit3 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Edit Campus Details</h3>
                  <p className="text-xs text-blue-200">Update information for {editingBranch.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Campus / Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingBranch.phoneNumber}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Campus Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Official Branch Email
                </label>
                <input
                  type="email"
                  value={editingBranch.email}
                  onChange={(e) => setEditingBranch({ ...editingBranch, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="editIsMainBranch"
                  checked={editingBranch.isMainBranch}
                  onChange={(e) => setEditingBranch({ ...editingBranch, isMainBranch: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="editIsMainBranch" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Primary School Campus
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
