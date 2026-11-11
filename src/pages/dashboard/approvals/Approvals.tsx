import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import './Approvals.css';
import { useDialog } from '../../../context/DialogContext';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import {
  Users,
  Award,
  ShieldCheck,
  Search,
  RotateCcw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClassItem {
  id: string;
  name: string;
  level?: string;
}

interface StudentResultItem {
  id: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  principalRemarks?: string;
  classTeacherRemarks?: string;
}

interface BatchResultResponse {
  batchId: string;
  status: string;
  results: StudentResultItem[];
}

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

export default function Approvals() {
  const { showAlert, showConfirm } = useDialog();

  const [activeTab, setActiveTab] = useState<'results' | 'promotions' | 'history'>('results');

  // Pending Queues
  const [resultBatches, setResultBatches] = useState<ResultBatch[]>([]);
  const [promotionBatches, setPromotionBatches] = useState<PromotionBatch[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Class Selection & Direct Result Lookup State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();
  const [classData, setClassData] = useState<BatchResultResponse | null>(null);
  const [loadingClassResults, setLoadingClassResults] = useState(false);
  const [classResultError, setClassResultError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Review & Remarks Modal state
  const [selectedBatchModal, setSelectedBatchModal] = useState<ResultBatch | null>(null);
  const [batchResultsModal, setBatchResultsModal] = useState<StudentResultItem[]>([]);
  const [loadingModalResults, setLoadingModalResults] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState<{
    [id: string]: { pRemark: string; tRemark: string };
  }>({});

  useEffect(() => {
    fetchClasses();
    fetchQueues();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassResultData();
    }
  }, [selectedClassId, filterSession, filterTerm]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/setup/classes');
      const classList = Array.isArray(res) ? res : [];
      setClasses(classList);
      if (classList.length > 0 && !selectedClassId) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes for approval', err);
    }
  };

  const fetchQueues = async () => {
    setLoadingQueues(true);
    try {
      const [resData, promData, historyData] = await Promise.all([
        api.get('/academics/approvals/results'),
        api.get('/academics/approvals/promotions'),
        api.get('/academics/approvals/history'),
      ]);
      setResultBatches(Array.isArray(resData) ? resData : []);
      setPromotionBatches(Array.isArray(promData) ? promData : []);
      setApprovalHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to load approval queues', err);
    } finally {
      setLoadingQueues(false);
    }
  };

  const fetchClassResultData = async () => {
    if (!selectedClassId) return;

    try {
      setLoadingClassResults(true);
      setClassResultError(null);
      const res = await api.get(
        `/academics/admin/class-results?classId=${selectedClassId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );

      if (!res.batchId || res.batchId === '00000000-0000-0000-0000-000000000000') {
        setClassData(null);
        setClassResultError('No compiled results found for the selected class and term.');
      } else {
        setClassData(res);
      }
    } catch (err: any) {
      setClassData(null);
      setClassResultError(err.message || 'Failed to load class results for approval.');
    } finally {
      setLoadingClassResults(false);
    }
  };

  const handleApproveBatchById = async (batchId: string) => {
    if (
      !(await showConfirm(
        'Are you sure you want to APPROVE this compiled class result batch? Once approved, official report cards will be released to parents.',
      ))
    )
      return;
    try {
      setProcessingId(batchId);
      await api.post(`/academics/results/batches/${batchId}/approve`, {});
      await showAlert('Result batch approved successfully!', { type: 'success' });
      fetchClassResultData();
      fetchQueues();
    } catch (err: any) {
      await showAlert(err.message || 'Approval failed.', { type: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectOrResetBatchById = async (batchId: string) => {
    if (
      !(await showConfirm(
        'Are you sure you want to REJECT / RESET this compilation? This will revert the results to draft status so subject teachers can make corrections.',
      ))
    )
      return;
    try {
      setProcessingId(batchId);
      await api.delete(`/academics/results/reset/${batchId}`);
      await showAlert('Result compilation has been reset to draft for teacher corrections.', {
        type: 'info',
      });
      fetchClassResultData();
      fetchQueues();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to reset results.', { type: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewBatchModal = async (batch: ResultBatch) => {
    setSelectedBatchModal(batch);
    setLoadingModalResults(true);
    setEditingRemarks({});
    try {
      const data = await api.get(`/academics/results/batches/${batch.id}`);
      const list = Array.isArray(data) ? data : [];
      setBatchResultsModal(list);
      const initialRemarks: any = {};
      list.forEach((r: StudentResultItem) => {
        initialRemarks[r.id] = {
          pRemark: r.principalRemarks || '',
          tRemark: r.classTeacherRemarks || '',
        };
      });
      setEditingRemarks(initialRemarks);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load results for review.');
      setSelectedBatchModal(null);
    } finally {
      setLoadingModalResults(false);
    }
  };

  const handleSaveModalAndApprove = async () => {
    if (!selectedBatchModal) return;
    if (
      !(await showConfirm('Are you sure you want to save remarks and approve this result batch?'))
    )
      return;
    try {
      setProcessingId(selectedBatchModal.id);
      for (const resultId of Object.keys(editingRemarks)) {
        await api.put('/academics/results/remarks', {
          studentResultId: resultId,
          principalRemarks: editingRemarks[resultId].pRemark,
          classTeacherRemarks: editingRemarks[resultId].tRemark,
        });
      }

      await api.post(`/academics/results/batches/${selectedBatchModal.id}/approve`, {});
      showAlert('Result batch approved successfully.', { type: 'success' });
      setSelectedBatchModal(null);
      fetchQueues();
      if (selectedClassId) fetchClassResultData();
    } catch (err: any) {
      showAlert(err.message || 'Approval failed.', { type: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprovePromotion = async (batchId: string) => {
    if (
      !(await showConfirm(
        'Are you sure you want to approve this promotion batch? This action is irreversible.',
      ))
    )
      return;
    try {
      setProcessingId(batchId);
      await api.post('/academics/promotion/approve', { batchId });
      showAlert('Promotion batch approved successfully.', { type: 'success' });
      fetchQueues();
    } catch (err: any) {
      showAlert(err.message || 'Approval failed.', { type: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  // Metrics for current selected class
  const rawResults = classData?.results || [];
  const filteredClassResults = [...rawResults]
    .filter((r) => {
      const text = `${r.studentName} ${r.positionInClass} ${r.averageScore}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => a.positionInClass - b.positionInClass);

  const totalClassStudents = rawResults.length;
  const classAvg =
    totalClassStudents > 0
      ? (rawResults.reduce((acc, curr) => acc + curr.averageScore, 0) / totalClassStudents).toFixed(
          2,
        )
      : '0.00';
  const highestScore =
    totalClassStudents > 0 ? Math.max(...rawResults.map((r) => r.averageScore)).toFixed(2) : '0.00';

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || 'Class';

  return (
    <div
      className="approvals-page"
      style={{ padding: '24px', background: '#F8FAFC', minHeight: '100vh' }}
    >
      {/* ════════ EXECUTIVE PAGE HEADER ════════ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={28} color="#000080" /> Approval Management
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
            Executive Governance Hub: Retrieve compiled class results and student promotions to
            authorize or reject batch releases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/dashboard/operations/promotions"
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              padding: '10px 16px',
              textDecoration: 'none',
            }}
          >
            <TrendingUp size={16} /> Promotion Approvals
          </Link>
        </div>
      </div>

      {/* ════════ MAIN TABS ════════ */}
      <div
        className="tabs-container"
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '24px',
        }}
      >
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'results' ? '#000080' : '#64748B',
            borderBottom: activeTab === 'results' ? '3px solid #000080' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Award size={18} /> Result Approval
          {resultBatches.length > 0 && (
            <span
              style={{
                background: '#EF4444',
                color: '#FFF',
                fontSize: '0.75rem',
                borderRadius: '12px',
                padding: '2px 8px',
                fontWeight: 800,
              }}
            >
              {resultBatches.length} Pending
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'promotions' ? '#000080' : '#64748B',
            borderBottom:
              activeTab === 'promotions' ? '3px solid #000080' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={18} /> Promotion Approval
          {promotionBatches.length > 0 && (
            <span
              style={{
                background: '#3B82F6',
                color: '#FFF',
                fontSize: '0.75rem',
                borderRadius: '12px',
                padding: '2px 8px',
                fontWeight: 800,
              }}
            >
              {promotionBatches.length} Pending
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'history' ? '#000080' : '#64748B',
            borderBottom: activeTab === 'history' ? '3px solid #000080' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={18} /> Audit History
        </button>
      </div>

      {activeTab === 'results' && (
        <>
          {/* ════════ CLASS RESULT QUERY CONTROLS ════════ */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '20px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
            >
              <Filter size={18} color="#000080" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Retrieve Compiled Class Results for Approval
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  SELECT CLASS
                </label>
                <select
                  className="form-control"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                  }}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.level ? `(${c.level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  ACADEMIC SESSION
                </label>
                <select
                  className="form-control"
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                  }}
                >
                  {getSessionOptions().map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  ACADEMIC TERM
                </label>
                <select
                  className="form-control"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontWeight: 600,
                  }}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>

              <div>
                <button
                  onClick={fetchClassResultData}
                  disabled={loadingClassResults}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Search size={16} /> Fetch Class Broadsheet
                </button>
              </div>
            </div>
          </div>

          {/* ════════ COMPILED CLASS RESULTS DISPLAY ════════ */}
          {loadingClassResults ? (
            <div
              style={{
                background: '#FFFFFF',
                padding: '40px',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1px solid #E2E8F0',
              }}
            >
              <p style={{ color: '#64748B', fontWeight: 600, margin: 0 }}>
                Retrieving compiled class results...
              </p>
            </div>
          ) : classResultError ? (
            <div
              style={{
                background: '#FFFBEB',
                padding: '24px',
                borderRadius: '14px',
                border: '1px solid #FCD34D',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <Clock size={32} color="#D97706" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 6px 0', color: '#92400E', fontWeight: 800 }}>
                No Compiled Results Found for {selectedClassName}
              </h4>
              <p style={{ margin: 0, color: '#B45309', fontSize: '0.88rem' }}>{classResultError}</p>
            </div>
          ) : (
            classData && (
              <div style={{ marginBottom: '32px' }}>
                {/* Executive Stat Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          TOTAL CLASS STUDENTS
                        </span>
                        <h2
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            margin: '4px 0 0 0',
                          }}
                        >
                          {totalClassStudents}
                        </h2>
                      </div>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={22} color="#000080" />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          CLASS AVERAGE SCORE
                        </span>
                        <h2
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            margin: '4px 0 0 0',
                          }}
                        >
                          {classAvg}%
                        </h2>
                      </div>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#ECFDF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingUp size={22} color="#10B981" />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          HIGHEST SCORE (1ST)
                        </span>
                        <h2
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: '#0F172A',
                            margin: '4px 0 0 0',
                          }}
                        >
                          {highestScore}%
                        </h2>
                      </div>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Award size={22} color="#D97706" />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#64748B',
                            textTransform: 'uppercase',
                          }}
                        >
                          BATCH APPROVAL STATUS
                        </span>
                        <div style={{ marginTop: '6px' }}>
                          {classData.status === 'Approved' ? (
                            <span
                              style={{
                                background: '#DCFCE7',
                                color: '#15803D',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <CheckCircle size={14} /> Approved
                            </span>
                          ) : (
                            <span
                              style={{
                                background: '#FEF3C7',
                                color: '#B45309',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Clock size={14} /> Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#F3E8FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShieldCheck size={22} color="#7C3AED" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Banner for Principal */}
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <h4
                      style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}
                    >
                      Results for {selectedClassName} ({filterTerm} - {filterSession})
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Review positions and averages below. Click Approve to finalize or Reject to
                      send back for corrections.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleRejectOrResetBatchById(classData.batchId)}
                      disabled={processingId === classData.batchId}
                      style={{
                        background: '#FEF2F2',
                        color: '#EF4444',
                        border: '1px solid #FCA5A5',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RotateCcw size={16} /> Reject / Reset Compilation
                    </button>

                    <button
                      onClick={() => handleApproveBatchById(classData.batchId)}
                      disabled={
                        processingId === classData.batchId || classData.status === 'Approved'
                      }
                      style={{
                        background: classData.status === 'Approved' ? '#94A3B8' : '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: classData.status === 'Approved' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle size={16} />{' '}
                      {classData.status === 'Approved'
                        ? 'Already Approved'
                        : 'Approve Class Results'}
                    </button>
                  </div>
                </div>

                {/* Broadsheet Table */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ position: 'relative', width: '300px' }}>
                      <Search
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94A3B8',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search student by name or rank..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 36px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        fontSize: '0.88rem',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            color: '#475569',
                            fontWeight: 700,
                          }}
                        >
                          <th style={{ padding: '12px 16px' }}>STUDENT NAME</th>
                          <th style={{ padding: '12px 16px' }}>TOTAL SCORE</th>
                          <th style={{ padding: '12px 16px' }}>TERM AVERAGE</th>
                          <th style={{ padding: '12px 16px' }}>CLASS POSITION</th>
                          <th style={{ padding: '12px 16px' }}>STATUS</th>
                          <th style={{ padding: '12px 16px' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClassResults.map((st) => (
                          <tr key={st.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                              {st.studentName}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B' }}>
                              {st.totalScore.toFixed(2)}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#000080' }}>
                              {st.averageScore.toFixed(2)}%
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                }}
                              >
                                Position {st.positionInClass}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                }}
                              >
                                ● {classData.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <Link
                                to={`/dashboard/reports/result/${st.studentId}/${classData.batchId || 'latest'}?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`}
                                target="_blank"
                                style={{
                                  color: '#000080',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <FileText size={14} /> View Report
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ════════ PENDING QUEUE LIST ════════ */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '24px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0F172A',
              }}
            >
              Pending Result Approval Queue ({resultBatches.length})
            </h3>

            {loadingQueues ? (
              <p style={{ color: '#64748B' }}>Loading approval queue...</p>
            ) : resultBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <CheckCircle size={36} color="#10B981" style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', color: '#0F172A', fontWeight: 700 }}>
                  All Caught Up!
                </h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                  There are no pending result batches waiting for approval.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        color: '#475569',
                        fontWeight: 700,
                      }}
                    >
                      <th style={{ padding: '12px 16px' }}>CLASS</th>
                      <th style={{ padding: '12px 16px' }}>ACADEMIC TERM</th>
                      <th style={{ padding: '12px 16px' }}>STUDENTS</th>
                      <th style={{ padding: '12px 16px' }}>SUBMITTED DATE</th>
                      <th style={{ padding: '12px 16px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultBatches.map((batch) => (
                      <tr key={batch.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                          {batch.className}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {batch.term} - {batch.session}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                          {batch.studentCount}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          {new Date(batch.submittedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReviewBatchModal(batch)}
                            style={{
                              fontWeight: 700,
                              padding: '6px 14px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Review & Edit Remarks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'promotions' && (
        <div
          style={{
            background: '#FFFFFF',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Student Promotion Approvals
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                Review and approve end-of-session student promotion batches.
              </p>
            </div>

            <Link
              to="/dashboard/operations/promotions"
              className="btn btn-primary"
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Open Student Promotions <ArrowRight size={16} />
            </Link>
          </div>

          {promotionBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <CheckCircle size={36} color="#10B981" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0', color: '#0F172A', fontWeight: 700 }}>
                No Pending Promotion Batches
              </h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                All promotion requests have been processed.
              </p>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.88rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>FROM CLASS</th>
                  <th style={{ padding: '12px 16px' }}>TO CLASS</th>
                  <th style={{ padding: '12px 16px' }}>SESSION</th>
                  <th style={{ padding: '12px 16px' }}>RECOMMENDATIONS</th>
                  <th style={{ padding: '12px 16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {promotionBatches.map((batch) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {batch.className}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {batch.nextClassName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{batch.session}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {batch.recommendationCount} students
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprovePromotion(batch.id)}
                        disabled={processingId === batch.id}
                        style={{
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {processingId === batch.id ? 'Approving...' : 'Approve Promotion'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div
          style={{
            background: '#FFFFFF',
            padding: '24px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
          }}
        >
          <h3
            style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}
          >
            Approval Audit History Log
          </h3>
          {approvalHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <Clock size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0', color: '#0F172A', fontWeight: 700 }}>
                No Approval History Found
              </h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                Completed approvals will be logged here.
              </p>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.88rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>TYPE</th>
                  <th style={{ padding: '12px 16px' }}>CLASS</th>
                  <th style={{ padding: '12px 16px' }}>SESSION</th>
                  <th style={{ padding: '12px 16px' }}>DETAILS</th>
                  <th style={{ padding: '12px 16px' }}>APPROVED BY</th>
                  <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {approvalHistory.map((history, idx) => (
                  <tr
                    key={`${history.batchId}-${idx}`}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: history.type === 'Result' ? '#EFF6FF' : '#F3E8FF',
                          color: history.type === 'Result' ? '#1D4ED8' : '#7C3AED',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        {history.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {history.className}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{history.session}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{history.details}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{history.approvedBy}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {new Date(history.approvedAt).toLocaleDateString()}{' '}
                      {new Date(history.approvedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedBatchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}
            >
              Review & Approve Results: {selectedBatchModal.className}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748B' }}>
              Inspect student grades and edit Principal remarks before authorising release.
            </p>

            {loadingModalResults ? (
              <p style={{ color: '#64748B' }}>Loading class roster...</p>
            ) : (
              <div
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  marginBottom: '20px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        color: '#475569',
                        fontWeight: 700,
                      }}
                    >
                      <th style={{ padding: '12px 16px' }}>STUDENT</th>
                      <th style={{ padding: '12px 16px' }}>AVG %</th>
                      <th style={{ padding: '12px 16px' }}>POS</th>
                      <th style={{ padding: '12px 16px' }}>PRINCIPAL REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...batchResultsModal]
                      .sort((a, b) => a.studentName.localeCompare(b.studentName))
                      .map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{r.studentName}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#000080' }}>
                            {r.averageScore}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                            {r.positionInClass}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <input
                              type="text"
                              style={{
                                border: '1px solid #CBD5E1',
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                              }}
                              value={editingRemarks[r.id]?.pRemark || ''}
                              onChange={(e) =>
                                setEditingRemarks({
                                  ...editingRemarks,
                                  [r.id]: { ...editingRemarks[r.id], pRemark: e.target.value },
                                })
                              }
                              placeholder="Enter principal remark..."
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedBatchModal(null)}
                disabled={processingId === selectedBatchModal.id}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveModalAndApprove}
                disabled={processingId === selectedBatchModal.id || loadingModalResults}
                style={{ fontWeight: 700, padding: '10px 20px' }}
              >
                {processingId === selectedBatchModal.id
                  ? 'Approving...'
                  : 'Save Remarks & Approve Class Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
