import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
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

  useEffect(() => {
    fetchResults();
  }, [filterSession, filterTerm]);

  return (
    <div className="management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Review Class Results</h1>
          <p className="page-subtitle">View and preview the compiled results for your assigned class.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
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
              {data.results.map(r => (
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
