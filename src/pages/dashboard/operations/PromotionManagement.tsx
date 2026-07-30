import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [nextSession, setNextSession] = useState('');
  const [minScore, setMinScore] = useState<number>(50);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [batchId, setBatchId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  // Override Modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRecId, setOverrideRecId] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('Promotable');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    // Default next session based on current year
    const year = new Date().getFullYear();
    setNextSession(`${year}/${year + 1}`);
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load classes.");
    }
  };

  const fetchReport = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.get(`/reports/academics/promotions/${id}`);
      setReport(data);
      setBatchId(id);
    } catch (err: any) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !nextSession) {
      alert("Please select a class and specify the next session.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setReport(null);
      
      const payload = {
        classId: selectedClassId,
        targetClassId: targetClassId || null, // null implies graduation if not selected
        nextSession: nextSession,
        minimumPromotionScore: minScore
      };
      
      const res = await api.post('/academics/promotion/batch', payload);
      if (res.batchId) {
        await fetchReport(res.batchId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate promotion list.");
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!batchId) return;
    if (!window.confirm("Are you sure you want to approve and execute these promotions? This action is permanent and will move students to their new classes.")) return;
    
    try {
      setLoading(true);
      await api.post('/academics/promotion/approve', { batchId });
      alert("Promotions executed successfully!");
      await fetchReport(batchId);
    } catch (err: any) {
      setError(err.message || "Failed to approve promotions.");
      setLoading(false);
    }
  };

  const openOverrideModal = (recId: string, currentDecision: string) => {
    setOverrideRecId(recId);
    setOverrideDecision(currentDecision);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("Please provide a reason for this override.");
      return;
    }
    try {
      setOverrideLoading(true);
      await api.post('/academics/promotion/override', {
        recommendationId: overrideRecId,
        newDecision: overrideDecision,
        reasonNote: overrideReason
      });
      setShowOverrideModal(false);
      if (batchId) {
        await fetchReport(batchId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to override.");
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <h1>Student Promotion Management</h1>
        <p>Generate promotion lists, review system recommendations, apply manual overrides, and execute end-of-year promotions.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-header">
          <h3>Generate Promotion Batch</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleGenerateList} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Current Class</label>
              <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required>
                <option value="">Select Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Next Session</label>
              <input type="text" className="form-control" placeholder="e.g. 2026/2027" value={nextSession} onChange={e => setNextSession(e.target.value)} required />
            </div>

            <div className="col-md-3">
              <label className="form-label">Next Class (Target)</label>
              <select className="form-select" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                <option value="">-- Graduating (Leave Empty) --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <small className="text-muted">Leave empty if class is graduating</small>
            </div>

            <div className="col-md-2">
              <label className="form-label">Min Score (%)</label>
              <input type="number" className="form-control" value={minScore} onChange={e => setMinScore(Number(e.target.value))} min="0" max="100" required />
            </div>

            <div className="col-md-1">
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? '...' : 'Generate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && !report && <div className="text-center py-5">Loading...</div>}

      {report && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3>Promotion Review: {report.class} ➡️ {report.nextClass} ({report.session})</h3>
            {report.status !== 'Approved' ? (
              <button className="btn btn-success" onClick={handleApprove} disabled={loading}>
                Approve & Execute Promotions
              </button>
            ) : (
              <span className="badge bg-success" style={{ fontSize: '1rem', padding: '10px' }}>✅ Approved & Executed</span>
            )}
          </div>
          
          <div className="card-body">
            <div className="row mb-4 text-center">
              <div className="col-md-2">
                <div className="p-3 border rounded bg-light">
                  <h4 className="m-0">{report.summary.totalStudents}</h4>
                  <small className="text-muted">Total Students</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded bg-light text-success">
                  <h4 className="m-0">{report.summary.promotableCount}</h4>
                  <small>Promotable</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded bg-light text-danger">
                  <h4 className="m-0">{report.summary.heldBackCount}</h4>
                  <small>Held Back</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded bg-light text-primary">
                  <h4 className="m-0">{report.summary.graduatingCount}</h4>
                  <small>Graduating</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded bg-light text-warning">
                  <h4 className="m-0">{report.summary.overridesCount}</h4>
                  <small>Manual Overrides</small>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>S/N</th>
                    <th>Student Name</th>
                    <th>Reg. Number</th>
                    <th>Annual Average</th>
                    <th>System Rec.</th>
                    <th>Final Decision</th>
                    <th>Status</th>
                    {report.status !== 'Approved' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((rec, idx) => (
                    <tr key={rec.recommendationId}>
                      <td>{idx + 1}</td>
                      <td>{rec.studentName}</td>
                      <td>{rec.registrationNumber}</td>
                      <td>
                        <span className={`badge ${rec.annualAverage >= minScore ? 'bg-success' : 'bg-danger'}`}>
                          {rec.annualAverage.toFixed(2)}%
                        </span>
                      </td>
                      <td>{rec.systemRecommendation}</td>
                      <td>
                        <strong>{rec.finalDecision}</strong>
                      </td>
                      <td>
                        {rec.hasOverride ? (
                          <span className="badge bg-warning text-dark" title={`Overridden by ${rec.overrideDetails?.principal}: ${rec.overrideDetails?.reason}`}>
                            Overridden
                          </span>
                        ) : (
                          <span className="badge bg-secondary">System</span>
                        )}
                      </td>
                      {report.status !== 'Approved' && (
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-primary"
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
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-backdrop-custom" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="m-0">Manual Promotion Override</h5>
              <button className="btn-close" onClick={() => setShowOverrideModal(false)}></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleOverrideSubmit}>
                <div className="mb-3">
                  <label className="form-label">New Final Decision</label>
                  <select className="form-select" value={overrideDecision} onChange={e => setOverrideDecision(e.target.value)} required>
                    <option value="Promotable">Promotable</option>
                    <option value="Held Back">Held Back</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Graduating">Graduating</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason for Override (Required)</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    value={overrideReason} 
                    onChange={e => setOverrideReason(e.target.value)} 
                    placeholder="e.g. Principal's discretion based on parent meeting"
                    required
                  ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={overrideLoading}>
                    {overrideLoading ? 'Saving...' : 'Save Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
