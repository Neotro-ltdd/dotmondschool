import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './ProxyUpload.css';
import { useDialog } from '../../../context/DialogContext';
import {
  Upload,
  Search,
  UserCheck,
  CheckCircle2,
  X,
  Printer,
  Receipt,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  FileText,
  History,
  AlertCircle,
} from 'lucide-react';

interface PosReceipt {
  id: string;
  invoiceId: string;
  receiptNumber: string;
  amountPaid: number;
  date: string;
  session: string;
  term: string;
  method: string;
  remarks: string;
}

interface PosStudent {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  invoices: any[];
  receipts?: PosReceipt[];
}

export default function ProxyPaymentUpload() {
  const { showAlert } = useDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PosStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<PosStudent | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const [targetInvoiceId, setTargetInvoiceId] = useState<string | 'new'>('new');
  const {
    session: posSession,
    term: posTerm,
    setSession: setPosSession,
    setTerm: setPosTerm,
  } = useActiveTerm();
  const [posAmountDue, setPosAmountDue] = useState<number>(0);
  const [posAmountPaid, setPosAmountPaid] = useState<number>(0);
  const [directMethod, setDirectMethod] = useState('Transfer');
  const [directRemarks, setDirectRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const getSortedPendingInvoices = (student: PosStudent) => {
    interface TermOrderMap {
      [term: string]: number;
    }
    const termsOrder: TermOrderMap = { 'First Term': 1, 'Second Term': 2, 'Third Term': 3 };
    return (student.invoices || [])
      .filter((i) => i.paymentStatus !== 'Completed')
      .sort((a, b) => {
        if (a.session !== b.session) return a.session.localeCompare(b.session);
        return (termsOrder[a.term] || 99) - (termsOrder[b.term] || 99);
      });
  };

  const handleSelectStudent = (student: PosStudent) => {
    setSelectedStudent(student);
    setReceiptData(null);
    setShowDrawer(true);

    const pending = getSortedPendingInvoices(student);
    if (pending.length > 0) {
      const oldest = pending[0];
      setTargetInvoiceId(oldest.id);
      setPosTerm(oldest.term);
      setPosSession(oldest.session);
      setPosAmountDue(oldest.amountDue);
      setPosAmountPaid(oldest.balance);
    } else {
      setTargetInvoiceId('new');
      setPosTerm('First Term');
      setPosSession(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
      setPosAmountDue(0);
      setPosAmountPaid(0);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setSearching(true);
      const data = await api.get(`/finance/student-ledger?q=${searchTerm}`);
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleProxyUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || posAmountPaid <= 0 || posAmountDue <= 0 || !selectedFile) {
      showAlert('Please ensure all fields are filled and a payment proof file is uploaded.');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      if (targetInvoiceId !== 'new') {
        formData.append('invoiceId', targetInvoiceId);
      }
      formData.append('studentId', selectedStudent.id);
      formData.append('term', posTerm);
      formData.append('session', posSession);
      formData.append('amountDue', posAmountDue.toString());
      formData.append('amountPaid', posAmountPaid.toString());
      formData.append('method', directMethod);
      formData.append('remarks', directRemarks || 'Bank proof verified by Accountant.');
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ROOT}/api/finance/proxy-record`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();

      let msg = data.message;
      if (data.invoiceStatus === 'Completed') {
        msg += '\n\nPayment fully cleared! Official Receipt is now available.';
      } else {
        msg += `\n\nPart-Payment logged successfully.`;
      }
      showAlert(msg);

      setReceiptData({
        studentName: selectedStudent.name,
        regNumber: selectedStudent.registrationNumber,
        className: selectedStudent.className,
        term: posTerm,
        session: posSession,
        amountPaid: posAmountPaid,
        method: directMethod,
        date: new Date().toLocaleDateString(),
        receiptNo: data.receiptNumber || 'N/A',
        invoiceId: data.invoiceId,
      });

      setSelectedFile(null);
      handleSearch(); // Refresh pool
    } catch (err: any) {
      showAlert('Upload failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStudentInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  const openReceipt = (invoiceId: string) => {
    if (invoiceId) {
      window.open(`/dashboard/finance/receipt/${invoiceId}`, '_blank');
    }
  };

  return (
    <div className="proxy-page-container">
      {/* Page Header */}
      <div className="proxy-page-header">
        <div>
          <h1 className="proxy-page-title">
            <Upload size={28} color="#000080" />
            Proxy Payment Upload & Verification
          </h1>
          <p className="proxy-page-subtitle">
            Upload parent bank transfer slips (e.g. from WhatsApp), verify credit in bank account,
            and issue official receipts
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="proxy-metrics-grid">
        <div className="proxy-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">BANK PROOF VERIFICATION</span>
            <span className="metric-number">Direct Upload</span>
          </div>
          <div className="metric-icon-badge upload">
            <Upload size={24} />
          </div>
        </div>

        <div className="proxy-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">ACCOUNT AUDIT RULE</span>
            <span className="metric-number" style={{ fontSize: '1.1rem' }}>
              Verify Bank Credit
            </span>
          </div>
          <div className="metric-icon-badge verify">
            <FileCheck2 size={24} />
          </div>
        </div>

        <div className="proxy-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">SEARCH RESULT POOL</span>
            <span className="metric-number">{searchResults.length} Students</span>
          </div>
          <div className="metric-icon-badge students">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Student Search Section */}
      <div className="proxy-search-card">
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
          🔍 Student Lookup
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
          Type student name or registration number below (e.g. <strong>Mary Agboke</strong> or{' '}
          <strong>DOTJSS2-002</strong>) and click Search or press Enter.
        </p>

        <div className="proxy-search-bar-row">
          <div className="proxy-search-input-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by Student Name or Reg No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-proxy-search" onClick={handleSearch} disabled={searching}>
            <Search size={16} />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results Container */}
        {searchResults.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px border-dashed #CBD5E1',
              color: '#64748B',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>No student selected yet.</p>
            <span style={{ fontSize: '0.82rem' }}>
              Enter student details above to display matching student profiles.
            </span>
          </div>
        ) : (
          <div className="proxy-students-grid">
            {searchResults.map((student) => {
              const pendingInvoices = getSortedPendingInvoices(student);
              const totalDebt = pendingInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);
              const totalPaid = (student.invoices || []).reduce(
                (acc, inv) => acc + (inv.amountPaid || 0),
                0,
              );
              const receipts = student.receipts || [];
              const latestReceipt = receipts.length > 0 ? receipts[0] : null;

              return (
                <div
                  key={student.id}
                  className="proxy-student-card"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="proxy-student-header">
                    <div className="proxy-student-avatar">{getStudentInitials(student.name)}</div>
                    <div className="proxy-student-info">
                      <span className="proxy-student-name">{student.name}</span>
                      <div className="proxy-student-meta">
                        <span>
                          Reg No: <strong>{student.registrationNumber}</strong>
                        </span>
                        <span className="proxy-class-badge">{student.className || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Debt Summary */}
                  <div className="proxy-debt-summary">
                    <span>
                      Pending Invoices: <strong>{pendingInvoices.length}</strong>
                    </span>
                    {totalDebt > 0 ? (
                      <span className="proxy-debt-amount">Owes ₦{totalDebt.toLocaleString()}</span>
                    ) : (
                      <span className="proxy-no-debt">Cleared (₦0)</span>
                    )}
                  </div>

                  {/* Prior Payment & Receipt Badge if student paid part-payment previously */}
                  {(totalPaid > 0 || receipts.length > 0) && (
                    <div
                      className="proxy-previous-receipts-box"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="proxy-previous-receipt-head">
                        <span>💳 Prior Payments Logged</span>
                        <span style={{ fontWeight: 900 }}>₦{totalPaid.toLocaleString()}</span>
                      </div>

                      {latestReceipt ? (
                        <button
                          type="button"
                          className="btn-view-proxy-receipt"
                          onClick={() => openReceipt(latestReceipt.invoiceId)}
                        >
                          <Printer size={13} /> View Receipt #{latestReceipt.receiptNumber}
                        </button>
                      ) : (student.invoices || []).some((i) => i.amountPaid > 0) ? (
                        <button
                          type="button"
                          className="btn-view-proxy-receipt"
                          onClick={() => {
                            const paidInv = (student.invoices || []).find((i) => i.amountPaid > 0);
                            if (paidInv) openReceipt(paidInv.id);
                          }}
                        >
                          <Printer size={13} /> View Latest Payment Receipt
                        </button>
                      ) : null}
                    </div>
                  )}

                  <button type="button" className="btn-upload-verify-action">
                    <Upload size={16} /> Upload Proof & Verify <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER FOR UPLOAD & VERIFY FORM */}
      {showDrawer && selectedStudent && (
        <>
          {/* Backdrop */}
          <div className="proxy-slideover-backdrop" onClick={() => setShowDrawer(false)} />

          {/* Drawer Panel */}
          <div className="proxy-slideover-drawer">
            {/* Drawer Header */}
            <div className="proxy-slideover-header">
              <div className="proxy-slideover-title-group">
                <div className="proxy-student-avatar">
                  {getStudentInitials(selectedStudent.name)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedStudent.name}
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
                      Reg No: <strong>{selectedStudent.registrationNumber}</strong>
                    </span>
                    <span className="proxy-class-badge">{selectedStudent.className || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button className="proxy-slideover-close-btn" onClick={() => setShowDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="proxy-slideover-body">
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
                      Payment Method: <strong>{receiptData.method}</strong>
                    </div>
                    <div>
                      Academic Term:{' '}
                      <strong>
                        {receiptData.session} - {receiptData.term}
                      </strong>
                    </div>
                    <div>
                      Issued Date: <strong>{receiptData.date}</strong>
                    </div>
                  </div>

                  <button
                    className="btn-proxy-search"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => openReceipt(receiptData.invoiceId)}
                  >
                    <Printer size={18} /> View / Print Official Receipt
                  </button>

                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#047857',
                      fontWeight: 700,
                      marginTop: '1rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                    onClick={() => {
                      setReceiptData(null);
                      handleSelectStudent(selectedStudent);
                    }}
                  >
                    + Verify Another Bank Payment for {selectedStudent.name}
                  </button>
                </div>
              ) : (
                /* Upload & Verify Form */
                <form
                  id="proxyUploadForm"
                  onSubmit={handleProxyUpload}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  {/* Previous Receipts & Payments History Section if Student Paid Before */}
                  {((selectedStudent.receipts && selectedStudent.receipts.length > 0) ||
                    (selectedStudent.invoices || []).some((i) => i.amountPaid > 0)) && (
                    <div className="proxy-history-section">
                      <div className="proxy-history-title">
                        <span>
                          <History
                            size={16}
                            style={{ verticalAlign: 'middle', marginRight: '6px' }}
                          />{' '}
                          Prior Payment Records
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: '#047857',
                            background: '#ECFDF5',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                          }}
                        >
                          Part-Payments Logged
                        </span>
                      </div>

                      {selectedStudent.receipts && selectedStudent.receipts.length > 0
                        ? selectedStudent.receipts.map((rec) => (
                            <div key={rec.id} className="proxy-history-item">
                              <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}
                              >
                                <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                                  Receipt #{rec.receiptNumber}
                                </strong>
                                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                  {rec.session} ({rec.term}) • {rec.date}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{ fontWeight: 800, color: '#047857', fontSize: '0.9rem' }}
                                >
                                  ₦{rec.amountPaid.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  className="btn-view-proxy-receipt"
                                  onClick={() => openReceipt(rec.invoiceId)}
                                  title="Print Official Receipt"
                                >
                                  <Printer size={13} /> Print
                                </button>
                              </div>
                            </div>
                          ))
                        : (selectedStudent.invoices || [])
                            .filter((i) => i.amountPaid > 0)
                            .map((inv) => (
                              <div key={inv.id} className="proxy-history-item">
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                  }}
                                >
                                  <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                                    {inv.session} - {inv.term}
                                  </strong>
                                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                    Status: {inv.paymentStatus}
                                  </span>
                                </div>

                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      color: '#047857',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    Paid ₦{inv.amountPaid.toLocaleString()}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-view-proxy-receipt"
                                    onClick={() => openReceipt(inv.id)}
                                    title="Print Official Receipt"
                                  >
                                    <Printer size={13} /> Receipt
                                  </button>
                                </div>
                              </div>
                            ))}
                    </div>
                  )}

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
                      Verify parent bank transfer proof for <strong>{selectedStudent.name}</strong>.
                      Target invoice automatically selects the oldest pending balance.
                    </div>
                  </div>

                  {/* Target Invoice Selector */}
                  {getSortedPendingInvoices(selectedStudent).length > 0 && (
                    <div className="proxy-form-group">
                      <label>Target Invoice (Auto-selects oldest debt)</label>
                      <select
                        className="select-filter-input"
                        value={targetInvoiceId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetInvoiceId(val);
                          if (val !== 'new') {
                            const inv = selectedStudent.invoices.find((i) => i.id === val);
                            if (inv) {
                              setPosTerm(inv.term);
                              setPosSession(inv.session);
                              setPosAmountDue(inv.amountDue);
                              setPosAmountPaid(inv.balance);
                            }
                          } else {
                            setPosAmountDue(0);
                            setPosAmountPaid(0);
                          }
                        }}
                      >
                        {getSortedPendingInvoices(selectedStudent).map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.session} - {inv.term} (Owes ₦{inv.balance.toLocaleString()})
                          </option>
                        ))}
                        <option value="new">+ Create Custom Charge (Override)</option>
                      </select>
                    </div>
                  )}

                  {/* Session & Term */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="proxy-form-group">
                      <label>Session</label>
                      <input
                        type="text"
                        className="select-filter-input"
                        value={posSession}
                        onChange={(e) => setPosSession(e.target.value)}
                        required
                        disabled={targetInvoiceId !== 'new'}
                      />
                    </div>
                    <div className="proxy-form-group">
                      <label>Term</label>
                      <select
                        className="select-filter-input"
                        value={posTerm}
                        onChange={(e) => setPosTerm(e.target.value)}
                        required
                        disabled={targetInvoiceId !== 'new'}
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                      </select>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="proxy-form-group">
                      <label>Total Fee Due (₦)</label>
                      <input
                        type="number"
                        className="select-filter-input"
                        min="1"
                        value={posAmountDue}
                        onChange={(e) => setPosAmountDue(Number(e.target.value))}
                        required
                        disabled={targetInvoiceId !== 'new'}
                      />
                    </div>

                    <div className="proxy-form-group">
                      <label>Amount Paid / Credited (₦) *</label>
                      <input
                        type="number"
                        min="1"
                        max={targetInvoiceId !== 'new' ? posAmountDue : undefined}
                        value={posAmountPaid}
                        onChange={(e) => setPosAmountPaid(Number(e.target.value))}
                        className="select-filter-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Proof of Payment File Upload */}
                  <div className="proxy-form-group">
                    <label>Proof of Payment Slip / Image / PDF *</label>
                    <input
                      type="file"
                      className="select-filter-input"
                      accept="image/*,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                    {selectedFile && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#047857',
                          fontWeight: 700,
                          marginTop: '0.2rem',
                        }}
                      >
                        Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{' '}
                        KB)
                      </span>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="proxy-form-group">
                    <label>Payment Channel *</label>
                    <select
                      value={directMethod}
                      onChange={(e) => setDirectMethod(e.target.value)}
                      className="select-filter-input"
                    >
                      <option value="Transfer">Bank Transfer</option>
                      <option value="POS">POS Bank Receipt</option>
                      <option value="Cash Deposit">Bank Teller Cash Deposit</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div className="proxy-form-group">
                    <label>Accountant Audit Notes / Remarks</label>
                    <input
                      type="text"
                      value={directRemarks}
                      onChange={(e) => setDirectRemarks(e.target.value)}
                      className="select-filter-input"
                      placeholder="E.g., Verified credit in FirstBank account via WhatsApp slip on May 5th"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Drawer Footer */}
            {!receiptData && (
              <div className="proxy-slideover-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDrawer(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  form="proxyUploadForm"
                  type="submit"
                  className="btn-proxy-search"
                  disabled={processing || !selectedFile}
                >
                  <FileCheck2 size={18} />
                  {processing
                    ? 'Uploading & Verifying...'
                    : `Verify & Issue Receipt (₦${posAmountPaid.toLocaleString()})`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
