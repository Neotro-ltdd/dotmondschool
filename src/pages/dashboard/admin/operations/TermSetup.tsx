import { useActiveTerm } from '../../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';
import { useDialog } from '../../../../context/DialogContext';
import { Sparkles, Calendar, ShieldAlert, CheckCircle, Palmtree } from 'lucide-react';

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
      showAlert("The sum of CA weights and Exam weight must equal exactly 100.");
      return;
    }
    
    try {
      setSaving(true);
      const isHolidayOrMTB = isHoliday || term === 'Holiday' || term === 'MTB (Mid Term Break)' || term === 'MTB';
      const computedStatus = isHolidayOrMTB 
        ? (term === 'MTB (Mid Term Break)' || term === 'MTB' ? 'MTB' : 'Holiday') 
        : (isActive ? 'Active' : 'SessionEnded');

      await api.post('/setup/terms', {
        session,
        term,
        nextTermResumptionDate: resumptionDate,
        isActive: true,
        isHoliday: isHolidayOrMTB,
        status: computedStatus,
        caWeightFirst,
        caWeightSecond,
        examWeight
      });
      showAlert(`Term setup saved successfully! Portal operational status set to "${term}".`);
    } catch (err: any) {
      showAlert(err.message || 'Failed to save term setup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operations-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Term & Session Setup</h1>
          <p className="page-subtitle">Configure session parameters, operational status (In Session vs. Holiday), and CA weights.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '680px', margin: '0 auto' }}>
        <div className="operations-card glass-panel" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2rem' }}>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>Configure Academic Term</h2>
          <p style={{ marginBottom: '1.75rem', color: '#64748B', fontSize: '0.9rem' }}>Define session status and control automatic attendance logging and report triggers.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>Session</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={session} 
                  onChange={(e) => setSession(e.target.value)} 
                  placeholder="2025/2026" 
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              
              <div>
                <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>Term</label>
                <select 
                  value={term} 
                  onChange={(e) => {
                    const selectedTerm = e.target.value;
                    setTerm(selectedTerm);
                    if (selectedTerm === 'Holiday') {
                      setIsHoliday(true);
                      setIsActive(false);
                      setStatus('Holiday');
                    } else if (selectedTerm === 'MTB (Mid Term Break)' || selectedTerm === 'MTB') {
                      setIsHoliday(true);
                      setIsActive(false);
                      setStatus('MTB');
                    } else {
                      setIsHoliday(false);
                      setIsActive(true);
                      setStatus('Active');
                    }
                  }} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                  <option value="Holiday">Holiday</option>
                  <option value="MTB (Mid Term Break)">MTB (Mid Term Break)</option>
                </select>
              </div>
            </div>

            {/* ════════ OPERATIONAL STATUS TOGGLE CARD ════════ */}
            <div style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: isHoliday ? '2px solid #F59E0B' : '2px solid #10B981',
              backgroundColor: isHoliday ? '#FFFBEB' : '#F0FDF4',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isHoliday ? <Palmtree size={20} color="#D97706" /> : <CheckCircle size={20} color="#15803D" />}
                  <strong style={{ fontSize: '1rem', color: isHoliday ? '#92400E' : '#166534' }}>
                    {isHoliday ? '🌴 Holiday / Session Ended Mode' : '🟢 School In Session (Active Mode)'}
                  </strong>
                </div>

                <span style={{ 
                  fontSize: '0.75rem', 
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
                  ? 'School has closed or the session has ended after Third Term. Gate/class attendance scanning is blocked, and automated attendance notifications/reports are paused.'
                  : 'School is actively in session. Gate attendance scanners, class attendance registers, and automated parent notifications are fully operational.'
                }
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsHoliday(false); setIsActive(true); setStatus('Active'); }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: !isHoliday ? '2px solid #10B981' : '1px solid #CBD5E1',
                    background: !isHoliday ? '#10B981' : '#FFFFFF',
                    color: !isHoliday ? '#FFFFFF' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={16} /> In Session (Active)
                </button>

                <button
                  type="button"
                  onClick={() => { setIsHoliday(true); setIsActive(false); setStatus('Holiday'); }}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: isHoliday ? '2px solid #D97706' : '1px solid #CBD5E1',
                    background: isHoliday ? '#D97706' : '#FFFFFF',
                    color: isHoliday ? '#FFFFFF' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Palmtree size={16} /> Holiday / Session Ended
                </button>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>Next Term Resumption Date</label>
              {loading ? (
                <p style={{ color: '#64748B' }}>Loading parameters...</p>
              ) : (
                <input 
                  type="date" 
                  className="form-control" 
                  value={resumptionDate} 
                  onChange={(e) => setResumptionDate(e.target.value)} 
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>1st CA Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={caWeightFirst} 
                  onChange={(e) => setCaWeightFirst(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>2nd CA Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={caWeightSecond} 
                  onChange={(e) => setCaWeightSecond(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#334155' }}>Exam Weight (%)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={examWeight} 
                  onChange={(e) => setExamWeight(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '-0.25rem' }}>Grading weights total must equal exactly 100%.</p>

          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || loading}
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 800, borderRadius: '10px', background: '#000080', color: '#ffffff' }}
          >
            {saving ? 'Saving Term Configuration...' : 'Save Term & Status Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
