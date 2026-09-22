import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Smartphone,
  MessageSquare,
  Copy,
  Check,
  Share2,
  QrCode,
  Download,
  Search,
  Filter,
  ExternalLink,
  Sparkles,
  CheckCircle,
  Clock,
  Send,
  Building,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import PublicParentIntakeForm from '../../public/PublicParentIntakeForm';
import './ParentIntakePage.css';

interface ParentRecord {
  id: string;
  tenantId: string;
  title: string;
  surname: string;
  firstName: string;
  otherName?: string;
  whatsappNumber: string;
  email: string;
  address: string;
  notificationPreference: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  totalCount: number;
  emailCount: number;
  emailPercentage: number;
  mobileAppCount: number;
  mobileAppPercentage: number;
  smsCount: number;
  smsPercentage: number;
}

export default function ParentIntakePage() {
  const { schoolName } = useTenant();
  const [activeTab, setActiveTab] = useState<'records' | 'preview'>('records');

  const [records, setRecords] = useState<ParentRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCount: 0,
    emailCount: 0,
    emailPercentage: 0,
    mobileAppCount: 0,
    mobileAppPercentage: 0,
    smsCount: 0,
    smsPercentage: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const publicFormUrl = `${window.location.origin}/parent-form`;

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (preferenceFilter !== 'all') queryParams.set('preference', preferenceFilter);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const res: any = await api.get(`/parents/intake-forms${queryString}`);

      if (res?.data) {
        setRecords(res.data.items || []);
        if (res.data.analytics) {
          setAnalytics(res.data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch parent intake records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords();
    }
  }, [activeTab, preferenceFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello Parent/Guardian, please complete the official Parent Information & Gate Notification Setup form for ${schoolName || 'our school'} here:\n\n${publicFormUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.put(`/parents/intake-forms/${id}/status`, { status: newStatus });
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const exportCSV = () => {
    if (!records || records.length === 0) return;
    const headers = ['Title', 'Surname', 'FirstName', 'OtherName', 'WhatsAppNumber', 'Email', 'Address', 'NotificationPreference', 'Status', 'CreatedAt'];
    const rows = records.map((r) => [
      `"${r.title}"`,
      `"${r.surname}"`,
      `"${r.firstName}"`,
      `"${r.otherName || ''}"`,
      `"${r.whatsappNumber}"`,
      `"${r.email}"`,
      `"${r.address.replace(/"/g, '""')}"`,
      `"${r.notificationPreference}"`,
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Parent_Intake_Forms_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="parent-intake-admin-container">
      {/* Top Banner Header */}
      <div className="intake-admin-header">
        <div className="intake-admin-title-block">
          <div className="intake-admin-eyebrow">
            <Sparkles size={16} /> ADMISSIONS & PARENT INFORMATION MODULE
          </div>
          <h1 className="intake-admin-title">Parent Form & Notification Setup</h1>
          <p className="intake-admin-subtitle">
            Manage submitted parent contact profiles, monitor notification preference distribution, and share the public parent form link with parents.
          </p>
        </div>

        {/* Shareable Link Action Bar */}
        <div className="intake-share-bar">
          <div className="share-link-box" onClick={handleCopyLink} title="Click to copy link">
            <span className="share-url">{publicFormUrl}</span>
            <button type="button" className="btn-copy-chip">
              {copiedLink ? <Check size={14} className="text-green" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="share-btn-group">
            <button
              type="button"
              className="btn-share-whatsapp"
              onClick={handleWhatsAppShare}
              title="Share form via WhatsApp"
            >
              <Share2 size={16} />
              <span>Share WhatsApp</span>
            </button>

            <button
              type="button"
              className="btn-share-qr"
              onClick={() => setShowQrModal(true)}
              title="Display QR Code"
            >
              <QrCode size={16} />
              <span>QR Code</span>
            </button>

            <a
              href="/parent-form"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-share-open"
              title="Open Public Form"
            >
              <ExternalLink size={16} />
              <span>Open Form</span>
            </a>
          </div>
        </div>
      </div>

      {/* Analytics Summary Metric Cards */}
      <div className="intake-metrics-grid">
        <div className="intake-metric-card total">
          <div className="metric-icon-box navy">
            <Users size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Submissions</span>
            <span className="metric-val">{analytics.totalCount}</span>
          </div>
        </div>

        <div className="intake-metric-card email">
          <div className="metric-icon-box green">
            <Mail size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Email Preference (100% Rate)</span>
            <span className="metric-val green">{analytics.emailCount} <span className="pct">({analytics.emailPercentage}%)</span></span>
          </div>
        </div>

        <div className="intake-metric-card app">
          <div className="metric-icon-box blue">
            <Smartphone size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Mobile App Preference (80% Rate)</span>
            <span className="metric-val blue">{analytics.mobileAppCount} <span className="pct">({analytics.mobileAppPercentage}%)</span></span>
          </div>
        </div>

        <div className="intake-metric-card sms">
          <div className="metric-icon-box grey">
            <MessageSquare size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">SMS Preference (60% Rate)</span>
            <span className="metric-val grey">{analytics.smsCount} <span className="pct">({analytics.smsPercentage}%)</span></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="intake-nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <Users size={18} />
          <span>Submitted Records ({records.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <ExternalLink size={18} />
          <span>Live Form Preview</span>
        </button>
      </div>

      {/* TAB 1: RECORDS TABLE */}
      {activeTab === 'records' && (
        <div className="intake-table-card">
          {/* Table Header Filter Bar */}
          <div className="table-filter-header">
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or WhatsApp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="search-btn">Search</button>
            </form>

            <div className="filter-group">
              <div className="filter-select-wrapper">
                <Filter size={15} />
                <select
                  value={preferenceFilter}
                  onChange={(e) => setPreferenceFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Preferences</option>
                  <option value="Email">📧 Email (100%)</option>
                  <option value="MobileApp">📱 Mobile App (80%)</option>
                  <option value="Sms">💬 SMS (60%)</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Processed">Processed</option>
                </select>
              </div>

              <button type="button" className="btn-refresh" onClick={fetchRecords} title="Refresh">
                <RefreshCw size={16} />
              </button>

              <button type="button" className="btn-export-csv" onClick={exportCSV} title="Export to CSV">
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          {isLoading ? (
            <div className="intake-loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <span>Loading parent form records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="intake-empty-state">
              <Users size={40} />
              <h3>No Parent Records Found</h3>
              <p>No parent forms match your search criteria. Share the public link to gather parent information.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>SUBMITTED DATE</th>
                    <th>PARENT NAME</th>
                    <th>WHATSAPP NUMBER</th>
                    <th>EMAIL ADDRESS</th>
                    <th>ADDRESS</th>
                    <th>NOTIFICATION PREFERENCE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="text-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="fw-700">
                        {r.title} {r.surname} {r.firstName} {r.otherName || ''}
                      </td>
                      <td>
                        <a href={`https://wa.me/${r.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="link-wa">
                          {r.whatsappNumber}
                        </a>
                      </td>
                      <td>{r.email}</td>
                      <td className="text-truncate-cell" title={r.address}>{r.address}</td>
                      <td>
                        {r.notificationPreference === 'Email' && (
                          <span className="pref-badge green">📧 Email (100%)</span>
                        )}
                        {r.notificationPreference === 'MobileApp' && (
                          <span className="pref-badge blue">📱 Mobile App (80%)</span>
                        )}
                        {r.notificationPreference === 'Sms' && (
                          <span className="pref-badge grey">💬 SMS (60%)</span>
                        )}
                      </td>
                      <td>
                        <select
                          className={`status-select ${r.status.toLowerCase()}`}
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Approved">Approved</option>
                          <option value="Processed">Processed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-table-action"
                          onClick={() => handleCopyLink()}
                          title="Copy Link"
                        >
                          Copy Share Link
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

      {/* TAB 2: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="intake-preview-container">
          <div className="preview-notice-bar">
            <Sparkles size={18} />
            <span>Interactive Live Form Preview — Parents see this exact layout when opening your shareable link.</span>
          </div>
          <PublicParentIntakeForm />
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="qr-modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="qr-modal-title">Public Form QR Code</h3>
            <p className="qr-modal-desc">Scan with a smartphone camera to open the Parent Form directly.</p>
            <div className="qr-code-img-box">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicFormUrl)}`}
                alt="Parent Form QR Code"
                className="qr-img"
              />
            </div>
            <div className="qr-modal-actions">
              <button className="btn-modal-close" onClick={() => setShowQrModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
