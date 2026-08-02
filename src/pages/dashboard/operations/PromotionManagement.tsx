import React, { useState } from 'react';
import { api } from '../../../services/api';
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
  History
} from 'lucide-react';
import { SlideNotification } from '../../../components/ui/SlideNotification';
import { useDialog } from '../../../context/DialogContext';
import '../students/Management.css';

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

export default function PromotionManagement() {
  const queryClient = useQueryClient();
  const { showConfirm } = useDialog();
  const year = new Date().getFullYear();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'promotion' | 'report' | 'history'>('promotion');

  // Notification Toast State (Slide from right)
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
  const [nextSession, setNextSession] = useState(`${year}/${year + 1}`);
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
  const { data: batchReport, isLoading: batchReportLoading, isRefetching: batchRefetching } = useQuery<ReportData>({
    queryKey: ['promotionReport', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const res = await api.get(`/reports/academics/promotions/${batchId}`);
      return res;
    },
    enabled: !!batchId && activeTab === 'promotion',
  });

  // 3. Fetch Report (By Class ID for Promotion Report Tab)
  const { data: classReport, isLoading: classReportLoading, isRefetching: classRefetching } = useQuery<ReportData>({
    queryKey: ['promotionReportByClass', reportClassId],
    queryFn: async () => {
      if (!reportClassId) return null;
      try {
        const res = await api.get(`/reports/academics/promotions/class/${reportClassId}/latest`);
        return res;
      } catch (err: any) {
        if (err.response?.status === 404) return null; // No batch exists yet
        throw err;
      }
    },
    enabled: !!reportClassId && activeTab === 'report',
    retry: false
  });

  // 4. Fetch All Promotion Batches for Approved & Historical Lists Tab
  const { data: promotionBatches, isLoading: batchesLoading } = useQuery<any[]>({
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
            label: 'View Approved Promotions',
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
      showNotification('Promotion list successfully revoked & unlocked! You can now edit student decisions or regenerate.', 'success', 'Batch Unlocked');
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

  const handleGenerateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !nextSession) {
      showNotification('Please select a current class and specify the target academic session.', 'warning', 'Missing Selection');
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
      'Are you sure you want to approve and execute these promotions? This action is permanent and will move students to their new target classes.',
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
    setOverrideDecision(currentDecision);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showNotification('Please provide a reason for overriding this decision for audit logs.', 'warning', 'Reason Required');
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
    const headers = ['S/N', 'Student Name', 'Registration Number', 'Annual Average', 'System Recommendation', 'Final Decision'];
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
    <div className='management-page'>
      
      {/* Page Header */}
      <div className='page-header'>
        <div>
          <h1 className='page-title'>
            <GraduationCap className='me-2' size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Student Promotion Management
          </h1>
          <p className='page-subtitle'>Generate lists, review recommendations, and export reports.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className='tabs-container' style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          className={`tab-btn ${activeTab === 'promotion' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotion')}
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'promotion' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'promotion' ? '#3b82f6' : 'var(--color-text-light)',
            fontWeight: activeTab === 'promotion' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          Class Promotion (Execute)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'report' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'report' ? '#3b82f6' : 'var(--color-text-light)',
            fontWeight: activeTab === 'report' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          Promotion Report (View &amp; Export)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '10px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'history' ? '#3b82f6' : 'var(--color-text-light)',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <History size={16} /> Approved Promotions (Revoke &amp; Revert)
        </button>
      </div>

      {/* =========================================
          TAB 1: CLASS PROMOTION
          ========================================= */}
      {activeTab === 'promotion' && (
        <div className='slide-in'>
          <div className='filter-bar glass-panel' style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Current Class *</label>
              <select className='filter-select' value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required>
                <option value=''>Select Class...</option>
                {!classesLoading && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Next Session *</label>
              <input type='text' className='filter-select' placeholder='e.g. 2026/2027' value={nextSession} onChange={e => setNextSession(e.target.value)} required />
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Target Class</label>
              <select className='filter-select' value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                <option value=''>-- Graduating (Leave Empty) --</option>
                {!classesLoading && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ flex: '0 0 100px' }}>
              <label>Min Score</label>
              <input type='number' className='filter-select' value={minScore} onChange={e => setMinScore(Number(e.target.value))} min='0' max='100' required />
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <button type='button' className='btn btn-primary' onClick={handleGenerateList} disabled={generateBatchMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
                {generateBatchMutation.isPending ? 'Generating...' : <><ArrowRightCircle size={18} /> Generate List</>}
              </button>
            </div>
          </div>

          {(batchReportLoading || batchRefetching) && (
            <div className='table-container glass-panel' style={{ textAlign: 'center', padding: '40px' }}>
              <p className='loading-text'>Loading promotion data...</p>
            </div>
          )}

          {batchReport && !(batchReportLoading || batchRefetching) && (
            <div className='slide-in'>
              <div className='table-container glass-panel' style={{ marginBottom: '20px', padding: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <div style={{ padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #3b82f6', minWidth: '120px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{batchReport.summary.totalStudents}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Total</div>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981', minWidth: '120px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{batchReport.summary.promotableCount}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Promotable</div>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid #ef4444', minWidth: '120px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{batchReport.summary.heldBackCount}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Held Back</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                      <div style={{ minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '5px' }}>Search Student</label>
                        <input type='text' className='filter-select' placeholder='Name or Reg No...' value={promoSearchQuery} onChange={(e) => setPromoSearchQuery(e.target.value)} style={{ width: '100%' }} />
                      </div>
                      {batchReport.status !== 'Approved' && (
                        <button className='btn btn-success' onClick={handleApprove} disabled={approveBatchMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', height: '42px' }}>
                          {approveBatchMutation.isPending ? 'Processing...' : <><CheckCircle size={20} /> Approve &amp; Execute</>}
                        </button>
                      )}
                      {batchReport.status === 'Approved' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className='badge badge-success' style={{ backgroundColor: '#10b981', padding: '10px 15px', fontSize: '14px', height: '42px', display: 'flex', alignItems: 'center' }}>
                            <CheckCircle size={18} style={{ marginRight: '5px' }} /> Approved &amp; Executed
                          </span>
                          <button
                            type='button'
                            className='btn btn-secondary'
                            onClick={() => {
                              if (window.confirm('Are you sure you want to unlock this promotion list? Students will temporarily return to their original classes so you can edit status decisions and re-approve.')) {
                                revertBatchMutation.mutate(batchReport.batchId || batchId || undefined);
                              }
                            }}
                            disabled={revertBatchMutation.isPending}
                            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-alt)', fontWeight: 600, color: 'var(--color-text)' }}
                          >
                            <Edit3 size={16} style={{ color: '#f59e0b' }} /> {revertBatchMutation.isPending ? 'Unlocking...' : 'Unlock & Re-open for Editing'}
                          </button>
                        </div>
                      )}
                    </div>
                 </div>
              </div>

              <div className='table-container glass-panel'>
                {promoFilteredRecords?.length === 0 ? (
                  <p className='empty-text'>No students found.</p>
                ) : (
                  <table className='data-table'>
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>Student</th>
                        <th>Annual Avg</th>
                        <th>System Rec.</th>
                        <th>Final Decision</th>
                        {batchReport.status !== 'Approved' && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {promoFilteredRecords?.map((rec, idx) => (
                        <tr key={rec.recommendationId}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{rec.studentName}</strong>
                            <div className='text-muted text-sm'>{rec.registrationNumber}</div>
                          </td>
                          <td>
                            <span className={`badge ${rec.annualAverage >= minScore ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: rec.annualAverage >= minScore ? '#10b981' : '#ef4444', color: 'white' }}>
                              {rec.annualAverage.toFixed(2)}%
                            </span>
                          </td>
                          <td><span className='text-muted'>{rec.systemRecommendation}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong>{rec.finalDecision}</strong>
                              {rec.hasOverride && (
                                <span className='badge badge-warning' title={`Edited by ${rec.overrideDetails?.principal}: ${rec.overrideDetails?.reason}`} style={{ cursor: 'help', backgroundColor: '#f59e0b', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>Manually Edited</span>
                              )}
                            </div>
                          </td>
                          {batchReport.status !== 'Approved' && (
                            <td>
                              <button className='btn btn-secondary btn-sm' onClick={() => openOverrideModal(rec.recommendationId, rec.finalDecision)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Edit3 size={14} /> Edit Status
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 2: PROMOTION REPORT
          ========================================= */}
      {activeTab === 'report' && (
        <div className='slide-in'>
          <div className='filter-bar glass-panel' style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Select Class for Report *</label>
              <select className='filter-select' value={reportClassId} onChange={e => setReportClassId(e.target.value)}>
                <option value=''>Choose a class...</option>
                {!classesLoading && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Filter by Status</label>
              <select className='filter-select' value={reportStatusFilter} onChange={e => setReportStatusFilter(e.target.value)}>
                <option value='All'>All Students</option>
                <option value='Promotable'>Promotable</option>
                <option value='Held Back'>Held Back</option>
                <option value='Graduating'>Graduating</option>
                <option value='Withdrawn'>Withdrawn</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Search Student</label>
              <input type='text' className='filter-select' placeholder='Name or Reg No...' value={reportSearchQuery} onChange={e => setReportSearchQuery(e.target.value)} />
            </div>

            <div style={{ flex: '0 0 auto' }}>
              <button 
                type='button' 
                className='btn btn-success' 
                onClick={() => exportToCSV(reportFilteredRecords || [], classReport?.class || 'Class')}
                disabled={!classReport || reportFilteredRecords?.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', backgroundColor: '#10b981', color: 'white', border: 'none' }}
              >
                <Download size={18} /> Export CSV
              </button>
            </div>
          </div>

          {(classReportLoading || classRefetching) && (
            <div className='table-container glass-panel' style={{ textAlign: 'center', padding: '40px' }}>
              <p className='loading-text'>Loading report data...</p>
            </div>
          )}

          {!classReportLoading && reportClassId && !classReport && (
            <div className='table-container glass-panel' style={{ textAlign: 'center', padding: '40px' }}>
              <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '15px' }} />
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-text)' }}>No Promotion List Found</h3>
              <p className='text-muted'>A promotion list has not been generated for this class yet. Please go to the <strong>Class Promotion</strong> tab to generate it first.</p>
            </div>
          )}

          {classReport && !(classReportLoading || classRefetching) && (
            <div className='table-container glass-panel slide-in'>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-text)' }}>{classReport.class} — Promotion Report</h3>
                  <p className='text-muted' style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Session: {classReport.session} | Target: {classReport.nextClass}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <span className={`badge ${classReport.status === 'Approved' ? 'badge-success' : 'badge-warning'}`} style={{ backgroundColor: classReport.status === 'Approved' ? '#10b981' : '#f59e0b', color: 'white', padding: '8px 12px', fontSize: '14px' }}>
                    Status: {classReport.status === 'Approved' ? 'Executed' : 'Draft / Pending'}
                  </span>
                  {classReport.status === 'Approved' && classReport.batchId && (
                    <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={() => {
                        if (window.confirm('Are you sure you want to unlock and revert this promotion list? Students will temporarily return to their original class rosters so you can edit status decisions.')) {
                          revertBatchMutation.mutate(classReport.batchId);
                        }
                      }}
                      disabled={revertBatchMutation.isPending}
                      style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-alt)', fontWeight: 600, color: 'var(--color-text)' }}
                    >
                      <Edit3 size={15} style={{ color: '#f59e0b' }} /> {revertBatchMutation.isPending ? 'Unlocking...' : 'Unlock for Editing'}
                    </button>
                  )}
                </div>
              </div>

              {reportFilteredRecords?.length === 0 ? (
                <p className='empty-text' style={{ padding: '40px' }}>No students match the current filters.</p>
              ) : (
                <table className='data-table'>
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>Student</th>
                      <th>Reg No.</th>
                      <th>Annual Avg</th>
                      <th>System Rec.</th>
                      <th>Final Decision</th>
                      {classReport.status !== 'Approved' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reportFilteredRecords?.map((rec, idx) => (
                      <tr key={rec.recommendationId}>
                        <td>{idx + 1}</td>
                        <td><strong>{rec.studentName}</strong></td>
                        <td className='text-muted'>{rec.registrationNumber}</td>
                        <td>{rec.annualAverage.toFixed(2)}%</td>
                        <td>{rec.systemRecommendation}</td>
                        <td>
                          <strong>{rec.finalDecision}</strong>
                          {rec.hasOverride && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>Manually Edited</span>}
                        </td>
                        {classReport.status !== 'Approved' && (
                          <td>
                            <button className='btn btn-secondary btn-sm' onClick={() => openOverrideModal(rec.recommendationId, rec.finalDecision)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Edit3 size={14} /> Edit Status
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 3: APPROVED & HISTORICAL PROMOTIONS (REVERT / REVOKE)
          ========================================= */}
      {activeTab === 'history' && (
        <div className='tab-pane slide-in'>
          <div className='glass-panel' style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={22} className='text-primary' /> Approved Promotions &amp; Batch History
              </h3>
              <p className='text-muted' style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                View all generated and executed promotion lists across classes and sessions. Revoke or revert approved promotions when adjustments or re-generation are required.
              </p>
            </div>
            <button type='button' className='btn btn-secondary btn-sm' onClick={() => queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] })}>
              Refresh List
            </button>
          </div>

          {batchesLoading ? (
            <div className='glass-panel' style={{ padding: '40px', textAlign: 'center' }}>
              <p className='text-muted'>Loading promotion lists and approval history...</p>
            </div>
          ) : !promotionBatches || promotionBatches.length === 0 ? (
            <div className='glass-panel' style={{ padding: '50px', textAlign: 'center' }}>
              <AlertTriangle size={36} className='text-warning' style={{ margin: '0 auto 15px auto', opacity: 0.8, color: '#f59e0b' }} />
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>No Promotion Lists Found</h4>
              <p className='text-muted' style={{ maxWidth: '400px', margin: '0 auto' }}>You haven't generated or approved any promotion lists for any class or session yet.</p>
            </div>
          ) : (
            <div className='table-container glass-panel'>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Session</th>
                    <th>Current Class</th>
                    <th>Target Class</th>
                    <th>Min Score</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions (Revoke / View)</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionBatches.map((b: any, idx: number) => (
                    <tr key={b.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{b.session}</strong></td>
                      <td><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{b.className}</span></td>
                      <td><span className='badge badge-primary' style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{b.nextClassName}</span></td>
                      <td>{b.minimumPromotionScore}%</td>
                      <td>
                        <strong>{b.totalStudents} total</strong>
                        <span className='text-muted text-sm' style={{ display: 'block', fontSize: '11px' }}>
                          {b.promotedCount} Promotable, {b.heldBackCount} Held Back
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${b.status === 'Approved' ? 'badge-success' : 'badge-warning'}`} style={{ backgroundColor: b.status === 'Approved' ? '#10b981' : '#f59e0b', color: 'white', padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {b.status === 'Approved' && <CheckCircle size={13} />}
                          {b.status === 'Approved' ? 'Approved & Executed' : 'Draft / Pending'}
                        </span>
                        {b.approvedBy && <span className='text-muted' style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>By: {b.approvedBy}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type='button'
                            className='btn btn-secondary btn-sm'
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px' }}
                            onClick={() => {
                              if (b.classId) {
                                setReportClassId(b.classId);
                              }
                              setBatchId(b.id);
                              setActiveTab('report');
                            }}
                          >
                            <Eye size={14} /> View List
                          </button>

                          {b.status === 'Approved' ? (
                            <button
                              type='button'
                              className='btn btn-secondary btn-sm'
                              disabled={revertBatchMutation.isPending}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)', fontWeight: 600, padding: '6px 12px', borderRadius: '6px' }}
                              onClick={async () => {
                                const confirmed = await showConfirm(
                                  <span>
                                    Are you sure you want to <strong>REVOKE / REVERT</strong> the approved promotion list for <strong>{b.className} ({b.session})</strong>?
                                    <br /><br />
                                    This will safely transition all affected students back to their original <strong>{b.className}</strong> roster and unlock the promotion list immediately so you can modify decisions or generate anew.
                                  </span>,
                                  {
                                    title: 'Revoke & Revert Promotion',
                                    type: 'danger',
                                    confirmText: 'Revoke List',
                                    cancelText: 'Cancel'
                                  }
                                );
                                if (confirmed) {
                                  revertBatchMutation.mutate(b.id);
                                }
                              }}
                            >
                              <RotateCcw size={15} /> Revoke &amp; Revert
                            </button>
                          ) : (
                            <button
                              type='button'
                              className='btn btn-primary btn-sm'
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600 }}
                              onClick={() => {
                                if (b.classId) setSelectedClassId(b.classId);
                                setBatchId(b.id);
                                setActiveTab('promotion');
                              }}
                            >
                              Resume &amp; Execute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Override / Edit Decision Modal */}
      {showOverrideModal && (
        <div className='modal-overlay'>
          <div className='modal-content glass-panel'>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Edit3 size={22} style={{ color: '#3b82f6' }} /> Edit Promotion Decision
            </h2>
            <p className='text-muted text-sm' style={{ marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Modify this student's academic status for the upcoming session. All administrative changes are recorded in the audit log.
            </p>
            <form onSubmit={handleOverrideSubmit} className='modal-form'>
              <div className='form-group full-width'>
                <label>New Decision Status</label>
                <select name='overrideDecision' value={overrideDecision} onChange={e => setOverrideDecision(e.target.value)} required style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-text)' }}>
                  <option value='Promotable'>Promotable (Promote to Next Class)</option>
                  <option value='Held Back'>Held Back (Repeat Current Class)</option>
                  <option value='Withdrawn'>Withdrawn (Leaving School / Deactivated)</option>
                  <option value='Graduating'>Graduating (Complete &amp; Archive)</option>
                </select>
              </div>
              <div className='form-group full-width' style={{ marginTop: '1rem' }}>
                <label>Reason for Decision Adjustment *</label>
                <textarea rows={3} value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder='e.g. Approved by Academic Board / Parental request / Special consideration...' required style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-text)' }}></textarea>
              </div>
              <div className='modal-actions' style={{ marginTop: '1.5rem' }}>
                <button type='button' className='btn btn-secondary' onClick={() => setShowOverrideModal(false)}>Cancel</button>
                <button type='submit' className='btn btn-primary' disabled={overrideMutation.isPending} style={{ backgroundColor: '#3b82f6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '6px', fontWeight: 600 }}>
                  {overrideMutation.isPending ? 'Saving Decision...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Slide-from-right Notification Toast */}
      <SlideNotification
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        action={notification.action}
      />
    </div>
  );
}
