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
  Save,
  Layers,
  CheckSquare,
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

  // Modal Dynamic Fee Selection State
  interface ModalFeeItem {
    id?: string;
    name: string;
    amount: number;
    applicability?: string;
    selected: boolean;
  }

  const DEFAULT_CLASS_FEE_ITEMS: ModalFeeItem[] = [
    { name: 'Registration Form', amount: 5000, applicability: 'COMPULSORY', selected: true },
    { name: 'Christmas Party', amount: 10000, applicability: 'COMPULSORY', selected: true },
    { name: 'Uniform Fees', amount: 40000, applicability: 'COMPULSORY', selected: true },
    { name: 'Notebook', amount: 10000, applicability: 'COMPULSORY', selected: true },
    { name: 'Sport Wear', amount: 10000, applicability: 'COMPULSORY', selected: true },
    { name: 'Security ID / Resource Management', amount: 10000, applicability: 'COMPULSORY', selected: true },
    { name: 'Textbook', amount: 30000, applicability: 'COMPULSORY', selected: true },
    { name: 'Development Fees', amount: 10000, applicability: 'COMPULSORY', selected: true },
    { name: 'Tuition Fees', amount: 90000, applicability: 'COMPULSORY', selected: true },
    { name: 'Lesson Fees', amount: 10000, applicability: 'COMPULSORY', selected: true },
  ];

  const [modalFeeItems, setModalFeeItems] = useState<ModalFeeItem[]>([]);
  const [modalDiscount, setModalDiscount] = useState<number>(0);
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  useEffect(() => {
    if (selectedInvoice) {
      setModalDiscount(0);
      if (selectedInvoice.items && selectedInvoice.items.length > 0) {
        const discountItem = selectedInvoice.items.find(
          (it) => it.amount < 0 || it.description?.toLowerCase().includes('discount')
        );
        if (discountItem) {
          setModalDiscount(Math.abs(Number(discountItem.amount)) || 0);
        }

        const regularItems = selectedInvoice.items.filter(
          (it) => !(it.amount < 0 || it.description?.toLowerCase().includes('discount'))
        );

        const hasOnlyGeneric =
          regularItems.length === 1 &&
          regularItems[0].description?.toLowerCase().includes('tuition & general');

        if (regularItems.length > 0 && !hasOnlyGeneric) {
          setModalFeeItems(
            regularItems.map((it) => ({
              id: it.id,
              name: it.feeCategory || it.description,
              amount: Number(it.amount) || 0,
              applicability: 'COMPULSORY',
              selected: true,
            }))
          );
          return;
        }
      }

      if (selectedInvoice.classId) {
        api
          .get(`/finance/setup/fee-templates/class/${selectedInvoice.classId}`)
          .then((res: any) => {
            if (res && Array.isArray(res.items) && res.items.length > 0) {
              setModalFeeItems(
                res.items.map((it: any) => ({
                  id: it.id,
                  name: it.name,
                  amount: Number(it.amount) || 0,
                  applicability: it.applicability ? it.applicability.toUpperCase() : 'COMPULSORY',
                  selected: true,
                }))
              );
            } else {
              setModalFeeItems(DEFAULT_CLASS_FEE_ITEMS.map((item) => ({ ...item })));
            }
          })
          .catch(() => {
            setModalFeeItems(DEFAULT_CLASS_FEE_ITEMS.map((item) => ({ ...item })));
          });
      } else {
        setModalFeeItems(DEFAULT_CLASS_FEE_ITEMS.map((item) => ({ ...item })));
      }
    }
  }, [selectedInvoice]);

  const toggleModalFeeItem = (index: number) => {
    setModalFeeItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleModalSelectAll = (selectAll: boolean) => {
    setModalFeeItems((prev) => prev.map((item) => ({ ...item, selected: selectAll })));
  };

  const handleModalSelectCompulsory = () => {
    setModalFeeItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected:
          item.applicability?.toUpperCase() === 'COMPULSORY' ||
          !item.applicability?.toLowerCase().includes('optional'),
      }))
    );
  };

  const handleSaveFeeSchedule = async () => {
    if (!selectedInvoice) return;
    setSavingSchedule(true);
    try {
      const selectedItems = modalFeeItems
        .filter((i) => i.selected)
        .map((i) => ({
          description: i.name,
          amount: i.amount,
        }));

      if (modalDiscount > 0) {
        selectedItems.push({
          description: `Fee Discount / Concession (-₦${modalDiscount.toLocaleString()})`,
          amount: -modalDiscount,
        });
      }

      const res = await api.post(`/finance/invoices/${selectedInvoice.id}/update-items`, {
        items: selectedItems,
      });

      if (res && res.success) {
        const updatedInv = {
          ...selectedInvoice,
          amountDue: res.amountDue,
          balance: res.balance,
          paymentStatus: res.paymentStatus,
          itemsCount: res.items?.length || 0,
          items: res.items || [],
        };
        setSelectedInvoice(updatedInv);

        setInvoices((prev) =>
          prev.map((inv) => (inv.id === selectedInvoice.id ? updatedInv : inv))
        );

        fetchInvoices();
        alert('Fee schedule saved successfully! Student invoice totals updated.');
      }
    } catch (err: any) {
      console.error('Failed to save fee schedule:', err);
      alert('Failed to save fee schedule: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingSchedule(false);
    }
  };

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

    let resolvedLogo = '';
    if (logoUrl) {
      resolvedLogo = logoUrl.startsWith('http')
        ? logoUrl
        : window.location.origin + (logoUrl.startsWith('/') ? '' : '/') + logoUrl;
    } else {
      resolvedLogo = window.location.origin + '/images/dotmond-logo-1.png';
    }

    const itemsHtml = (inv.items || [])
      .map(
        (item, idx) => `
      <tr>
        <td style="padding:5px 10px; border-bottom:1px solid #E2E8F0; text-align:center; font-size:11px;">${idx + 1}</td>
        <td style="padding:5px 10px; border-bottom:1px solid #E2E8F0; font-size:11px;"><strong>${item.feeCategory || item.description}</strong></td>
        <td style="padding:5px 10px; border-bottom:1px solid #E2E8F0; font-size:11px;">${item.description || 'Term Tuition Fee Item'}</td>
        <td style="padding:5px 10px; border-bottom:1px solid #E2E8F0; text-align:right; font-size:11px;">₦${Number(item.amount).toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Bursary Student Fee Breakdown - ${inv.registrationNumber || inv.studentName}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm 10mm; }
            html, body { height: 100%; max-height: 100vh; overflow: hidden; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10px 15px; color: #0F172A; }
            .header-box { text-align: center; border-bottom: 2px solid #000080; padding-bottom: 8px; margin-bottom: 12px; position: relative; }
            .logo-img { max-height: 55px; object-fit: contain; margin-bottom: 4px; }
            .school-title { font-size: 20px; font-weight: 800; color: #000080; text-transform: uppercase; margin: 0 0 2px 0; }
            .heading-title { font-size: 13px; font-weight: 700; color: #1E293B; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
            .status-badge { position: absolute; right: 0; top: 0; background: #000080; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
            
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px; background: #F8FAFC; padding: 10px 14px; border-radius: 6px; border: 1px solid #E2E8F0; page-break-inside: avoid; }
            .meta-item { font-size: 12px; margin-bottom: 3px; }
            .meta-item strong { color: #334155; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; }
            th { background: #000080; color: #fff; padding: 6px 10px; font-size: 11px; text-align: left; text-transform: uppercase; }
            td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #E2E8F0; }
            tr { page-break-inside: avoid; }
            
            .totals { float: right; width: 300px; background: #F1F5F9; padding: 10px 14px; border-radius: 6px; font-size: 12px; margin-top: 4px; page-break-inside: avoid; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #CBD5E1; }
            .total-row.grand { border-bottom: none; font-size: 14px; font-weight: 800; color: #000080; margin-top: 4px; padding-top: 4px; }
            
            .footer { clear: both; margin-top: 15px; text-align: center; font-size: 11px; color: #334155; font-weight: 600; border-top: 1px solid #E2E8F0; padding-top: 8px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div class="status-badge">${inv.paymentStatus}</div>
            ${resolvedLogo ? `<img src="${resolvedLogo}" alt="${schoolName} Logo" class="logo-img" />` : ''}
            <h1 class="school-title">${schoolName}</h1>
            <h2 class="heading-title">OFFICIAL BURSARY STUDENT FEE BREAKDOWN</h2>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-item"><strong>Student Name:</strong> ${inv.studentName}</div>
              <div class="meta-item"><strong>Reg / Adm Number:</strong> ${inv.registrationNumber}</div>
              <div class="meta-item"><strong>Class / Level:</strong> ${inv.className} (${inv.level})</div>
            </div>
            <div>
              <div class="meta-item"><strong>Session & Term:</strong> ${inv.session} • ${inv.term}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align:center; width:45px;">#</th>
                <th>Fee Category</th>
                <th>Description</th>
                <th style="text-align:right;">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml.length > 0 ? itemsHtml : '<tr><td colspan="4" style="padding:10px; text-align:center; color:#64748B;">Standard Term Tuition Fee Breakdown</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Total Invoice Amount:</span> <strong>₦${Number(inv.amountDue).toLocaleString()}</strong></div>
            <div class="total-row"><span>Amount Paid To Date:</span> <strong style="color:#10B981;">₦${Number(inv.amountPaid).toLocaleString()}</strong></div>
            <div class="total-row grand"><span>Outstanding Balance:</span> <span>₦${Number(inv.balance).toLocaleString()}</span></div>
          </div>

          <div style="clear:both;"></div>

          <div class="footer">
            Dotmond School Bursary Department @2026
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

              {/* Class Fee Breakdown & Dynamic Selection Component */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#000080" />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      Class Fee Breakdown &amp; Dynamic Selection
                    </h4>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="pos-btn-fee-action"
                      onClick={() => handleModalSelectAll(true)}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="pos-btn-fee-action"
                      onClick={handleModalSelectCompulsory}
                    >
                      Compulsory Only
                    </button>
                    <button
                      type="button"
                      className="pos-btn-fee-action"
                      onClick={() => handleModalSelectAll(false)}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {modalFeeItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleModalFeeItem(idx)}
                      style={{
                        border: item.selected ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
                        background: item.selected ? '#f0fdf4' : '#ffffff',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: item.selected ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            background: item.selected ? '#059669' : '#ffffff',
                            border: item.selected ? 'none' : '2px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                          }}
                        >
                          {item.selected ? '✓' : ''}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                            {item.name}
                          </div>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '0.2rem',
                            }}
                          >
                            {item.applicability || 'COMPULSORY'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, color: '#047857', fontSize: '0.92rem' }}>
                        ₦{item.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount / Concession Input Box */}
              <div
                style={{
                  marginBottom: '1.25rem',
                  background: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#92400E',
                    }}
                  >
                    Discount Amount (₦)
                  </label>
                  <div style={{ fontSize: '0.72rem', color: '#B45309' }}>
                    Special concession / fee reduction deducted from total fee due
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={modalDiscount === 0 ? '' : modalDiscount}
                  onChange={(e) => setModalDiscount(Math.max(0, Number(e.target.value) || 0))}
                  style={{
                    width: '180px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #F59E0B',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: '#D97706',
                    background: '#FFFFFF',
                  }}
                />
              </div>

              {/* Financial Totals Summary */}
              {(() => {
                const rawTotal = modalFeeItems
                  .filter((i) => i.selected)
                  .reduce((acc, item) => acc + item.amount, 0);
                const modalTotalBilled = Math.max(0, rawTotal - modalDiscount);
                const modalBalance = Math.max(0, modalTotalBilled - selectedInvoice.amountPaid);
                return (
                  <div className="modal-totals-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#475569' }}>Selected Fee Subtotal:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>
                        ₦{Number(rawTotal).toLocaleString()}
                      </span>
                    </div>
                    {modalDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#D97706' }}>
                        <span>Fee Discount / Concession (-):</span>
                        <span style={{ fontWeight: 800 }}>
                          -₦{Number(modalDiscount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#475569' }}>Net Billed Total Due:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>
                        ₦{Number(modalTotalBilled).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: '#475569' }}>Amount Paid to Date:</span>
                      <span style={{ fontWeight: 800, color: '#166534' }}>
                        ₦{Number(selectedInvoice.amountPaid).toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1rem',
                        fontWeight: 900,
                        paddingTop: '0.6rem',
                        borderTop: '1px solid #bfdbfe',
                        color: '#000080',
                      }}
                    >
                      <span>Outstanding Balance:</span>
                      <span>₦{Number(modalBalance).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
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
                onClick={handleSaveFeeSchedule}
                disabled={savingSchedule}
                className="btn-table-action primary"
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                <Save size={16} /> {savingSchedule ? 'Saving Schedule...' : 'Save Selected Fee Schedule'}
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
