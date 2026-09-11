import React, { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  Printer,
  Eye,
  RefreshCw,
  Building,
  CheckCircle,
  AlertCircle,
  Calendar,
  X,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useBranch } from '../../../context/BranchContext';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { useTenant } from '../../../context/TenantContext';
import StatCard from '../../../components/dashboard/overview/StatCard';
import './Finance.css';

interface InvoiceItem {
  id: string;
  feeCategory: string;
  description: string;
  amount: number;
}

interface InvoiceRecord {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  classId?: string;
  className: string;
  level: string;
  session: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string;
  isPaid: boolean;
  dueDate?: string;
  branchId?: string;
  branchName?: string;
  itemsCount: number;
  items: InvoiceItem[];
}

interface InvoicesSummary {
  totalInvoices: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  fullyPaidCount: number;
  partPaidCount: number;
  unpaidCount: number;
  pendingVerificationCount: number;
}

export default function TermInvoices() {
  const { activeBranchId, assignedBranchName } = useBranch();
  const { session: activeSession, term: activeTerm } = useActiveTerm();
  const { schoolName } = useTenant();

  // Filter States
  const [filterSession, setFilterSession] = useState<string>(activeSession || '2026/2027');
  const [filterTerm, setFilterTerm] = useState<string>(activeTerm || 'First Term');
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data States
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<InvoicesSummary>({
    totalInvoices: 0,
    totalAmountDue: 0,
    totalAmountPaid: 0,
    totalOutstanding: 0,
    fullyPaidCount: 0,
    partPaidCount: 0,
    unpaidCount: 0,
    pendingVerificationCount: 0,
  });
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Sync active term defaults
  useEffect(() => {
    if (activeSession && !filterSession) setFilterSession(activeSession);
    if (activeTerm && !filterTerm) setFilterTerm(activeTerm);
  }, [activeSession, activeTerm]);

  // Fetch Class List for dropdown filter
  useEffect(() => {
    api
      .get('/setup/classes')
      .then((res: any) => {
        if (Array.isArray(res)) setClassList(res);
        else if (res?.data && Array.isArray(res.data)) setClassList(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Invoices List with filters & branch context
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSession) params.append('session', filterSession);
      if (filterTerm) params.append('term', filterTerm);
      if (filterClassId && filterClassId !== 'ALL') params.append('classId', filterClassId);
      if (filterLevel && filterLevel !== 'ALL') params.append('level', filterLevel);
      if (filterMonth && filterMonth !== 'ALL') params.append('month', filterMonth);
      if (filterStatus && filterStatus !== 'ALL') params.append('paymentStatus', filterStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (activeBranchId) params.append('branchId', activeBranchId);

      const endpoint = `/finance/invoices?${params.toString()}`;
      const res = await api.get(endpoint);

      if (res && res.invoices) {
        setInvoices(res.invoices);
        if (res.summary) {
          setSummary(res.summary);
        }
      } else if (Array.isArray(res)) {
        setInvoices(res);
      }
    } catch (err) {
      console.error('Failed to load term invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [
    filterSession,
    filterTerm,
    filterClassId,
    filterLevel,
    filterMonth,
    filterStatus,
    activeBranchId,
  ]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInvoices();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setFilterSession(activeSession || '2026/2027');
    setFilterTerm(activeTerm || 'First Term');
    setFilterClassId('ALL');
    setFilterLevel('ALL');
    setFilterMonth('ALL');
    setFilterStatus('ALL');
    setSearchTerm('');
  };

  const getStatusBadge = (status: string, isPaid: boolean) => {
    if (status === 'Completed' || isPaid) {
      return <span className="status-pill-badge completed">✓ Fully Paid</span>;
    }
    if (status === 'Part-Payment') {
      return <span className="status-pill-badge part-payment">⏳ Part-Paid</span>;
    }
    if (status === 'Pending Verification') {
      return <span className="status-pill-badge pending">🔍 Pending Check</span>;
    }
    return <span className="status-pill-badge unpaid">✕ Unpaid</span>;
  };

  const handlePrintInvoice = (inv: InvoiceRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (inv.items || [])
      .map(
        (item, idx) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0;"><strong>${item.feeCategory || item.description}</strong></td>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0;">${item.description || 'Term Tuition Fee Item'}</td>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0; text-align:right;">₦${Number(item.amount).toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Fee Invoice - ${inv.registrationNumber || inv.studentName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0F172A; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #000080; padding-bottom: 20px; margin-bottom: 25px; }
            .school-title { font-size: 24px; font-weight: 800; color: #000080; text-transform: uppercase; margin: 0; }
            .school-sub { font-size: 13px; color: #64748B; margin-top: 4px; }
            .invoice-badge { background: #000080; color: #fff; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; }
            .meta-item { font-size: 13px; margin-bottom: 6px; }
            .meta-item strong { color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #000080; color: #fff; padding: 12px; font-size: 13px; text-align: left; text-transform: uppercase; }
            .totals { float: right; width: 320px; background: #F1F5F9; padding: 18px; border-radius: 8px; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #CBD5E1; }
            .total-row.grand { border-bottom: none; font-size: 16px; font-weight: 800; color: #000080; margin-top: 6px; padding-top: 10px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="school-title">${schoolName}</h1>
              <div class="school-sub">${inv.branchName || assignedBranchName || 'Main Campus Branch'} • Official Bursary Student Fee Invoice</div>
            </div>
            <div class="invoice-badge">${inv.paymentStatus}</div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-item"><strong>Student Name:</strong> ${inv.studentName}</div>
              <div class="meta-item"><strong>Reg / Adm Number:</strong> ${inv.registrationNumber}</div>
              <div class="meta-item"><strong>Class / Level:</strong> ${inv.className} (${inv.level})</div>
            </div>
            <div>
              <div class="meta-item"><strong>Session & Term:</strong> ${inv.session} • ${inv.term}</div>
              <div class="meta-item"><strong>Invoice Reference:</strong> INV-${inv.id.substring(0, 8).toUpperCase()}</div>
              <div class="meta-item"><strong>Branch Campus:</strong> ${inv.branchName || assignedBranchName}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align:center; width:50px;">#</th>
                <th>Fee Category</th>
                <th>Description</th>
                <th style="text-align:right;">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml.length > 0 ? itemsHtml : '<tr><td colspan="4" style="padding:15px; text-align:center; color:#64748B;">Standard Term Tuition Fee Breakdown</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Total Invoice Amount:</span> <strong>₦${Number(inv.amountDue).toLocaleString()}</strong></div>
            <div class="total-row"><span>Amount Paid To Date:</span> <strong style="color:#10B981;">₦${Number(inv.amountPaid).toLocaleString()}</strong></div>
            <div class="total-row grand"><span>Outstanding Balance:</span> <span>₦${Number(inv.balance).toLocaleString()}</span></div>
          </div>

          <div style="clear:both;"></div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Computer Generated Student Term Invoice • Bursary Control System
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="finance-page-container">
      {/* ════════ BURSARY COMMAND HERO BANNER ════════ */}
      <div className="finance-hero-banner">
        <div className="finance-banner-header">
          <span className="finance-banner-pill">
            <Building size={14} /> {assignedBranchName}
          </span>
          <span className="finance-banner-pill">
            <Calendar size={14} /> {filterSession} • {filterTerm}
          </span>
        </div>

        <div className="finance-banner-content">
          <div className="finance-banner-text">
            <h2>
              Term Invoices & Fee Roster <Sparkles size={22} className="text-yellow-400" />
            </h2>
            <p>
              Centralized bursary ledger of all generated term tuition fee invoices across students,
              classes, levels, and campus branches. Filter, monitor revenue collections, and inspect individual student invoice items.
            </p>
          </div>

          <div className="finance-banner-actions">
            <button onClick={fetchInvoices} className="btn-banner-action">
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Roster
            </button>
            <button onClick={handleResetFilters} className="btn-banner-outline">
              <RotateCcw size={16} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ════════ EXECUTIVE KPI METRIC CARDS ════════ */}
      <div className="stats-grid">
        <StatCard
          label="GENERATED INVOICES"
          value={summary.totalInvoices.toLocaleString()}
          icon={FileText}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: `● ${summary.fullyPaidCount} Cleared` }}
          subText={`${summary.unpaidCount} Unpaid • ${summary.partPaidCount} Part-Paid`}
        />

        <StatCard
          label="TOTAL BILLED FEES"
          value={`₦${summary.totalAmountDue.toLocaleString()}`}
          icon={DollarSign}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Term Schedule' }}
          subText={`Active ${filterSession} ${filterTerm}`}
        />

        <StatCard
          label="TOTAL REVENUE COLLECTED"
          value={`₦${summary.totalAmountPaid.toLocaleString()}`}
          icon={CheckCircle}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Verified Revenue' }}
          subText="Bank Transfers & POS"
        />

        <StatCard
          label="OUTSTANDING BALANCE"
          value={`₦${summary.totalOutstanding.toLocaleString()}`}
          icon={CreditCard}
          topColor="#000080"
          iconBg="#EFF6FF"
          iconColor="#000080"
          trendTag={{ type: 'positive', text: '● Uncollected Fees' }}
          subText="Pending Tuition Payments"
        />
      </div>

      {/* ════════ GRANULAR INVOICE FILTERS PANEL ════════ */}
      <div className="filter-card-container">
        <div className="filter-card-header">
          <div className="filter-card-title">
            <Filter size={18} style={{ color: '#000080' }} />
            <span>Granular Invoice Filters</span>
          </div>
          <button onClick={handleResetFilters} className="btn-reset-link">
            Reset All Filters
          </button>
        </div>

        <div className="filter-controls-grid">
          {/* Search Bar */}
          <div className="filter-field-group">
            <label>Search Student / Reg No</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-inside" />
              <input
                type="text"
                placeholder="Search name, Reg No, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-control-input"
              />
            </div>
          </div>

          {/* Session Selector */}
          <div className="filter-field-group">
            <label>Academic Session</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="filter-control-select"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>

          {/* Term Selector */}
          <div className="filter-field-group">
            <label>Academic Term</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="filter-control-select"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Level Selector */}
          <div className="filter-field-group">
            <label>Education Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="filter-control-select"
            >
              <option value="ALL">All Levels</option>
              <option value="Junior">Junior Secondary (JSS)</option>
              <option value="Senior">Senior Secondary (SSS)</option>
              <option value="Primary">Primary School</option>
              <option value="Nursery">Nursery / Creche</option>
            </select>
          </div>

          {/* Class Selector */}
          <div className="filter-field-group">
            <label>Class Name</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="filter-control-select"
            >
              <option value="ALL">All Classes</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section} ({c.level || 'Class'})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="filter-field-group">
            <label>Due Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="filter-control-select"
            >
              <option value="ALL">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Payment Status Selector */}
          <div className="filter-field-group">
            <label>Payment Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-control-select"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Completed">Fully Paid (Completed)</option>
              <option value="Part-Payment">Part-Payment</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          {/* Campus Branch Display */}
          <div className="filter-field-group">
            <label>Campus Branch</label>
            <div
              className="filter-control-input"
              style={{ background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}
            >
              <Building size={16} style={{ color: '#000080' }} />
              <span style={{ fontWeight: 700 }}>{assignedBranchName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ INVOICES ROSTER DATA TABLE CARD ════════ */}
      <div className="invoices-table-card">
        <div className="invoices-table-header">
          <div>
            <h3>Generated Term Invoices Roster</h3>
            <p>
              Showing {invoices.length} student invoice records for {filterSession} • {filterTerm}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem auto', color: '#000080' }} />
            <div>Loading Bursary Invoice Roster...</div>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
            <h4 style={{ fontWeight: 800, color: '#334155', margin: 0 }}>No Invoices Found</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
              No fee invoices match the selected session, term, level, or search query.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn-table-action"
              style={{ marginTop: '1rem' }}
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-finance-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Class / Level</th>
                  <th>Session & Term</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Campus Branch</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{inv.studentName}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                        {inv.registrationNumber}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{inv.className}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.level}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>{inv.session}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.term}</div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      ₦{Number(inv.amountDue).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: '#166534' }}>
                      ₦{Number(inv.amountPaid).toLocaleString()}
                    </td>
                    <td
                      style={{
                        fontWeight: 800,
                        color: inv.balance > 0 ? '#dc2626' : '#64748b',
                      }}
                    >
                      ₦{Number(inv.balance).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(inv.paymentStatus, inv.isPaid)}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                        }}
                      >
                        {inv.branchName || assignedBranchName}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn-table-action"
                          title="View Invoice Items Breakdown"
                        >
                          <Eye size={14} /> Items ({inv.itemsCount || inv.items?.length || 0})
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="btn-table-action primary"
                          title="Print Official Student Invoice"
                        >
                          <Printer size={14} /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════ INVOICE ITEMS BREAKDOWN MODAL ════════ */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            {/* Modal Header */}
            <div className="modal-header-navy">
              <div>
                <h3>
                  Student Term Invoice Breakdown
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Ref: INV-{selectedInvoice.id.substring(0, 8).toUpperCase()} •{' '}
                  {selectedInvoice.session} {selectedInvoice.term}
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body-scroll">
              {/* Student Metadata Card */}
              <div className="modal-student-info-box">
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Student Name</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '0.15rem' }}>
                    {selectedInvoice.studentName}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', marginTop: '0.25rem' }}>
                    Reg No: {selectedInvoice.registrationNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Class & Branch</div>
                  <div style={{ fontWeight: 800, color: '#1e293b', marginTop: '0.15rem' }}>
                    {selectedInvoice.className} ({selectedInvoice.level})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                    {selectedInvoice.branchName || assignedBranchName}
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Itemized Tuition & Fee Schedule
              </h4>

              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Fee Category</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            {item.feeCategory || item.description}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                            {item.description || 'Standard Term Fee'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₦{Number(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.25rem' }}>
                  Standard Consolidated Term Tuition Invoice
                </div>
              )}

              {/* Financial Totals Summary */}
              <div className="modal-totals-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#475569' }}>Total Invoice Amount:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    ₦{Number(selectedInvoice.amountDue).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#475569' }}>Amount Paid to Date:</span>
                  <span style={{ fontWeight: 800, color: '#166534' }}>
                    ₦{Number(selectedInvoice.amountPaid).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, paddingTop: '0.6rem', borderTop: '1px solid #bfdbfe', color: '#000080' }}>
                  <span>Outstanding Balance:</span>
                  <span>₦{Number(selectedInvoice.balance).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer-bar">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn-table-action"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintInvoice(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="btn-table-action primary"
              >
                <Printer size={16} /> Print Full Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
