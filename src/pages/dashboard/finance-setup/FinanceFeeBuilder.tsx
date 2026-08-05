import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './FinanceFeeBuilder.css';
import { useDialog } from '../../../context/DialogContext';
import { 
  Wrench, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Building2, 
  Copy, 
  CheckCircle2, 
  Printer, 
  BarChart3, 
  Sparkles,
  Search,
  Filter,
  DollarSign,
  PieChart
} from 'lucide-react';

interface FeeTemplateItem {
  name: string;
  amount: number;
}

interface FeeTemplateReport {
  id: string;
  classId: string;
  className: string;
  level: string;
  section: string;
  totalAmount: number;
  items?: { id: string; name: string; amount: number }[];
}

export default function FinanceFeeBuilder() {
  const { showAlert } = useDialog();

  const [activeTab, setActiveTab] = useState<'builder' | 'report'>('builder');
  const [classes, setClasses] = useState<any[]>([]);
  
  // Form State
  const { session, term, setSession, setTerm } = useActiveTerm();
  const [classId, setClassId] = useState('');
  
  const [feeItems, setFeeItems] = useState<FeeTemplateItem[]>([
    { name: 'Tuition Fees', amount: 0 },
    { name: 'PTA Fees', amount: 0 },
    { name: 'Technology Fees', amount: 0 },
    { name: 'Uniform Fees', amount: 0 },
    { name: 'Books', amount: 0 }
  ]);
  
  // Batch copy targets
  const [copyTargetClassIds, setCopyTargetClassIds] = useState<string[]>([]);
  const [showBatchCopy, setShowBatchCopy] = useState(false);

  // Report tab state
  const [reportTemplates, setReportTemplates] = useState<FeeTemplateReport[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data || []);
      if (data && data.length > 0) {
        setClassId(data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setLoading(false);
    }
  };

  // Load existing fee template for selected class & term
  useEffect(() => {
    if (classId && session && term) {
      loadExistingClassFeeTemplate();
    }
  }, [classId, session, term]);

  const loadExistingClassFeeTemplate = async () => {
    try {
      const data: FeeTemplateReport[] = await api.get(`/finance/setup/fee-templates?session=${session}&term=${term}`);
      const match = data.find(t => t.classId === classId);
      if (match && match.items && match.items.length > 0) {
        setFeeItems(match.items.map(i => ({ name: i.name, amount: i.amount })));
      }
    } catch (err) {
      // Ignore if no existing template
    }
  };

  // Load report data when report tab opens
  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      const data: FeeTemplateReport[] = await api.get(`/finance/setup/fee-templates?session=${session}&term=${term}`);
      setReportTemplates(data || []);
    } catch (err) {
      console.error("Failed to load fee template report:", err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report') {
      fetchReportData();
    }
  }, [activeTab, session, term]);

  const handleAddItem = () => {
    setFeeItems([...feeItems, { name: '', amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setFeeItems(feeItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    const newItems = [...feeItems];
    newItems[index] = { ...newItems[index], [field]: value as never };
    setFeeItems(newItems);
  };

  const handleSaveFeeTemplate = async () => {
    if (!classId) return showAlert('Please select a target class');
    
    const validItems = feeItems.filter(i => i.name.trim() !== '' && i.amount >= 0);
    if (validItems.length === 0) return showAlert('Please provide at least one valid fee item.');

    setSaving(true);
    try {
      // Save for primary target class
      await api.post('/finance/setup/fee-template', {
        session,
        term,
        classId,
        items: validItems
      });

      // Save for batch copy target classes if selected
      if (copyTargetClassIds.length > 0) {
        for (const targetId of copyTargetClassIds) {
          if (targetId !== classId) {
            await api.post('/finance/setup/fee-template', {
              session,
              term,
              classId: targetId,
              items: validItems
            });
          }
        }
      }

      let msg = `Fee structure saved successfully for ${classes.find(c => c.id === classId)?.level || ''} ${classes.find(c => c.id === classId)?.name || ''}!`;
      if (copyTargetClassIds.length > 0) {
        msg += `\n\nAlso copied to ${copyTargetClassIds.length} additional classes.`;
      }
      showAlert(msg);

      setCopyTargetClassIds([]);
      setShowBatchCopy(false);
      if (activeTab === 'report') fetchReportData();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      showAlert('Failed to save fee template:\n' + detail);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Metrics calculation for Report tab
  const totalClassesCount = classes.length;
  const configuredCount = reportTemplates.length;
  const totalFeesSum = reportTemplates.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const averageFee = configuredCount > 0 ? totalFeesSum / configuredCount : 0;
  
  const sortedByFee = [...reportTemplates].sort((a, b) => b.totalAmount - a.totalAmount);
  const highestFeeTemplate = sortedByFee.length > 0 ? sortedByFee[0] : null;

  if (loading) {
    return (
      <div className="builder-page-container">
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Loading Fee Structure Builder...
        </div>
      </div>
    );
  }

  return (
    <div className="builder-page-container">
      {/* Page Header */}
      <div className="builder-page-header">
        <div>
          <h1 className="builder-page-title">
            <Wrench size={28} color="#000080" />
            Class Fee Structure Builder & Report Hub
          </h1>
          <p className="builder-page-subtitle">Configure official itemized term fees per class and generate institutional fee summary reports</p>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="builder-tabs-bar">
        <button 
          className={`builder-tab-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <Wrench size={16} /> Fee Structure Builder
        </button>
        <button 
          className={`builder-tab-button ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <BarChart3 size={16} /> Fee Structure Report & Matrix ({configuredCount}/{totalClassesCount} Configured)
        </button>
      </div>

      {/* TAB 1: FEE STRUCTURE BUILDER */}
      {activeTab === 'builder' && (
        <div className="builder-card-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                🛠️ Itemized Fee Configuration Workspace
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Set up official itemized term fee breakdown for target class.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-select-all-family" 
                onClick={() => setShowBatchCopy(!showBatchCopy)}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              >
                <Copy size={14} style={{ marginRight: '4px' }} /> Copy Structure to Other Classes
              </button>
            </div>
          </div>

          {/* Session, Term & Target Class Selector Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div className="verify-form-group">
              <label>Academic Session</label>
              <input 
                type="text" 
                className="select-filter-input" 
                value={session} 
                onChange={e => setSession(e.target.value)} 
                required 
              />
            </div>

            <div className="verify-form-group">
              <label>Academic Term</label>
              <select className="select-filter-input" value={term} onChange={e => setTerm(e.target.value)}>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div className="verify-form-group">
              <label>Target Class *</label>
              <select className="select-filter-input" value={classId} onChange={e => setClassId(e.target.value)}>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.level} {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Batch Copy Section */}
          {showBatchCopy && (
            <div className="batch-copy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: '#1E40AF' }}>
                  <Copy size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Batch Copy Fee Structure:
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#1E40AF' }}>
                  Select additional classes to apply this exact fee breakdown to
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                {classes.filter(c => c.id !== classId).map(c => {
                  const isChecked = copyTargetClassIds.includes(c.id);
                  return (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', background: '#FFFFFF', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setCopyTargetClassIds(prev => prev.filter(id => id !== c.id));
                          } else {
                            setCopyTargetClassIds(prev => [...prev, c.id]);
                          }
                        }}
                      />
                      <span>{c.level} {c.name} {c.section}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fee Breakdown Container */}
          <div className="fee-breakdown-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                Itemized Fee Components Breakdown
              </h3>
              <button className="btn-select-all-family" onClick={handleAddItem}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Custom Fee Field
              </button>
            </div>

            {feeItems.map((item, index) => (
              <div key={index} className="fee-row-item">
                <div style={{ flex: 2 }}>
                  <input 
                    type="text" 
                    className="select-filter-input" 
                    placeholder="Fee Item Name (e.g. Tuition, PTA, Excursion)" 
                    value={item.name} 
                    onChange={e => handleItemChange(index, 'name', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#64748B' }}>₦</span>
                  <input 
                    type="number" 
                    className="select-filter-input" 
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="0.00" 
                    min="0"
                    value={item.amount || ''} 
                    onChange={e => handleItemChange(index, 'amount', Number(e.target.value))}
                  />
                </div>
                <button 
                  className="btn-remove-fee-row" 
                  onClick={() => handleRemoveItem(index)}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Total Calculation Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '2px dashed #CBD5E1' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Total Official Term Fee:
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#000080' }}>
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <button 
            className="btn-proxy-search" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '1.05rem' }} 
            onClick={handleSaveFeeTemplate}
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving Fee Configuration...' : 'Save Fee Configuration'}
          </button>
        </div>
      )}

      {/* TAB 2: FEE STRUCTURE REPORT & MATRIX */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Metrics Banner */}
          <div className="builder-metrics-grid">
            <div className="builder-metric-card">
              <div className="metric-info-box">
                <span className="metric-label">CONFIGURED CLASSES</span>
                <span className="metric-number">{configuredCount} / {totalClassesCount} Classes</span>
              </div>
              <div className="metric-icon-badge classes">
                <Building2 size={24} />
              </div>
            </div>

            <div className="builder-metric-card">
              <div className="metric-info-box">
                <span className="metric-label">AVERAGE CLASS FEE</span>
                <span className="metric-number" style={{ color: '#047857' }}>
                  ₦{averageFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="metric-icon-badge average">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="builder-metric-card">
              <div className="metric-info-box">
                <span className="metric-label">HIGHEST CLASS FEE</span>
                <span className="metric-number" style={{ fontSize: '1.25rem', color: '#B45309' }}>
                  {highestFeeTemplate ? `₦${highestFeeTemplate.totalAmount.toLocaleString()} (${highestFeeTemplate.className})` : 'N/A'}
                </span>
              </div>
              <div className="metric-icon-badge highest">
                <PieChart size={24} />
              </div>
            </div>
          </div>

          {/* Report Table Card */}
          <div className="builder-card-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  📊 Institutional Fee Structure Report ({session} - {term})
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Comprehensive breakdown of fee structures configured for each class.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  className="btn-select-all-family" 
                  onClick={() => window.print()}
                  style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Report
                </button>
              </div>
            </div>

            {/* Session & Term Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', alignItems: 'center' }}>
              <Filter size={18} color="#000080" />
              <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Filter Session</label>
                  <input type="text" className="select-filter-input" value={session} onChange={e => setSession(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Filter Term</label>
                  <select className="select-filter-input" value={term} onChange={e => setTerm(e.target.value)}>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report Table */}
            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                Loading fee structure report matrix...
              </div>
            ) : reportTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px border-dashed #CBD5E1', color: '#64748B' }}>
                <Building2 size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>No Fee Structures Configured</h3>
                <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                  No class fee structures found for {session} ({term}). Switch to the Fee Builder tab to configure fees.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="executive-fee-report-table">
                  <thead>
                    <tr>
                      <th>Class Level & Name</th>
                      <th>Itemized Fee Components</th>
                      <th>Total Official Fee</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTemplates.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 800, color: '#0F172A' }}>
                          {t.className}
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {(t.items || []).map((item, i) => (
                              <span key={i} style={{ background: '#F1F5F9', color: '#334155', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                                {item.name}: ₦{item.amount.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000080' }}>
                          ₦{t.totalAmount.toLocaleString()}
                        </td>

                        <td>
                          <span className="status-pill active">
                            Configured
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-select-all-family"
                            onClick={() => {
                              setClassId(t.classId);
                              setActiveTab('builder');
                            }}
                          >
                            Edit Structure
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
