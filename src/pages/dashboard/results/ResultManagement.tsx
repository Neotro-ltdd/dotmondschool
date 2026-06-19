import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../admin/SystemOperations.css';

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

export default function ResultManagement() {
  const [session, setSession] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [term, setTerm] = useState('First Term');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [compiling, setCompiling] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const handleCompile = async () => {
    if (!selectedClassId) {
      alert('Please select a class to compute results for.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to compute final results for this class? This will overwrite any currently compiled but unapproved results.')) {
      return;
    }

    try {
      setCompiling(true);
      await api.post('/academics/results/compile', { 
        classId: selectedClassId, 
        session, 
        term 
      });
      alert('Results computed successfully and sent to Admin for approval!');
    } catch (err: any) {
      alert(err.message || 'Failed to compute results.');
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Result Management</h1>
          <p className="page-subtitle">Administer and compute end-of-term results for classes.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={session} onChange={(e) => setSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>Compute Class Results</h2>
          <p>
            Trigger the computation of final grades for a specific class. This is usually done by the Class Teacher, 
            but an Administrator can manually trigger it here if all subject teachers have submitted their scores.
          </p>
          
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Class</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="form-control" 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.level} {c.name} {c.section}</option>
                ))}
              </select>
              <button 
                className="btn btn-primary" 
                onClick={handleCompile} 
                disabled={compiling || !selectedClassId}
              >
                {compiling ? 'Computing...' : 'Compute Results'}
              </button>
            </div>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
              Requires all subjects to be submitted. Results will be marked as "Submitted to Admin".
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
