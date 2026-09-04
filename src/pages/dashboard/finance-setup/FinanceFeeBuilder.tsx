import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import './FinanceFeeBuilder.css';
import { useDialog } from '../../../context/DialogContext';
import {
  Wrench,
  Plus,
  Trash2,
  Save,
  Building2,
  Copy,
  Printer,
  BarChart3,
  Filter,
  DollarSign,
  PieChart,
  Gift,
  Search,
  CheckCircle2,
  Tag,
  Calculator,
  Info,
  X,
} from 'lucide-react';

type FeeApplicability = 'Compulsory' | 'SectionalTransition' | 'NewIntakeOnly' | 'Optional';

interface FeeTemplateItem {
  name: string;
  amount: number;
  applicability: FeeApplicability;
}

interface FeeTemplateReport {
  id: string;
  classId: string;
  className: string;
  level: string;
  section: string;
  totalAmount: number;
  items?: { id: string; name: string; amount: number; applicability?: string }[];
}

interface GiftRecipient {
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

export default function FinanceFeeBuilder() {
  const { showAlert } = useDialog();

  const [activeTab, setActiveTab] = useState<'builder' | 'report' | 'gifts'>('builder');
  const [classes, setClasses] = useState<any[]>([]);

  // Form State
  const { session, term, setSession, setTerm } = useActiveTerm();
  const [classId, setClassId] = useState('');

  const [feeItems, setFeeItems] = useState<FeeTemplateItem[]>([
    { name: 'Tuition Fees', amount: 0, applicability: 'Compulsory' },
    { name: 'Development Fees', amount: 0, applicability: 'Compulsory' },
    { name: 'Registration Form', amount: 0, applicability: 'NewIntakeOnly' },
    { name: 'Security ID / Resource Mat', amount: 0, applicability: 'Compulsory' },
    { name: 'Lesson Fees', amount: 0, applicability: 'Compulsory' },
    { name: 'Notebook', amount: 0, applicability: 'Compulsory' },
    { name: 'Textbook', amount: 0, applicability: 'Compulsory' },
    { name: 'Uniform', amount: 0, applicability: 'SectionalTransition' },
    { name: 'Sport Wear', amount: 0, applicability: 'SectionalTransition' },
    { name: 'Christmas Party (Optional)', amount: 0, applicability: 'Optional' },
  ]);

  // Batch copy targets
  const [copyTargetClassIds, setCopyTargetClassIds] = useState<string[]>([]);
  const [showBatchCopy, setShowBatchCopy] = useState(false);

  // Report & Matrix tab state
  const [reportTemplates, setReportTemplates] = useState<FeeTemplateReport[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('All Levels');
  const [filterClass, setFilterClass] = useState('All Classes');

  // Breakdown Modal state
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedTemplateForBreakdown, setSelectedTemplateForBreakdown] =
    useState<FeeTemplateReport | null>(null);

  // Gift List tab state
  const [giftRecipients, setGiftRecipients] = useState<GiftRecipient[]>([]);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const detectApplicability = (name: string, app?: string): FeeApplicability => {
    if (app === 'SectionalTransition' || app === 'NewIntakeOnly' || app === 'Optional') {
      return app;
    }
    const lower = (name || '').toLowerCase();
    if (lower.includes('registration form') || lower.includes('registration'))
      return 'NewIntakeOnly';
    if (lower.includes('uniform') || lower.includes('sport wear') || lower.includes('sportwear'))
      return 'SectionalTransition';
    if (
      lower.includes('optional') ||
      lower.includes('party') ||
      lower.includes('excursion') ||
      lower.includes('christmas')
    )
      return 'Optional';
    return 'Compulsory';
  };

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
      console.error('Failed to fetch classes:', err);
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
      const data: FeeTemplateReport[] = await api.get(
        `/finance/setup/fee-templates?session=${session}&term=${term}`,
      );
      const match = data.find((t) => t.classId === classId);
      if (match && match.items && match.items.length > 0) {
        setFeeItems(
          match.items.map((i) => ({
            name: i.name,
            amount: Number(i.amount) || 0,
            applicability: detectApplicability(i.name, i.applicability),
          })),
        );
      }
    } catch (err) {
      // Ignore if no existing template
    }
  };

  // Load report data when report tab opens
  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      const data: FeeTemplateReport[] = await api.get(
        `/finance/setup/fee-templates?session=${session}&term=${term}`,
      );
      setReportTemplates(data || []);
    } catch (err) {
      console.error('Failed to load fee template report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  // Load Christmas Party Gift Recipients
  const fetchGiftRecipients = async () => {
    setGiftLoading(true);
    try {
      const data: GiftRecipient[] = await api.get(
        `/finance/reports/optional-fees?session=${session}&term=${term}&item=Christmas Party`,
      );
      setGiftRecipients(data || []);
    } catch (err) {
      console.error('Failed to load gift recipients:', err);
    } finally {
      setGiftLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report') fetchReportData();
    if (activeTab === 'gifts') fetchGiftRecipients();
  }, [activeTab, session, term]);

  const handleAddItem = (presetName?: string, presetApp?: FeeApplicability) => {
    setFeeItems([
      ...feeItems,
      {
        name: presetName || '',
        amount: 0,
        applicability: presetApp || (presetName ? detectApplicability(presetName) : 'Compulsory'),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setFeeItems(feeItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'name' | 'amount' | 'applicability',
    value: any,
  ) => {
    const newItems = [...feeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFeeItems(newItems);
  };

  const handleSaveFeeTemplate = async () => {
    if (!classId) return showAlert('Please select a target class');

    const validItems = feeItems
      .filter((i) => i.name.trim() !== '' && i.amount >= 0)
      .map((i) => ({
        name: i.name.trim(),
        amount: Number(i.amount) || 0,
        applicability: i.applicability,
      }));

    if (validItems.length === 0) return showAlert('Please provide at least one valid fee item.');

    setSaving(true);
    try {
      // Save for primary target class
      await api.post('/finance/setup/fee-template', {
        session,
        term,
        classId,
        items: validItems,
      });

      // Save for batch copy target classes if selected
      if (copyTargetClassIds.length > 0) {
        for (const targetId of copyTargetClassIds) {
          if (targetId !== classId) {
            await api.post('/finance/setup/fee-template', {
              session,
              term,
              classId: targetId,
              items: validItems,
            });
          }
        }
      }

      let msg = `Fee structure saved successfully for ${classes.find((c) => c.id === classId)?.level || ''} ${classes.find((c) => c.id === classId)?.name || ''}!`;
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

  // Categorized Segment Calculations
  const compulsoryTotal = feeItems
    .filter((i) => i.applicability === 'Compulsory')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const transitionTotal = feeItems
    .filter((i) => i.applicability === 'SectionalTransition')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const newIntakeOnlyTotal = feeItems
    .filter((i) => i.applicability === 'NewIntakeOnly')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const optionalTotal = feeItems
    .filter((i) => i.applicability === 'Optional')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const continuingStudentTotal = compulsoryTotal;
  const sectionalTransitionTotal = compulsoryTotal + transitionTotal;
  const directNewIntakeTotal = compulsoryTotal + transitionTotal + newIntakeOnlyTotal;
  const maxPossibleFee = directNewIntakeTotal + optionalTotal;

  // Unique Levels & Classes for Filtering
  const uniqueLevels = Array.from(new Set(classes.map((c) => c.level))).filter(Boolean);
  const uniqueClassNames = Array.from(new Set(classes.map((c) => c.name))).filter(Boolean);

  // Filtered Templates for Class Fees Matrix
  const filteredReportTemplates = reportTemplates.filter((t) => {
    const levelMatch = filterLevel === 'All Levels' || t.level === filterLevel;
    const classMatch =
      filterClass === 'All Classes' ||
      t.className.toLowerCase().includes(filterClass.toLowerCase());
    return levelMatch && classMatch;
  });

  // Filter gift recipients
  const filteredGiftRecipients = giftRecipients.filter((r) => {
    const q = giftSearchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      r.className.toLowerCase().includes(q) ||
      r.parentEmail.toLowerCase().includes(q)
    );
  });

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
          <p className="builder-page-subtitle">
            Configure official itemized term fees per class segment and view institutional fee
            breakdowns
          </p>
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
          <BarChart3 size={16} /> Class Fees Matrix ({reportTemplates.length}/{classes.length})
        </button>

        <button
          className={`builder-tab-button ${activeTab === 'gifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('gifts')}
        >
          <Gift size={16} color="#B45309" /> 🎁 Christmas Party Gift Recipients (
          {giftRecipients.length})
        </button>
      </div>

      {/* TAB 1: FEE STRUCTURE BUILDER (2-COLUMN SPLIT WORKSPACE) */}
      {activeTab === 'builder' && (
        <div className="fee-builder-workspace-grid">
          {/* LEFT WORKSPACE COLUMN (65% Width) */}
          <div className="builder-card-wrapper">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  🛠️ Itemized Fee Configuration Workspace
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Set up itemized term fees and tag applicability by student segment.
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                background: '#F8FAFC',
                padding: '1.1rem',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div className="verify-form-group">
                <label>Academic Session</label>
                <input
                  type="text"
                  className="select-filter-input"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  required
                />
              </div>

              <div className="verify-form-group">
                <label>Academic Term</label>
                <select
                  className="select-filter-input"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>

              <div className="verify-form-group">
                <label>Target Class *</label>
                <select
                  className="select-filter-input"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
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
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong style={{ fontSize: '0.88rem', color: '#1E40AF' }}>
                    <Copy size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Batch Copy Fee Structure:
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#1E40AF' }}>
                    Select additional classes to apply this exact fee breakdown to
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '0.4rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {classes
                    .filter((c) => c.id !== classId)
                    .map((c) => {
                      const isChecked = copyTargetClassIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            background: '#FFFFFF',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCopyTargetClassIds((prev) => prev.filter((id) => id !== c.id));
                              } else {
                                setCopyTargetClassIds((prev) => [...prev, c.id]);
                              }
                            }}
                          />
                          <span>
                            {c.level} {c.name} {c.section}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Preset Quick Add Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexWrap: 'wrap',
                background: '#EFF6FF',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid #BFDBFE',
                fontSize: '0.8rem',
              }}
            >
              <strong style={{ color: '#1E40AF', marginRight: '4px' }}>⚡ Presets:</strong>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Tuition Fees', 'Compulsory')}
              >
                + Tuition
              </button>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Development Fees', 'Compulsory')}
              >
                + Development
              </button>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Uniform', 'SectionalTransition')}
              >
                + Uniform
              </button>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Sport Wear', 'SectionalTransition')}
              >
                + Sport Wear
              </button>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Registration Form', 'NewIntakeOnly')}
              >
                + Registration
              </button>
              <button
                type="button"
                className="btn-select-all-family"
                onClick={() => handleAddItem('Christmas Party (Optional)', 'Optional')}
              >
                + Party
              </button>
            </div>

            {/* Fee Breakdown Container */}
            <div className="fee-breakdown-container">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Itemized Fee Components Breakdown ({feeItems.length} Items)
                </h3>
                <button className="btn-select-all-family" onClick={() => handleAddItem()}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Add Custom Fee Field
                </button>
              </div>

              {feeItems.map((item, index) => {
                const currentApp = item.applicability || detectApplicability(item.name);
                return (
                  <div key={index} className="fee-row-item">
                    {/* Item Name */}
                    <div>
                      <input
                        type="text"
                        className="select-filter-input"
                        placeholder="Fee Name (e.g. Tuition, Uniform, Party)"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                    </div>

                    {/* Applicability Category */}
                    <div>
                      <select
                        className="select-filter-input"
                        style={{ fontSize: '0.78rem', fontWeight: 700 }}
                        value={currentApp}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'applicability',
                            detectApplicability(e.target.value, e.target.value),
                          )
                        }
                      >
                        <option value="Compulsory">📌 Compulsory (All Students)</option>
                        <option value="SectionalTransition">
                          🎓 Sectional Entry (Pry 1, JSS 1, SS 1)
                        </option>
                        <option value="NewIntakeOnly">🆕 Direct New Intake Only</option>
                        <option value="Optional">🌟 Optional Add-on (Opt-in)</option>
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontWeight: 900,
                          color: '#64748B',
                          fontSize: '0.85rem',
                        }}
                      >
                        ₦
                      </span>
                      <input
                        type="number"
                        className="select-filter-input"
                        style={{ paddingLeft: '2.2rem' }}
                        placeholder="0.00"
                        min="0"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(index, 'amount', Number(e.target.value))}
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      className="btn-remove-fee-row"
                      onClick={() => handleRemoveItem(index)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  className="btn-select-all-family"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                  onClick={() => handleAddItem()}
                >
                  <Plus size={14} style={{ marginRight: '6px' }} /> Add Another Fee Line Item
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN (35% Width - Sticky Executive Summary) */}
          <div className="fee-summary-sidebar-card">
            <div className="fee-sidebar-header">
              <h3 className="fee-sidebar-title">
                <Calculator size={20} color="#000080" />
                Executive Fee Summary
              </h3>
              <span className="fee-sidebar-subtitle">
                Live calculation breakdown per student segment
              </span>
            </div>

            {/* Segment Breakdown Cards Stack */}
            <div className="fee-segment-stack">
              {/* 1. Continuing Student */}
              <div className="fee-segment-card continuing">
                <div className="fee-segment-card-header">
                  <span className="fee-segment-name">📌 Continuing Student Fee</span>
                  <span className="fee-segment-amount" style={{ color: '#1E40AF' }}>
                    ₦{continuingStudentTotal.toLocaleString()}
                  </span>
                </div>
                <span className="fee-segment-desc">
                  In-section promotions (e.g. JSS 1 → JSS 2). Excludes uniforms/sportswear.
                </span>
              </div>

              {/* 2. Sectional Entry */}
              <div className="fee-segment-card sectional">
                <div className="fee-segment-card-header">
                  <span className="fee-segment-name">🎓 Sectional Entry Fee</span>
                  <span className="fee-segment-amount" style={{ color: '#047857' }}>
                    ₦{sectionalTransitionTotal.toLocaleString()}
                  </span>
                </div>
                <span className="fee-segment-desc">
                  Level transitions (KG→Pry 1, Pry→JSS 1, JSS 3→SS 1). Includes uniforms &
                  sportswear, excludes Registration Form.
                </span>
              </div>

              {/* 3. Direct New Intake */}
              <div className="fee-segment-card direct">
                <div className="fee-segment-card-header">
                  <span className="fee-segment-name">🆕 Direct New Intake Fee</span>
                  <span className="fee-segment-amount" style={{ color: '#B45309' }}>
                    ₦{directNewIntakeTotal.toLocaleString()}
                  </span>
                </div>
                <span className="fee-segment-desc">
                  Direct new admissions into any class. Includes Registration Form, Uniforms &
                  Sportswear.
                </span>
              </div>

              {/* 4. Optional Add-ons */}
              <div className="fee-segment-card optional">
                <div className="fee-segment-card-header">
                  <span className="fee-segment-name">🌟 Optional Add-ons Total</span>
                  <span className="fee-segment-amount" style={{ color: '#4F46E5' }}>
                    ₦{optionalTotal.toLocaleString()}
                  </span>
                </div>
                <span className="fee-segment-desc">
                  Opt-in items (e.g. Christmas Party ₦{optionalTotal.toLocaleString()}). Opted by
                  parents or accountant.
                </span>
              </div>
            </div>

            {/* Total Range Banner */}
            <div className="fee-range-banner">
              <span className="fee-range-label">TOTAL FEE RANGE FOR CLASS</span>
              <span className="fee-range-val">
                ₦{continuingStudentTotal.toLocaleString()} – ₦{maxPossibleFee.toLocaleString()}
              </span>
            </div>

            {/* Primary Action Save Button */}
            <button
              className="btn-proxy-search"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.95rem',
                fontSize: '1.05rem',
                marginTop: '0.25rem',
              }}
              onClick={handleSaveFeeTemplate}
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Saving Fee Configuration...' : 'Save Fee Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS FEES MATRIX & POPUP BREAKDOWN */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="builder-card-wrapper">
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                Class Fees
              </h2>
              <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                View official fee configurations by class.
              </span>
            </div>

            {/* Filter Bar (Level, Class, Session, Term) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.85rem',
                background: '#F8FAFC',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                alignItems: 'center',
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                  Filter by Level:
                </label>
                <select
                  className="select-filter-input"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="All Levels">All Levels</option>
                  {uniqueLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                  Filter by Class:
                </label>
                <select
                  className="select-filter-input"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="All Classes">All Classes</option>
                  {uniqueClassNames.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                  Session:
                </label>
                <select
                  className="select-filter-input"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  {getSessionOptions(session).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                  Term:
                </label>
                <select
                  className="select-filter-input"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>

            {/* Class Fees Table */}
            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                Loading class fees matrix...
              </div>
            ) : filteredReportTemplates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3.5rem 1rem',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px border-dashed #CBD5E1',
                  color: '#64748B',
                }}
              >
                <Building2 size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                  No Fee Configurations Found
                </h3>
                <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                  No fee templates configured matching selected filters for {session} ({term}).
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="executive-fee-report-table">
                  <thead>
                    <tr>
                      <th>LEVEL</th>
                      <th>CLASS</th>
                      <th>SECTION</th>
                      <th>TOTAL OFFICIAL FEE</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportTemplates.map((t) => (
                      <tr key={t.id}>
                        <td style={{ color: '#64748B', fontWeight: 600 }}>{t.level || 'N/A'}</td>

                        <td style={{ fontWeight: 800, color: '#0F172A' }}>{t.className}</td>

                        <td style={{ color: '#64748B' }}>{t.section || 'General'}</td>

                        <td style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                          ₦{t.totalAmount.toLocaleString()}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-view-breakdown-navy"
                            onClick={() => {
                              setSelectedTemplateForBreakdown(t);
                              setShowBreakdownModal(true);
                            }}
                          >
                            View Breakdown
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

      {/* POP-UP BREAKDOWN MODAL DIALOG (WITH ACCURATE SEGMENT CARDS & TAGS) */}
      {showBreakdownModal &&
        selectedTemplateForBreakdown &&
        (() => {
          const modalItems = selectedTemplateForBreakdown.items || [];
          const modalCompulsory = modalItems
            .filter((i) => detectApplicability(i.name, i.applicability) === 'Compulsory')
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

          const modalTransition = modalItems
            .filter((i) => detectApplicability(i.name, i.applicability) === 'SectionalTransition')
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

          const modalNewIntake = modalItems
            .filter((i) => detectApplicability(i.name, i.applicability) === 'NewIntakeOnly')
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

          const modalOptional = modalItems
            .filter((i) => detectApplicability(i.name, i.applicability) === 'Optional')
            .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

          const modalContinuingTotal = modalCompulsory;
          const modalSectionalTotal = modalCompulsory + modalTransition;
          const modalDirectNewIntakeTotal = modalCompulsory + modalTransition + modalNewIntake;
          const modalMaxTotal = modalDirectNewIntakeTotal + modalOptional;

          return (
            <div className="fee-modal-overlay" onClick={() => setShowBreakdownModal(false)}>
              <div className="fee-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Top Bar with Title and Close X Button */}
                <div className="fee-modal-top-bar">
                  <div className="fee-modal-header">
                    <h3 className="fee-modal-title">
                      Fee Breakdown: {selectedTemplateForBreakdown.className}
                    </h3>
                    <span className="fee-modal-subtitle-pill">
                      <Building2 size={13} /> {term} • {session}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-modal-close-icon"
                    onClick={() => setShowBreakdownModal(false)}
                    title="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Executive Segment Cards Stack (Matching Second Image) */}
                <div className="fee-segment-stack">
                  {/* 1. Continuing Student */}
                  <div className="fee-segment-card continuing">
                    <div className="fee-segment-card-header">
                      <span className="fee-segment-name">📌 Continuing Student Fee</span>
                      <span className="fee-segment-amount" style={{ color: '#1E40AF' }}>
                        ₦{modalContinuingTotal.toLocaleString()}
                      </span>
                    </div>
                    <span className="fee-segment-desc">
                      In-section promotions (e.g. JSS 1 → JSS 2). Excludes uniforms/sportswear.
                    </span>
                  </div>

                  {/* 2. Sectional Entry */}
                  <div className="fee-segment-card sectional">
                    <div className="fee-segment-card-header">
                      <span className="fee-segment-name">🎓 Sectional Entry Fee</span>
                      <span className="fee-segment-amount" style={{ color: '#047857' }}>
                        ₦{modalSectionalTotal.toLocaleString()}
                      </span>
                    </div>
                    <span className="fee-segment-desc">
                      Level transitions (KG→Pry 1, Pry→JSS 1, JSS 3→SS 1). Includes uniforms &
                      sportswear, excludes Registration Form.
                    </span>
                  </div>

                  {/* 3. Direct New Intake */}
                  <div className="fee-segment-card direct">
                    <div className="fee-segment-card-header">
                      <span className="fee-segment-name">🆕 Direct New Intake Fee</span>
                      <span className="fee-segment-amount" style={{ color: '#B45309' }}>
                        ₦{modalDirectNewIntakeTotal.toLocaleString()}
                      </span>
                    </div>
                    <span className="fee-segment-desc">
                      Direct new admissions into any class. Includes Registration Form, Uniforms &
                      Sportswear.
                    </span>
                  </div>

                  {/* 4. Optional Add-ons */}
                  <div className="fee-segment-card optional">
                    <div className="fee-segment-card-header">
                      <span className="fee-segment-name">🌟 Optional Add-ons Total</span>
                      <span className="fee-segment-amount" style={{ color: '#4F46E5' }}>
                        ₦{modalOptional.toLocaleString()}
                      </span>
                    </div>
                    <span className="fee-segment-desc">
                      Opt-in items (e.g. Christmas Party ₦{modalOptional.toLocaleString()}). Opted
                      by parents or accountant.
                    </span>
                  </div>
                </div>

                {/* Total Fee Range Banner */}
                <div className="fee-range-banner">
                  <span className="fee-range-label">TOTAL FEE RANGE FOR CLASS</span>
                  <span className="fee-range-val">
                    ₦{modalContinuingTotal.toLocaleString()} – ₦{modalMaxTotal.toLocaleString()}
                  </span>
                </div>

                {/* Executive Itemized Table Card */}
                <div className="fee-modal-breakdown-card">
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    Itemized Component Breakdown ({modalItems.length} Items)
                  </h4>
                  <table className="fee-modal-table">
                    <thead>
                      <tr>
                        <th>Fee Component & Tag</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalItems.map((item, idx) => {
                        const appTag = detectApplicability(item.name, item.applicability);
                        return (
                          <tr key={idx}>
                            <td>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                                  {item.name}
                                </span>
                                {appTag === 'Compulsory' && (
                                  <span
                                    style={{
                                      background: '#EFF6FF',
                                      color: '#1E40AF',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    📌 Compulsory
                                  </span>
                                )}
                                {appTag === 'SectionalTransition' && (
                                  <span
                                    style={{
                                      background: '#ECFDF5',
                                      color: '#047857',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    🎓 Level Entry
                                  </span>
                                )}
                                {appTag === 'NewIntakeOnly' && (
                                  <span
                                    style={{
                                      background: '#FFFBEB',
                                      color: '#B45309',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    🆕 Direct Intake
                                  </span>
                                )}
                                {appTag === 'Optional' && (
                                  <span
                                    style={{
                                      background: '#EEF2FF',
                                      color: '#4F46E5',
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    🌟 Optional
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                              ₦{Number(item.amount).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Action Buttons */}
                <div className="fee-modal-footer-actions">
                  <button
                    type="button"
                    className="btn-select-all-family"
                    onClick={() => window.print()}
                    style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
                  >
                    <Printer size={15} style={{ marginRight: '5px' }} /> Print Fee Breakdown
                  </button>

                  <button
                    type="button"
                    className="btn-modal-close-blue"
                    onClick={() => setShowBreakdownModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* TAB 3: CHRISTMAS PARTY GIFT RECIPIENTS REPORT */}
      {activeTab === 'gifts' && (
        <div className="builder-card-wrapper">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Gift size={22} color="#B45309" /> 🎁 Christmas Party Gift Recipients List
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Confirmed list of students whose parents paid for the Christmas Party for gift
                package preparation.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn-select-all-family"
                onClick={() => window.print()}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              >
                <Printer size={14} style={{ marginRight: '4px' }} /> Print Gift Preparation List
              </button>
            </div>
          </div>

          {/* Session & Term Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              background: '#FEF3C7',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #FDE68A',
              alignItems: 'center',
            }}
          >
            <Filter size={18} color="#B45309" />
            <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#B45309',
                    textTransform: 'uppercase',
                  }}
                >
                  Academic Session
                </label>
                <select
                  className="select-filter-input"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  {getSessionOptions(session).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#B45309',
                    textTransform: 'uppercase',
                  }}
                >
                  Academic Term
                </label>
                <select
                  className="select-filter-input"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
                size={14}
              />
              <input
                type="text"
                className="select-filter-input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search student..."
                value={giftSearchQuery}
                onChange={(e) => setGiftSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {giftLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Loading Christmas party gift recipients...
            </div>
          ) : filteredGiftRecipients.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 1rem',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px border-dashed #CBD5E1',
                color: '#64748B',
              }}
            >
              <Gift size={42} color="#94A3B8" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                No Gift Recipients Found
              </h3>
              <p style={{ fontSize: '0.88rem', marginTop: '0.4rem' }}>
                No students found with confirmed Christmas Party payments for {session} ({term}).
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="executive-fee-report-table">
                <thead>
                  <tr>
                    <th>Recipient Student</th>
                    <th>Class</th>
                    <th>Receipt Number</th>
                    <th>Amount Paid</th>
                    <th>Date Paid</th>
                    <th>Parent Contact</th>
                    <th style={{ textAlign: 'right' }}>Gift Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGiftRecipients.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>
                          {r.studentName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Reg: {r.registrationNumber}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#0F172A' }}>{r.className}</td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {r.receiptNumber}
                      </td>

                      <td style={{ color: '#047857', fontWeight: 800 }}>
                        ₦{r.amountPaid.toLocaleString()}
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>{r.datePaid}</td>

                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>{r.parentEmail}</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {r.parentPhone}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span
                          className="status-pill active"
                          style={{
                            background: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          🎁 Confirmed (Prepare Gift)
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
    </div>
  );
}
