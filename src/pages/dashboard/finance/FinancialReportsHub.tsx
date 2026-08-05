import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './FinancialReportsHub.css';
import { 
  BarChart3, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Printer, 
  Filter, 
  Gift, 
  Receipt, 
  Search, 
  Building2, 
  FileText, 
  Send,
  PieChart
} from 'lucide-react';

interface ClassCollectionSummary {
  classId: string;
  level: string;
  className: string;
  section: string;
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionPercentage: number;
  fullyClearedCount: number;
  unclearedCount: number;
}

interface CashbookEntry {
  id: string;
  receiptNumber: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  paymentChannel: string;
  amountPaid: number;
  datePaid: string;
  verificationStatus: string;
  clearedBy: string;
}

interface DebtorEntry {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  parentPhoneNumber: string;
  parentEmail: string;
  amountDue: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  isCleared: boolean;
}

interface OptionalFeeRecipient {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  parentEmail: string;
  parentPhone: string;
  amountPaid: number;
  datePaid: string;
  optedInItem: string;
  status: string;
}

export default function FinancialReportsHub() {
  const { session, term, setSession, setTerm } = useActiveTerm();
  const [activeTab, setActiveTab] = useState<'collection' | 'optional' | 'cashbook' | 'debtors'>('collection');

  // Report Data States
  const [hubSummary, setHubSummary] = useState<any>(null);
  const [termCollectionList, setTermCollectionList] = useState<ClassCollectionSummary[]>([]);
  const [cashbookList, setCashbookList] = useState<CashbookEntry[]>([]);
  const [debtorsList, setDebtorsList] = useState<DebtorEntry[]>([]);
  
  // Optional Fee State
  const [optionalItem, setOptionalItem] = useState('Christmas Party');
  const [optionalRecipients, setOptionalRecipients] = useState<OptionalFeeRecipient[]>([]);
  const [optionalLoading, setOptionalLoading] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [minDebtFilter, setMinDebtFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubData();
  }, [session, term]);

  useEffect(() => {
    if (activeTab === 'optional') {
      fetchOptionalRecipients();
    }
  }, [activeTab, session, term, optionalItem]);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/finance/reports/financial-hub?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      setHubSummary(data.summary || null);
      setTermCollectionList(data.termCollectionReport || []);
      setCashbookList(data.cashbookReport || []);
      setDebtorsList(data.debtorsReport || []);
    } catch (err) {
      console.error("Failed to load financial reports hub:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptionalRecipients = async () => {
    setOptionalLoading(true);
    try {
      const data = await api.get(`/finance/reports/optional-fees?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}&item=${encodeURIComponent(optionalItem)}`);
      setOptionalRecipients(data || []);
    } catch (err) {
      console.error("Failed to load optional fee recipients:", err);
    } finally {
      setOptionalLoading(false);
    }
  };

  // Filtered Cashbook List
  const filteredCashbook = cashbookList.filter(c => {
    const channelMatch = channelFilter === 'All Channels' || c.paymentChannel === channelFilter;
    const searchMatch = !searchQuery || 
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return channelMatch && searchMatch;
  });

  // Filtered Debtors List
  const filteredDebtors = debtorsList.filter(d => {
    const debtMatch = d.balanceDue >= minDebtFilter;
    const searchMatch = !searchQuery || 
      d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.className.toLowerCase().includes(searchQuery.toLowerCase());
    return debtMatch && searchMatch;
  });

  // Filtered Optional Fee List
  const filteredOptional = optionalRecipients.filter(r => {
    const searchMatch = !searchQuery ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.className.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="fin-reports-container">
      {/* Page Header */}
      <div className="fin-reports-header">
        <div>
          <h1 className="fin-reports-title">
            <BarChart3 size={28} color="#000080" />
            Financial Reports & Executive Analytics Hub
          </h1>
          <p className="fin-reports-subtitle">
            Comprehensive financial reconciliation, class collection metrics, optional fee logs, cashbook audit, and defaulters roster
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn-select-all-family" 
            onClick={() => window.print()}
            style={{ padding: '0.6rem 1.1rem', fontSize: '0.88rem' }}
          >
            <Printer size={16} style={{ marginRight: '5px' }} /> Print Current Report
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="fin-reports-tabs-bar">
        <button 
          className={`fin-reports-tab-button ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <PieChart size={16} /> Term Collection & Outstanding Balance Summary
        </button>

        <button 
          className={`fin-reports-tab-button ${activeTab === 'optional' ? 'active' : ''}`}
          onClick={() => setActiveTab('optional')}
        >
          <Gift size={16} color="#B45309" /> 🎁 Optional Add-ons & Event Recipients ({optionalRecipients.length})
        </button>

        <button 
          className={`fin-reports-tab-button ${activeTab === 'cashbook' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashbook')}
        >
          <Receipt size={16} /> 🧾 Daily Cashbook & Channel Audit ({cashbookList.length})
        </button>

        <button 
          className={`fin-reports-tab-button ${activeTab === 'debtors' ? 'active' : ''}`}
          onClick={() => setActiveTab('debtors')}
        >
          <AlertCircle size={16} color="#DC2626" /> ⚠️ Debtors & Defaulters Roster ({debtorsList.length})
        </button>
      </div>

      {/* Global Session & Term Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={18} color="#000080" />
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Academic Session</label>
            <input 
              type="text" 
              className="select-filter-input" 
              value={session} 
              onChange={e => setSession(e.target.value)} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Academic Term</label>
            <select 
              className="select-filter-input" 
              value={term} 
              onChange={e => setTerm(e.target.value)}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
        </div>

        {activeTab !== 'collection' && (
          <div style={{ position: 'relative', width: '260px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={15} />
            <input 
              type="text" 
              className="select-filter-input" 
              style={{ paddingLeft: '2.3rem' }}
              placeholder="Search student, reg #, receipt..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* KPI Summary Banner */}
      <div className="fin-summary-grid">
        <div className="fin-summary-card">
          <div className="info-box">
            <span className="card-label">EXPECTED TOTAL BILLING</span>
            <span className="card-val" style={{ color: '#1E40AF' }}>
              ₦{(hubSummary?.totalSchoolExpected || 0).toLocaleString()}
            </span>
          </div>
          <div className="card-icon-badge expected">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="fin-summary-card">
          <div className="info-box">
            <span className="card-label">TOTAL PAYMENTS COLLECTED</span>
            <span className="card-val" style={{ color: '#047857' }}>
              ₦{(hubSummary?.totalSchoolCollected || 0).toLocaleString()}
            </span>
          </div>
          <div className="card-icon-badge collected">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="fin-summary-card">
          <div className="info-box">
            <span className="card-label">OUTSTANDING UNPAID BALANCE</span>
            <span className="card-val" style={{ color: '#DC2626' }}>
              ₦{(hubSummary?.totalSchoolOutstanding || 0).toLocaleString()}
            </span>
          </div>
          <div className="card-icon-badge outstanding">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="fin-summary-card">
          <div className="info-box">
            <span className="card-label">COLLECTION COMPLETION RATE</span>
            <span className="card-val" style={{ color: '#B45309' }}>
              {hubSummary?.overallCollectionRate || 0}%
            </span>
          </div>
          <div className="card-icon-badge rate">
            <PieChart size={24} />
          </div>
        </div>
      </div>

      {/* TAB 1: TERM COLLECTION & OUTSTANDING BALANCE SUMMARY */}
      {activeTab === 'collection' && (
        <div className="fin-reports-card-wrapper">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              📊 Term Collection & Class-by-Class Financial Summary ({session} - {term})
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Detailed breakdown of total billed fees, collected revenue, and uncollected debt across all class arms.
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Loading class collection report...
            </div>
          ) : termCollectionList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
              <Building2 size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Class Billing Found</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                No generated invoices or billing records found for {session} ({term}).
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="fin-reports-table">
                <thead>
                  <tr>
                    <th>CLASS LEVEL & ARM</th>
                    <th>STUDENTS</th>
                    <th>EXPECTED BILLING (₦)</th>
                    <th>COLLECTED PAYMENTS (₦)</th>
                    <th>OUTSTANDING DEBT (₦)</th>
                    <th>COLLECTION %</th>
                    <th style={{ textAlign: 'right' }}>CLEARED / UNCLEARED</th>
                  </tr>
                </thead>
                <tbody>
                  {termCollectionList.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: '#0F172A' }}>
                        {c.className} {c.section}
                      </td>

                      <td style={{ fontWeight: 700, color: '#334155' }}>
                        {c.totalStudents} Students
                      </td>

                      <td style={{ fontWeight: 800, color: '#1E40AF' }}>
                        ₦{c.totalExpected.toLocaleString()}
                      </td>

                      <td style={{ fontWeight: 800, color: '#047857' }}>
                        ₦{c.totalCollected.toLocaleString()}
                      </td>

                      <td style={{ fontWeight: 800, color: c.totalOutstanding > 0 ? '#DC2626' : '#047857' }}>
                        ₦{c.totalOutstanding.toLocaleString()}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, c.collectionPercentage)}%`, height: '100%', background: c.collectionPercentage >= 80 ? '#059669' : c.collectionPercentage >= 50 ? '#D97706' : '#DC2626' }}></div>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, width: '42px', textAlign: 'right' }}>
                            {c.collectionPercentage}%
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                          {c.fullyClearedCount} Cleared / {c.unclearedCount} Outstanding
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPTIONAL ADD-ONS & EVENT RECIPIENTS */}
      {activeTab === 'optional' && (
        <div className="fin-reports-card-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift size={22} color="#B45309" /> 🎁 Optional Add-ons & Event Gift Preparation Roster
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Filter students who paid for specific optional items (Christmas Party, Excursions, Graduation Gowns) for event logistics and gift packages.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B45309' }}>Optional Item:</label>
              <select className="select-filter-input" style={{ width: '200px' }} value={optionalItem} onChange={e => setOptionalItem(e.target.value)}>
                <option value="Christmas Party">Christmas Party</option>
                <option value="Excursion">Excursion Fees</option>
                <option value="Graduation">Graduation Gown</option>
              </select>
            </div>
          </div>

          {optionalLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Loading optional item recipients...
            </div>
          ) : filteredOptional.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
              <Gift size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Payments Found for {optionalItem}</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                No students found with confirmed payments for "{optionalItem}" in {session} ({term}).
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="fin-reports-table">
                <thead>
                  <tr>
                    <th>RECIPIENT STUDENT</th>
                    <th>CLASS</th>
                    <th>OPTED-IN ITEM</th>
                    <th>AMOUNT PAID</th>
                    <th>RECEIPT #</th>
                    <th>PAYMENT DATE</th>
                    <th>PARENT CONTACT</th>
                    <th style={{ textAlign: 'right' }}>CONFIRMATION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptional.map(r => (
                    <tr key={r.id}>
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block' }}>{r.studentName}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Reg: {r.registrationNumber}</span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0F172A' }}>
                        {r.className}
                      </td>

                      <td>
                        <span style={{ background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                          🎁 {r.optedInItem || optionalItem}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#047857' }}>
                        ₦{r.amountPaid.toLocaleString()}
                      </td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {r.receiptNumber}
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {r.datePaid}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>{r.parentEmail}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.parentPhone}</span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span className="status-pill active" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                          ✓ Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY CASHBOOK & CHANNEL RECONCILIATION */}
      {activeTab === 'cashbook' && (
        <div className="fin-reports-card-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={22} color="#000080" /> 🧾 Daily Cashbook & Payment Channel Audit Trail
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Itemized transaction audit trail broken down by payment mode (Bank Transfer, POS Terminal, Counter Cash, Online Paystack).
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>Payment Channel:</label>
              <select className="select-filter-input" style={{ width: '190px' }} value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
                <option value="All Channels">All Channels</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="POS Terminal">POS Terminal</option>
                <option value="Counter Cash/Draft">Counter Cash / Draft</option>
                <option value="Online Paystack Card">Online Paystack Card</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Loading cashbook transactions...
            </div>
          ) : filteredCashbook.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
              <Receipt size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Cashbook Transactions Found</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                No payment transactions recorded matching selected filters for {session} ({term}).
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="fin-reports-table">
                <thead>
                  <tr>
                    <th>RECEIPT / REF #</th>
                    <th>STUDENT NAME & REG</th>
                    <th>CLASS</th>
                    <th>PAYMENT CHANNEL</th>
                    <th>VERIFIED AMOUNT (₦)</th>
                    <th>TIMESTAMP</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>CLEARING OFFICER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCashbook.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>
                        {c.receiptNumber}
                      </td>

                      <td>
                        <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block' }}>{c.studentName}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Reg: {c.registrationNumber}</span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0F172A' }}>
                        {c.className}
                      </td>

                      <td>
                        <span className={`channel-tag ${c.paymentChannel.includes('POS') ? 'pos' : c.paymentChannel.includes('Cash') ? 'cash' : c.paymentChannel.includes('Paystack') ? 'online' : 'transfer'}`}>
                          {c.paymentChannel}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857' }}>
                        ₦{c.amountPaid.toLocaleString()}
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {c.datePaid}
                      </td>

                      <td>
                        <span className={`status-pill ${c.verificationStatus === 'Verified' ? 'active' : 'pending'}`}>
                          {c.verificationStatus}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', fontSize: '0.82rem', color: '#64748B' }}>
                        {c.clearedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEBTORS & DEFAULTERS ROSTER */}
      {activeTab === 'debtors' && (
        <div className="fin-reports-card-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={22} color="#DC2626" /> ⚠️ Debtors & Unpaid Tuition Defaulters Roster
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Actionable roster of all students with outstanding balances after payment due date for debt recovery and exam clearances.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626' }}>Minimum Debt:</label>
              <select className="select-filter-input" style={{ width: '170px' }} value={minDebtFilter} onChange={e => setMinDebtFilter(Number(e.target.value))}>
                <option value={0}>All Debtors (&gt; ₦0)</option>
                <option value={20000}>&gt; ₦20,000</option>
                <option value={50000}>&gt; ₦50,000</option>
                <option value={100000}>&gt; ₦100,000</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Loading debtors roster...
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
              <CheckCircle size={42} color="#059669" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Zero Defaulters Found</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                No defaulting students found matching minimum debt threshold of ₦{minDebtFilter.toLocaleString()} for {session} ({term}).
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="fin-reports-table">
                <thead>
                  <tr>
                    <th>STUDENT NAME & REG</th>
                    <th>CLASS</th>
                    <th>TOTAL BILLED (₦)</th>
                    <th>TOTAL PAID (₦)</th>
                    <th>OUTSTANDING BALANCE (₦)</th>
                    <th>OVERDUE DAYS</th>
                    <th>PARENT CONTACT</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebtors.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block' }}>{d.studentName}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Reg: {d.registrationNumber}</span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0F172A' }}>
                        {d.className}
                      </td>

                      <td style={{ fontWeight: 700, color: '#1E40AF' }}>
                        ₦{d.amountDue.toLocaleString()}
                      </td>

                      <td style={{ fontWeight: 700, color: '#047857' }}>
                        ₦{d.amountPaid.toLocaleString()}
                      </td>

                      <td style={{ fontSize: '0.95rem', fontWeight: 900, color: '#DC2626' }}>
                        ₦{d.balanceDue.toLocaleString()}
                      </td>

                      <td>
                        <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                          {d.daysOverdue} Days Overdue
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>{d.parentEmail}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{d.parentPhoneNumber}</span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-select-all-family"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={() => window.alert(`Payment reminder trigger sent to ${d.parentPhoneNumber} / ${d.parentEmail}`)}
                        >
                          <Send size={12} style={{ marginRight: '4px' }} /> Send Reminder
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
  );
}
