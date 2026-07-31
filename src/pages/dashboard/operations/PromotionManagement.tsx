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
  Filter
} from 'lucide-react';

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
  const year = new Date().getFullYear();
  
  // Form State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [nextSession, setNextSession] = useState(`${year}/${year + 1}`);
  const [minScore, setMinScore] = useState<number>(50);
  const [batchId, setBatchId] = useState<string | null>(null);

  // Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRecId, setOverrideRecId] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('Promotable');
  const [overrideReason, setOverrideReason] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Classes using React Query
  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/setup/classes');
      return res;
    }
  });

  // 2. Fetch Report using React Query
  const { data: report, isLoading: reportLoading, isRefetching } = useQuery<ReportData>({
    queryKey: ['promotionReport', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const res = await api.get(`/reports/academics/promotions/${batchId}`);
      return res;
    },
    enabled: !!batchId,
  });

  // 3. Generate Batch Mutation
  const generateBatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/batch', payload);
    },
    onSuccess: (data) => {
      if (data.batchId) {
        setBatchId(data.batchId);
      }
    },
    onError: (err: any) => {
      alert(err.message || "Failed to generate promotion list.");
    }
  });

  // 4. Approve Batch Mutation
  const approveBatchMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/academics/promotion/approve', { batchId });
    },
    onSuccess: () => {
      alert("Promotions executed successfully!");
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to approve promotions.");
    }
  });

  // 5. Override Mutation
  const overrideMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/override', payload);
    },
    onSuccess: () => {
      setShowOverrideModal(false);
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to override.");
    }
  });

  const handleGenerateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !nextSession) {
      alert("Please select a class and specify the next session.");
      return;
    }
    generateBatchMutation.mutate({
      classId: selectedClassId,
      targetClassId: targetClassId || null,
      nextSession: nextSession,
      minimumPromotionScore: minScore
    });
  };

  const handleApprove = () => {
    if (!batchId) return;
    if (window.confirm("Are you sure you want to approve and execute these promotions? This action is permanent and will move students to their new classes.")) {
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
      alert("Please provide a reason for this override.");
      return;
    }
    overrideMutation.mutate({
      recommendationId: overrideRecId,
      newDecision: overrideDecision,
      reasonNote: overrideReason
    });
  };

  // Filter records based on search query
  const filteredRecords = report?.records.filter(r => 
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <GraduationCap className="me-2 text-primary" size={28} />
            Student Promotion Management
          </h2>
          <p className="text-muted mb-0">Generate lists, review recommendations, and execute year-end promotions.</p>
        </div>
      </div>

      {/* Generation Configuration Card */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4">
          <h5 className="mb-0 fw-semibold text-dark d-flex align-items-center">
            <Filter className="me-2 text-secondary" size={20} />
            Configure Promotion Batch
          </h5>
        </div>
        <div className="card-body p-4 bg-white">
          <form onSubmit={handleGenerateList}>
            <div className="row g-4 align-items-end">
              <div className="col-12 col-md-3">
                <label className="form-label fw-medium text-secondary small mb-2">CURRENT CLASS *</label>
                <select 
                  className="form-select form-select-lg rounded-3 shadow-none border-light bg-light" 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  required
                >
                  <option value="">Select Class...</option>
                  {!classesLoading && classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-12 col-md-3">
                <label className="form-label fw-medium text-secondary small mb-2">NEXT SESSION *</label>
                <input 
                  type="text" 
                  className="form-control form-control-lg rounded-3 shadow-none border-light bg-light" 
                  placeholder="e.g. 2026/2027" 
                  value={nextSession} 
                  onChange={e => setNextSession(e.target.value)} 
                  required 
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-medium text-secondary small mb-2">TARGET CLASS</label>
                <select 
                  className="form-select form-select-lg rounded-3 shadow-none border-light bg-light" 
                  value={targetClassId} 
                  onChange={e => setTargetClassId(e.target.value)}
                >
                  <option value="">-- Graduating (Leave Empty) --</option>
                  {!classesLoading && classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-1">
                <label className="form-label fw-medium text-secondary small mb-2">MIN SCORE</label>
                <input 
                  type="number" 
                  className="form-control form-control-lg rounded-3 shadow-none border-light bg-light text-center" 
                  value={minScore} 
                  onChange={e => setMinScore(Number(e.target.value))} 
                  min="0" 
                  max="100" 
                  required 
                />
              </div>

              <div className="col-12 col-md-2">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 rounded-3 shadow-sm d-flex align-items-center justify-content-center" 
                  disabled={generateBatchMutation.isPending}
                >
                  {generateBatchMutation.isPending ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <ArrowRightCircle className="me-2" size={20} />
                  )}
                  Generate List
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Loading States */}
      {(reportLoading || isRefetching) && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Report View */}
      {report && !(reportLoading || isRefetching) && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 slide-in">
          
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="mb-1 fw-bold text-dark d-flex align-items-center">
                <FileText className="me-2 text-primary" size={24} />
                Promotion Review
              </h4>
              <p className="text-muted mb-0 small">
                {report.class} ➡️ {report.nextClass || "Graduating"} ({report.session})
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><Search size={18} className="text-muted"/></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-0 shadow-none" 
                  placeholder="Search student..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {report.status !== 'Approved' ? (
                <button 
                  className="btn btn-success d-flex align-items-center rounded-3 px-4 shadow-sm" 
                  onClick={handleApprove} 
                  disabled={approveBatchMutation.isPending}
                >
                  {approveBatchMutation.isPending ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <CheckCircle className="me-2" size={20} />
                  )}
                  Approve & Execute
                </button>
              ) : (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-4 py-2 rounded-pill fs-6 d-flex align-items-center">
                  <CheckCircle className="me-2" size={18} /> Approved
                </span>
              )}
            </div>
          </div>
          
          <div className="card-body p-4 bg-light">
            
            {/* Metric Cards */}
            <div className="row g-3 mb-4">
              {[
                { label: 'Total Students', value: report.summary.totalStudents, color: 'primary', icon: Users },
                { label: 'Promotable', value: report.summary.promotableCount, color: 'success', icon: CheckCircle },
                { label: 'Held Back', value: report.summary.heldBackCount, color: 'danger', icon: AlertTriangle },
                { label: 'Graduating', value: report.summary.graduatingCount, color: 'info', icon: GraduationCap },
                { label: 'Overrides', value: report.summary.overridesCount, color: 'warning', icon: FileText },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div className="col" key={idx}>
                    <div className="card border-0 shadow-sm rounded-3 h-100">
                      <div className="card-body text-center p-3">
                        <Icon className={`text-${metric.color} mb-2`} size={24} />
                        <h3 className={`fw-bold text-${metric.color} mb-0`}>{metric.value}</h3>
                        <span className="text-muted small fw-medium text-uppercase">{metric.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-secondary small fw-semibold">S/N</th>
                      <th className="px-4 py-3 text-secondary small fw-semibold">STUDENT</th>
                      <th className="px-4 py-3 text-secondary small fw-semibold">ANNUAL AVG</th>
                      <th className="px-4 py-3 text-secondary small fw-semibold">SYSTEM REC.</th>
                      <th className="px-4 py-3 text-secondary small fw-semibold">FINAL DECISION</th>
                      {report.status !== 'Approved' && <th className="px-4 py-3 text-secondary small fw-semibold text-end">ACTION</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords?.map((rec, idx) => (
                      <tr key={rec.recommendationId}>
                        <td className="px-4 text-muted">{idx + 1}</td>
                        <td className="px-4">
                          <div className="fw-semibold text-dark">{rec.studentName}</div>
                          <div className="text-muted small">{rec.registrationNumber}</div>
                        </td>
                        <td className="px-4">
                          <span className={`badge ${rec.annualAverage >= minScore ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} rounded-pill`}>
                            {rec.annualAverage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4">
                          <span className="text-muted">{rec.systemRecommendation}</span>
                        </td>
                        <td className="px-4">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold">{rec.finalDecision}</span>
                            {rec.hasOverride && (
                              <span 
                                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill" 
                                title={`Overridden by ${rec.overrideDetails?.principal}: ${rec.overrideDetails?.reason}`}
                                style={{ cursor: 'help' }}
                              >
                                Overridden
                              </span>
                            )}
                          </div>
                        </td>
                        {report.status !== 'Approved' && (
                          <td className="px-4 text-end">
                            <button 
                              className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm"
                              onClick={() => openOverrideModal(rec.recommendationId, rec.finalDecision)}
                            >
                              Override
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredRecords?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050, backdropFilter: 'blur(4px)' }}>
          <div className="card border-0 shadow-lg rounded-4 w-100 animate-zoom-in" style={{ maxWidth: '500px' }}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
              <h5 className="m-0 fw-bold d-flex align-items-center">
                <AlertTriangle className="text-warning me-2" size={24} />
                Manual Decision Override
              </h5>
              <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" onClick={() => setShowOverrideModal(false)}>
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleOverrideSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary small">NEW DECISION</label>
                  <select 
                    className="form-select form-select-lg bg-light border-0 shadow-none rounded-3" 
                    value={overrideDecision} 
                    onChange={e => setOverrideDecision(e.target.value)} 
                    required
                  >
                    <option value="Promotable">Promotable</option>
                    <option value="Held Back">Held Back</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Graduating">Graduating</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary small">REASON FOR OVERRIDE *</label>
                  <textarea 
                    className="form-control bg-light border-0 shadow-none rounded-3 p-3" 
                    rows={4} 
                    value={overrideReason} 
                    onChange={e => setOverrideReason(e.target.value)} 
                    placeholder="Enter explicit reason for changing the system's recommendation..."
                    required
                  ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-3 mt-2">
                  <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-medium" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 py-2 rounded-3 shadow-sm fw-medium d-flex align-items-center" disabled={overrideMutation.isPending}>
                    {overrideMutation.isPending ? <span className="spinner-border spinner-border-sm me-2"/> : <CheckCircle className="me-2" size={18} />}
                    Save Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        .animate-zoom-in {
          animation: zoomIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
