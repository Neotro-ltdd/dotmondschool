import React, { useState } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

interface CAComponent {
  name: string;
  weight: number;
}

export default function Templates() {
  const { session, term, setSession, setTerm } = useActiveTerm();
  
  const [caComponents, setCaComponents] = useState<CAComponent[]>([
    { name: '1st Test', weight: 10 },
    { name: '2nd Test', weight: 10 },
    { name: 'Project', weight: 10 },
    { name: 'Exam', weight: 70 }
  ]);
  const [savingCA, setSavingCA] = useState(false);

  const handleCASave = async () => {
    const total = caComponents.reduce((sum, c) => sum + Number(c.weight), 0);
    if (total > 100) {
      alert(`Total CA weight cannot exceed 100. Current total is ${total}.`);
      return;
    }

    try {
      setSavingCA(true);
      const componentsMap = caComponents.reduce((acc, curr) => ({ ...acc, [curr.name]: Number(curr.weight) }), {});
      await api.post('/setup/ca-templates', { session, term, components: componentsMap });
      alert('CA Template saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save CA Template.');
    } finally {
      setSavingCA(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">CA Templates</h1>
          <p className="page-subtitle">Configure Continuous Assessment structure.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="session-term-control" 
            value={session} 
            onChange={(e) => setSession(e.target.value)} 
            placeholder="Session" 
          />
          <select 
            className="session-term-control" 
            value={term} 
            onChange={(e) => setTerm(e.target.value)}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>CA Templates Structure</h2>
          <p style={{ marginBottom: '1.5rem' }}>Define the structure of Continuous Assessment.</p>
          
          <div className="table-container">
            <table className="data-table" style={{ width: '100%', marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Component Name</th>
                  <th style={{ textAlign: 'left', width: '30%' }}>Weight (%)</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {caComponents.map((ca, idx) => (
                  <tr key={idx}>
                    <td>
                      <input type="text" className="form-control" value={ca.name} onChange={(e) => {
                        const newCA = [...caComponents];
                        newCA[idx].name = e.target.value;
                        setCaComponents(newCA);
                      }} placeholder="e.g. 1st Test" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    </td>
                    <td>
                      <select 
                        className="form-control" 
                        value={ca.weight} 
                        onChange={(e) => {
                          const newCA = [...caComponents];
                          newCA[idx].weight = Number(e.target.value);
                          setCaComponents(newCA);
                        }}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
                      >
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                          <option key={val} value={val} style={{ color: '#000' }}>{val}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: '#ff4136', background: 'rgba(255, 65, 54, 0.1)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }} 
                        onClick={() => setCaComponents(caComponents.filter((_, i) => i !== idx))}
                        title="Remove Component"
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn-add" onClick={() => setCaComponents([...caComponents, { name: '', weight: 0 }])}>+ Add CA Component</button>
          
          <div className="action-row" style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={handleCASave} disabled={savingCA}>{savingCA ? 'Saving...' : 'Save CA Template'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
