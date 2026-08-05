import React, { useState } from 'react';
import { api } from '../../../services/api';
import './StudentLedger.css';
import { 
  FileText, 
  Search, 
  Users, 
  DollarSign, 
  BookOpen, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  History, 
  Building2, 
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';

interface LedgerInvoice {
  id: string;
  session: string;
  term: string;
  className: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string;
  receiptNumber: string;
}

interface LedgerReceipt {
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

interface LedgerStudent {
  id: string;
  name: string;
  surname: string;
  firstName: string;
  registrationNumber: string;
  className: string;
  parentEmail?: string;
  parentPhoneNumber?: string;
  invoices: LedgerInvoice[];
  receipts?: LedgerReceipt[];
  totalOwed: number;
}

export default function StudentLedger() {
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [ledgerResults, setLedgerResults] = useState<LedgerStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const handleLedgerSearch = async () => {
    if (!ledgerSearchTerm.trim()) return;
    try {
      setSearching(true);
      const data: LedgerStudent[] = await api.get(`/finance/student-ledger?q=${ledgerSearchTerm}`);
      setLedgerResults(data || []);
      
      // Auto-select all returned students by default so parent family totals show immediately!
      if (data && data.length > 0) {
        setSelectedStudentIds(data.map(s => s.id));
      } else {
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error("Ledger search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === ledgerResults.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(ledgerResults.map(s => s.id));
    }
  };

  const selectedStudents = ledgerResults.filter(s => selectedStudentIds.includes(s.id));
  
  // Family Combined Total Debt
  const combinedTotalOwed = selectedStudents.reduce((acc, s) => {
    const studentDebt = (s.invoices || []).reduce((invAcc, inv) => invAcc + Math.max(0, inv.amountDue - inv.amountPaid), 0);
    return acc + studentDebt;
  }, 0);

  const combinedTotalPaid = selectedStudents.reduce((acc, s) => {
    const studentPaid = (s.invoices || []).reduce((invAcc, inv) => invAcc + (inv.amountPaid || 0), 0);
    return acc + studentPaid;
  }, 0);

  // Group invoices class by class
  const getGroupedInvoicesByClass = () => {
    const classMap: Record<string, { className: string; studentName: string; invoices: LedgerInvoice[] }> = {};
    
    selectedStudents.forEach(student => {
      (student.invoices || []).forEach(inv => {
        const key = `${inv.className || student.className || 'General'}`;
        if (!classMap[key]) {
          classMap[key] = {
            className: key,
            studentName: student.name,
            invoices: []
          };
        }
        classMap[key].invoices.push(inv);
      });
    });

    return Object.values(classMap);
  };

  // Collect all receipts across selected students
  const getAllSelectedReceipts = () => {
    const receiptsList: (LedgerReceipt & { studentName: string; regNo: string })[] = [];
    selectedStudents.forEach(student => {
      (student.receipts || []).forEach(rec => {
        receiptsList.push({
          ...rec,
          studentName: student.name,
          regNo: student.registrationNumber
        });
      });
    });
    return receiptsList;
  };

  const openReceipt = (invoiceId: string) => {
    if (invoiceId) {
      window.open(`/dashboard/finance/receipt/${invoiceId}`, '_blank');
    }
  };

  const getStudentInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'ST';
  };

  return (
    <div className="ledger-page-container">
      {/* Page Header */}
      <div className="ledger-page-header">
        <div>
          <h1 className="ledger-page-title">
            <BookOpen size={28} color="#000080" />
            Student & Family Financial Ledger
          </h1>
          <p className="ledger-page-subtitle">View class-by-class fee payment history and combined family debt totals</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="ledger-metrics-grid">
        <div className="ledger-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">FAMILY COMBINED DEBT</span>
            <span className="metric-number" style={{ color: combinedTotalOwed > 0 ? '#DC2626' : '#16A34A' }}>
              ₦{combinedTotalOwed.toLocaleString()}
            </span>
          </div>
          <div className="metric-icon-badge balance">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="ledger-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">TOTAL PAID TO DATE</span>
            <span className="metric-number" style={{ color: '#047857' }}>
              ₦{combinedTotalPaid.toLocaleString()}
            </span>
          </div>
          <div className="metric-icon-badge family">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="ledger-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">SELECTED STUDENTS</span>
            <span className="metric-number">{selectedStudents.length} / {ledgerResults.length} Kids</span>
          </div>
          <div className="metric-icon-badge class">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="ledger-workspace-grid">
        {/* Left Column: Search & Student Selection List */}
        <div className="ledger-card-wrapper">
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
            🔍 Search Ledger
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
            Search by <strong>Reg No</strong>, <strong>Student Name</strong>, <strong>Parent Surname</strong>, or <strong>Parent Email</strong>.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="ledger-search-box" style={{ flex: 1 }}>
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Reg No, Surname, Email..." 
                value={ledgerSearchTerm}
                onChange={e => setLedgerSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLedgerSearch()}
              />
            </div>
            <button className="btn-ledger-search" onClick={handleLedgerSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Results Selector */}
          {ledgerResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {/* Family Aggregation Bar */}
              <div className="family-toggle-bar">
                <span>Family Pool ({ledgerResults.length} Kids)</span>
                <button type="button" className="btn-select-all-family" onClick={selectAllStudents}>
                  {selectedStudentIds.length === ledgerResults.length ? 'Deselect All' : 'Select All Kids'}
                </button>
              </div>

              <div className="ledger-student-list">
                {ledgerResults.map(student => {
                  const invoices = student.invoices || [];
                  const hasInvoices = invoices.length > 0;
                  const studentDebt = invoices.reduce((acc, inv) => {
                    const due = Number(inv.amountDue ?? 0);
                    const paid = Number(inv.amountPaid ?? 0);
                    return acc + Math.max(0, due - paid);
                  }, 0);
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <div 
                      key={student.id} 
                      className={`ledger-student-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <input 
                        type="checkbox" 
                        className="student-checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '0.4rem', marginTop: '0.1rem' }}>
                          <span>Reg: <strong>{student.registrationNumber}</strong></span>
                          <span>•</span>
                          <span style={{ fontWeight: 700, color: '#334155' }}>{student.className}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 900, 
                          color: !hasInvoices ? '#64748B' : studentDebt > 0 ? '#DC2626' : '#16A34A' 
                        }}>
                          {!hasInvoices ? 'No Invoice' : studentDebt > 0 ? `₦${studentDebt.toLocaleString()}` : 'Cleared'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Status & Class-by-Class Breakdown */}
        <div className="ledger-card-wrapper">
          {selectedStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
              <Building2 size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Student Selected</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                Search by Reg Number, Student Name, or Parent Surname/Email on the left to view financial history and family totals.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Overview Header */}
              <div style={{ background: '#F8FAFC', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedStudents.length === 1 ? selectedStudents[0].name : `Combined Family Ledger (${selectedStudents.length} Children)`}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedStudents.map(s => (
                      <span key={s.id} style={{ background: '#FFFFFF', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                        {s.name} ({s.className})
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
                    {selectedStudents.length === 1 ? 'STUDENT BALANCE' : 'TOTAL FAMILY OUTSTANDING'}
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: combinedTotalOwed > 0 ? '#DC2626' : '#16A34A', lineHeight: 1.1 }}>
                    ₦{combinedTotalOwed.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Class-by-Class Fee Ledger Breakdown */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} color="#000080" />
                  Class-by-Class Fee Ledger Breakdown
                </h3>

                {getGroupedInvoicesByClass().map((group, idx) => (
                  <div key={idx} className="class-group-card">
                    <div className="class-group-header">
                      <span>🏫 Academic Class Level: {group.className} ({group.studentName})</span>
                      <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700 }}>
                        {group.invoices.length} Invoices Recorded
                      </span>
                    </div>

                    <table className="executive-ledger-table">
                      <thead>
                        <tr>
                          <th>Academic Term / Session</th>
                          <th>Amount Due</th>
                          <th>Amount Paid</th>
                          <th>Balance Owed</th>
                          <th>Payment Status</th>
                          <th style={{ textAlign: 'right' }}>Official Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.invoices.map(inv => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 700 }}>
                              {inv.session} - {inv.term}
                            </td>
                            <td>₦{inv.amountDue.toLocaleString()}</td>
                            <td style={{ color: '#047857', fontWeight: 700 }}>₦{inv.amountPaid.toLocaleString()}</td>
                            <td style={{ color: inv.balance > 0 ? '#DC2626' : '#16A34A', fontWeight: 800 }}>
                              ₦{inv.balance.toLocaleString()}
                            </td>
                            <td>
                              <span className={`status-pill ${inv.paymentStatus === 'Completed' ? 'active' : 'inactive'}`}>
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {inv.amountPaid > 0 ? (
                                <button 
                                  className="btn-select-all-family"
                                  onClick={() => openReceipt(inv.id)}
                                >
                                  <Printer size={12} style={{ marginRight: '4px' }} />
                                  {inv.receiptNumber}
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Unpaid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Verified Payment Receipts History */}
              {getAllSelectedReceipts().length > 0 && (
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="#047857" />
                    Verified Payment Receipts & History Log
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {getAllSelectedReceipts().map(rec => (
                      <div key={rec.id} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0.85rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                            Receipt #{rec.receiptNumber} ({rec.studentName})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                            {rec.session} - {rec.term} • Date: {rec.date} • Method: {rec.method}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857' }}>
                            ₦{rec.amountPaid.toLocaleString()}
                          </span>
                          <button 
                            className="btn-pos-search"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                            onClick={() => openReceipt(rec.invoiceId)}
                          >
                            <Printer size={14} /> Print Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
