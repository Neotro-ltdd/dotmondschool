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
  Layers,
  Zap,
  CalendarDays,
  CalendarCheck2,
  Info,
} from 'lucide-react';

interface HolidayTypeOption {
  id: string;
  label: string;
  badge?: string;
  icon: React.ElementType;
  description: string;
  themeColor: string;
  themeBg: string;
  themeBorder: string;
}

const HOLIDAY_TYPES: HolidayTypeOption[] = [
  {
    id: 'Mid-Term Break',
    label: 'Mid-Term Break (MTB)',
    badge: 'MID-TERM BREAK',
    icon: Palmtree,
    description: 'Pause classes & gate scanning for 5 days or 1 week during active term. Fee billing remains active.',
    themeColor: '#D97706',
    themeBg: '#FFFBEB',
    themeBorder: '#FCD34D',
  },
  {
    id: 'Term Vacation',
    label: 'Term Vacation / Inter-Term Break',
    badge: 'VACATION MODE',
    icon: CalendarDays,
    description: 'Holiday between terms (First to Second Term, or Second to Third Term). Term records finalized.',
    themeColor: '#2563EB',
    themeBg: '#EFF6FF',
    themeBorder: '#BFDBFE',
  },
  {
    id: 'Session Ended',
    label: 'Session Ended / Long Vacation',
    badge: 'SESSION ENDED',
    icon: Layers,
    description: 'Annual session holiday after Third Term. Awaiting new academic session promotion & setup.',
    themeColor: '#7C3AED',
    themeBg: '#F5F3FF',
    themeBorder: '#DDD6FE',
  },
  {
    id: 'Public Holiday',
    label: 'Public Holiday / Observance',
    badge: 'PUBLIC HOLIDAY',
    icon: Sparkles,
    description: 'Official national or religious holiday (1-3 days). Attendance scanners automatically frozen.',
    themeColor: '#059669',
    themeBg: '#ECFDF5',
    themeBorder: '#A7F3D0',
  },
];

const formatPrettyDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export default function TermSetup() {
  const { showAlert } = useDialog();

  const { session, term, setSession, setTerm } = useActiveTerm();
  const [resumptionDate, setResumptionDate] = useState('2026-11-09');
  const [isActive, setIsActive] = useState(true);
  const [isHoliday, setIsHoliday] = useState(true);
  const [holidayType, setHolidayType] = useState('Mid-Term Break');
  const [holidayStartDate, setHolidayStartDate] = useState('2026-11-02');
  const [holidayEndDate, setHolidayEndDate] = useState('2026-11-06');
  const [holidayReason, setHolidayReason] = useState('First Term 5-Day Mid-Term Break');
  const [status, setStatus] = useState('MTB');
  const [caWeightFirst, setCaWeightFirst] = useState(20);
  const [caWeightSecond, setCaWeightSecond] = useState(20);
  const [examWeight, setExamWeight] = useState(60);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTermSetup = async () => {
    try {
      setLoading(true);
      const data = await api.get(
        `/setup/terms?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
      );
      if (data) {
        if (data.nextTermResumptionDate) {
          setResumptionDate(data.nextTermResumptionDate.split('T')[0]);
        }
        if (data.isActive !== undefined) setIsActive(data.isActive);
        if (data.isHoliday !== undefined) setIsHoliday(data.isHoliday);
        if (data.holidayType) setHolidayType(data.holidayType);
        if (data.holidayStartDate) setHolidayStartDate(data.holidayStartDate.split('T')[0]);
        if (data.holidayReason) setHolidayReason(data.holidayReason);
        if (data.status) setStatus(data.status);
        if (data.caWeightFirst !== undefined) setCaWeightFirst(data.caWeightFirst);
        if (data.caWeightSecond !== undefined) setCaWeightSecond(data.caWeightSecond);
        if (data.examWeight !== undefined) setExamWeight(data.examWeight);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to load term setup', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermSetup();
  }, [session, term]);

  const applyPreset = (presetKey: string) => {
    if (presetKey === '5day-mtb') {
      setIsHoliday(true);
      setStatus('MTB');
      setHolidayType('Mid-Term Break');
      setHolidayStartDate('2026-11-02');
      setHolidayEndDate('2026-11-06');
      setResumptionDate('2026-11-09');
      setHolidayReason('First Term 5-Day Mid-Term Break (Resumes Monday, 9th November 2026)');
    } else if (presetKey === '1week') {
      setIsHoliday(true);
      setStatus('MTB');
      setHolidayType('Mid-Term Break');
      setHolidayStartDate('2026-11-02');
      setHolidayEndDate('2026-11-08');
      setResumptionDate('2026-11-09');
      setHolidayReason('1-Week Mid-Term Break');
    } else if (presetKey === 'term-vacation') {
      setIsHoliday(true);
      setStatus('Holiday');
      setHolidayType('Term Vacation');
      setHolidayStartDate('2026-11-02');
      setResumptionDate('2027-01-11');
      setHolidayReason('End of Term Vacation');
    }
  };

  const handleSave = async () => {
    if (!resumptionDate) {
      showAlert('Please select a school resumption date.');
      return;
    }

    if (caWeightFirst + caWeightSecond + examWeight !== 100) {
      showAlert('The sum of CA weights and Exam weight must equal exactly 100%.');
      return;
    }

    try {
      setSaving(true);
      const computedStatus = isHoliday
        ? (holidayType.toLowerCase().includes('mid-term') || holidayType === 'MTB'
            ? 'MTB'
            : holidayType.toLowerCase().includes('session')
            ? 'SessionEnded'
            : 'Holiday')
        : 'Active';

      await api.post('/setup/terms', {
        session,
        term,
        nextTermResumptionDate: resumptionDate,
        isActive: true,
        isHoliday,
        status: computedStatus,
        holidayType: isHoliday ? holidayType : null,
        holidayStartDate: isHoliday && holidayStartDate ? holidayStartDate : null,
        holidayReason: isHoliday ? holidayReason : null,
        caWeightFirst,
        caWeightSecond,
        examWeight,
      });

      invalidateActiveTermCache();
      showAlert(
        `Term setup saved successfully! Operational status is set to: ${
          isHoliday
            ? `🌴 ${holidayType} (School resumes ${formatPrettyDate(resumptionDate)})`
            : '🟢 School In Session (Active)'
        }`,
      );
    } catch (err: any) {
      showAlert(err.message || 'Failed to save term setup.');
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = caWeightFirst + caWeightSecond + examWeight;
  const isWeightValid = totalWeight === 100;

  const activeHolidayConfig =
    HOLIDAY_TYPES.find((h) => h.id === holidayType) || HOLIDAY_TYPES[0];

  const resumptionLabel =
    holidayType === 'Mid-Term Break' || holidayType === 'Public Holiday'
      ? 'School Resumption Date (Classes Resume)'
      : 'Next Academic Term Resumption Date';

  return (
    <div className="termsetup-page-container">
      {/* Page Header */}
      <div className="termsetup-page-header">
        <div>
          <h1 className="termsetup-page-title">Term & Session Setup</h1>
          <p className="termsetup-page-subtitle">
            Configure operational status, academic calendar parameters, holiday breaks, and continuous assessment weights
          </p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="termsetup-metrics-grid">
        <div className="termsetup-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Session</span>
            <span className="metric-number">{session || '2026/2027'}</span>
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
            <span
              className="metric-number"
              style={{
                fontSize: '1.15rem',
                marginTop: '0.4rem',
                color: isHoliday ? activeHolidayConfig.themeColor : '#047857',
              }}
            >
              {isHoliday ? `🌴 ${holidayType}` : '🟢 In Session (Active)'}
            </span>
            {isHoliday && resumptionDate && (
              <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, marginTop: '2px' }}>
                Resumes: {formatPrettyDate(resumptionDate)}
              </span>
            )}
          </div>
          <div className="metric-icon-badge status" style={{ background: isHoliday ? activeHolidayConfig.themeBg : '#ECFDF5', color: isHoliday ? activeHolidayConfig.themeColor : '#047857' }}>
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
            <p className="termsetup-card-subtitle">
              Define active session/term parameters, configure holiday modes, and set resumption dates
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Academic Session
              </label>
              <select
                className="select-filter-input"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              >
                {getSessionOptions(session).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Academic Term
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="select-filter-input"
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          {/* Operational Status Mode Selector */}
          <div style={{ marginTop: '0.25rem' }}>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              School Operational Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-status-toggle"
                onClick={() => {
                  setIsHoliday(false);
                  setIsActive(true);
                  setStatus('Active');
                }}
                style={{
                  border: !isHoliday ? '2px solid #10B981' : '1px solid #CBD5E1',
                  background: !isHoliday ? '#10B981' : '#FFFFFF',
                  color: !isHoliday ? '#FFFFFF' : '#334155',
                }}
              >
                <CheckCircle size={16} /> 🟢 In Session (Active)
              </button>

              <button
                type="button"
                className="btn-status-toggle"
                onClick={() => {
                  setIsHoliday(true);
                  setIsActive(false);
                  setStatus(holidayType === 'Mid-Term Break' ? 'MTB' : 'Holiday');
                }}
                style={{
                  border: isHoliday ? '2px solid #D97706' : '1px solid #CBD5E1',
                  background: isHoliday ? '#D97706' : '#FFFFFF',
                  color: isHoliday ? '#FFFFFF' : '#334155',
                }}
              >
                <Palmtree size={16} /> 🌴 Holiday / Break Mode
              </button>
            </div>
          </div>

          {/* Detailed Holiday Configuration when in Holiday Mode */}
          {isHoliday && (
            <div
              style={{
                background: '#FFFDF5',
                border: '1.5px solid #FCD34D',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Header with Presets */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Palmtree size={18} color="#D97706" />
                    Select Holiday / Break Classification
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>
                    Quick 1-Click Presets:
                  </span>
                </div>

                {/* Presets Bar */}
                <div className="holiday-presets-bar">
                  <button
                    type="button"
                    className={`btn-holiday-preset ${holidayType === 'Mid-Term Break' && holidayStartDate === '2026-11-02' ? 'active' : ''}`}
                    onClick={() => applyPreset('5day-mtb')}
                  >
                    <Zap size={14} /> 5-Day Mid-Term Break (Mon 02 Nov – Fri 06 Nov, Resumes Mon 09 Nov)
                  </button>
                  <button
                    type="button"
                    className="btn-holiday-preset"
                    onClick={() => applyPreset('1week')}
                  >
                    <CalendarCheck2 size={14} /> 1-Week Break
                  </button>
                  <button
                    type="button"
                    className="btn-holiday-preset"
                    onClick={() => applyPreset('term-vacation')}
                  >
                    <CalendarDays size={14} /> End-of-Term Vacation
                  </button>
                </div>
              </div>

              {/* Holiday Type Grid Cards */}
              <div className="holiday-type-grid">
                {HOLIDAY_TYPES.map((ht) => {
                  const isSelected = holidayType === ht.id;
                  const IconComp = ht.icon;
                  return (
                    <div
                      key={ht.id}
                      className={`holiday-type-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setHolidayType(ht.id);
                        if (ht.id === 'Mid-Term Break') {
                          setStatus('MTB');
                        } else if (ht.id === 'Session Ended') {
                          setStatus('SessionEnded');
                        } else {
                          setStatus('Holiday');
                        }
                      }}
                      style={{
                        borderColor: isSelected ? ht.themeColor : '#E2E8F0',
                        background: isSelected ? ht.themeBg : '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: ht.themeColor, fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconComp size={16} />
                          {ht.label}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: ht.themeColor,
                            }}
                          />
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748B', lineHeight: 1.35 }}>
                        {ht.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Holiday Dates & Resumption Configuration */}
              <div className="holiday-dates-grid">
                <div>
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#334155',
                      display: 'block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Break Start Date
                  </label>
                  <input
                    type="date"
                    className="select-filter-input"
                    value={holidayStartDate}
                    onChange={(e) => setHolidayStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem' }}
                  />
                  {holidayStartDate && (
                    <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                      Starts: {formatPrettyDate(holidayStartDate)}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#92400E',
                      display: 'block',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {resumptionLabel} *
                  </label>
                  <input
                    type="date"
                    className="select-filter-input"
                    value={resumptionDate}
                    onChange={(e) => setResumptionDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.9rem',
                      borderColor: '#F59E0B',
                      background: '#FFFDF5',
                    }}
                  />
                  {resumptionDate && (
                    <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 800, marginTop: '3px', display: 'block' }}>
                      Resumes: {formatPrettyDate(resumptionDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Operational Status Box */}
              <div
                style={{
                  background: activeHolidayConfig.themeBg,
                  border: `1px solid ${activeHolidayConfig.themeBorder}`,
                  borderRadius: '10px',
                  padding: '0.9rem',
                  fontSize: '0.82rem',
                  color: '#78350F',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                }}
              >
                <Info size={18} color={activeHolidayConfig.themeColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: activeHolidayConfig.themeColor, display: 'block', marginBottom: '2px' }}>
                    {holidayType === 'Mid-Term Break'
                      ? '🌴 5-Day Mid-Term Break Active (First Term 2026/2027)'
                      : `🌴 ${holidayType} Active`}
                  </strong>
                  <span>
                    {holidayType === 'Mid-Term Break'
                      ? `School is on mid-term break from Monday, 02 Nov 2026 through Friday, 06 Nov 2026. Gate tap-in scanners and parent attendance emails are paused. Normal classes and gate scanning resume on `
                      : `School is closed for ${holidayType}. Gate scanning is blocked and attendance tracking is paused. Normal academic activities resume on `}
                    <strong>{formatPrettyDate(resumptionDate) || 'Monday, 9th November 2026'}</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* School In Session Notice when Active */}
          {!isHoliday && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <CheckCircle size={22} color="#15803D" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: '#166534', display: 'block' }}>
                  🟢 School is In Session (Active Mode)
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#14532D', lineHeight: 1.45 }}>
                  Gate attendance scanners, class registers, and automated parent notifications are fully operational for {session} {term}. Continuous assessments and teacher scoring remain open.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: CA & Exam Grading Weights */}
        <div className="termsetup-card">
          <div>
            <h2 className="termsetup-card-title">Continuous Assessment & Exam Weights</h2>
            <p className="termsetup-card-subtitle">
              Configure mark weightings for 1st CA, 2nd CA, and Final Examination
            </p>
          </div>

          {/* Weighting Progress Bar Visualizer */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '0.4rem',
              }}
            >
              <span>Weighting Breakdown</span>
              <span style={{ color: isWeightValid ? '#047857' : '#DC2626' }}>
                {isWeightValid ? '100% Balanced' : `Total: ${totalWeight}% (Must be 100%)`}
              </span>
            </div>

            <div className="weighting-progress-bar">
              <div
                className="weight-segment-ca1"
                style={{ width: `${Math.min(caWeightFirst, 100)}%` }}
                title={`1st CA: ${caWeightFirst}%`}
              />
              <div
                className="weight-segment-ca2"
                style={{ width: `${Math.min(caWeightSecond, 100)}%` }}
                title={`2nd CA: ${caWeightSecond}%`}
              />
              <div
                className="weight-segment-exam"
                style={{ width: `${Math.min(examWeight, 100)}%` }}
                title={`Exam: ${examWeight}%`}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                marginTop: '0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#1E40AF',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3B82F6',
                  }}
                />{' '}
                1st CA ({caWeightFirst}%)
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#6B21A8',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#8B5CF6',
                  }}
                />{' '}
                2nd CA ({caWeightSecond}%)
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#047857',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                  }}
                />{' '}
                Exam ({examWeight}%)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
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
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
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
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
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

          <div
            style={{
              background: '#F8FAFC',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              fontSize: '0.82rem',
              color: '#64748B',
              display: 'flex',
              gap: '0.5rem',
              marginTop: 'auto',
            }}
          >
            <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              CA and Exam weights are used automatically across teacher score sheets and student
              report card computations.
            </span>
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
