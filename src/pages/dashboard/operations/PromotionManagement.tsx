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
    <div className="management-page">
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <GraduationCap className="me-2" size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Student Promotion Management
          </h1>
          <p className="page-subtitle">Generate lists, review recommendations, and execute year-end promotions.</p>
        </div>
        <div className="header-actions">
          {report && report.status !== 'Approved' && (
            <button 
              className="btn btn-success" 
              onClick={handleApprove} 
              disabled={approveBatchMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none' }}
            >
              {approveBatchMutation.isPending ? 'Processing...' : <><CheckCircle size={20} /> Approve & Execute</>}
            </button>
          )}
          {report && report.status === 'Approved' && (
            <span className="badge badge-success" style={{ backgroundColor: '#10b981', padding: '10px 15px', fontSize: '14px' }}>
              <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Approved
            </span>
          )}
        </div>
      </div>

      {/* Generation Configuration Card (Using Filter Bar styling) */}
      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Current Class *</label>
          <select 
            className="filter-select" 
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
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Next Session *</label>
          <input 
            type="text" 
            className="filter-select" 
            placeholder="e.g. 2026/2027" 
            value={nextSession} 
            onChange={e => setNextSession(e.target.value)} 
            required 
          />
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Target Class</label>
          <select 
            className="filter-select" 
            value={targetClassId} 
            onChange={e => setTargetClassId(e.target.value)}
          >
            <option value="">-- Graduating (Leave Empty) --</option>
            {!classesLoading && classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 0 100px' }}>
          <label>Min Score</label>
          <input 
            type="number" 
            className="filter-select" 
            value={minScore} 
            onChange={e => setMinScore(Number(e.target.value))} 
            min="0" 
            max="100" 
            required 
          />
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleGenerateList}
            disabled={generateBatchMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}
          >
            {generateBatchMutation.isPending ? 'Generating...' : <><ArrowRightCircle size={18} /> Generate List</>}
          </button>
        </div>
      </div>

      {/* Loading States */}
      {(reportLoading || isRefetching) && (
        <div className="table-container glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="loading-text">Loading promotion data...</p>
        </div>
      )}

      {/* Report View */}
      {report && !(reportLoading || isRefetching) && (
        <div className="slide-in">
          
          <div className="table-container glass-panel" style={{ marginBottom: '20px', padding: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #3b82f6', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{report.summary.totalStudents}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Total Students</div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{report.summary.promotableCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Promotable</div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid #ef4444', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{report.summary.heldBackCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Held Back</div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', borderLeft: '4px solid #f59e0b', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{report.summary.graduatingCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Graduating</div>
                  </div>
                  <div style={{ padding: '15px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{report.summary.overridesCount}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Overrides</div>
                  </div>
                </div>

                <div style={{ minWidth: '250px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '5px' }}>Search Student</label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    placeholder="Name or Registration No..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
             </div>
          </div>

          {/* Data Table */}
          <div className="table-container glass-panel">
            {filteredRecords?.length === 0 ? (
              <p className="empty-text">No students found matching your search.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Student</th>
                    <th>Annual Avg</th>
                    <th>System Rec.</th>
                    <th>Final Decision</th>
                    {report.status !== 'Approved' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords?.map((rec, idx) => (
                    <tr key={rec.recommendationId}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{rec.studentName}</strong>
                        <div className="text-muted text-sm">{rec.registrationNumber}</div>
                      </td>
                      <td>
                        <span className={`badge ${rec.annualAverage >= minScore ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: rec.annualAverage >= minScore ? '#10b981' : '#ef4444', color: 'white' }}>
                          {rec.annualAverage.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">{rec.systemRecommendation}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{rec.finalDecision}</strong>
                          {rec.hasOverride && (
                            <span 
                              className="badge badge-warning" 
                              title={`Overridden by ${rec.overrideDetails?.principal}: ${rec.overrideDetails?.reason}`}
                              style={{ cursor: 'help', backgroundColor: '#f59e0b', color: 'white' }}
                            >
                              Overridden
                            </span>
                          )}
                        </div>
                      </td>
                      {report.status !== 'Approved' && (
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openOverrideModal(rec.recommendationId, rec.finalDecision)}
                          >
                            Override
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

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Manual Decision Override</h2>
            <form onSubmit={handleOverrideSubmit} className="modal-form">
              <div className="form-group full-width">
                <label>New Decision</label>
                <select 
                  name="overrideDecision" 
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
              <div className="form-group full-width">
                <label>Reason for Override *</label>
                <textarea 
                  rows={4} 
                  value={overrideReason} 
                  onChange={e => setOverrideReason(e.target.value)} 
                  placeholder="Enter explicit reason for changing the system's recommendation..."
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-text)' }}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={overrideMutation.isPending} style={{ backgroundColor: '#f59e0b', border: 'none', color: 'white' }}>
                  {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
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
    </div>
  );
}
