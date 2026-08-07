import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './Reports.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'audit'>('overview');
  const { session, term, setSession, setTerm } = useActiveTerm();
  
  // Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [financeData, setFinanceData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const data = await api.get(`/reports/school/performance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      setOverviewData(data);
      setError(null);
    } catch (err: any) {
      setOverviewData(null);
      setError(err.message || "Failed to load overview report.");
    }
  };

  const fetchFinance = async () => {
    try {
      const data = await api.get(`/reports/finance/fee-clearance?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      setFinanceData(data);
      setError(null);
    } catch (err: any) {
      setFinanceData(null);
      setError(err.message || "Failed to load finance report.");
    }
  };

  const fetchAudit = async () => {
    try {
      const data = await api.get(`/reports/system/audit-logs`);
      setAuditData(data);
      setError(null);
    } catch (err: any) {
      setAuditData(null);
      setError(err.message || "Failed to load audit logs.");
    }
  };

  const loadCurrentTab = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'overview') await fetchOverview();
    if (activeTab === 'finance') await fetchFinance();
    if (activeTab === 'audit') await fetchAudit();
    setLoading(false);
  };

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reporting & Analytics</h1>
          <p className="page-subtitle">School intelligence, performance metrics, and system audits.</p>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          School Overview
        </button>
        <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
          Fee Clearance
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          System Audit Logs
        </button>
      </div>

      {(activeTab === 'overview' || activeTab === 'finance') && (
        <div className="report-controls">
          <div className="form-group">
            <label>Session</label>
            <select value={session} onChange={(e) => setSession(e.target.value)} className="session-term-control">
              {getSessionOptions(session).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="session-term-control">
              <option value="First">First Term</option>
              <option value="Second">Second Term</option>
              <option value="Third">Third Term</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadCurrentTab} disabled={loading}>
            {loading ? "Refreshing..." : "Generate Report"}
          </button>
        </div>
      )}

      <div className="tab-content glass-panel">
        {loading ? (
          <p className="loading-text">Generating report...</p>
        ) : error ? (
          <div className="empty-state">
            <span className="icon">⚠️</span>
            <h3>No Data Available</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && overviewData && (
              <div className="report-section">
                <div className="summary-cards">
                  <div className="stat-card">
                    <h3>School Avg Score</h3>
                    <div className="stat-value">{overviewData.summary.schoolAverageScore}%</div>
                  </div>
                  <div className="stat-card">
                    <h3>Total Classes Recorded</h3>
                    <div className="stat-value">{overviewData.summary.totalClassesRecorded}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Highest Performing</h3>
                    <div className="stat-value" style={{fontSize: '1.2rem', marginTop: '10px'}}>{overviewData.summary.highestPerformingClass || 'N/A'}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Lowest Performing</h3>
                    <div className="stat-value" style={{fontSize: '1.2rem', marginTop: '10px'}}>{overviewData.summary.lowestPerformingClass || 'N/A'}</div>
                  </div>
                </div>

                <h3>Class Performance Rankings</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Average Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.classPerformances.map((c: any) => (
                      <tr key={c.classId}>
                        <td><strong>{c.className}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                              <div style={{ width: `${c.averageScore}%`, background: 'var(--primary)', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                            <span>{c.averageScore}%</span>
                          </div>
                        </td>
                        <td><span className="badge badge-success">{c.dateApproved}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'finance' && financeData && (
              <div className="report-section">
                <div className="summary-cards">
                  <div className="stat-card">
                    <h3>Total Expected</h3>
                    <div className="stat-value">${financeData.summary.totalAmountExpected.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Total Received</h3>
                    <div className="stat-value" style={{color: 'var(--success)'}}>${financeData.summary.totalAmountReceived.toLocaleString()}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Fully Paid Students</h3>
                    <div className="stat-value">{financeData.summary.fullyPaidCount}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Unpaid / Debtor Count</h3>
                    <div className="stat-value" style={{color: 'var(--danger)'}}>{financeData.summary.unpaidCount}</div>
                  </div>
                </div>

                <h3>Student Fee Status List</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Amount Due</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeData.records.map((r: any) => (
                      <tr key={r.studentId}>
                        <td>
                          <strong>{r.studentName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.registrationNumber}</div>
                        </td>
                        <td>{r.class}</td>
                        <td>${r.amountDue.toLocaleString()}</td>
                        <td>${r.amountPaid.toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${r.status === 'Completed' ? 'success' : r.status === 'Pending' ? 'danger' : 'warning'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'audit' && auditData && (
              <div className="report-section">
                <h3>Recent System Activity ({auditData.summary.returnedRecords} records)</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.records.map((log: any) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td><span className="badge badge-info">{log.action}</span></td>
                        <td><strong>{log.entityName}</strong></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.newValues || log.oldValues || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
