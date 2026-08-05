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
  Clock, 
  ShieldCheck, 
  Sparkles 
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
  
  // Promotion State
  const [promoClassId, setPromoClassId] = useState('');
  const [promoProcessing, setPromoProcessing] = useState(false);

  // Archiving State (SS 3 / Terminal Class & 2-Year Threshold)
  const [archiveClassId, setArchiveClassId] = useState('');
  const [archiveGraduationSession, setArchiveGraduationSession] = useState('2023/2024');
  const [archiving, setArchiving] = useState(false);

  const currentYear = new Date().getFullYear();
  const defaultEligibleSession = `${currentYear - 3}/${currentYear - 2}`; // e.g. 2023/2024 (2 years post-graduation)

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
      if (data && data.length > 0) {
        if (!promoClassId) setPromoClassId(data[0].id);
        
        // Auto-select SS 3 or Senior Secondary class for Archiving
        const ss3Class = data.find((c: ClassItem) => 
          c.name.toLowerCase().includes('ss 3') || 
          c.name.toLowerCase().includes('ss3') || 
          c.level.toLowerCase().includes('senior secondary')
        );
        if (ss3Class) {
          setArchiveClassId(ss3Class.id);
        } else {
          setArchiveClassId(data[0].id);
        }
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
    const selectedArchClass = classes.find(c => c.id === archiveClassId);
    const className = selectedArchClass?.name || 'Selected Class';

    if (!await showConfirm(`Are you sure you want to archive results for ${className} (${archiveGraduationSession} Cohort)? This will move student results into deep storage as per the 2-year graduation policy.`)) {
      return;
    }

    try {
      setArchiving(true);
      await api.post('/academics/archiving/process', { 
        session: archiveGraduationSession, 
        classId: archiveClassId 
      });
      showAlert(`Results and profiles for ${className} (${archiveGraduationSession} Cohort) have been successfully archived to deep storage!`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to process archiving.');
    } finally {
      setArchiving(false);
    }
  };

  const selectedPromoClass = classes.find(c => c.id === promoClassId);
  const selectedArchClass = classes.find(c => c.id === archiveClassId);
  const totalClassesCount = classes.length;

  return (
    <div className="sessionop-page-container">
      {/* Page Header */}
      <div className="sessionop-page-header">
        <div>
          <h1 className="sessionop-page-title">Session Operation</h1>
          <p className="sessionop-page-subtitle">Execute end-of-session promotion calculations and 2-year post-graduation result archiving</p>
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
            <span className="metric-label">Terminal Class</span>
            <span className="metric-number" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
              SS 3 Senior
            </span>
          </div>
          <div className="metric-icon-badge promo">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="sessionop-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Archiving Policy</span>
            <span className="metric-number" style={{ fontSize: '1.2rem', marginTop: '0.4rem', color: '#B45309' }}>
              2-Years Post Graduation
            </span>
          </div>
          <div className="metric-icon-badge archive">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="sessionop-workspace-grid">
        {/* Card 1: Generate Class Promotion List */}
        <div className="sessionop-card">
          <div>
            <h2 className="sessionop-card-title">Generate Class Promotion List</h2>
            <p className="sessionop-card-subtitle">Compute annual cumulative scores and generate recommended promotion rosters for active classes</p>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Target Class Room
            </label>
            <select 
              className="select-filter-input"
              value={promoClassId} 
              onChange={(e) => setPromoClassId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
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
              Calculates the weighted 3-term cumulative average for <strong>{selectedPromoClass?.name || 'the selected class'}</strong> and submits promotion recommendations to the Principal for final approval.
            </span>
          </div>

          <button 
            className="btn-process-promo" 
            onClick={handleGeneratePromotions} 
            disabled={promoProcessing || !promoClassId}
            style={{ marginTop: 'auto' }}
          >
            <TrendingUp size={18} />
            {promoProcessing ? 'Processing Promotion Roster...' : 'Generate Class Promotion List'}
          </button>
        </div>

        {/* Card 2: SS 3 & Terminal Class Result Archiving (2-Year Policy) */}
        <div className="sessionop-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className="sessionop-card-title">Terminal Class Result Archiving</h2>
              <span style={{ background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                2-Year Policy Threshold
              </span>
            </div>
            <p className="sessionop-card-subtitle">Archive terminal class results (SS 3) into deep storage after 2 years of graduation</p>
          </div>

          {/* Select Terminal Class Dropdown */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Select Graduating Class Room (e.g. SS 3)
            </label>
            <select 
              className="select-filter-input"
              value={archiveClassId} 
              onChange={(e) => setArchiveClassId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
            >
              <option value="">-- Select Graduating Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level}) {c.name.toLowerCase().includes('ss 3') || c.name.toLowerCase().includes('ss3') ? '⭐ [SS 3 Terminal]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Select Graduation Session Cohort */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Graduation Session Cohort
            </label>
            <select 
              className="select-filter-input"
              value={archiveGraduationSession} 
              onChange={(e) => setArchiveGraduationSession(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
            >
              <option value="2023/2024">2023/2024 Cohort (2 Years Post-Graduation - Eligible)</option>
              <option value="2022/2023">2022/2023 Cohort (3 Years Post-Graduation - Eligible)</option>
              <option value="2021/2022">2021/2022 Cohort (4 Years Post-Graduation - Eligible)</option>
              <option value="2024/2025">2024/2025 Cohort (1 Year Post-Graduation - Active Retention)</option>
              <option value="2025/2026">Current 2025/2026 Active Session (In Session)</option>
            </select>
          </div>

          {/* 2-Year Retention Policy Explanation Card */}
          <div className="archive-policy-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 800, fontSize: '0.88rem' }}>
              <Clock size={16} /> 2-Year Post-Graduation Retention Policy
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5 }}>
              Results for terminal graduating classes (such as <strong>SS 3</strong>) remain active on student portals for <strong>2 full years post-graduation</strong>. After 2 years, results are archived to deep storage while retaining transcript lookup privileges.
            </p>
          </div>

          <button 
            className="btn-process-archive" 
            onClick={handleAutoArchive} 
            disabled={archiving || !archiveClassId}
            style={{ marginTop: 'auto' }}
          >
            <Archive size={18} />
            {archiving ? 'Archiving Class Results...' : `Archive ${selectedArchClass?.name || 'SS 3'} Results (${archiveGraduationSession} Cohort)`}
          </button>
        </div>
      </div>
    </div>
  );
}
