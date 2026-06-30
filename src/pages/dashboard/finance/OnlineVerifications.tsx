import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import './Finance.css';

interface PendingPayment {
  id: string;
  uploadedBy: string;
  bankReference: string;
  proofUrl: string;
  uploadedAt: string;
  targetStudent: string;
}

export default function OnlineVerifications() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);

  // Verification Form State
  const [isApproved, setIsApproved] = useState(true);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/finance/payment-proofs/pending');
      setPendingPayments(data);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    
    setProcessing(true);
    try {
      await api.post(`/finance/payment-proofs/${selectedPayment.id}/verify`, {
        receiptId: selectedPayment.id,
        isApproved,
        verifiedAmount: isApproved ? verifiedAmount : 0,
        remarks,
        allocatedInvoiceId: null
      });
      alert(`Payment ${isApproved ? 'verified' : 'queried'} successfully.`);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      alert("Verification failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setIsApproved(true);
    setVerifiedAmount(0);
    setRemarks('');
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Online Verifications</h1>
          <p className="page-subtitle">Verify and approve parent payment uploads.</p>
        </div>
      </div>

      <div className="glass-panel fade-in">
        <h2 className="section-title">Pending Payment Verifications</h2>
        
        {loading ? (
          <p className="loading-text">Loading queues...</p>
        ) : pendingPayments.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💸</span>
            <h3>No pending payments</h3>
            <p>All parent payment uploads have been verified.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Parent Email</th>
                <th>Target Student</th>
                <th>Bank Ref</th>
                <th>Date Uploaded</th>
                <th>Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map(payment => (
                <tr key={payment.id}>
                  <td>{payment.uploadedBy}</td>
                  <td><strong>{payment.targetStudent}</strong></td>
                  <td>{payment.bankReference || 'N/A'}</td>
                  <td>{new Date(payment.uploadedAt).toLocaleDateString()}</td>
                  <td>
                    <a href={`${API_ROOT}${payment.proofUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      View Receipt
                    </a>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal(payment)}>
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPayment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Verify Payment Proof</h2>
              <button className="close-btn" onClick={() => setSelectedPayment(null)}>×</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', gap: '2rem' }}>
              <div className="receipt-preview" style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                <img 
                  src={`${API_ROOT}${selectedPayment.proofUrl}`} 
                  alt="Receipt Proof" 
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                />
              </div>

              <form onSubmit={handleVerify} style={{ flex: 1 }}>
                <div className="form-group">
                  <label>Verification Action</label>
                  <select 
                    value={isApproved ? "approve" : "query"} 
                    onChange={(e) => setIsApproved(e.target.value === 'approve')}
                    className="form-control"
                  >
                    <option value="approve">Approve & Verify Funds</option>
                    <option value="query">Reject & Query Parent</option>
                  </select>
                </div>

                {isApproved && (
                  <div className="form-group">
                    <label>Verified Amount Received</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={verifiedAmount} 
                      onChange={(e) => setVerifiedAmount(Number(e.target.value))}
                      className="form-control"
                      required 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Remarks / Reason (Sent to Parent)</label>
                  <textarea 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)}
                    className="form-control"
                    rows={3}
                    required={!isApproved}
                    placeholder={isApproved ? "Optional note..." : "Reason for rejection..."}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedPayment(null)}>Cancel</button>
                  <button type="submit" className={isApproved ? "btn btn-primary" : "btn btn-danger"} disabled={processing}>
                    {processing ? "Processing..." : (isApproved ? "Confirm Verification" : "Send Query")}
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
