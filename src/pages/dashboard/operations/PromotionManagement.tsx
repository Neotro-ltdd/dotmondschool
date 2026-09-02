import React, { useState } from 'react';
import { api } from '../../../services/api';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GraduationCap, 
  Users, 
  ArrowRightCircle, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  X,
  Search,
  Filter,
  Download,
  Edit3,
  RotateCcw,
  Eye,
  History,
  ShieldAlert,
  PlayCircle,
  LayoutGrid,
  List,
  BookOpen,
  Calendar,
  Percent,
  ChevronRight,
  UserCheck,
  UserX,
  Award,
  Trash2
} from 'lucide-react';
import { SlideNotification } from '../../../components/ui/SlideNotification';
import { useDialog } from '../../../context/DialogContext';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './PromotionManagement.css';

interface ClassItem {
  id: string;
  name: string;
  level: string;
}

interface StudentRecord {
  recommendationId: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  annualAverage: number;
  systemRecommendation: string;
  finalDecision: string;
  hasOverride: boolean;
  overrideDetails?: {
    principal: string;
    reason: string;
    date: string;
  };
}

interface ReportData {
  batchId?: string;
  class: string;
  nextClass: string;
  session: string;
  status: string;
  dateCreated: string;
  summary: {
    totalStudents: number;
    promotableCount: number;
    heldBackCount: number;
    graduatingCount: number;
    overridesCount: number;
  };
  records: StudentRecord[];
}

import { useAuth } from '../../../context/AuthContext';

