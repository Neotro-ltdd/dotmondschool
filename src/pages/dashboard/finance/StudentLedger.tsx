import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import './Finance.css';

interface LedgerInvoice {
  id: string;
  session: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string;
  receiptNumber: string;
}

interface LedgerStudent {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  invoices: LedgerInvoice[];
  totalOwed: number;
}

export default function StudentLedger() {
  const navigate = useNavigate();
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [ledgerResults, setLedgerResults] = useState<LedgerStudent[]>([]);
  const [selectedLedgerStudent, setSelectedLedgerStudent] = useState<LedgerStudent | null>(null);

  const handleLedgerSearch = async () => {
    if (!ledgerSearchTerm.trim()) return;
    try {
      const data = await api.get(`/finance/student-ledger?q=${ledgerSearchTerm}`);
      setLedgerResults(data || []);
      setSelectedLedgerStudent(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Ledger</h1>
          <p className="page-subtitle">View full financial history and outstanding balances.</p>
        </div>
      </div>

      <div className="glass-panel fade-in" style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1, maxWidth: '350px' }}>
          <h2 className="section-title">Student Search</h2>
          <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Name or Reg No" 
              value={ledgerSearchTerm}
              onChange={e => setLedgerSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLedgerSearch()}
            />
            <button className="btn btn-primary" onClick={handleLedgerSearch}>Search</button>
          </div>

          {ledgerResults.length > 0 && (
            <div className="search-results" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {ledgerResults.map(student => (
                <div 
                  key={student.id} 
                  className={`kid-item ${selectedLedgerStudent?.id === student.id ? 'active' : ''}`}
                  onClick={() => setSelectedLedgerStudent(student)}
                  style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: selectedLedgerStudent?.id === student.id ? '1px solid var(--primary)' : '1px solid transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{student.name} ({student.registrationNumber})</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {student.className} • Total Owed: ₦{student.totalOwed.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 2 }}>
          <h2 className="section-title">Financial Status</h2>
          {!selectedLedgerStudent ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Select a student to view their full financial history.</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{selectedLedgerStudent.name}</h3>
                  <p className="text-muted">{selectedLedgerStudent.registrationNumber} • {selectedLedgerStudent.className}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Outstanding Balance</div>
                  <h2 style={{ margin: 0, color: selectedLedgerStudent.totalOwed > 0 ? '#ffc107' : '#28a745' }}>
                    ₦{selectedLedgerStudent.totalOwed.toLocaleString()}
                  </h2>
                </div>
              </div>

              <h4>Invoice History</h4>
              {selectedLedgerStudent.invoices.length === 0 ? (
                <p>No invoices found.</p>
              ) : (
                <table className="data-table" style={{ width: '100%', marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Term/Session</th>
                      <th>Amount Due</th>
                      <th>Amount Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Receipt No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLedgerStudent.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.term} {inv.session}</td>
                        <td>₦{inv.amountDue.toLocaleString()}</td>
                        <td>₦{inv.amountPaid.toLocaleString()}</td>
                        <td>₦{inv.balance.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${inv.paymentStatus.toLowerCase().replace(' ', '-')}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {inv.amountPaid > 0 ? (
                            <button 
                              className="btn btn-sm btn-outline" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => navigate(`/dashboard/finance/receipt/${inv.id}`)}
                            >
                              {inv.receiptNumber || 'View Receipt'}
                            </button>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
