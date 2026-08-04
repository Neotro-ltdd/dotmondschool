import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { useActiveTerm } from '../../../../hooks/useActiveTerm';
import './SessionOperation.css';
import { useDialog } from '../../../../context/DialogContext';
import { 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  Archive, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Layers 
} from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section?: string;
}

export default function SessionOperation() {
  const { showAlert, showConfirm } = useDialog();

  const { session, setSession } = useActiveTerm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [promoClassId, setPromoClassId] = useState('');
  const [promoProcessing, setPromoProcessing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
      if (data && data.length > 0 && !promoClassId) {
        setPromoClassId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load classes for dropdown", err);
    }
  };

  const handleGeneratePromotions = async () => {
    if (!promoClassId) {
      showAlert('Please select a Class Room to process promotions for.');
      return;
    }
    try {
      setPromoProcessing(true);
      await api.post('/academics/promotions/generate', { session, classId: promoClassId });
      showAlert('Promotion list generated successfully and sent to Principal for approval!');
    } catch (err: any) {
      showAlert(err.message || 'Failed to generate promotions.');
    } finally {
      setPromoProcessing(false);
    }
  };

  const handleAutoArchive = async () => {
    if (!await showConfirm('Are you sure you want to execute auto-archiving? This will archive all graduating/withdrawn students for this session.')) return;
    try {
      setArchiving(true);
      await api.post('/academics/archiving/process', { session });
      showAlert('Archiving processed successfully! Graduating and withdrawn records have been archived.');
    } catch (err: any) {
      showAlert(err.message || 'Failed to process archiving.');
    } finally {
      setArchiving(false);
    }
  };

  const selectedClass = classes.find(c => c.id === promoClassId);
  const totalClassesCount = classes.length;

  return (
    <div className="sessionop-page-container">
      {/* Page Header */}
      <div className="sessionop-page-header">
        <div>
          <h1 className="sessionop-page-title">Session Operation</h1>
          <p className="sessionop-page-subtitle">Execute annual end-of-session promotion calculations and student record archiving</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="sessionop-metrics-grid">
        <div className="sessionop-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Session</span>
            <span className="metric-number">{session || '2025/2026'}</span>
          </div>
          <div className="metric-icon-badge session">
            <Calendar size={24} />
          </div>
        </div>

        <div className="sessionop-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Classes Configured</span>
            <span className="metric-number">{totalClassesCount}</span>
          </div>
          <div className="metric-icon-badge classes">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="sessionop-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Promotion Processor</span>
            <span className="metric-number" style={{ fontSize: '1.2rem', marginTop: '0.4rem' }}>
              Cumulative 3-Term
            </span>
          </div>
          <div className="metric-icon-badge promo">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="sessionop-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Deep Storage Engine</span>
            <span className="metric-number" style={{ fontSize: '1.2rem', marginTop: '0.4rem' }}>
              Graduating / Withdrawn
            </span>
          </div>
          <div className="metric-icon-badge archive">
            <Archive size={24} />
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="sessionop-workspace-grid">
        {/* Card 1: Generate Promotion Roster */}
        <div className="sessionop-card">
          <div>
            <h2 className="sessionop-card-title">Generate Class Promotion List</h2>
            <p className="sessionop-card-subtitle">Compute annual cumulative scores and generate recommended class promotion recommendations</p>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Target Class Room
            </label>
            <select 
              className="select-filter-input"
              value={promoClassId} 
              onChange={(e) => setPromoClassId(e.target.value)}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem', borderRadius: '10px' }}
            >
              <option value="">-- Select Class Room --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{`${c.level} ${c.name} ${c.section || ''}`}</option>
              ))}
            </select>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              Processing promotion calculates the weighted 3-term average for <strong>{selectedClass?.name || 'the selected class'}</strong> and queues promotion recommendations for Principal Approval.
            </span>
          </div>

          <button 
            className="btn-process-promo" 
            onClick={handleGeneratePromotions} 
            disabled={promoProcessing || !promoClassId}
            style={{ marginTop: 'auto' }}
          >
            <TrendingUp size={18} />
            {promoProcessing ? 'Processing Promotion Roster...' : 'Generate Promotion List'}
          </button>
        </div>

        {/* Card 2: Auto-Archive Graduating Students */}
        <div className="sessionop-card">
          <div>
            <h2 className="sessionop-card-title">Auto-Archive Graduating Students</h2>
            <p className="sessionop-card-subtitle">Move completed SS3 graduating cohorts and withdrawn student profiles to deep storage</p>
          </div>

          <div style={{ background: '#FFFBEB', padding: '1.15rem', borderRadius: '12px', border: '1px solid #FED7AA', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 800, fontSize: '0.9rem' }}>
              <Archive size={18} /> Deep Storage Archiving Policy
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#78350F', lineHeight: 1.5 }}>
              Archiving transfers student profiles marked as <strong>'Graduating'</strong> or <strong>'Withdrawn'</strong> to long-term storage while retaining full transcript searchability and report card access.
            </p>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Target Session: <strong>{session}</strong>. Active student rosters will be updated automatically upon archiving execution.</span>
          </div>

          <button 
            className="btn-process-archive" 
            onClick={handleAutoArchive} 
            disabled={archiving}
          >
            <Archive size={18} />
            {archiving ? 'Processing Archiving...' : 'Execute Auto-Archive Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
