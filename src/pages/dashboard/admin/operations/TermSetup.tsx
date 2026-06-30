import { useActiveTerm } from '../../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

export default function TermSetup() {
  const { session, term, setSession, setTerm } = useActiveTerm();
  const [resumptionDate, setResumptionDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [caWeightFirst, setCaWeightFirst] = useState(20);
  const [caWeightSecond, setCaWeightSecond] = useState(20);
  const [examWeight, setExamWeight] = useState(60);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTermSetup = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/setup/terms?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      if (data) {
        if (data.nextTermResumptionDate) {
          setResumptionDate(data.nextTermResumptionDate.split('T')[0]);
        } else {
          setResumptionDate('');
        }
        if (data.isActive !== undefined) setIsActive(data.isActive);
        if (data.caWeightFirst !== undefined) setCaWeightFirst(data.caWeightFirst);
        if (data.caWeightSecond !== undefined) setCaWeightSecond(data.caWeightSecond);
        if (data.examWeight !== undefined) setExamWeight(data.examWeight);
      } else {
        setResumptionDate('');
        setIsActive(false);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed to load term setup", err);
      } else {
        setResumptionDate('');
        setIsActive(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermSetup();
  }, [session, term]);

  const handleSave = async () => {
    if (!resumptionDate) {
      alert("Please select a resumption date.");
      return;
    }
    
    if (caWeightFirst + caWeightSecond + examWeight !== 100) {
      alert("The sum of CA weights and Exam weight must equal exactly 100.");
      return;
    }
    
    try {
      setSaving(true);
      await api.post('/setup/terms', {
        session,
        term,
        nextTermResumptionDate: resumptionDate,
        isActive,
        caWeightFirst,
        caWeightSecond,
        examWeight
      });
      alert('Term setup saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save term setup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operations-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Term Setup</h1>
          <p className="page-subtitle">Configure the resumption date, CA weights, and active status for the term.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>Configure Term</h2>
          <p style={{ marginBottom: '1.5rem' }}>Select the academic session and term, then define the parameters.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label className="form-label">Session</label>
              <input 
                type="text" 
                className="form-control" 
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                placeholder="2026/2027" 
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
              />
            </div>
            
            <div>
              <label className="form-label">Term</label>
              <select 
                value={term} 
                onChange={(e) => setTerm(e.target.value)} 
                className="form-control"
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div>
              <label className="form-label">Next Term Resumption Date</label>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <input 
                  type="date" 
                  className="form-control" 
                  value={resumptionDate} 
                  onChange={(e) => setResumptionDate(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">1st CA Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={caWeightFirst} 
                  onChange={(e) => setCaWeightFirst(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">2nd CA Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={caWeightSecond} 
                  onChange={(e) => setCaWeightSecond(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Exam Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={examWeight} 
                  onChange={(e) => setExamWeight(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px' }}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '-0.5rem' }}>Total must equal exactly 100%.</p>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="isActive"
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
              <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Set as Active Term
              </label>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            {saving ? 'Saving...' : 'Save Term Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
