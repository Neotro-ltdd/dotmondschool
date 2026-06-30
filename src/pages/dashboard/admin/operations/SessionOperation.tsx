import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { useActiveTerm } from '../../../../hooks/useActiveTerm';
import '../SystemOperations.css';

export default function SessionOperation() {
  const { session, setSession } = useActiveTerm();
  const [promoClassId, setPromoClassId] = useState('');
  const [promoProcessing, setPromoProcessing] = useState(false);

  const handleGeneratePromotions = async () => {
    if (!promoClassId) {
      alert('Please enter a Class ID to process promotions for.');
      return;
    }
    try {
      setPromoProcessing(true);
      await api.post('/academics/promotions/generate', { session, classId: promoClassId });
      alert('Promotion list generated and sent to Principal for approval!');
    } catch (err: any) {
      alert(err.message || 'Failed to generate promotions.');
    } finally {
      setPromoProcessing(false);
    }
  };

  const handleAutoArchive = async () => {
    if (!window.confirm('Are you sure? This will archive all graduating/withdrawn students for this session.')) return;
    try {
      await api.post('/academics/archiving/process', { session });
      alert('Archiving processed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to process archiving.');
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Session Operation</h1>
          <p className="page-subtitle">Execute end-of-term logic and batch processing.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="session-term-control" 
            value={session} 
            onChange={(e) => setSession(e.target.value)} 
            placeholder="Session" 
          />
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel danger-zone">
          <h2>End of Session Operations</h2>
          <p>Trigger heavy batch processes for the current session. These actions compute final grades and archive records.</p>
          
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Generate Promotion List</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-control" value={promoClassId} onChange={(e) => setPromoClassId(e.target.value)} placeholder="Enter Class ID..." />
              <button className="btn btn-primary" onClick={handleGeneratePromotions} disabled={promoProcessing}>Process</button>
            </div>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>This calculates average scores for the year and recommends promotions. Awaits Principal Approval.</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Auto-Archive Graduating Students</label>
            <button className="btn btn-secondary" onClick={handleAutoArchive}>Execute Auto-Archive</button>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>Moves students marked as 'Graduating' or 'Withdrawn' into deep storage.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
