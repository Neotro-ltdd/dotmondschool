import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Sparkles,
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
  const { activeBranchId, assignedBranchName, branches } = useBranch();
  const { session: activeSession, term: activeTerm } = useActiveTerm();
  const { schoolName, logoUrl } = useTenant();

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
      return <span className="badge badge-success">✓ Fully Paid</span>;
    }
    if (status === 'Part-Payment') {
      return <span className="badge badge-info">⏳ Part-Paid</span>;
    }
    if (status === 'Pending Verification') {
      return <span className="badge badge-warning">🔍 Pending Check</span>;
    }
    return <span className="badge badge-danger">✕ Unpaid</span>;
  };

  const handlePrintInvoice = (inv: InvoiceRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (inv.items || [])
      .map(
        (item, idx) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0; text-align:center;">${idx + 1}</td>
        <td style="padding:10px; border-bottom:1px solid #E2E8F0;"><strong>${item.feeCategory}</strong></td>
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
    <div className="finance-page">
      {/* ════════ BURSARY HERO BANNER ════════ */}
      <div className="finance-banner glass-panel">
        <div className="banner-text">
          <div className="flex items-center gap-2">
            <h2>Term Invoices & Fee Roster</h2>
            <span className="branch-badge">
              <Building size={14} /> {assignedBranchName}
            </span>
          </div>
          <p>
            Centralized bursary ledger of all generated term tuition invoices across students,
            classes, levels, and campus branches. Filter, verify collections, and export individual student receipts.
          </p>
        </div>
        <div className="banner-actions">
          <button onClick={fetchInvoices} className="btn btn-outline flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Roster
          </button>
        </div>
      </div>

      {/* ════════ EXECUTIVE METRIC CARDS ════════ */}
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
          label="TOTAL COLLECTED (PAID)"
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

      {/* ════════ GRANULAR FILTER CONTROLS BAR ════════ */}
      <div className="glass-panel p-5 my-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Filter size={18} className="text-blue-900" />
            <span>Granular Invoice Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">
              Search Student / Reg No
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search name, Reg No, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none"
              />
            </div>
          </div>

          {/* Session Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Academic Session</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>

          {/* Term Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Academic Term</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Level Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Education Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
            >
              <option value="ALL">All Levels</option>
              <option value="Junior">Junior Secondary (JSS)</option>
              <option value="Senior">Senior Secondary (SSS)</option>
              <option value="Primary">Primary School</option>
              <option value="Nursery">Nursery / Creche</option>
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Class Name</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
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
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Due Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
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
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Payment Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none bg-white"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Completed">Fully Paid (Completed)</option>
              <option value="Part-Payment">Part-Payment</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          {/* Active Branch Display */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Campus Branch</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
              <Building size={16} className="text-blue-900" />
              <span className="truncate">{assignedBranchName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ INVOICES ROSTER TABLE ════════ */}
      <div className="table-card glass-panel">
        <div className="table-header">
          <div>
            <h3>Generated Term Invoices Roster</h3>
            <p>
              Showing {invoices.length} student invoice records for {filterSession} • {filterTerm}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw size={24} className="spin mx-auto mb-2 text-blue-900" />
            Loading Bursary Invoice Roster...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <h4 className="font-bold text-slate-700">No Invoices Found</h4>
            <p className="text-sm text-slate-500 mt-1">
              No fee invoices match the selected session, term, level, or search query.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn btn-outline btn-sm mt-4 inline-flex items-center gap-2"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
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
                      <div className="font-bold text-slate-900">{inv.studentName}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {inv.registrationNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{inv.className}</div>
                      <div className="text-xs text-slate-500">{inv.level}</div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-700">{inv.session}</div>
                      <div className="text-xs text-slate-500">{inv.term}</div>
                    </td>
                    <td className="font-bold text-slate-800">
                      ₦{Number(inv.amountDue).toLocaleString()}
                    </td>
                    <td className="font-semibold text-emerald-700">
                      ₦{Number(inv.amountPaid).toLocaleString()}
                    </td>
                    <td
                      className={`font-bold ${
                        inv.balance > 0 ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      ₦{Number(inv.balance).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(inv.paymentStatus, inv.isPaid)}</td>
                    <td>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {inv.branchName || assignedBranchName}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn btn-sm btn-outline flex items-center gap-1"
                          title="View Invoice Items Breakdown"
                        >
                          <Eye size={14} /> Items ({inv.itemsCount || inv.items?.length || 0})
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="btn btn-sm btn-primary flex items-center gap-1"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText size={20} className="text-blue-400" />
                  Student Term Invoice Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Invoice Ref: INV-{selectedInvoice.id.substring(0, 8).toUpperCase()} •{' '}
                  {selectedInvoice.session} {selectedInvoice.term}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {/* Student Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Student Name</div>
                  <div className="font-bold text-slate-900 text-base">
                    {selectedInvoice.studentName}
                  </div>
                  <div className="text-xs font-mono text-slate-600 mt-0.5">
                    Reg No: {selectedInvoice.registrationNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Class & Branch</div>
                  <div className="font-bold text-slate-800">
                    {selectedInvoice.className} ({selectedInvoice.level})
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedInvoice.branchName || assignedBranchName}
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-blue-900" /> Itemized Tuition & Fee Schedule
              </h4>

              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 text-left">Fee Category</th>
                        <th className="p-3 text-left">Description</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-semibold text-slate-800">
                            {item.feeCategory}
                          </td>
                          <td className="p-3 text-slate-600">
                            {item.description || 'Standard Term Fee'}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ₦{Number(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl mb-6">
                  Standard Consolidated Term Tuition Invoice
                </div>
              )}

              {/* Financial Totals Summary */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Invoice Amount:</span>
                  <span className="font-bold text-slate-900">
                    ₦{Number(selectedInvoice.amountDue).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Paid to Date:</span>
                  <span className="font-bold text-emerald-700">
                    ₦{Number(selectedInvoice.amountPaid).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold pt-2 border-t border-blue-200 text-blue-950">
                  <span>Outstanding Balance:</span>
                  <span>₦{Number(selectedInvoice.balance).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-outline text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handlePrintInvoice(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="btn btn-primary flex items-center gap-2"
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
