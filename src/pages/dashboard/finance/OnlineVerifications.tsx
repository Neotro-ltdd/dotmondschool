import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import './OnlineVerifications.css';
import { useDialog } from '../../../context/DialogContext';
import {
  FileCheck2,
  Search,
  UserCheck,
  CheckCircle2,
  X,
  Printer,
  Receipt,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  Send,
  Building2,
} from 'lucide-react';

interface PendingPayment {
  id: string;
  uploadedBy: string;
  parentName?: string;
  bankReference: string;
  proofUrl: string;
  uploadedAt: string;
  invoiceId?: string;
  studentId?: string;
  targetStudent: string;
  registrationNumber?: string;
  className?: string;
  session?: string;
  term?: string;
  amountDue?: number;
  amountPaid?: number;
  balance?: number;
  verifiedAmount?: number;
  remarks?: string;
}

export default function OnlineVerifications() {
  const { showAlert } = useDialog();

  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Verification Form State
  const [isApproved, setIsApproved] = useState(true);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [excludeOptional, setExcludeOptional] = useState(false);
  const [optionalDeduction, setOptionalDeduction] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/finance/payment-proofs/pending');
      setPendingPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openDrawer = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setIsApproved(true);
    setVerifiedAmount(payment.balance || payment.amountDue || 0);
    setRemarks(payment.remarks || 'Bank credit verified by Accountant.');
    setExcludeOptional(false);
    setOptionalDeduction(0);
    setReceiptData(null);
    setShowDrawer(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const response = await api.post(`/finance/payment-proofs/${selectedPayment.id}/verify`, {
        receiptId: selectedPayment.id,
        isApproved,
        verifiedAmount: isApproved ? verifiedAmount : 0,
        remarks,
        allocatedInvoiceId: selectedPayment.invoiceId || null,
        excludedOptionalDeduction: excludeOptional ? optionalDeduction : 0,
      });

      if (isApproved) {
        showAlert('Payment verified and approved! Official receipt has been issued.');
        setReceiptData({
          studentName: selectedPayment.targetStudent,
          regNumber: selectedPayment.registrationNumber,
          className: selectedPayment.className,
          term: selectedPayment.term,
          session: selectedPayment.session,
          amountPaid: verifiedAmount,
          receiptNo: selectedPayment.id.substring(0, 8).toUpperCase(),
          invoiceId: selectedPayment.invoiceId,
        });
      } else {
        showAlert('Payment receipt queried and rejection notification sent to parent.');
        setShowDrawer(false);
        setSelectedPayment(null);
      }

      fetchPayments(); // Refresh list
    } catch (err: any) {
      showAlert('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const getStudentInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  const openReceipt = (invoiceId?: string) => {
    if (invoiceId) {
      window.open(`/dashboard/finance/receipt/${invoiceId}`, '_blank');
    }
  };

  // Filter pending payments
  const filteredPayments = pendingPayments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.targetStudent && p.targetStudent.toLowerCase().includes(q)) ||
      (p.registrationNumber && p.registrationNumber.toLowerCase().includes(q)) ||
      (p.uploadedBy && p.uploadedBy.toLowerCase().includes(q)) ||
      (p.parentName && p.parentName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="verify-page-container">
      {/* Page Header */}
      <div className="verify-page-header">
        <div>
          <h1 className="verify-page-title">
            <FileCheck2 size={28} color="#000080" />
            Online Payment Verifications
          </h1>
          <p className="verify-page-subtitle">
            Review parent portal bank transfer uploads, verify bank credit, and generate official
            receipts
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="verify-metrics-grid">
        <div className="verify-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">PENDING VERIFICATIONS</span>
            <span className="metric-number">{pendingPayments.length} Uploads</span>
          </div>
          <div className="metric-icon-badge pending">
            <Clock size={24} />
          </div>
        </div>

        <div className="verify-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">BANK CREDIT RULE</span>
            <span className="metric-number" style={{ fontSize: '1.1rem' }}>
              Verify Credit First
            </span>
          </div>
          <div className="metric-icon-badge audit">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="verify-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">RECEIPT ISSUANCE</span>
            <span className="metric-number" style={{ fontSize: '1.1rem', color: '#047857' }}>
              Instant Auto-Generate
            </span>
          </div>
          <div className="metric-icon-badge receipt">
            <Receipt size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="verify-table-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              📋 Pending Payment Proof Queue
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              All payments uploaded by parents via the Parent Portal appear here for accountant
              audit.
            </span>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
              size={16}
            />
            <input
              type="text"
              className="select-filter-input"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
              placeholder="Search student or parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
            Loading pending payment proofs queue...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px border-dashed #CBD5E1',
              color: '#64748B',
            }}
          >
            <CheckCircle2 size={42} color="#16A34A" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              No Pending Verifications
            </h3>
            <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
              All parent payment uploads have been audited and verified.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="executive-verify-table">
              <thead>
                <tr>
                  <th>Target Student</th>
                  <th>Parent Info</th>
                  <th>Session & Term</th>
                  <th>Balance Due</th>
                  <th>Uploaded Date</th>
                  <th>Payment Proof</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          className="verify-student-avatar"
                          style={{
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            fontSize: '0.85rem',
                          }}
                        >
                          {getStudentInitials(payment.targetStudent)}
                        </div>
                        <div>
                          <strong
                            style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}
                          >
                            {payment.targetStudent}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Reg: {payment.registrationNumber || 'N/A'} •{' '}
                            {payment.className || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                        {payment.parentName || 'Parent'}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {payment.uploadedBy}
                      </span>
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {payment.session} - {payment.term}
                    </td>

                    <td style={{ color: '#DC2626', fontWeight: 800 }}>
                      ₦{(payment.balance || payment.amountDue || 0).toLocaleString()}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {new Date(payment.uploadedAt).toLocaleDateString()}
                    </td>

                    <td>
                      <a
                        href={`${API_ROOT}${payment.proofUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#000080',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ExternalLink size={13} /> View Slip
                      </a>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-review-verify" onClick={() => openDrawer(payment)}>
                        <FileCheck2 size={15} /> Review & Verify <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER FOR REVIEW & VERIFICATION */}
      {showDrawer && selectedPayment && (
        <>
          {/* Backdrop */}
          <div className="verify-slideover-backdrop" onClick={() => setShowDrawer(false)} />

          {/* Drawer Panel */}
          <div className="verify-slideover-drawer">
            {/* Drawer Header */}
            <div className="verify-slideover-header">
              <div className="verify-slideover-title-group">
                <div className="verify-student-avatar">
                  {getStudentInitials(selectedPayment.targetStudent)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedPayment.targetStudent}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: '#64748B',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginTop: '0.15rem',
                    }}
                  >
                    <span>
                      Reg No: <strong>{selectedPayment.registrationNumber || 'N/A'}</strong>
                    </span>
                    <span className="pos-class-badge">{selectedPayment.className || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button className="verify-slideover-close-btn" onClick={() => setShowDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="verify-slideover-body">
              {receiptData ? (
                /* Success Receipt Display */
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    background: '#ECFDF5',
                    borderRadius: '16px',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  <CheckCircle2 size={48} color="#047857" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ margin: 0, color: '#047857', fontWeight: 800 }}>
                    Payment Verified & Receipt Generated!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#065F46', marginTop: '0.4rem' }}>
                    Bank proof verified. Official Receipt <strong>#{receiptData.receiptNo}</strong>{' '}
                    has been issued for {receiptData.studentName}.
                  </p>

                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      margin: '1.25rem 0',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div>
                      Verified Amount: <strong>₦{receiptData.amountPaid.toLocaleString()}</strong>
                    </div>
                    <div>
                      Academic Term:{' '}
                      <strong>
                        {receiptData.session} - {receiptData.term}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="btn-pos-search"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => openReceipt(receiptData.invoiceId)}
                  >
                    <Printer size={18} /> View / Print Official Receipt
                  </button>
                </div>
              ) : (
                /* Review & Verify Form */
                <form
                  id="verifyForm"
                  onSubmit={handleVerify}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  {/* Payment Proof Preview Box */}
                  <div className="verify-proof-preview-card">
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: '#475569',
                          textTransform: 'uppercase',
                        }}
                      >
                        Uploaded Payment Proof Slip
                      </span>
                      <a
                        href={`${API_ROOT}${selectedPayment.proofUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.78rem',
                          color: '#000080',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <ExternalLink size={12} /> Full Screen Slip
                      </a>
                    </div>

                    <img
                      src={`${API_ROOT}${selectedPayment.proofUrl}`}
                      alt="Bank Proof Slip"
                      className="verify-proof-img"
                    />
                  </div>

                  <div
                    style={{
                      background: '#EFF6FF',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #BFDBFE',
                      fontSize: '0.85rem',
                      color: '#1E40AF',
                      display: 'flex',
                      gap: '0.6rem',
                    }}
                  >
                    <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      Verify credit in school bank account for{' '}
                      <strong>{selectedPayment.targetStudent}</strong> before approving.
                    </div>
                  </div>

                  {/* Payment Info Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      background: '#F8FAFC',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#64748B',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Parent Contact
                      </div>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '0.1rem' }}>
                        {selectedPayment.parentName || 'Parent'}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.78rem' }}>
                        {selectedPayment.uploadedBy}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: '#64748B',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Invoice & Balance
                      </div>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '0.1rem' }}>
                        {selectedPayment.session} ({selectedPayment.term})
                      </div>
                      <div style={{ color: '#DC2626', fontWeight: 800, fontSize: '0.9rem' }}>
                        Owes ₦
                        {(
                          selectedPayment.balance ||
                          selectedPayment.amountDue ||
                          0
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Selector */}
                  <div className="verify-form-group">
                    <label>Audit Verification Action *</label>
                    <select
                      value={isApproved ? 'approve' : 'query'}
                      onChange={(e) => setIsApproved(e.target.value === 'approve')}
                      className="select-filter-input"
                    >
                      <option value="approve">✅ Approve & Issue Official Receipt</option>
                      <option value="query">❌ Reject & Send Query to Parent</option>
                    </select>
                  </div>

                  {/* Verified Amount */}
                  {isApproved && (
                    <>
                      <div className="verify-form-group">
                        <label>Verified Amount Received (₦) *</label>
                        <input
                          type="number"
                          min="1"
                          value={verifiedAmount}
                          onChange={(e) => setVerifiedAmount(Number(e.target.value))}
                          className="select-filter-input"
                          required
                        />
                      </div>

                      {/* Optional Item Exclusion Checkbox */}
                      <div
                        style={{
                          background: '#FEF3C7',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid #FDE68A',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#B45309',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={excludeOptional}
                            onChange={(e) => {
                              setExcludeOptional(e.target.checked);
                              if (e.target.checked) setOptionalDeduction(10000);
                              else setOptionalDeduction(0);
                            }}
                          />
                          <span>🎁 Exclude Optional Item (e.g. Christmas Party ₦10,000)</span>
                        </label>
                        <span style={{ fontSize: '0.78rem', color: '#78350F' }}>
                          Check this if parent paid for compulsory fees but excluded optional items.
                          Approves invoice without querying parent.
                        </span>
                      </div>
                    </>
                  )}

                  {/* Remarks */}
                  <div className="verify-form-group">
                    <label>Accountant Audit Notes / Reason *</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="select-filter-input"
                      rows={3}
                      required={!isApproved}
                      placeholder={
                        isApproved
                          ? 'E.g., Verified credit in FirstBank account.'
                          : 'Reason for rejection (sent to parent)...'
                      }
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Drawer Footer */}
            {!receiptData && (
              <div className="verify-slideover-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDrawer(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  form="verifyForm"
                  type="submit"
                  className={isApproved ? 'btn-proxy-search' : 'btn btn-danger'}
                  disabled={processing}
                >
                  {isApproved ? <FileCheck2 size={18} /> : <Send size={16} />}
                  {processing
                    ? 'Processing...'
                    : isApproved
                      ? `Confirm Verification (₦${verifiedAmount.toLocaleString()})`
                      : 'Send Query to Parent'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
