import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { useDialog } from '../../../context/DialogContext';
import ReportCard from '../../../components/ReportCard';
import { 
  Users, 
  GraduationCap, 
  Award, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowLeft, 
  Download, 
  Upload, 
  Clock, 
  Search, 
  BookOpen, 
  TrendingUp,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import './ParentHub.css';

interface Kid {
  id: string;
  firstName: string;
  surname: string;
  otherNames?: string;
  registrationNumber: string;
  className: string;
  level?: string;
  departmentTrack?: string;
  status?: string;
  isCleared?: boolean;
  passportUrl: string | null;
}

interface InvoiceItem {
  id: string;
  term: string;
  session: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  feeItems?: { name: string; amount: number; isCompulsory: boolean }[];
}

interface ReceiptItem {
  id: string;
  receiptNumber: string;
  amount: number;
  verifiedAmount?: number;
  paymentMethod: string;
  uploadedAt: string;
  status: string;
  invoiceId: string;
}

interface AttendanceLogItem {
  date: string;
  dayName: string;
  formattedDate: string;
  timeIn: string;
  timeOut: string;
  status: string;
  remarks: string;
}

interface AttendanceReportData {
  totalSchoolDays: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  attendanceRatePercentage: number;
  logs: AttendanceLogItem[];
}

interface TranscriptTerm {
  session: string;
  term: string;
  class: string;
  gpa?: number;
  averageScore?: number;
}

export default function ParentHub() {
  const { showAlert } = useDialog();
  const { session: currentSession, term: currentTerm } = useActiveTerm();

  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [loadingKids, setLoadingKids] = useState(true);

  // Workspace Filters
  const [filterSession, setFilterSession] = useState<string>(currentSession);
  const [filterTerm, setFilterTerm] = useState<string>(currentTerm);

  // Tab States
  const [activeTab, setActiveTab] = useState<'results' | 'fees' | 'report'>('results');
  const [feeSubTab, setFeeSubTab] = useState<'breakdown' | 'history' | 'upload'>('breakdown');
  const [reportSubTab, setReportSubTab] = useState<'attendance' | 'academic_trend'>('attendance');

  // Data States
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptTerm[]>([]);
  const [selectedReportCard, setSelectedReportCard] = useState<{ session: string; term: string } | null>(null);
  
  const [loadingTab, setLoadingTab] = useState(false);

  // Proof Upload Form
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string>('');
  const [depositorName, setDepositorName] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [proofAmount, setProofAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  useEffect(() => {
    fetchMyKids();
  }, []);

  useEffect(() => {
    if (selectedKid) {
      if (activeTab === 'results') {
        fetchTranscripts(selectedKid.id);
        fetchInvoices(selectedKid.id);
      } else if (activeTab === 'fees') {
        fetchInvoices(selectedKid.id);
      } else if (activeTab === 'report') {
        if (reportSubTab === 'attendance') {
          fetchAttendance(selectedKid.id, filterSession, filterTerm);
        } else {
          fetchTranscripts(selectedKid.id);
        }
      }
    }
  }, [selectedKid, activeTab, feeSubTab, reportSubTab, filterSession, filterTerm]);

  const fetchMyKids = async () => {
    try {
      setLoadingKids(true);
      const data = await api.get('/parents/my-kids');
      const kidsList: Kid[] = data || [];
      setKids(kidsList);
    } catch (error) {
      console.error('Failed to load children', error);
    } finally {
      setLoadingKids(false);
    }
  };

  const fetchInvoices = async (studentId: string) => {
    try {
      setLoadingTab(true);
      const data = await api.get(`/parents/my-kids/${studentId}/invoices`);
      setInvoices(data?.invoices || []);
      setReceipts(data?.receipts || []);
    } catch (error: any) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchTranscripts = async (studentId: string) => {
    try {
      setLoadingTab(true);
      const data = await api.get(`/academics/students/${studentId}/transcript`);
      setTranscripts(data?.transcript || []);
    } catch (error) {
      console.error('Failed to fetch transcripts', error);
      setTranscripts([]);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchAttendance = async (studentId: string, sess: string, trm: string) => {
    try {
      setLoadingTab(true);
      const data = await api.get(`/parents/my-kids/${studentId}/attendance?session=${encodeURIComponent(sess)}&term=${encodeURIComponent(trm)}`);
      setAttendanceData(data || null);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      setAttendanceData(null);
    } finally {
      setLoadingTab(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      showAlert('Please select a bank teller or payment receipt image/PDF first.');
      return;
    }
    try {
      setSubmittingProof(true);
      const formData = new FormData();
      formData.append('file', proofFile);
      if (bankRef) formData.append('bankReference', bankRef);
      if (depositorName) formData.append('depositorName', depositorName);
      if (proofAmount) formData.append('amount', proofAmount);
      if (uploadingInvoiceId) formData.append('invoiceId', uploadingInvoiceId);

      await api.post('/finance/upload-proof', formData);
      showAlert('Proof of payment uploaded successfully. School accountant will verify your submission.');
      setProofFile(null);
      setBankRef('');
      setDepositorName('');
      setProofAmount('');
      setUploadingInvoiceId('');
      if (selectedKid) fetchInvoices(selectedKid.id);
    } catch (error: any) {
      showAlert(error.message || 'Failed to upload proof of payment.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  const currentInvoice = invoices.find(inv => inv.session === filterSession && inv.term === filterTerm) || invoices[0];
  const hasOutstandingFees = invoices.some(inv => inv.status !== 'Completed' && inv.status !== 'Verified');

  return (
    <div className="parent-hub-page">
      {/* Hero Banner Header */}
      {!selectedKid ? (
        <>
          <div className="parent-hero-banner">
            <div className="parent-hero-header">
              <div>
                <h1 className="parent-hero-title">Parent Academic & Financial Portal</h1>
                <p className="parent-hero-subtitle">
                  Review your children's academic performance, monitor daily gate attendance logs, inspect itemized tuition billing, and download official payment receipts.
                </p>
              </div>

              <div className="parent-hero-badge">
                <ShieldCheck size={16} />
                <span>{currentSession} Session • {currentTerm}</span>
              </div>
            </div>
          </div>

          {loadingKids ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', borderRadius: '16px' }}>
              <p style={{ color: '#64748b' }}>Loading children records...</p>
            </div>
          ) : kids.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: '#64748b', borderRadius: '16px' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Children Linked</h3>
              <p style={{ maxWidth: '480px', margin: '0 auto' }}>
                There are no student records linked to your parent account. If you believe this is an error, please contact the school administration.
              </p>
            </div>
          ) : (
            <div className="parent-kids-grid">
              {kids.map(kid => {
                const photoUrl = getFullUrl(kid.passportUrl);
                return (
                  <div key={kid.id} className="child-card">
                    <div>
                      <div className="child-card-header">
                        <div className="child-avatar-container">
                          {photoUrl ? (
                            <img src={photoUrl} alt={kid.firstName} className="child-avatar-img" />
                          ) : (
                            <div className="child-avatar-initials">
                              {kid.firstName.charAt(0)}{kid.surname.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="child-info">
                          <h3>{kid.surname} {kid.firstName}</h3>
                          <p className="child-meta">{kid.className || 'Student'}</p>
                          <span className="child-reg-badge">{kid.registrationNumber}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {kid.departmentTrack && kid.departmentTrack !== 'General' && (
                          <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {kid.departmentTrack}
                          </span>
                        )}
                        <span className="badge" style={{ background: kid.isCleared ? '#dcfce7' : '#fee2e2', color: kid.isCleared ? '#15803d' : '#b91c1c', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {kid.isCleared ? 'Fee Cleared' : 'Pending Clearance'}
                        </span>
                      </div>
                    </div>

                    <div className="child-card-footer">
                      <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Active Student</span>
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600 }}
                        onClick={() => setSelectedKid(kid)}
                      >
                        <BookOpen size={15} />
                        View Child Portal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Selected Child Workspace */
        <div>
          {/* Top Bar with Back Button & Child Summary */}
          <div className="child-workspace-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setSelectedKid(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} /> Back to My Kids
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #4f46e5' }}>
                  {selectedKid.passportUrl ? (
                    <img src={getFullUrl(selectedKid.passportUrl)!} alt={selectedKid.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 700, color: '#4338ca' }}>{selectedKid.firstName.charAt(0)}{selectedKid.surname.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{selectedKid.surname} {selectedKid.firstName}</h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {selectedKid.registrationNumber} • {selectedKid.className}
                  </span>
                </div>
              </div>
            </div>

            {/* Session & Term Global Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select value={filterSession} onChange={e => setFilterSession(e.target.value)} className="filter-select" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                {getSessionOptions(filterSession).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="filter-select" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="parent-nav-tabs">
            <button className={`parent-nav-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
              <Award size={18} /> Results & Report Cards
            </button>
            <button className={`parent-nav-tab ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
              <CreditCard size={18} /> Tuition Fees & Receipts
            </button>
            <button className={`parent-nav-tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
              <Calendar size={18} /> Attendance & Academic Reports
            </button>
          </div>

          {/* TAB 1: RESULTS */}
          {activeTab === 'results' && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Academic Result Sheet</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Viewing approved terminal result for {filterSession} ({filterTerm})
                  </p>
                </div>
              </div>

              {hasOutstandingFees ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <AlertCircle size={28} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#92400e', fontSize: '1rem' }}>Pending Tuition Clearance Required</strong>
                    <span style={{ fontSize: '0.88rem', color: '#b45309' }}>
                      Terminal result viewing for {selectedKid.firstName} requires cleared tuition fees. Please resolve pending invoices to access the complete report sheet.
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ background: '#d97706', borderColor: '#d97706' }} onClick={() => setActiveTab('fees')}>
                    Clear Fees Now
                  </button>
                </div>
              ) : null}

              {/* Interactive Report Card Component */}
              <ReportCard 
                studentId={selectedKid.id}
                session={filterSession}
                term={filterTerm}
                onClose={() => {}}
              />
            </div>
          )}

          {/* TAB 2: FEES & BILLING */}
          {activeTab === 'fees' && (
            <div>
              {/* Fee Sub-Tabs */}
              <div className="parent-sub-tabs">
                <button className={`parent-sub-tab ${feeSubTab === 'breakdown' ? 'active' : ''}`} onClick={() => setFeeSubTab('breakdown')}>
                  Tuition Billing & Breakdown
                </button>
                <button className={`parent-sub-tab ${feeSubTab === 'history' ? 'active' : ''}`} onClick={() => setFeeSubTab('history')}>
                  Payment History & Receipts ({receipts.length})
                </button>
                <button className={`parent-sub-tab ${feeSubTab === 'upload' ? 'active' : ''}`} onClick={() => setFeeSubTab('upload')}>
                  Upload Bank Invoice / Proof
                </button>
              </div>

              {/* Sub-Tab 1: Breakdown */}
              {feeSubTab === 'breakdown' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>Termly Fee Summary ({filterSession} - {filterTerm})</h3>
                  
                  {loadingTab ? (
                    <p style={{ color: '#64748b' }}>Loading fee details...</p>
                  ) : !currentInvoice ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem', color: '#16a34a' }} />
                      <p>No active unpaid invoices found for this term.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="stat-card">
                          <p className="stat-label">Total Billed</p>
                          <h3 className="stat-value">₦{currentInvoice.totalAmount?.toLocaleString() || 0}</h3>
                        </div>
                        <div className="stat-card">
                          <p className="stat-label">Amount Paid</p>
                          <h3 className="stat-value" style={{ color: '#16a34a' }}>₦{currentInvoice.amountPaid?.toLocaleString() || 0}</h3>
                        </div>
                        <div className="stat-card">
                          <p className="stat-label">Outstanding Balance</p>
                          <h3 className="stat-value" style={{ color: '#dc2626' }}>
                            ₦{Math.max(0, (currentInvoice.totalAmount || 0) - (currentInvoice.amountPaid || 0)).toLocaleString()}
                          </h3>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={() => { setUploadingInvoiceId(currentInvoice.id); setFeeSubTab('upload'); }}>
                          <Upload size={16} /> Upload Bank Proof
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: History & Receipts */}
              {feeSubTab === 'history' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>Payment Receipts Directory</h3>
                  {receipts.length === 0 ? (
                    <p style={{ color: '#64748b', padding: '1.5rem 0' }}>No confirmed payment receipts found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {receipts.map(rec => (
                        <div key={rec.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Receipt #{rec.receiptNumber || 'Pending'}</strong>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                              Payment Method: {rec.paymentMethod || 'Bank Transfer'} • Date: {new Date(rec.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.05rem' }}>
                                ₦{(rec.verifiedAmount || rec.amount || 0).toLocaleString()}
                              </div>
                              <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                {rec.status}
                              </span>
                            </div>
                            <a 
                              href={`/dashboard/finance/receipt/${rec.invoiceId}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Download size={14} /> Download Receipt
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 3: Upload Bank Teller / Invoice */}
              {feeSubTab === 'upload' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', maxWidth: '640px' }}>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>Upload Bank Teller / Transfer Receipt</h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Submit proof of payment for verification by the school bursar.
                  </p>

                  <form onSubmit={handleUploadProof}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="form-label">Depositor Name</label>
                        <input type="text" className="form-control" value={depositorName} onChange={e => setDepositorName(e.target.value)} placeholder="Full name on bank account / teller" required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label className="form-label">Bank Reference / Teller No.</label>
                          <input type="text" className="form-control" value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="e.g. TRF/2026/84920" required />
                        </div>
                        <div>
                          <label className="form-label">Amount Paid (₦)</label>
                          <input type="number" className="form-control" value={proofAmount} onChange={e => setProofAmount(e.target.value)} placeholder="e.g. 150000" required />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Upload Proof Image / PDF</label>
                        <input type="file" accept="image/*,.pdf" className="form-control" onChange={e => setProofFile(e.target.files?.[0] || null)} required />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={submittingProof}>
                          {submittingProof ? 'Uploading...' : 'Submit Payment Proof'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE & ACADEMIC REPORTS */}
          {activeTab === 'report' && (
            <div>
              {/* Report Sub-Tabs */}
              <div className="parent-sub-tabs">
                <button className={`parent-sub-tab ${reportSubTab === 'attendance' ? 'active' : ''}`} onClick={() => setReportSubTab('attendance')}>
                  Gate & Class Attendance Log
                </button>
                <button className={`parent-sub-tab ${reportSubTab === 'academic_trend' ? 'active' : ''}`} onClick={() => setReportSubTab('academic_trend')}>
                  Academic History & Performance Compare
                </button>
              </div>

              {/* Sub-Tab 1: Attendance Log */}
              {reportSubTab === 'attendance' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>Gate Attendance & Time In / Time Out Log</h3>

                  {attendanceData && (
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="stat-card">
                        <p className="stat-label">Total School Days</p>
                        <h3 className="stat-value">{attendanceData.totalSchoolDays}</h3>
                      </div>
                      <div className="stat-card">
                        <p className="stat-label">Days Present</p>
                        <h3 className="stat-value" style={{ color: '#16a34a' }}>{attendanceData.daysPresent}</h3>
                      </div>
                      <div className="stat-card">
                        <p className="stat-label">Days Absent</p>
                        <h3 className="stat-value" style={{ color: '#dc2626' }}>{attendanceData.daysAbsent}</h3>
                      </div>
                      <div className="stat-card">
                        <p className="stat-label">Punctuality Rate</p>
                        <h3 className="stat-value" style={{ color: '#4f46e5' }}>{attendanceData.attendanceRatePercentage}%</h3>
                      </div>
                    </div>
                  )}

                  {loadingTab ? (
                    <p style={{ color: '#64748b' }}>Loading gate attendance logs...</p>
                  ) : !attendanceData || attendanceData.logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                      <Clock size={40} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
                      <p>No daily gate attendance logs recorded for this term selection.</p>
                    </div>
                  ) : (
                    <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Status</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.logs.map((log, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>{log.formattedDate}</td>
                              <td>{log.dayName}</td>
                              <td style={{ fontWeight: 600, color: '#16a34a' }}>{log.timeIn}</td>
                              <td style={{ fontWeight: 600, color: '#4338ca' }}>{log.timeOut}</td>
                              <td>
                                <span style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  background: log.status === 'Present' ? '#dcfce7' : log.status === 'Late' ? '#fef9c3' : '#fee2e2',
                                  color: log.status === 'Present' ? '#15803d' : log.status === 'Late' ? '#854d0e' : '#b91c1c'
                                }}>
                                  {log.status}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.84rem' }}>{log.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Academic Performance Comparison */}
              {reportSubTab === 'academic_trend' && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>Academic Progress & Performance Comparison</h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Compare past terminal scores and GPA progression across sessions.
                  </p>

                  {transcripts.length === 0 ? (
                    <p style={{ color: '#64748b' }}>No past academic transcript records available.</p>
                  ) : (
                    <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Academic Session</th>
                            <th>Term</th>
                            <th>Class Level</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transcripts.map((t, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.session}</td>
                              <td>{t.term}</td>
                              <td>
                                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                                  {t.class}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedReportCard({ session: t.session, term: t.term })}
                                >
                                  View Past Report
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal for Report Card Preview */}
      {selectedReportCard && selectedKid && (
        <ReportCard 
          studentId={selectedKid.id} 
          session={selectedReportCard.session} 
          term={selectedReportCard.term} 
          onClose={() => setSelectedReportCard(null)} 
        />
      )}
    </div>
  );
}