export default function PromotionManagement() {
  const { userRole } = useAuth();
  const isReadOnly = userRole === 'Chairman';
  const queryClient = useQueryClient();
  const { showConfirm } = useDialog();
  const year = new Date().getFullYear();
  
  // Tab & View States
  const [activeTab, setActiveTab] = useState<'promotion' | 'report' | 'history'>('promotion');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Notification Toast State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', title?: string, action?: { label: string; onClick: () => void }) => {
    setNotification({ isOpen: true, message, type, title, action });
  };

  // --- CLASS PROMOTION STATE ---
  const [selectedClassId, setSelectedClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const { session: nextSession, setSession: setNextSession } = useActiveTerm();
  const [minScore, setMinScore] = useState<number>(50);
  const [batchId, setBatchId] = useState<string | null>(null);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRecId, setOverrideRecId] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('Promotable');
  const [overrideReason, setOverrideReason] = useState('');
  const [promoSearchQuery, setPromoSearchQuery] = useState('');

  // --- PROMOTION REPORT STATE ---
  const [reportClassId, setReportClassId] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // 1. Fetch Classes using React Query
  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/setup/classes');
      return res;
    }
  });

  // 2. Fetch Report (By Batch ID for Class Promotion Tab)
  const { data: batchReport, isLoading: batchReportLoading } = useQuery<ReportData>({
    queryKey: ['promotionReport', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const res = await api.get(`/reports/academics/promotions/${batchId}`);
      return res;
    },
    enabled: !!batchId && activeTab === 'promotion',
  });

  // 3. Fetch Report (By Class ID for Promotion Report Tab)
  const { data: classReport, isLoading: classReportLoading } = useQuery<ReportData>({
    queryKey: ['promotionReportByClass', reportClassId],
    queryFn: async () => {
      if (!reportClassId) return null;
      try {
        const res = await api.get(`/reports/academics/promotions/class/${reportClassId}/latest`);
        return res;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!reportClassId && activeTab === 'report',
    retry: false
  });

  // 4. Fetch All Promotion Batches for Approved & Historical Lists Tab
  const { data: promotionBatches = [], isLoading: batchesLoading } = useQuery<any[]>({
    queryKey: ['allPromotionBatches'],
    queryFn: async () => {
      return await api.get('/academics/promotion/batches');
    },
    enabled: activeTab === 'history',
  });

  // Mutations
  const generateBatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/generate', payload);
    },
    onSuccess: (data) => {
      if (data.batchId) {
        setBatchId(data.batchId);
        showNotification('Promotion evaluation generated successfully! Review student decisions below.', 'success', 'List Generated');
      }
    },
    onError: (err: any) => {
      const errMsg = err.message || 'Failed to generate promotion list.';
      if (errMsg.toLowerCase().includes('already approved') || errMsg.toLowerCase().includes('already exists')) {
        showNotification(
          errMsg,
          'warning',
          'Promotion Already Executed',
          {
            label: 'View Approved Batches',
            onClick: () => setActiveTab('history')
          }
        );
      } else {
        showNotification(errMsg, 'error', 'Generation Error');
      }
    }
  });

  const approveBatchMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/academics/promotion/approve', { batchId });
    },
    onSuccess: () => {
      showNotification('Promotions executed successfully! Students have been transitioned to their target classes.', 'success', 'Execution Complete');
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to approve promotions.', 'error', 'Approval Error');
    }
  });

  const revertBatchMutation = useMutation({
    mutationFn: async (targetId?: string) => {
      const idToUse = targetId || batchId;
      if (!idToUse) throw new Error('No promotion list selected.');
      return await api.post('/academics/promotion/revert', { batchId: idToUse });
    },
    onSuccess: () => {
      showNotification('Promotion batch successfully revoked & unlocked! You can now edit student decisions or regenerate.', 'success', 'Batch Unlocked');
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to unlock promotion batch.', 'error', 'Revert Error');
    }
  });

  const overrideMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/override', payload);
    },
    onSuccess: () => {
      setShowOverrideModal(false);
      showNotification('Student promotion decision updated successfully.', 'success', 'Status Overridden');
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to override student decision.', 'error', 'Update Error');
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async (targetBatchId: string) => {
      return await api.delete(`/academics/promotion/batch/${targetBatchId}`);
    },
    onSuccess: () => {
      showNotification('Promotion batch deleted successfully.', 'success', 'Batch Deleted');
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['promotionReport'] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to delete promotion batch.', 'error', 'Delete Error');
    }
  });

  const handleCurrentClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (!newClassId) {
      setTargetClassId('');
      return;
    }
    const currentClass = classes.find(c => c.id === newClassId);
    if (currentClass) {
      if (targetClassId === newClassId) {
        setTargetClassId('');
      }
      const name = currentClass.name.trim();
      const match = name.match(/(\d+)/);
      if (match) {
        const currentNum = parseInt(match[0], 10);
        const nextNum = currentNum + 1;
        const predictedName = name.replace(String(currentNum), String(nextNum)).toLowerCase();
        const nextClass = classes.find(c => c.name.trim().toLowerCase() === predictedName);
        if (nextClass && nextClass.id !== newClassId) {
          setTargetClassId(nextClass.id);
          return;
        }
      }
      if (targetClassId === newClassId) {
        setTargetClassId('');
      }
    }
  };

  const handleGenerateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !nextSession) {
      showNotification('Please select a current class and specify the target academic session.', 'warning', 'Missing Selection');
      return;
    }
    if (targetClassId && selectedClassId === targetClassId) {
      showNotification('Target class cannot be identical to current class! Promoting a student to their current class is logically invalid.', 'error', 'Invalid Target Class');
      return;
    }
    generateBatchMutation.mutate({
      classId: selectedClassId,
      nextClassId: targetClassId || null,
      session: nextSession,
      minimumPromotionScore: minScore
    });
  };

  const handleApprove = async () => {
    if (!batchId) return;
    const confirmed = await showConfirm(
      'Are you sure you want to approve and execute these promotions? This action is permanent and will transition students to their target classes.',
      {
        title: 'Confirm Promotion Execution',
        type: 'warning',
        confirmText: 'Execute Promotions',
        cancelText: 'Cancel'
      }
    );
    if (confirmed) {
      approveBatchMutation.mutate();
    }
  };

  const openOverrideModal = (recId: string, currentDecision: string) => {
    setOverrideRecId(recId);
    const defaultTargetDecision = (currentDecision === 'Held Back' || currentDecision === 'Repeat') ? 'Promotable' : 'Held Back';
    setOverrideDecision(defaultTargetDecision);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showNotification('Please provide an explicit reason note for overriding this decision for audit logs.', 'warning', 'Reason Required');
      return;
    }
    overrideMutation.mutate({
      recommendationId: overrideRecId,
      newDecision: overrideDecision,
      reasonNote: overrideReason
    });
  };

  const exportToCSV = (records: StudentRecord[], className: string) => {
    if (!records || records.length === 0) return;
    const headers = ['S/N', 'Student Name', 'Registration Number', 'Annual Average (%)', 'System Recommendation', 'Final Decision'];
    const rows = records.map((r, i) => [
      i + 1,
      `"${r.studentName}"`,
      `"${r.registrationNumber}"`,
      `${r.annualAverage.toFixed(2)}%`,
      `"${r.systemRecommendation}"`,
      `"${r.finalDecision}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${className}_Promotion_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStudentInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Filtering for Class Promotion Tab
  const promoFilteredRecords = batchReport?.records.filter(r => 
    r.studentName.toLowerCase().includes(promoSearchQuery.toLowerCase()) || 
    r.registrationNumber.toLowerCase().includes(promoSearchQuery.toLowerCase())
  );

  // Filtering for Promotion Report Tab
  const reportFilteredRecords = classReport?.records.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(reportSearchQuery.toLowerCase()) || r.registrationNumber.toLowerCase().includes(reportSearchQuery.toLowerCase());
    const matchesStatus = reportStatusFilter === 'All' || r.finalDecision === reportStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="promo-page-container">
      <SlideNotification 
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        action={notification.action}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Page Header */}
      <div className="promo-page-header">
        <div>
          <h1 className="promo-page-title">
            <GraduationCap size={28} color="var(--primary-color, #000080)" />
            Student Promotion Management
          </h1>
          <p className="promo-page-subtitle">Configure grade thresholds, generate class transition rosters, review overrides, and execute annual promotions</p>
        </div>

        {activeTab === 'promotion' && batchReport && (
          <button className="btn-execute-promo-header" onClick={handleApprove} disabled={approveBatchMutation.isPending}>
            <CheckCircle size={18} />
            {approveBatchMutation.isPending ? 'Executing...' : 'Execute & Approve Batch'}
          </button>
        )}

        {activeTab === 'report' && classReport && (
          <button className="btn-execute-promo-header" onClick={() => exportToCSV(reportFilteredRecords || [], classReport.class)}>
            <Download size={18} />
            Export CSV Report
          </button>
        )}
      </div>

      {/* Metric Cards Banner (Matching Reference 4-Card Blueprint) */}
      <div className="promo-metrics-grid">
        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">PROMOTED STUDENTS</span>
            <span className="metric-number">
              {batchReport?.summary.promotableCount ?? classReport?.summary.promotableCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge promoted">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">GRADUATING SENIORS</span>
            <span className="metric-number">
              {batchReport?.summary.graduatingCount ?? classReport?.summary.graduatingCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge graduated">
            <Award size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">HELD BACK / REVIEW</span>
            <span className="metric-number" style={{ color: '#B45309' }}>
              {batchReport?.summary.heldBackCount ?? classReport?.summary.heldBackCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge heldback">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">EXECUTIVE OVERRIDES</span>
            <span className="metric-number" style={{ color: '#6B21A8' }}>
              {batchReport?.summary.overridesCount ?? classReport?.summary.overridesCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge overrides">
            <Edit3 size={22} />
          </div>
        </div>
      </div>

      {/* Top Executive Navigation Tabs */}
      <div className="promo-tabs-container">
        <button 
          className={`promo-tab-btn ${activeTab === 'promotion' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotion')}
        >
          <PlayCircle size={17} /> Class Promotion (Execute)
        </button>
        <button 
          className={`promo-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <FileText size={17} /> Promotion Report (View & Export)
        </button>
        <button 
          className={`promo-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={17} /> Approved Promotions (Revoke & Revert)
        </button>
      </div>

      {/* =========================================
          TAB 1: CLASS PROMOTION (EXECUTE)
          ========================================= */}
      {activeTab === 'promotion' && (
        <div className="promo-tab-content">
          {/* Executive Form Controls Card */}
          <div className="promo-controls-card">
            <div className="promo-controls-header">
              <div className="promo-controls-title">
                <BookOpen size={18} color="var(--primary-color, #000080)" />
                <span>Promotion Parameters & Transition Configuration</span>
              </div>
              <span className="promo-controls-badge">Step 1 of 2</span>
            </div>

            <form onSubmit={handleGenerateList} className="promo-form-grid">
              <div className="promo-form-group">
                <label>Current Class *</label>
                <div className="promo-input-wrapper">
                  <BookOpen className="field-icon" size={16} />
                  <select className="promo-select-input" value={selectedClassId} onChange={e => handleCurrentClassChange(e.target.value)} required>
                    <option value="">Select Current Class...</option>
                    {!classesLoading && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Target Academic Session *</label>
                <div className="promo-input-wrapper">
                  <Calendar className="field-icon" size={16} />
                  <select className="promo-select-input" value={nextSession} onChange={e => setNextSession(e.target.value)} required>
                    {getSessionOptions(nextSession).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Target Class (Destination)</label>
                <div className="promo-input-wrapper">
                  <GraduationCap className="field-icon" size={16} />
                  <select className="promo-select-input" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                    <option value="">-- Graduating Class (Leave Empty if Graduating) --</option>
                    {!classesLoading && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="promo-form-group" style={{ maxWidth: '160px' }}>
                <label>Pass Score (%) *</label>
                <div className="promo-input-wrapper">
                  <Percent className="field-icon" size={16} />
                  <input 
                    type="number" 
                    className="promo-select-input" 
                    value={minScore} 
                    onChange={e => setMinScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    required
                  />
                </div>
              </div>

              <button className="btn-generate-promo" type="submit" disabled={generateBatchMutation.isPending}>
                <ArrowRightCircle size={18} />
                {generateBatchMutation.isPending ? 'Generating Roster...' : 'Generate Promotion List'}
              </button>
            </form>
          </div>

          {/* Promotion Candidate List Table & Cards Container */}
          {batchReportLoading ? (
            <div className="promo-table-wrapper loading-box">
              <div className="spinner" />
              <span>Evaluating annual scores and generating candidate recommendations...</span>
            </div>
          ) : batchReport ? (
            <div className="promo-table-wrapper">
              <div className="promo-table-toolbar">
                <div>
                  <h3 className="promo-table-title">
                    Promotion Candidate List — {batchReport.class} <ChevronRight size={16} inline-block /> {batchReport.nextClass || 'Graduating Class'}
                  </h3>
                  <span className="promo-table-subtitle">
                    Generated on {new Date(batchReport.dateCreated).toLocaleDateString()} • Session {batchReport.session}
                  </span>
                </div>

                <div className="promo-toolbar-actions">
                  <div className="promo-search-box">
                    <Search className="promo-search-icon" size={15} />
                    <input 
                      type="text" 
                      placeholder="Search student name or reg..."
                      value={promoSearchQuery}
                      onChange={e => setPromoSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* View Toggle matching reference design */}
                  <div className="promo-view-toggle">
                    <button 
                      className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <List size={15} /> Table View
                    </button>
                    <button 
                      className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid Cards"
                    >
                      <LayoutGrid size={15} /> Grid Cards
                    </button>
                  </div>

                  {!isReadOnly && (
                    <button className="btn-save-grading" onClick={handleApprove} disabled={approveBatchMutation.isPending}>
                      <CheckCircle size={18} />
                      {approveBatchMutation.isPending ? 'Executing...' : 'Execute & Approve Promotions'}
                    </button>
                  )}
                </div>
              </div>

              {viewMode === 'table' ? (
                <table className="executive-promo-table">
                  <thead>
                    <tr>
                      <th>STUDENT NAME</th>
                      <th>REGISTRATION NO.</th>
                      <th>ANNUAL AVERAGE</th>
                      <th>SYSTEM RECOMMENDATION</th>
                      <th>FINAL DECISION</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoFilteredRecords && promoFilteredRecords.length > 0 ? (
                      promoFilteredRecords.map(rec => (
                        <tr key={rec.recommendationId}>
                          <td>
                            <div className="teacher-profile-cell">
                              <div className="teacher-avatar">
                                {getStudentInitials(rec.studentName)}
                              </div>
                              <div className="student-info-col">
                                <span className="teacher-name-title">{rec.studentName}</span>
                                {rec.hasOverride && <span className="override-badge-sub">Overridden</span>}
                              </div>
                            </div>
                          </td>
                          <td><span className="reg-badge">{rec.registrationNumber}</span></td>
                          <td>
                            <div className="score-pill-box">
                              <span className={`score-badge ${rec.annualAverage >= minScore ? 'pass' : 'fail'}`}>
                                {rec.annualAverage.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${rec.systemRecommendation === 'Promotable' ? 'active' : rec.systemRecommendation === 'Graduating' ? 'info' : 'inactive'}`}>
                              {rec.systemRecommendation}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : rec.finalDecision === 'Graduating' ? 'info' : 'inactive'}`}>
                              {rec.finalDecision}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-action-override"
                              onClick={() => openOverrideModal(rec.recommendationId || rec.studentId, rec.finalDecision)}
                            >
                              <Edit3 size={14} />
                              Override
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          No matching student records found for "{promoSearchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="promo-grid-wrapper">
                  {promoFilteredRecords && promoFilteredRecords.length > 0 ? (
                    promoFilteredRecords.map(rec => (
                      <div className="promo-grid-card" key={rec.recommendationId}>
                        <div className="card-top-header">
                          <div className="teacher-avatar">
                            {getStudentInitials(rec.studentName)}
                          </div>
                          <div>
                            <span className="card-student-name">{rec.studentName}</span>
                            <span className="card-reg-no">{rec.registrationNumber}</span>
                          </div>
                        </div>

                        <div className="card-metrics-row">
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Annual Avg</span>
                            <span className={`score-badge ${rec.annualAverage >= minScore ? 'pass' : 'fail'}`}>
                              {rec.annualAverage.toFixed(2)}%
                            </span>
                          </div>

                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Final Decision</span>
                            <span className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : 'inactive'}`}>
                              {rec.finalDecision}
                            </span>
                          </div>
                        </div>

                        <div className="card-footer-actions">
                          <span className="system-rec-lbl">System: {rec.systemRecommendation}</span>
                          <button 
                            className="btn-action-override"
                            onClick={() => openOverrideModal(rec.recommendationId || rec.studentId, rec.finalDecision)}
                          >
                            <Edit3 size={14} /> Override
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-grid-box">No matching student records found.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="promo-empty-placeholder">
              <div className="empty-icon-circle">
                <GraduationCap size={36} color="var(--primary-color, #000080)" />
              </div>
              <h3>No Promotion Batch Selected</h3>
              <p>Select a current class above and click <strong>Generate Promotion List</strong> to initiate student transition evaluations.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 2: PROMOTION REPORT (VIEW & EXPORT)
          ========================================= */}
      {activeTab === 'report' && (
        <div className="promo-tab-content">
          <div className="promo-controls-card">
            <div className="promo-controls-header">
              <div className="promo-controls-title">
                <FileText size={18} color="var(--primary-color, #000080)" />
                <span>Class Promotion Audit & Export Controls</span>
              </div>
            </div>

            <div className="promo-controls-row">
              <div className="promo-form-group" style={{ flex: 1, minWidth: '220px' }}>
                <label>Select Class *</label>
                <div className="promo-input-wrapper">
                  <BookOpen className="field-icon" size={16} />
                  <select className="promo-select-input" value={reportClassId} onChange={e => setReportClassId(e.target.value)}>
                    <option value="">-- Choose Class to Audit --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="promo-form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Status Filter</label>
                <div className="promo-input-wrapper">
                  <Filter className="field-icon" size={16} />
                  <select className="promo-select-input" value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)}>
                    <option value="All">All Decisions</option>
                    <option value="Promotable">Promotable</option>
                    <option value="Repeat">Repeat / Hold Back</option>
                  </select>
                </div>
              </div>

              <div className="promo-search-box" style={{ flex: 1.2, minWidth: '240px' }}>
                <Search className="promo-search-icon" size={15} />
                <input 
                  type="text" 
                  placeholder="Search student name or reg..."
                  value={reportSearchQuery}
                  onChange={e => setReportSearchQuery(e.target.value)}
                />
              </div>

              {classReport && (
                <button 
                  className="btn-add-rule" 
                  onClick={() => exportToCSV(reportFilteredRecords || [], classReport.class)}
                  style={{ height: '42px', marginTop: 'auto' }}
                >
                  <Download size={16} /> Export CSV Report
                </button>
              )}
            </div>
          </div>

          {classReportLoading ? (
            <div className="promo-table-wrapper loading-box">
              <div className="spinner" />
              <span>Fetching promotion audit records for class...</span>
            </div>
          ) : classReport ? (
            <div className="promo-table-wrapper">
              <div className="promo-table-toolbar">
                <div>
                  <h3 className="promo-table-title">
                    Latest Approved Promotion Report — {classReport.class}
                  </h3>
                  <span className="promo-table-subtitle">
                    Session {classReport.session} • Total Students: {classReport.summary.totalStudents}
                  </span>
                </div>

                <div className="promo-view-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={15} /> Table View
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid size={15} /> Grid Cards
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <table className="executive-promo-table">
                  <thead>
                    <tr>
                      <th>STUDENT NAME</th>
                      <th>REGISTRATION NO.</th>
                      <th>ANNUAL AVERAGE</th>
                      <th>SYSTEM RECOMMENDATION</th>
                      <th>FINAL DECISION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportFilteredRecords && reportFilteredRecords.length > 0 ? (
                      reportFilteredRecords.map(rec => (
                        <tr key={rec.recommendationId}>
                          <td>
                            <div className="teacher-profile-cell">
                              <div className="teacher-avatar">
                                {getStudentInitials(rec.studentName)}
                              </div>
                              <span className="teacher-name-title">{rec.studentName}</span>
                            </div>
                          </td>
                          <td><span className="reg-badge">{rec.registrationNumber}</span></td>
                          <td><strong>{rec.annualAverage.toFixed(2)}%</strong></td>
                          <td><span className="status-pill active">{rec.systemRecommendation}</span></td>
                          <td><span className="status-pill active">{rec.finalDecision}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-table-cell">No matching promotion records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="promo-grid-wrapper">
                  {reportFilteredRecords && reportFilteredRecords.length > 0 ? (
                    reportFilteredRecords.map(rec => (
                      <div className="promo-grid-card" key={rec.recommendationId}>
                        <div className="card-top-header">
                          <div className="teacher-avatar">
                            {getStudentInitials(rec.studentName)}
                          </div>
                          <div>
                            <span className="card-student-name">{rec.studentName}</span>
                            <span className="card-reg-no">{rec.registrationNumber}</span>
                          </div>
                        </div>
                        <div className="card-metrics-row">
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Annual Avg</span>
                            <span className="score-badge pass">{rec.annualAverage.toFixed(2)}%</span>
                          </div>
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Final Decision</span>
                            <span className="status-pill active">{rec.finalDecision}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-grid-box">No matching promotion records found.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="promo-empty-placeholder">
              <div className="empty-icon-circle">
                <FileText size={36} color="var(--primary-color, #000080)" />
              </div>
              <h3>No Class Selected</h3>
              <p>Select a class from the dropdown above to inspect historical promotion reports and export CSV summaries.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 3: APPROVED PROMOTIONS (REVOKE & REVERT)
          ========================================= */}
      {activeTab === 'history' && (
        <div className="promo-tab-content">
          <div className="promo-table-wrapper">
            <div className="promo-table-toolbar">
              <div>
                <h3 className="promo-table-title">
                  Executed & Approved Promotion Batches
                </h3>
                <span className="promo-table-subtitle">
                  Audit log of historical promotion executions with options to revoke and revert class transitions
                </span>
              </div>
            </div>

            {batchesLoading ? (
              <div className="loading-box">
                <div className="spinner" />
                <span>Loading historical batch audit logs...</span>
              </div>
            ) : promotionBatches.length === 0 ? (
              <div className="promo-empty-placeholder" style={{ border: 'none' }}>
                <div className="empty-icon-circle">
                  <History size={36} color="var(--primary-color, #000080)" />
                </div>
                <h3>No Historical Batches Found</h3>
                <p>There are no executed promotion batches recorded in the database yet.</p>
              </div>
            ) : (
              <table className="executive-promo-table">
                <thead>
                  <tr>
                    <th>CLASS TRANSITION</th>
                    <th>ACADEMIC SESSION</th>
                    <th>EXECUTION DATE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionBatches.map((batch: any) => {
                    const rawDate = batch.createdAt || batch.dateCreated || batch.approvedAt;
                    const formattedDate = rawDate && !isNaN(new Date(rawDate).getTime()) 
                      ? new Date(rawDate).toLocaleDateString() 
                      : 'N/A';
                    const isApproved = batch.isApproved || batch.status === 'Approved';

                    return (
                      <tr key={batch.id}>
                        <td>
                          <div className="batch-transition-cell">
                            <span className="batch-class-name">{batch.className}</span>
                            <ChevronRight size={16} className="transition-arrow" />
                            <span className="batch-target-name">{batch.targetClassName || batch.nextClassName || 'Graduating Senior Class'}</span>
                          </div>
                        </td>
                        <td><span className="reg-badge">{batch.session}</span></td>
                        <td>{formattedDate}</td>
                        <td>
                          <span className={`status-pill ${isApproved ? 'active' : 'inactive'}`}>
                            {isApproved ? 'Approved & Executed' : 'Pending / Reverted'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            {isApproved && (
                              <button 
                                className="btn-revoke-batch"
                                onClick={async () => {
                                  const confirmRevert = await showConfirm(
                                    `Are you sure you want to revoke and unlock promotions for ${batch.className}? Students will be returned to their previous class placement.`,
                                    { title: 'Confirm Promotion Reversal', type: 'warning' }
                                  );
                                  if (confirmRevert) revertBatchMutation.mutate(batch.id);
                                }}
                                disabled={revertBatchMutation.isPending}
                              >
                                <RotateCcw size={14} /> Revoke Batch
                              </button>
                            )}

                            <button 
                              className="btn-delete-batch"
                              onClick={async () => {
                                const confirmDelete = await showConfirm(
                                  `Are you sure you want to permanently delete the promotion batch for ${batch.className}? This action cannot be undone.`,
                                  { title: 'Confirm Batch Deletion', type: 'warning', confirmText: 'Delete Batch', cancelText: 'Cancel' }
                                );
                                if (confirmDelete) deleteBatchMutation.mutate(batch.id);
                              }}
                              disabled={deleteBatchMutation.isPending}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="promo-modal-backdrop">
          <div className="promo-modal-panel">
            <div className="promo-modal-header">
              <h3 className="promo-modal-title">Override Student Decision</h3>
              <button className="btn-close-modal" onClick={() => setShowOverrideModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="promo-modal-body">
              <div className="promo-form-group">
                <label>Override Decision *</label>
                <div className="promo-input-wrapper">
                  <UserCheck className="field-icon" size={16} />
                  <select className="promo-select-input" value={overrideDecision} onChange={e => setOverrideDecision(e.target.value)}>
                    <option value="Promotable">Promotable (Promote to Next Class)</option>
                    <option value="Held Back">Held Back (Repeat Current Class)</option>
                    <option value="Graduating">Graduating</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Audit Reason Note *</label>
                <textarea 
                  className="promo-textarea-input" 
                  rows={4} 
                  placeholder="Provide an explicit reason for overriding this recommendation for audit logging..."
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  required
                />
              </div>

              <div className="promo-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                <button type="submit" className="btn-save-grading" disabled={overrideMutation.isPending}>
                  {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
