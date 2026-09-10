import React from 'react';
import { AcademicAnalysisView } from '../../../components/dashboard/reports/AcademicAnalysisView';
import { TrendingUp, ChevronRight, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Reports.css';

export default function AcademicAnalysis() {
  return (
    <div className="reports-page">
      {/* ════════ BREADCRUMB ════════ */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.82rem',
          color: '#64748b',
          marginBottom: '1rem',
        }}
        className="no-print"
      >
        <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link to="/dashboard/reports" style={{ color: '#64748b', textDecoration: 'none' }}>
          Reports & Analytics
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Academic Analysis</span>
      </nav>

      {/* ════════ EXECUTIVE HERO BANNER ════════ */}
      <div className="reports-header-banner">
        <div className="reports-header-title-box">
          <div className="reports-header-icon-badge">
            <TrendingUp size={26} />
          </div>
          <div>
            <h1>Academic Analysis & Subject Progression</h1>
            <p>
              Longitudinal multi-term progression curves comparing First Term, Second Term, and Third
              Term continuous assessment (C.A.) and examination scores.
            </p>
          </div>
        </div>
      </div>

      {/* ════════ MAIN ANALYSIS VIEW ════════ */}
      <AcademicAnalysisView isParentView={false} />
    </div>
  );
}
