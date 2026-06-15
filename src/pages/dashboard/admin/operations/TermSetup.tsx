import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

export default function TermSetup() {
  const [session, setSession] = useState('2026/2027');
  const [term, setTerm] = useState('First Term');
  const [resumptionDate, setResumptionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTermSetup = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/setup/terms?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      if (data && data.nextTermResumptionDate) {
        setResumptionDate(data.nextTermResumptionDate.split('T')[0]);
      } else {
        setResumptionDate('');
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed to load term setup", err);
      } else {
        setResumptionDate('');
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
    
    try {
      setSaving(true);
      await api.post('/setup/terms', {
        session,
        term,
        nextTermResumptionDate: resumptionDate
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
          <p className="page-subtitle">Configure the resumption date and parameters for the term.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>Configure Term</h2>
          <p style={{ marginBottom: '1.5rem' }}>Select the academic session and term, then define the resumption date for the next term.</p>
          
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
