import React, { useState } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';
import { useDialog } from '../../../../context/DialogContext';


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
    { minScore: 0, maxScore: 39.99, grade: 'F', remark: 'Fail' }
  ]);
  const [savingRules, setSavingRules] = useState(false);

  React.useEffect(() => {
    const fetchRules = async () => {
      try {
        const rules = await api.get('/setup/grading-rules');
        if (rules && rules.length > 0) {
          setGradingRules(rules);
        }
      } catch (err) {
        console.error("Failed to load grading rules:", err);
      }
    };
    fetchRules();
  }, []);

  const handleGradingSave = async () => {
    try {
      setSavingRules(true);
      const rulesDto = gradingRules.map(r => ({
        minScore: Number(r.minScore),
        maxScore: Number(r.maxScore),
        grade: r.grade,
        remark: r.remark
      }));
      await api.post('/setup/grading-rules', { rules: rulesDto });
      showAlert('Grading Rules saved successfully!');
    } catch (err: any) {
      showAlert(err.message || 'Failed to save Grading Rules.');
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grading Rules</h1>
          <p className="page-subtitle">Standardize grades and remarks across the school.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>Score Bands</h2>
          <p style={{ marginBottom: '1.5rem' }}>Define the score bands for computing final grades.</p>
          
          <div className="table-container">
            <table className="data-table" style={{ width: '100%', marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Grade</th>
                  <th style={{ textAlign: 'left' }}>Min Score</th>
                  <th style={{ textAlign: 'left' }}>Max Score</th>
                  <th style={{ textAlign: 'left' }}>Remark</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {gradingRules.map((rule, idx) => (
                  <tr key={idx}>
                    <td>
                      <input type="text" className="form-control" value={rule.grade} onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].grade = e.target.value;
                        setGradingRules(newRules);
                      }} placeholder="e.g. A" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    </td>
                    <td>
                      <input type="number" className="form-control" value={rule.minScore} onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].minScore = Number(e.target.value);
                        setGradingRules(newRules);
                      }} placeholder="70" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    </td>
                    <td>
                      <input type="number" className="form-control" value={rule.maxScore} onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].maxScore = Number(e.target.value);
                        setGradingRules(newRules);
                      }} placeholder="100" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    </td>
                    <td>
                      <input type="text" className="form-control" value={rule.remark} onChange={(e) => {
                        const newRules = [...gradingRules];
                        newRules[idx].remark = e.target.value;
                        setGradingRules(newRules);
                      }} placeholder="e.g. Excellent" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: '#ff4136', background: 'rgba(255, 65, 54, 0.1)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }} 
                        onClick={() => setGradingRules(gradingRules.filter((_, i) => i !== idx))}
                        title="Remove Rule"
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-add" onClick={() => setGradingRules([...gradingRules, { minScore: 0, maxScore: 0, grade: '', remark: '' }])}>+ Add Rule</button>
          
          <div className="action-row" style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={handleGradingSave} disabled={savingRules}>{savingRules ? 'Saving...' : 'Save Grading Rules'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
