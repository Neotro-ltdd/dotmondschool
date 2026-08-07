import React, { useState, useEffect } from 'react';
import { useActiveTerm, invalidateActiveTermCache } from '../../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../../utils/sessionOptions';
import { api } from '../../../../services/api';
import './TermSetup.css';
import { useDialog } from '../../../../context/DialogContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Palmtree, 
  Scale, 
  Save, 
  AlertCircle, 
  Sparkles, 
  Layers 
} from 'lucide-react';

export default function TermSetup() {
  const { showAlert } = useDialog();

  const { session, term, setSession, setTerm } = useActiveTerm();
  const [resumptionDate, setResumptionDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isHoliday, setIsHoliday] = useState(false);
  const [status, setStatus] = useState('Active');
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
        if (data.isHoliday !== undefined) setIsHoliday(data.isHoliday);
        if (data.status) setStatus(data.status);
        if (data.caWeightFirst !== undefined) setCaWeightFirst(data.caWeightFirst);
        if (data.caWeightSecond !== undefined) setCaWeightSecond(data.caWeightSecond);
        if (data.examWeight !== undefined) setExamWeight(data.examWeight);
      } else {
        setResumptionDate('');
        setIsActive(false);
        setIsHoliday(false);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Failed to load term setup", err);
      } else {
        setResumptionDate('');
        setIsActive(false);
        setIsHoliday(false);
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
      showAlert("Please select a resumption date.");
      return;
    }
    
    if (caWeightFirst + caWeightSecond + examWeight !== 100) {
      showAlert("The sum of CA weights and Exam weight must equal exactly 100%.");
      return;
    }
    
    try {
      setSaving(true);
      const computedStatus = isHoliday ? 'Holiday' : 'Active';

      await api.post('/setup/terms', {
        session,
        term,
        nextTermResumptionDate: resumptionDate,
        isActive: true,
        isHoliday,
        status: computedStatus,
        caWeightFirst,
        caWeightSecond,
        examWeight
      });
      invalidateActiveTermCache();
      showAlert(`Term setup saved successfully! Operational status is set to: ${isHoliday ? `🌴 Holiday Mode (School resumes ${resumptionDate})` : '🟢 School In Session'}`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to save term setup.');
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = caWeightFirst + caWeightSecond + examWeight;
  const isWeightValid = totalWeight === 100;

  return (
    <div className="termsetup-page-container">
      {/* Page Header */}
      <div className="termsetup-page-header">
        <div>
          <h1 className="termsetup-page-title">Term & Session Setup</h1>
          <p className="termsetup-page-subtitle">Configure operational status, academic calendar parameters, and continuous assessment weights</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="termsetup-metrics-grid">
        <div className="termsetup-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Session</span>
            <span className="metric-number">{session || '2025/2026'}</span>
          </div>
          <div className="metric-icon-badge session">
            <Calendar size={24} />
          </div>
        </div>

        <div className="termsetup-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Term</span>
            <span className="metric-number" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>
              {term || 'First Term'}
            </span>
          </div>
          <div className="metric-icon-badge term">
            <Clock size={24} />
          </div>
        </div>

        <div className="termsetup-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">System Status</span>
            <span className="metric-number" style={{ fontSize: '1.15rem', marginTop: '0.4rem', color: isHoliday ? '#B45309' : '#047857' }}>
              {isHoliday ? '🌴 Holiday Mode' : '🟢 In Session (Active)'}
            </span>
          </div>
          <div className="metric-icon-badge status">
            {isHoliday ? <Palmtree size={24} /> : <CheckCircle size={24} />}
          </div>
        </div>

        <div className="termsetup-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Grading Scheme</span>
            <span className="metric-number" style={{ fontSize: '1.15rem', marginTop: '0.4rem' }}>
              {caWeightFirst}% / {caWeightSecond}% / {examWeight}%
            </span>
          </div>
          <div className="metric-icon-badge weights">
            <Scale size={24} />
          </div>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="termsetup-workspace-grid">
        {/* Card 1: Academic Calendar & Status Setup */}
        <div className="termsetup-card">
          <div>
            <h2 className="termsetup-card-title">Academic Term & Operational Status</h2>
            <p className="termsetup-card-subtitle">Define active term parameters and control automated attendance scanning</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                Academic Session
              </label>
              <select 
                className="select-filter-input"
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              >
                {getSessionOptions(session).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                Academic Term
              </label>
              <select 
                value={term} 
                onChange={(e) => {
                  const selectedTerm = e.target.value;
                  setTerm(selectedTerm);
                }} 
                className="select-filter-input"
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          {/* Operational Status (Holiday Mode) Toggle Switch */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: isHoliday ? '#FFFBEB' : '#F0FDF4', borderRadius: '12px', border: `1px solid ${isHoliday ? '#FDE68A' : '#BBF7D0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: isHoliday ? '#92400E' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isHoliday ? <Palmtree size={18} color="#D97706" /> : <CheckCircle size={18} color="#15803D" />}
                School Operational Mode: {isHoliday ? '🌴 Holiday / Inter-Term Break' : '🟢 School In Session (Active)'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: isHoliday ? '#78350F' : '#14532D', display: 'block', marginTop: '2px' }}>
                {isHoliday 
                  ? 'Gate tap-in scanning is BLOCKED, attendance emails are PAUSED. Fee setup and billing operate normally for First Term 2026/2027.' 
                  : 'Gate tap-in scanning is LIVE, registers are ACTIVE, daily parent emails are SENT.'
                }
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextState = !isHoliday;
                setIsHoliday(nextState);
                setStatus(nextState ? 'Holiday' : 'Active');
              }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: isHoliday ? '#D97706' : '#16A34A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {isHoliday ? <Palmtree size={16} /> : <CheckCircle size={16} />}
              {isHoliday ? 'Switch to Active Mode' : 'Trigger Holiday Mode'}
            </button>
          </div>

          {/* Operational Status Banner Card */}
          <div className={`operational-banner ${isHoliday ? 'holiday' : 'active'}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHoliday ? <Palmtree size={20} color="#D97706" /> : <CheckCircle size={20} color="#15803D" />}
                <strong style={{ fontSize: '1rem', color: isHoliday ? '#92400E' : '#166534' }}>
                  {isHoliday ? '🌴 Holiday / Session Ended Mode' : '🟢 School In Session (Active Mode)'}
                </strong>
              </div>

              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 800, 
                padding: '4px 10px', 
                borderRadius: '12px',
                background: isHoliday ? '#FEF3C7' : '#DCFCE7',
                color: isHoliday ? '#B45309' : '#15803D'
              }}>
                {isHoliday ? 'ATTENDANCE & REPORTS STOPPED' : 'LIVE SYSTEM'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: isHoliday ? '#78350F' : '#14532D', lineHeight: 1.5 }}>
              {isHoliday 
                ? 'School has closed or the session has ended after Third Term. Gate/class attendance scanning is blocked, and automated attendance notifications are paused.'
                : 'School is actively in session. Gate attendance scanners, class registers, and automated parent notifications are fully operational.'
              }
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn-status-toggle"
                onClick={() => { setIsHoliday(false); setIsActive(true); setStatus('Active'); }}
                style={{
                  border: !isHoliday ? '2px solid #10B981' : '1px solid #CBD5E1',
                  background: !isHoliday ? '#10B981' : '#FFFFFF',
                  color: !isHoliday ? '#FFFFFF' : '#334155'
                }}
              >
                <CheckCircle size={16} /> In Session (Active)
              </button>

              <button
                type="button"
                className="btn-status-toggle"
                onClick={() => { setIsHoliday(true); setIsActive(false); setStatus('Holiday'); }}
                style={{
                  border: isHoliday ? '2px solid #D97706' : '1px solid #CBD5E1',
                  background: isHoliday ? '#D97706' : '#FFFFFF',
                  color: isHoliday ? '#FFFFFF' : '#334155'
                }}
              >
                <Palmtree size={16} /> Holiday / Session Ended
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              Next Term Resumption Date
            </label>
            {loading ? (
              <p style={{ color: '#64748B', fontSize: '0.88rem' }}>Loading date parameters...</p>
            ) : (
              <input 
                type="date" 
                className="select-filter-input"
                value={resumptionDate} 
                onChange={(e) => setResumptionDate(e.target.value)} 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              />
            )}
          </div>
        </div>

        {/* Card 2: CA & Exam Grading Weights */}
        <div className="termsetup-card">
          <div>
            <h2 className="termsetup-card-title">Continuous Assessment & Exam Weights</h2>
            <p className="termsetup-card-subtitle">Configure mark weightings for 1st CA, 2nd CA, and Final Examination</p>
          </div>

          {/* Weighting Progress Bar Visualizer */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>Weighting Breakdown</span>
              <span style={{ color: isWeightValid ? '#047857' : '#DC2626' }}>
                {isWeightValid ? '100% Balanced' : `Total: ${totalWeight}% (Must be 100%)`}
              </span>
            </div>
            
            <div className="weighting-progress-bar">
              <div className="weight-segment-ca1" style={{ width: `${Math.min(caWeightFirst, 100)}%` }} title={`1st CA: ${caWeightFirst}%`} />
              <div className="weight-segment-ca2" style={{ width: `${Math.min(caWeightSecond, 100)}%` }} title={`2nd CA: ${caWeightSecond}%`} />
              <div className="weight-segment-exam" style={{ width: `${Math.min(examWeight, 100)}%` }} title={`Exam: ${examWeight}%`} />
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1E40AF' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} /> 1st CA ({caWeightFirst}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#6B21A8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }} /> 2nd CA ({caWeightSecond}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> Exam ({examWeight}%)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                1st CA (%)
              </label>
              <input 
                type="number" 
                className="select-filter-input"
                value={caWeightFirst} 
                onChange={(e) => setCaWeightFirst(parseInt(e.target.value) || 0)} 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                2nd CA (%)
              </label>
              <input 
                type="number" 
                className="select-filter-input"
                value={caWeightSecond} 
                onChange={(e) => setCaWeightSecond(parseInt(e.target.value) || 0)} 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                Exam (%)
              </label>
              <input 
                type="number" 
                className="select-filter-input"
                value={examWeight} 
                onChange={(e) => setExamWeight(parseInt(e.target.value) || 0)} 
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>CA and Exam weights are used automatically across teacher score sheets and student report card computations.</span>
          </div>

          <button 
            className="btn-save-setup" 
            onClick={handleSave} 
            disabled={saving || loading || !isWeightValid}
          >
            <Save size={18} />
            {saving ? 'Saving Configuration...' : 'Save Term & Status Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
