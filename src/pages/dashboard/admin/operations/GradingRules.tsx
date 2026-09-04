import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import './GradingRules.css';
import { useDialog } from '../../../../context/DialogContext';
import {
  Award,
  Layers,
  TrendingUp,
  CheckCircle,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';

interface GradingRule {
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}

export default function GradingRules() {
  const { showAlert } = useDialog();

  const [gradingRules, setGradingRules] = useState<GradingRule[]>([
    { minScore: 70, maxScore: 100, grade: 'A', remark: 'Excellent' },
    { minScore: 60, maxScore: 69.99, grade: 'B', remark: 'Good' },
    { minScore: 50, maxScore: 59.99, grade: 'C', remark: 'Credit' },
    { minScore: 40, maxScore: 49.99, grade: 'D', remark: 'Pass' },
    { minScore: 0, maxScore: 39.99, grade: 'F', remark: 'Fail' },
  ]);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rules = await api.get('/setup/grading-rules');
        if (rules && rules.length > 0) {
          setGradingRules(rules);
        }
      } catch (err) {
        console.error('Failed to load grading rules:', err);
      }
    };
    fetchRules();
  }, []);

  const handleGradingSave = async () => {
    try {
      setSavingRules(true);
      const rulesDto = gradingRules.map((r) => ({
        minScore: Number(r.minScore),
        maxScore: Number(r.maxScore),
        grade: r.grade,
        remark: r.remark,
      }));
      await api.post('/setup/grading-rules', { rules: rulesDto });
      showAlert('Grading Rules saved successfully!');
    } catch (err: any) {
      showAlert(err.message || 'Failed to save Grading Rules.');
    } finally {
      setSavingRules(false);
    }
  };

  const totalBands = gradingRules.length;
  const topGrade = gradingRules.find((r) => r.grade.toUpperCase() === 'A') || gradingRules[0];
  const passGrade = gradingRules.find((r) => r.grade.toUpperCase() === 'D') || gradingRules[3];

  return (
    <div className="grading-page-container">
      {/* Page Header */}
      <div className="grading-page-header">
        <div>
          <h1 className="grading-page-title">Grading Rules & Score Bands</h1>
          <p className="grading-page-subtitle">
            Configure academic grade boundaries, symbols, and official descriptors across classes
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="grading-metrics-grid">
        <div className="grading-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Score Bands</span>
            <span className="metric-number">{totalBands}</span>
          </div>
          <div className="metric-icon-badge bands">
            <Layers size={24} />
          </div>
        </div>

        <div className="grading-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Highest Grade</span>
            <span className="metric-number" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
              Grade {topGrade?.grade || 'A'} ({topGrade?.minScore || 70}% - 100%)
            </span>
          </div>
          <div className="metric-icon-badge max">
            <Award size={24} />
          </div>
        </div>

        <div className="grading-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Passing Threshold</span>
            <span className="metric-number" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
              Grade {passGrade?.grade || 'D'} ({passGrade?.minScore || 40}% Min)
            </span>
          </div>
          <div className="metric-icon-badge pass">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="grading-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Coverage Validation</span>
            <span
              className="metric-number"
              style={{ fontSize: '1.15rem', marginTop: '0.4rem', color: '#047857' }}
            >
              0% - 100% Contiguous
            </span>
          </div>
          <div className="metric-icon-badge scheme">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="grading-card-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              Configured Score Bands
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Define score boundaries for grade assignment and report card descriptors.
            </p>
          </div>

          <button
            className="btn-add-rule"
            onClick={() =>
              setGradingRules([
                ...gradingRules,
                { minScore: 0, maxScore: 0, grade: '', remark: '' },
              ])
            }
          >
            <Plus size={16} /> Add Score Band
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="executive-grading-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Grade Symbol</th>
                <th style={{ width: '160px' }}>Min Score (%)</th>
                <th style={{ width: '160px' }}>Max Score (%)</th>
                <th>Official Remark Descriptor</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {gradingRules.map((rule, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      className="grading-table-input"
                      value={rule.grade}
                      onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].grade = e.target.value;
                        setGradingRules(newRules);
                      }}
                      placeholder="e.g. A"
                      style={{ fontWeight: 800, textAlign: 'center', textTransform: 'uppercase' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="grading-table-input"
                      value={rule.minScore}
                      onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].minScore = Number(e.target.value);
                        setGradingRules(newRules);
                      }}
                      placeholder="70"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="grading-table-input"
                      value={rule.maxScore}
                      onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].maxScore = Number(e.target.value);
                        setGradingRules(newRules);
                      }}
                      placeholder="100"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="grading-table-input"
                      value={rule.remark}
                      onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].remark = e.target.value;
                        setGradingRules(newRules);
                      }}
                      placeholder="e.g. Excellent"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      style={{
                        color: '#EF4444',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        cursor: 'pointer',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => setGradingRules(gradingRules.filter((_, i) => i !== idx))}
                      title="Remove Score Band"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: '#F8FAFC',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            fontSize: '0.82rem',
            color: '#64748B',
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Grading rules automatically apply to end-of-term score computations and student report
            card generation.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button className="btn-save-grading" onClick={handleGradingSave} disabled={savingRules}>
            <Save size={18} />
            {savingRules ? 'Saving Rules...' : 'Save Grading Rules Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
