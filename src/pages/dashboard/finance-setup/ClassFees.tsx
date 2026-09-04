import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import '../finance/Finance.css';
import './ClassFees.css';
import { useDialog } from '../../../context/DialogContext';
import { useTenant } from '../../../context/TenantContext';
import { Building2, Sparkles, Printer } from 'lucide-react';

interface FeeTemplateListDto {
  id: string;
  classId: string;
  className: string;
  level: string;
  section: string;
  totalAmount: number;
}

interface FeeTemplateDetailDto {
  id: string;
  classId: string;
  className: string;
  level: string;
  session: string;
  term: string;
  totalAmount: number;
  items: { name: string; amount: number }[];
}

export default function ClassFees() {
  const {
    session: filterSession,
    term: filterTerm,
    setSession: setFilterSession,
    setTerm: setFilterTerm,
  } = useActiveTerm();
  const { schoolName: tenantSchoolName, logoUrl: tenantLogoUrl } = useTenant();

  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [classes, setClasses] = useState<
    { id: string; level: string; name: string; section: string }[]
  >([]);
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplateListDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplateDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Asset states for official printable receipt layout (Image 1 format)
  const [setupLogoUrl, setSetupLogoUrl] = useState<string | null>(null);
  const [principalSigUrl, setPrincipalSigUrl] = useState<string | null>(null);
  const [accountantSigUrl, setAccountantSigUrl] = useState<string | null>(null);

  const { showAlert } = useDialog();

  useEffect(() => {
    fetchClasses();
    fetchSetupAssets();
  }, []);

  useEffect(() => {
    fetchFeeTemplates();
  }, [filterSession, filterTerm]);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/academics/classes');
      setClasses(data || []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchSetupAssets = async () => {
    try {
      const data = await api.get('/finance/setup');
      if (data) {
        if (data.schoolLogoUrl) setSetupLogoUrl(data.schoolLogoUrl);
        if (data.principalSignatureUrl) setPrincipalSigUrl(data.principalSignatureUrl);
        if (data.accountantSignatureUrl) setAccountantSigUrl(data.accountantSignatureUrl);
      }
    } catch (err) {
      console.error('Failed to load setup assets', err);
    }
  };

  const fetchFeeTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(
        `/finance/setup/fee-templates?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );
      setFeeTemplates(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load fee templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBreakdown = async (classId: string) => {
    try {
      setLoadingDetail(true);
      const data = await api.get(
        `/finance/setup/fee-templates/class/${classId}?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`,
      );
      setSelectedTemplate(data);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to load breakdown details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const resolveUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') || url.startsWith('/') ? url : `${API_ROOT}${url}`;
  };

  const handlePrint = () => {
    window.print();
  };

  let filteredTemplates = [...feeTemplates];
  if (filterLevel) {
    filteredTemplates = filteredTemplates.filter((t) => t.level === filterLevel);
  }
  if (filterClassId) {
    filteredTemplates = filteredTemplates.filter((t) => t.classId === filterClassId);
  }

  // Generate options for classes based on selected level
  const classOptions = filterLevel ? classes.filter((c) => c.level === filterLevel) : classes;

  const displayLogo = resolveUrl(setupLogoUrl) || tenantLogoUrl || '/images/dotmond-logo-1.png';
  const displaySchoolName = tenantSchoolName || 'Dotmond International School';

  return (
    <div className="finance-page fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Class Fees</h1>
          <p className="page-subtitle">View official fee configurations by class.</p>
        </div>
      </div>

      <div
        className="filter-bar glass-panel no-print"
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Level:</label>
          <select
            value={filterLevel}
            onChange={(e) => {
              setFilterLevel(e.target.value);
              setFilterClassId('');
            }}
            className="filter-select"
          >
            <option value="">All Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Middle Primary">Middle Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Class:</label>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="filter-select"
          >
            <option value="">All Classes</option>
            {classOptions.map((cls) => (
              <option
                key={cls.id}
                value={cls.id}
              >{`${cls.level} ${cls.name} ${cls.section}`}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="filter-select"
          >
            {getSessionOptions(filterSession).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="filter-select"
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-error no-print">{error}</div>}

      <div className="table-container glass-panel no-print">
        {loading ? (
          <p className="loading-text">Loading templates...</p>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="empty-text">No fee template configured for the selected filters.</p>
            <a
              href="/dashboard/finance-setup/builder"
              className="btn btn-primary"
              style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}
            >
              Go to Fee Builder
            </a>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Class</th>
                <th>Section</th>
                <th>Total Official Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => handleViewBreakdown(template.classId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{template.level}</td>
                  <td>
                    <strong>{template.className}</strong>
                  </td>
                  <td>{template.section}</td>
                  <td>
                    <strong style={{ color: 'var(--primary-light)' }}>
                      ₦{template.totalAmount.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">View Breakdown</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Official Printable Fee Breakdown Receipt Modal (Image 1 Design) */}
      {selectedTemplate && (
        <div className="class-fee-modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="class-fee-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Top Bar Preview Status (No-Print) */}
            <div className="receipt-preview-topbar no-print">
              <span className="receipt-preview-topbar-title">
                <Sparkles size={15} /> OFFICIAL FEE BREAKDOWN PREVIEW
              </span>
              <span className="receipt-preview-topbar-badge">Official Print Layout</span>
            </div>

            {/* School Crest & Header */}
            <div className="receipt-preview-header">
              {displayLogo ? (
                <img src={displayLogo} alt="School Logo" className="receipt-logo-thumb" />
              ) : (
                <Building2 size={42} color="#000080" />
              )}
              <strong className="receipt-school-title">{displaySchoolName}</strong>
              <span className="receipt-doc-subtitle">OFFICIAL CLASS FEE BREAKDOWN</span>
            </div>

            {/* Metadata Rows */}
            <div className="receipt-preview-body">
              <div className="receipt-preview-row">
                <span className="receipt-row-label">Class Name:</span>
                <strong className="receipt-row-val">
                  {selectedTemplate.className}{' '}
                  {selectedTemplate.level ? `(${selectedTemplate.level})` : ''}
                </strong>
              </div>
              <div className="receipt-preview-row">
                <span className="receipt-row-label">Term / Session:</span>
                <span className="receipt-row-val">
                  {selectedTemplate.session} - {selectedTemplate.term}
                </span>
              </div>
              <div className="receipt-preview-row highlight-amount">
                <span className="receipt-row-label">Total Official Fee:</span>
                <span className="receipt-row-val">
                  ₦
                  {selectedTemplate.totalAmount.toLocaleString('en-NG', {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {/* Component Fee Table */}
            <div className="receipt-table-wrapper">
              <table className="receipt-fee-table">
                <thead>
                  <tr>
                    <th>Fee Item</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₦{item.amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="receipt-table-total-row">
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>
                      ₦
                      {selectedTemplate.totalAmount.toLocaleString('en-NG', {
                        minimumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official Stamped Authorization Signatures (Image 1 Style) */}
            <div className="receipt-signature-stamps-grid">
              <div className="signature-stamp-box">
                <div className="signature-img-frame">
                  {principalSigUrl ? (
                    <img src={resolveUrl(principalSigUrl)!} alt="Principal Stamp" />
                  ) : (
                    <span className="signature-pending-text">Pending Signature</span>
                  )}
                </div>
                <div className="signature-label">PRINCIPAL SIGNATURE</div>
              </div>

              <div className="signature-stamp-box">
                <div className="signature-img-frame">
                  {accountantSigUrl ? (
                    <img src={resolveUrl(accountantSigUrl)!} alt="Accountant Stamp" />
                  ) : (
                    <span className="signature-pending-text">Pending Signature</span>
                  )}
                </div>
                <div className="signature-label">ACCOUNTANT SIGNATURE</div>
              </div>
            </div>

            {/* Modal Actions Footer (No-Print) */}
            <div className="receipt-modal-actions no-print">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />
                Print Breakdown
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="modal-overlay no-print">
          <div className="loading-screen">Loading Breakdown...</div>
        </div>
      )}
    </div>
  );
}
