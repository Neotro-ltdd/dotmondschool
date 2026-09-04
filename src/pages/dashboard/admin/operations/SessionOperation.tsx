import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { useActiveTerm } from '../../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../../utils/sessionOptions';
import './SessionOperation.css';
import { useDialog } from '../../../../context/DialogContext';
import {
  Calendar,
  GraduationCap,
  Archive,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section?: string;
}

export default function SessionOperation() {
  const { showAlert, showConfirm } = useDialog();

  const { session } = useActiveTerm();
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Archiving State (SS 3 / Terminal Class & 2-Year Threshold)
  const [archiveClassId, setArchiveClassId] = useState('');
  const [archiveGraduationSession, setArchiveGraduationSession] = useState('2023/2024');
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
      if (data && data.length > 0) {
        // Auto-select SS 3 or Senior Secondary class for Archiving
        const ss3Class = data.find(
          (c: ClassItem) =>
            c.name.toLowerCase().includes('ss 3') ||
            c.name.toLowerCase().includes('ss3') ||
            c.level.toLowerCase().includes('senior secondary'),
        );
        if (ss3Class) {
          setArchiveClassId(ss3Class.id);
        } else {
          setArchiveClassId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load classes for dropdown', err);
    }
  };

  const handleAutoArchive = async () => {
    const selectedArchClass = classes.find((c) => c.id === archiveClassId);
    const className = selectedArchClass?.name || 'Selected Class';

    if (
      !(await showConfirm(
        `Are you sure you want to archive results for ${className} (${archiveGraduationSession} Cohort)? This will transfer student academic results into deep storage as per the 2-year graduation retention policy.`,
      ))
    ) {
      return;
    }

    try {
      setArchiving(true);
      await api.post('/academics/archiving/process', {
        session: archiveGraduationSession,
        classId: archiveClassId,
      });
      showAlert(
        `Results and profiles for ${className} (${archiveGraduationSession} Cohort) have been successfully archived to deep storage!`,
      );
    } catch (err: any) {
      showAlert(err.message || 'Failed to process archiving.');
    } finally {
      setArchiving(false);
    }
  };

  const selectedArchClass = classes.find((c) => c.id === archiveClassId);
  const totalClassesCount = classes.length;

  return (
    <div className="sessionop-page-container">
      {/* Page Header */}
      <div className="sessionop-page-header">
        <div>
          <h1 className="sessionop-page-title">Session Operation — Result Archiving</h1>
          <p className="sessionop-page-subtitle">
            Archive terminal class results (SS 3) into deep storage following the 2-year
            post-graduation policy
          </p>
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
            <span className="metric-label">Target Terminal Class</span>
            <span className="metric-number" style={{ fontSize: '1.35rem', marginTop: '0.3rem' }}>
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
            <span
              className="metric-number"
              style={{ fontSize: '1.2rem', marginTop: '0.4rem', color: '#B45309' }}
            >
              2-Years Post Graduation
            </span>
          </div>
          <div className="metric-icon-badge archive">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Single Main Card Workspace */}
      <div className="sessionop-single-workspace">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="sessionop-card-title">Terminal Class Result Archiving</h2>
            <span
              style={{
                background: '#FEF3C7',
                color: '#B45309',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              2-Year Policy Threshold
            </span>
          </div>
          <p className="sessionop-card-subtitle">
            Transfer terminal class academic results (SS 3) into deep storage after 2 full years of
            graduation, updating active portal rosters while retaining historical transcript lookup
            capabilities.
          </p>
        </div>

        {/* Select Terminal Class Dropdown */}
        <div className="form-group">
          <label
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              display: 'block',
              marginBottom: '0.4rem',
            }}
          >
            Select Graduating Class Room (e.g. SS 3) <span style={{ color: '#E11D48' }}>*</span>
          </label>
          <select
            className="select-filter-input"
            value={archiveClassId}
            onChange={(e) => setArchiveClassId(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            <option value="">-- Select Graduating Class --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level}){' '}
                {c.name.toLowerCase().includes('ss 3') || c.name.toLowerCase().includes('ss3')
                  ? '⭐ [SS 3 Terminal]'
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Select Graduation Session Cohort */}
        <div className="form-group">
          <label
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              display: 'block',
              marginBottom: '0.4rem',
            }}
          >
            Graduation Session Cohort <span style={{ color: '#E11D48' }}>*</span>
          </label>
          <select
            className="select-filter-input"
            value={archiveGraduationSession}
            onChange={(e) => setArchiveGraduationSession(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            {getSessionOptions(archiveGraduationSession).map((s) => (
              <option key={s} value={s}>
                {s} Cohort
              </option>
            ))}
          </select>
        </div>

        {/* 2-Year Retention Policy Explanation Card */}
        <div className="archive-policy-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#B45309',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            <Clock size={18} /> 2-Year Post-Graduation Retention Policy Rule
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350F', lineHeight: 1.6 }}>
            Results for terminal graduating classes (most notably{' '}
            <strong>SS 3 / Senior Secondary 3</strong>) remain active on student & parent portals
            for <strong>2 full academic years post-graduation</strong>. Once the 2-year threshold is
            reached, executing archiving moves these records into deep historical storage while
            preserving transcript verification access.
          </p>
        </div>

        <button
          className="btn-process-archive"
          onClick={handleAutoArchive}
          disabled={archiving || !archiveClassId}
        >
          <Archive size={18} />
          {archiving
            ? 'Archiving Class Results...'
            : `Archive ${selectedArchClass?.name || 'SS 3'} Results (${archiveGraduationSession} Cohort)`}
        </button>
      </div>
    </div>
  );
}
