import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import '../students/Management.css'; 

interface StudentResultItem {
  id: string;
  studentId: string;
  studentName: string;
  totalScore: number;
  averageScore: number;
  positionInClass: number;
  principalRemarks: string;
  classTeacherRemarks: string;
}

interface BatchResultResponse {
  batchId: string;
  status: string;
  results: StudentResultItem[];
}

export default function TeacherResults() {
  const [data, setData] = useState<BatchResultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showConfirm, showAlert } = useDialog();

  // Filters
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/academics/teacher/class-results?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      
      if (!res.batchId || res.batchId === '00000000-0000-0000-0000-000000000000') {
          setData(null);
          setError("No results found or results have not been compiled yet for this term.");
      } else {
          setData(res);
      }
    } catch (err: any) {
      setData(null);
      setError(err.message || 'Failed to load class results.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!data?.batchId) return;
    
    const confirmed = await showConfirm(
      "Are you sure you want to reset and delete this compilation? This will return the class to a pre-compiled state."
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.delete(`/academics/results/reset/${data.batchId}`);
      await showAlert("Results have been successfully reset.", { type: 'success' });
      fetchResults();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to reset results.', { type: 'danger' });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [filterSession, filterTerm]);

  return (
    <div className="management-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Broadsheet & Results</h1>
          <p className="page-subtitle">Compile student assessment scores and submit for Admin Review.</p>
        </div>
        {data?.results && data.results.length > 0 && (
          <button className="btn btn-secondary" onClick={handleReset} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            Reset Compilation
          </button>
        )}
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            {getSessionOptions(filterSession).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem', color: '#dc3545' }}>{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading results...</p>
        ) : !data || !data.results || data.results.length === 0 ? (
          <p className="empty-text">No results available to review.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Total Score</th>
                <th>Average</th>
                <th>Position</th>
                <th>Batch Status</th>
              </tr>
            </thead>
            <tbody>
              {[...data.results].sort((a, b) => a.studentName.localeCompare(b.studentName)).map(r => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.studentName}</strong>
                    <br />
                    <a 
                      href={`/dashboard/reports/result/${r.studentId}/${data.batchId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      View Result
                    </a>
                  </td>
                  <td>{r.totalScore}</td>
                  <td>{r.averageScore}%</td>
                  <td>{r.positionInClass}</td>
                  <td>
                     <span className={`badge badge-${data.status === 'Approved' ? 'success' : 'warning'}`}>
                        {data.status}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
