import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './Approvals.css';

interface ResultBatch {
  id: string;
  session: string;
  term: string;
  className: string;
  studentCount: number;
  submittedAt: string;
}

interface PromotionBatch {
  id: string;
  session: string;
  className: string;
  nextClassName: string;
  minimumPromotionScore: number;
  recommendationCount: number;
  createdAt: string;
}

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  principalRemarks: string;
  classTeacherRemarks: string;
}

interface PendingSignature {
  type: string;
  id: string;
  name: string;
  signatureUrl: string;
}

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<'results' | 'promotions' | 'history'>('results');
  const [resultBatches, setResultBatches] = useState<ResultBatch[]>([]);
  const [promotionBatches, setPromotionBatches] = useState<PromotionBatch[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Review Modal state
  const [selectedBatch, setSelectedBatch] = useState<ResultBatch | null>(null);
  const [batchResults, setBatchResults] = useState<StudentResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState<{ [id: string]: { pRemark: string, tRemark: string } }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, promData, historyData] = await Promise.all([
        api.get('/academics/approvals/results'),
        api.get('/academics/approvals/promotions'),
        api.get('/academics/approvals/history')
      ]);
      setResultBatches(resData);
      setPromotionBatches(promData);
      setApprovalHistory(historyData);
    } catch (err) {
      console.error("Failed to load approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveResult = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to approve this result batch? This action is irreversible.")) return;
    try {
      setProcessingId(batchId);
      // First save any edited remarks
      for (const resultId of Object.keys(editingRemarks)) {
        await api.put('/academics/results/remarks', {
          studentResultId: resultId,
          principalRemarks: editingRemarks[resultId].pRemark,
          classTeacherRemarks: editingRemarks[resultId].tRemark
        });
      }
      
      await api.post(`/academics/results/batches/${batchId}/approve`, {});
      alert("Result batch approved successfully.");
      setSelectedBatch(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewBatch = async (batch: ResultBatch) => {
    setSelectedBatch(batch);
    setLoadingResults(true);
    setEditingRemarks({});
    try {
      const data = await api.get(`/academics/results/batches/${batch.id}`);
      setBatchResults(data);
      const initialRemarks: any = {};
      data.forEach((r: StudentResult) => {
        initialRemarks[r.id] = { pRemark: r.principalRemarks, tRemark: r.classTeacherRemarks };
      });
      setEditingRemarks(initialRemarks);
    } catch (err) {
      console.error(err);
      alert("Failed to load results for review.");
      setSelectedBatch(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleApprovePromotion = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to approve this promotion batch? This action is irreversible.")) return;
    try {
      setProcessingId(batchId);
      await api.post('/academics/promotion/approve', { batchId });
      alert("Promotion batch approved successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="approvals-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Approvals</h1>
          <p className="page-subtitle">Review and authorize submitted results and promotions</p>
        </div>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Class Results
          {resultBatches.length > 0 && <span className="badge-count">{resultBatches.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          Promotions
          {promotionBatches.length > 0 && <span className="badge-count">{promotionBatches.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="tab-content glass-panel">
        {loading ? (
          <p className="loading-text">Loading queues...</p>
        ) : activeTab === 'results' ? (
          // RESULTS TAB
          resultBatches.length === 0 ? (
            <div className="empty-state">
              <span className="icon">✅</span>
              <h3>All caught up!</h3>
              <p>There are no pending result batches waiting for your approval.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Academic Term</th>
                  <th>Students</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultBatches.map(batch => (
                  <tr key={batch.id}>
                    <td><strong>{batch.className}</strong></td>
                    <td>{batch.term} - {batch.session}</td>
                    <td>{batch.studentCount}</td>
                    <td>{new Date(batch.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReviewBatch(batch)}
                      >
                        Review & Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === 'promotions' ? (
          // PROMOTIONS TAB
          promotionBatches.length === 0 ? (
            <div className="empty-state">
              <span className="icon">✅</span>
              <h3>All caught up!</h3>
              <p>There are no pending promotion batches waiting for your approval.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>From Class</th>
                  <th>To Class</th>
                  <th>Session</th>
                  <th>Recommendations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotionBatches.map(batch => (
                  <tr key={batch.id}>
                    <td><strong>{batch.className}</strong></td>
                    <td><span className="badge badge-info">{batch.nextClassName}</span></td>
                    <td>{batch.session}</td>
                    <td>{batch.recommendationCount} students</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprovePromotion(batch.id)}
                        disabled={processingId === batch.id}
                      >
                        {processingId === batch.id ? 'Approving...' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          // HISTORY TAB
          approvalHistory.length === 0 ? (
            <div className="empty-state">
              <span className="icon">📜</span>
              <h3>No History</h3>
              <p>There is no recent approval history.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Session</th>
                  <th>Details</th>
                  <th>Approved By</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {approvalHistory.map((history, idx) => (
                  <tr key={`${history.batchId}-${idx}`}>
                    <td><span className={`badge badge-${history.type === 'Result' ? 'primary' : 'info'}`}>{history.type}</span></td>
                    <td><strong>{history.className}</strong></td>
                    <td>{history.session}</td>
                    <td>{history.details}</td>
                    <td>{history.approvedBy}</td>
                    <td>
                      {new Date(history.approvedAt).toLocaleDateString()}
                      {' '}at{' '}
                      {new Date(history.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Review Modal */}
      {selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '90%' }}>
            <h2>Review Results: {selectedBatch.className}</h2>
            <p>You can edit auto-generated remarks before final approval.</p>
            
            {loadingResults ? (
              <p>Loading results...</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: '1.5rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Avg %</th>
                      <th>Pos</th>
                      <th>Teacher Remark</th>
                      <th>Principal Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map(r => (
                      <tr key={r.id} className="student-row">
                        <td>
                          <strong>{r.studentName}</strong>
                          <br />
                          <a 
                            href={`/dashboard/reports/result/${r.studentId}/${selectedBatch?.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
                          >
                            View Result
                          </a>
                        </td>
                        <td>{r.averageScore}</td>
                        <td>{r.positionInClass}</td>
                        <td>
                          <input 
                            type="text" 
                            className="remark-input" 
                            style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', width: '100%', padding: '0.5rem', borderRadius: '6px' }}
                            value={editingRemarks[r.id]?.tRemark || ''} 
                            onChange={(e) => setEditingRemarks({
                              ...editingRemarks,
                              [r.id]: { ...editingRemarks[r.id], tRemark: e.target.value }
                            })}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="remark-input" 
                            style={{ backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', width: '100%', padding: '0.5rem', borderRadius: '6px' }}
                            value={editingRemarks[r.id]?.pRemark || ''} 
                            onChange={(e) => setEditingRemarks({
                              ...editingRemarks,
                              [r.id]: { ...editingRemarks[r.id], pRemark: e.target.value }
                            })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="action-row" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBatch(null)} disabled={processingId === selectedBatch.id}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleApproveResult(selectedBatch.id)} disabled={processingId === selectedBatch.id || loadingResults}>
                {processingId === selectedBatch.id ? 'Approving...' : 'Save Remarks & Approve Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
