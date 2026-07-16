import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import './ParentHub.css';

interface Kid {
  id: string;
  firstName: string;
  surname: string;
  registrationNumber: string;
  className: string;
  passportUrl: string | null;
}

interface Invoice {
  id: string;
  term: string;
  session: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  dueDate: string;
}

interface TranscriptTerm {
  session: string;
  term: string;
  class: string;
}

import ReportCard from '../../../components/ReportCard';
import { useDialog } from '../../../context/DialogContext';


export default function ParentHub() {
  const { showAlert } = useDialog();

  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'attendance' | 'finance'>('results');
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptTerm[]>([]);
  const [selectedReport, setSelectedReport] = useState<{session: string, term: string} | null>(null);
  
  const [uploadingForInvoice, setUploadingForInvoice] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bankRef, setBankRef] = useState('');

  useEffect(() => {
    fetchMyKids();
  }, []);

  useEffect(() => {
    if (selectedKid) {
      fetchInvoices(selectedKid.id);
      if (activeTab === 'results') fetchTranscripts(selectedKid.id);
    }
  }, [selectedKid, activeTab]);

  const fetchTranscripts = async (studentId: string) => {
    try {
      const data = await api.get(`/academics/students/${studentId}/transcript`);
      if (data && data.transcript) {
        setTranscripts(data.transcript);
      } else {
        setTranscripts([]);
      }
    } catch (error) {
      console.error('Failed to fetch transcripts', error);
      setTranscripts([]);
    }
  };

  const fetchMyKids = async () => {
    try {
      const data = await api.get('/parents/my-kids');
      setKids(data || []);
      if (data && data.length > 0) {
        setSelectedKid(data[0]);
      }
    } catch (error) {
      console.error('Failed to load kids', error);
    }
  };

  const fetchInvoices = async (studentId: string) => {
    try {
      const data = await api.get(`/parents/my-kids/${studentId}/invoices`);
      setInvoices(data?.invoices || []);
      setReceipts(data?.receipts || []);
    } catch (error: any) {
      console.error('Failed to fetch invoices', error);
      showAlert('Error loading invoices: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUploadProof = async (invoiceId: string) => {
    if (!proofFile) {
      showAlert("Please select a file first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      if (bankRef) formData.append('bankReference', bankRef);
      formData.append('invoiceId', invoiceId);

      await api.post('/finance/upload-proof', formData);
      showAlert('Proof of payment uploaded successfully. Awaiting verification.');
      setUploadingForInvoice(null);
      setProofFile(null);
      setBankRef('');
      if (selectedKid) fetchInvoices(selectedKid.id);
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to upload proof.');
    }
  };

  return (
    <div className="parent-hub-page">
      <div className="page-header">
        <h1 className="page-title">Parent Portal</h1>
        <p className="page-subtitle">Track your children's academic progress and manage school fees.</p>
      </div>

      <div className="parent-hub-grid">
        {/* Sidebar: My Kids */}
        <div className="sidebar-panel">
          <h3 style={{ marginBottom: '1rem' }}>My Kids</h3>
          {kids.length === 0 ? (
            <p className="text-muted">No children linked to your account.</p>
          ) : (
            <div className="kid-list">
              {kids.map(kid => (
                <div 
                  key={kid.id} 
                  className={`kid-item ${selectedKid?.id === kid.id ? 'active' : ''}`}
                  onClick={() => setSelectedKid(kid)}
                >
                  <div className="kid-avatar">👦</div>
                  <div>
                    <span className="kid-name">{kid.firstName} {kid.surname}</span>
                    <span className="kid-meta">{kid.className} | {kid.registrationNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="main-panel">
          {!selectedKid ? (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <h3>Select a child</h3>
              <p>Choose a child from the sidebar to view their details.</p>
            </div>
          ) : (
            <>
              <div className="tabs-container">
                <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Academic Results</button>
                <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>Attendance</button>
                <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>Finance & Invoices</button>
              </div>

              {/* RESULTS TAB */}
              {activeTab === 'results' && (
                <div className="tab-content fade-in">
                  <div className="result-card">
                    <h3>Available Report Cards</h3>
                    <p>Report cards become available here once approved by the Principal.</p>
                    
                    {transcripts.length === 0 ? (
                      <p className="text-muted" style={{ marginTop: '1rem' }}>No approved results available yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                        {transcripts.map((t, idx) => {
                          const hasPendingFees = invoices.some(inv => inv.status !== 'Completed');
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px 15px', borderRadius: '8px', border: '1px solid #eee' }}>
                              <div>
                                <strong>{t.session} - {t.term}</strong>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Class: {t.class}</div>
                              </div>
                              {hasPendingFees ? (
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ color: '#dc3545', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                    ⚠️ Pending Fees
                                  </span>
                                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('finance')}>
                                    Clear pending fees
                                  </button>
                                </div>
                              ) : (
                                <button className="btn btn-primary" onClick={() => setSelectedReport({ session: t.session, term: t.term })}>
                                  👁️ View Report Sheet
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === 'attendance' && (
                <div className="tab-content fade-in">
                  <div className="result-card">
                    <h3>Attendance Record</h3>
                    <p>View daily attendance and punctuality.</p>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-light)', margin: '1rem 0' }}>95%</div>
                    <p className="text-muted">Present for 45 out of 48 school days this term.</p>
                  </div>
                </div>
              )}

              {/* FINANCE TAB */}
              {activeTab === 'finance' && (
                <div className="tab-content fade-in">
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                    <button 
                      style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-dark)', borderBottom: '2px solid var(--primary-dark)' }}
                    >
                      Outstanding Invoices
                    </button>
                  </div>

                  <h3 style={{ marginBottom: '1rem' }}>Outstanding Invoices</h3>
                  {invoices.length === 0 ? (
                    <p className="text-muted">No invoices found for this term.</p>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="invoice-card">
                        <div className="invoice-details">
                          <h4>{inv.term} Term School Fees ({inv.session || 'Current'})</h4>
                          <p className="text-muted" style={{ margin: '0.25rem 0' }}>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
                          <span className={`status-badge ${inv.status?.toLowerCase() === 'completed' ? 'status-paid' : 'status-pending'}`}>
                            {inv.status || 'Pending'}
                          </span>
                        </div>
                        <div className="invoice-actions" style={{ textAlign: 'right' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>₦{inv.totalAmount?.toLocaleString() || 0}</h3>
                          
                          {inv.status !== 'Completed' && uploadingForInvoice !== inv.id && (
                            <button className="btn btn-primary btn-sm" onClick={() => setUploadingForInvoice(inv.id)}>
                              Upload Payment Proof
                            </button>
                          )}

                          {uploadingForInvoice === inv.id && (
                            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'left' }}>
                              <h5 style={{ marginTop: 0 }}>Submit Proof</h5>
                              <input type="text" className="form-control" placeholder="Bank Reference (Optional)" value={bankRef} onChange={e => setBankRef(e.target.value)} style={{ marginBottom: '0.5rem' }} />
                              <input type="file" accept="image/*,.pdf" className="form-control" onChange={e => setProofFile(e.target.files?.[0] || null)} style={{ marginBottom: '0.5rem' }} />
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleUploadProof(inv.id)}>Submit</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setUploadingForInvoice(null)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <h3 style={{ marginTop: '2rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>Payment Receipts</h3>
                  {receipts && receipts.length === 0 ? (
                    <p className="text-muted">No receipts found.</p>
                  ) : (
                    receipts && receipts.map((rec: any) => (
                      <div key={rec.id} className="invoice-card" style={{ background: '#f8f9fa' }}>
                        <div className="invoice-details">
                          <h4>Receipt #{rec.receiptNumber || 'Pending'}</h4>
                          <p className="text-muted" style={{ margin: '0.25rem 0' }}>Uploaded: {new Date(rec.uploadedAt).toLocaleDateString()}</p>
                          <span className={`status-badge ${rec.status?.toLowerCase() === 'verified' ? 'status-paid' : 'status-pending'}`}>
                            {rec.status}
                          </span>
                        </div>
                        <div className="invoice-actions" style={{ textAlign: 'right' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>₦{rec.verifiedAmount?.toLocaleString() || '---'}</h3>
                          <a href={`/dashboard/finance/receipt/${rec.invoiceId}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                            View Receipt
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {selectedReport && selectedKid && (
        <ReportCard 
          studentId={selectedKid.id} 
          session={selectedReport.session} 
          term={selectedReport.term} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
}
