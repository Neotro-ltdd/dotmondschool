import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './PointOfSale.css';
import { useDialog } from '../../../context/DialogContext';
import {
  CreditCard,
  Search,
  UserCheck,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Printer,
  Receipt,
  ArrowRight,
  ShieldCheck,
  History,
  FileText,
  Layers,
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

export interface PosFeeItem {
  id?: string;
  name: string;
  amount: number;
  applicability?: string;
  selected: boolean;
}

interface PosStudent {
  id: string;
  name: string;
  registrationNumber: string;
  classId?: string;
  className: string;
  classLevel?: string;
  invoices: any[];
  receipts?: PosReceipt[];
}

export default function PointOfSale() {
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
  const [directMethod, setDirectMethod] = useState('Cash');
  const [directRemarks, setDirectRemarks] = useState('Received by Mrs. Olufunke Ikang');
  const [feeBreakdownItems, setFeeBreakdownItems] = useState<PosFeeItem[]>([]);
  const [loadingFeeTemplate, setLoadingFeeTemplate] = useState<boolean>(false);
  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Helper to sort invoices oldest to newest
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

  const loadFeeBreakdown = async (student: PosStudent, session: string, term: string) => {
    setLoadingFeeTemplate(true);
    try {
      let items: PosFeeItem[] = [];

      // 1. Try class-specific template endpoint if classId is available
      if (student.classId) {
        try {
          const classTemplate = await api.get(
            `/finance/setup/fee-templates/class/${student.classId}?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`
          );
          if (classTemplate && Array.isArray(classTemplate.items) && classTemplate.items.length > 0) {
            items = classTemplate.items.map((it: any) => ({
              id: it.id,
              name: it.name,
              amount: Number(it.amount) || 0,
              applicability: it.applicability || 'Compulsory',
              selected: true,
            }));
          }
        } catch (e) {
          // Fall through to query all templates
        }
      }

      // 2. Query all templates for session & term
      if (items.length === 0) {
        try {
          const templates = await api.get(
            `/finance/setup/fee-templates?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`
          );
          if (Array.isArray(templates) && templates.length > 0) {
            const matched = templates.find((t: any) => 
              (student.classId && t.classId === student.classId) ||
              (student.className && (
                t.className?.toLowerCase().includes(student.className.toLowerCase()) ||
                student.className.toLowerCase().includes(t.className?.toLowerCase())
              ))
            ) || templates[0];

            if (matched && Array.isArray(matched.items) && matched.items.length > 0) {
              items = matched.items.map((it: any) => ({
                id: it.id,
                name: it.name,
                amount: Number(it.amount) || 0,
                applicability: it.applicability || 'Compulsory',
                selected: true,
              }));
            }
          }
        } catch (e) {
          // Fall through to default items
        }
      }

      // 3. Fallback standard curriculum fee breakdown if template not yet configured
      if (items.length === 0) {
        items = [
          { name: 'Tuition Fee', amount: 75000, applicability: 'Compulsory', selected: true },
          { name: 'Development Levy', amount: 15000, applicability: 'Compulsory', selected: true },
          { name: 'Textbooks & Learning Materials', amount: 35000, applicability: 'Compulsory', selected: true },
          { name: 'Customized Notebooks Pack', amount: 10000, applicability: 'Compulsory', selected: true },
          { name: 'School Uniform (2 Pairs)', amount: 25000, applicability: 'Compulsory', selected: true },
          { name: 'Sportswear & House Wear', amount: 15000, applicability: 'Compulsory', selected: true },
          { name: 'Student Identity Card & Lanyard', amount: 5000, applicability: 'Compulsory', selected: true },
          { name: 'Co-Curricular & Club Dues', amount: 8000, applicability: 'Compulsory', selected: true },
          { name: 'After-School Lessons & Tutorial', amount: 15000, applicability: 'Optional', selected: true },
          { name: 'End of Year / Christmas Party', amount: 12000, applicability: 'Optional', selected: true },
        ];
      }

      setFeeBreakdownItems(items);
      const totalDue = items.reduce((acc, it) => it.selected ? acc + it.amount : acc, 0);
      setPosAmountDue(totalDue);
      setPosAmountPaid(totalDue);
    } catch (err) {
      console.error('Failed to load fee breakdown:', err);
    } finally {
      setLoadingFeeTemplate(false);
    }
  };

  const toggleFeeItem = (index: number) => {
    setFeeBreakdownItems((prev) => {
      const updated = prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item));
      const newTotal = updated.reduce((acc, it) => (it.selected ? acc + it.amount : acc), 0);
      setPosAmountDue(newTotal);
      setPosAmountPaid((prevPaid) => (prevPaid === posAmountDue || prevPaid > newTotal ? newTotal : prevPaid));
      return updated;
    });
  };

  const handleSelectAllFeeItems = (selectAll: boolean) => {
    setFeeBreakdownItems((prev) => {
      const updated = prev.map((item) => ({ ...item, selected: selectAll }));
      const newTotal = updated.reduce((acc, it) => (it.selected ? acc + it.amount : acc), 0);
      setPosAmountDue(newTotal);
      setPosAmountPaid(newTotal);
      return updated;
    });
  };

  const handleSelectCompulsoryOnly = () => {
    setFeeBreakdownItems((prev) => {
      const updated = prev.map((item) => ({
        ...item,
        selected: item.applicability?.toLowerCase() === 'compulsory' || !item.applicability?.toLowerCase().includes('optional'),
      }));
      const newTotal = updated.reduce((acc, it) => (it.selected ? acc + it.amount : acc), 0);
      setPosAmountDue(newTotal);
      setPosAmountPaid(newTotal);
      return updated;
    });
  };

  const handleSelectStudent = (student: PosStudent) => {
    setSelectedStudent(student);
    setReceiptData(null);
    setShowDrawer(true);
    setDirectRemarks('Received by Mrs. Olufunke Ikang');

    const pending = getSortedPendingInvoices(student);
    let targetSession: string;
    let targetTerm: string;

    if (pending.length > 0) {
      const oldest = pending[0];
      setTargetInvoiceId(oldest.id);
      targetTerm = oldest.term;
      targetSession = oldest.session;
      setPosTerm(oldest.term);
      setPosSession(oldest.session);
    } else {
      setTargetInvoiceId('new');
      targetTerm = posTerm || 'First Term';
      targetSession = posSession || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
      setPosTerm(targetTerm);
      setPosSession(targetSession);
    }

    loadFeeBreakdown(student, targetSession, targetTerm);
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

  const handleDirectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || posAmountPaid <= 0 || posAmountDue <= 0) return;

    setProcessing(true);
    try {
      const data = await api.post('/finance/pos-transaction', {
        invoiceId: targetInvoiceId === 'new' ? null : targetInvoiceId,
        studentId: selectedStudent.id,
        term: posTerm,
        session: posSession,
        amountDue: posAmountDue,
        amountPaid: posAmountPaid,
        method: directMethod,
        remarks: directRemarks,
      });

      let msg = data.message;
      if (data.invoiceStatus === 'Completed') {
        msg += '\n\nPayment fully cleared! Official Receipt is now available.';
      } else {
        msg += `\n\nPart-Payment logged successfully.`;
      }
      showAlert(msg);

      // Setup receipt data for slide-over drawer completion state
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

      handleSearch(); // Refresh search pool
    } catch (err: any) {
      showAlert('Payment failed: ' + (err.response?.data?.message || err.message));
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
    <div className="pos-page-container">
      {/* Page Header */}
      <div className="pos-page-header">
        <div>
          <h1 className="pos-page-title">
            <CreditCard size={28} color="#000080" />
            Point of Sale (Direct Entry)
          </h1>
          <p className="pos-page-subtitle">
            Search student records to record direct fee payments via Cash, POS, or Transfer
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="pos-metrics-grid">
        <div className="pos-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">DIRECT ENTRY WORKFLOW</span>
            <span className="metric-number">Instant POS</span>
          </div>
          <div className="metric-icon-badge sales">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="pos-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">SUPPORTED METHODS</span>
            <span className="metric-number" style={{ fontSize: '1.1rem' }}>
              Cash • POS • Transfer
            </span>
          </div>
          <div className="metric-icon-badge cash">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="pos-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">SEARCH RESULT POOL</span>
            <span className="metric-number">{searchResults.length} Students</span>
          </div>
          <div className="metric-icon-badge pending">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Student Search Section */}
      <div className="pos-search-card">
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
          🔍 Student Lookup
        </h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
          Type student name or registration number below (e.g. <strong>Mary Agboke</strong> or{' '}
          <strong>DOTJSS2-002</strong>) and click Search or press Enter.
        </p>

        <div className="pos-search-bar-row">
          <div className="pos-search-input-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by Student Name or Reg No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-pos-search" onClick={handleSearch} disabled={searching}>
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
          <div className="pos-students-grid">
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
                  className="pos-student-card"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="pos-student-header">
                    <div className="pos-student-avatar">{getStudentInitials(student.name)}</div>
                    <div className="pos-student-info">
                      <span className="pos-student-name">{student.name}</span>
                      <div className="pos-student-meta">
                        <span>
                          Reg No: <strong>{student.registrationNumber}</strong>
                        </span>
                        <span className="pos-class-badge">{student.className || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Debt Summary */}
                  <div className="pos-debt-summary">
                    <span>
                      Pending Invoices: <strong>{pendingInvoices.length}</strong>
                    </span>
                    {totalDebt > 0 ? (
                      <span className="pos-debt-amount">Owes ₦{totalDebt.toLocaleString()}</span>
                    ) : (
                      <span className="pos-no-debt">Cleared (₦0)</span>
                    )}
                  </div>

                  {/* Prior Payment & Receipt Badge if student paid part-payment previously */}
                  {(totalPaid > 0 || receipts.length > 0) && (
                    <div className="pos-previous-receipts-box" onClick={(e) => e.stopPropagation()}>
                      <div className="pos-previous-receipt-head">
                        <span>💳 Prior Payments Recorded</span>
                        <span style={{ fontWeight: 900 }}>₦{totalPaid.toLocaleString()}</span>
                      </div>

                      {latestReceipt ? (
                        <button
                          type="button"
                          className="btn-view-previous-receipt"
                          onClick={() => openReceipt(latestReceipt.invoiceId)}
                        >
                          <Printer size={13} /> View Receipt #{latestReceipt.receiptNumber}
                        </button>
                      ) : (student.invoices || []).some((i) => i.amountPaid > 0) ? (
                        <button
                          type="button"
                          className="btn-view-previous-receipt"
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

                  <button type="button" className="btn-record-payment">
                    <Receipt size={16} /> Record Payment <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER FOR RECORD PAYMENT FORM */}
      {showDrawer && selectedStudent && (
        <>
          {/* Backdrop */}
          <div className="pos-slideover-backdrop" onClick={() => setShowDrawer(false)} />

          {/* Drawer Panel */}
          <div className="pos-slideover-drawer">
            {/* Drawer Header */}
            <div className="pos-slideover-header">
              <div className="pos-slideover-title-group">
                <div className="pos-student-avatar">{getStudentInitials(selectedStudent.name)}</div>
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
                    <span className="pos-class-badge">{selectedStudent.className || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button className="pos-slideover-close-btn" onClick={() => setShowDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="pos-slideover-body">
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
                    Payment Recorded Successfully!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#065F46', marginTop: '0.4rem' }}>
                    Official Receipt <strong>#{receiptData.receiptNo}</strong> has been issued for{' '}
                    {receiptData.studentName}.
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
                      Amount Paid: <strong>₦{receiptData.amountPaid.toLocaleString()}</strong>
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
                    className="btn-pos-search"
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
                    + Record Another Payment for {selectedStudent.name}
                  </button>
                </div>
              ) : (
                /* Record Payment Form */
                <form
                  id="posPaymentForm"
                  onSubmit={handleDirectPayment}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  {/* Previous Receipts & Payments History Section if Student Paid Before */}
                  {((selectedStudent.receipts && selectedStudent.receipts.length > 0) ||
                    (selectedStudent.invoices || []).some((i) => i.amountPaid > 0)) && (
                    <div className="pos-history-section">
                      <div className="pos-history-title">
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
                            <div key={rec.id} className="pos-history-item">
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
                                  className="btn-view-previous-receipt"
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
                              <div key={inv.id} className="pos-history-item">
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
                                    className="btn-view-previous-receipt"
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
                      Recording payment for <strong>{selectedStudent.name}</strong>. Target invoice
                      automatically selects the oldest pending balance.
                    </div>
                  </div>

                  {/* Target Invoice Selector */}
                  {getSortedPendingInvoices(selectedStudent).length > 0 && (
                    <div className="pos-form-group">
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
                              loadFeeBreakdown(selectedStudent, inv.session, inv.term);
                            }
                          } else {
                            loadFeeBreakdown(selectedStudent, posSession, posTerm);
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
                    <div className="pos-form-group">
                      <label>Session</label>
                      <input
                        type="text"
                        className="select-filter-input"
                        value={posSession}
                        onChange={(e) => {
                          const s = e.target.value;
                          setPosSession(s);
                          if (selectedStudent) {
                            loadFeeBreakdown(selectedStudent, s, posTerm);
                          }
                        }}
                        required
                        disabled={targetInvoiceId !== 'new'}
                      />
                    </div>
                    <div className="pos-form-group">
                      <label>Term</label>
                      <select
                        className="select-filter-input"
                        value={posTerm}
                        onChange={(e) => {
                          const t = e.target.value;
                          setPosTerm(t);
                          if (selectedStudent) {
                            loadFeeBreakdown(selectedStudent, posSession, t);
                          }
                        }}
                        required
                        disabled={targetInvoiceId !== 'new'}
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                      </select>
                    </div>
                  </div>

                  {/* Class Fee Breakdown & Dynamic Selection */}
                  <div className="pos-fee-breakdown-section">
                    <div className="pos-fee-breakdown-header">
                      <div className="pos-fee-breakdown-title">
                        <Layers size={16} color="#000080" />
                        <span>Class Fee Breakdown &amp; Dynamic Selection</span>
                        {loadingFeeTemplate && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 'normal' }}>
                            (Loading template...)
                          </span>
                        )}
                      </div>
                      <div className="pos-fee-actions">
                        <button
                          type="button"
                          className="pos-btn-fee-action"
                          onClick={() => handleSelectAllFeeItems(true)}
                          title="Select all fee components"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="pos-btn-fee-action"
                          onClick={handleSelectCompulsoryOnly}
                          title="Select compulsory items only"
                        >
                          Compulsory Only
                        </button>
                        <button
                          type="button"
                          className="pos-btn-fee-action"
                          onClick={() => handleSelectAllFeeItems(false)}
                          title="Deselect all items"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="pos-fee-items-grid">
                      {feeBreakdownItems.map((item, idx) => {
                        const appClass = item.applicability?.toLowerCase().includes('optional')
                          ? 'optional'
                          : item.applicability?.toLowerCase().includes('sectional')
                          ? 'sectional'
                          : 'compulsory';

                        return (
                          <div
                            key={item.id || idx}
                            className={`pos-fee-item-card ${item.selected ? 'selected' : 'unselected'}`}
                            onClick={() => toggleFeeItem(idx)}
                          >
                            <input
                              type="checkbox"
                              className="pos-fee-checkbox"
                              checked={item.selected}
                              onChange={() => toggleFeeItem(idx)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="pos-fee-item-info">
                              <div className="pos-fee-item-name" title={item.name}>
                                {item.name}
                              </div>
                              <div className="pos-fee-item-meta">
                                <span className={`pos-fee-badge ${appClass}`}>
                                  {item.applicability || 'Compulsory'}
                                </span>
                              </div>
                            </div>
                            <div className="pos-fee-item-amount">
                              ₦{item.amount.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pos-fee-breakdown-summary">
                      <span>
                        Selected components:{' '}
                        <strong>
                          {feeBreakdownItems.filter((i) => i.selected).length} of {feeBreakdownItems.length}
                        </strong>
                      </span>
                      <span>
                        Total Fee Due: <strong>₦{posAmountDue.toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="pos-form-group">
                      <label>Total Fee Due (₦)</label>
                      <input
                        type="number"
                        className="select-filter-input"
                        min="1"
                        value={posAmountDue}
                        readOnly
                        style={{ backgroundColor: '#F8FAFC', fontWeight: 800, color: '#0F172A', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="pos-form-group">
                      <label>Amount Received (₦) *</label>
                      <input
                        type="number"
                        min="1"
                        value={posAmountPaid}
                        onChange={(e) => setPosAmountPaid(Number(e.target.value))}
                        className="select-filter-input"
                        required
                        style={{ fontWeight: 800, color: '#047857' }}
                      />
                    </div>
                  </div>

                  {posAmountDue > posAmountPaid && posAmountPaid > 0 && (
                    <div className="pos-part-payment-banner">
                      <AlertCircle size={16} color="#92400E" style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Part-Payment:</strong> Outstanding balance of{' '}
                        <strong>₦{(posAmountDue - posAmountPaid).toLocaleString()}</strong> will remain open on the student's ledger.
                      </span>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="pos-form-group">
                    <label>Payment Method *</label>
                    <select
                      value={directMethod}
                      onChange={(e) => setDirectMethod(e.target.value)}
                      className="select-filter-input"
                    >
                      <option value="Cash">Cash</option>
                      <option value="POS">POS Terminal</option>
                      <option value="Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Remarks */}
                  <div className="pos-form-group">
                    <label>Remarks / Collector Notes</label>
                    <input
                      type="text"
                      value={directRemarks}
                      onChange={(e) => setDirectRemarks(e.target.value)}
                      className="select-filter-input"
                      placeholder="E.g., Received by Mrs. Olufunke Ikang"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Drawer Footer */}
            {!receiptData && (
              <div className="pos-slideover-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDrawer(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  form="posPaymentForm"
                  type="submit"
                  className="btn-pos-search"
                  disabled={processing}
                >
                  <Receipt size={18} />
                  {processing
                    ? 'Processing...'
                    : `Record ₦${posAmountPaid.toLocaleString()} Payment`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
