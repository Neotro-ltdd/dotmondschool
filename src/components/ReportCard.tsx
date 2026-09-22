import React, { useState, useEffect } from 'react';
import { BookOpen, Printer, X } from 'lucide-react';
import { api, API_ROOT } from '../services/api';
import '../pages/dashboard/reports/ResultSheet.css';

interface ReportCardProps {
  studentId: string;
  session: string;
  term: string;
  onClose?: () => void;
  isInline?: boolean;
}

interface ReportCardData {
  studentName: string;
  className: string;
  session: string;
  term: string;
  daysSchoolOpened: number;
  daysStudentPresent: number;
  dateOfResult: string;
  grandTotal: number;
  average: number;
  averageGrade?: string;
  percentage: string;
  teacherComment: string;
  principalComment: string;
  parentName: string;
  resumptionDate: string;
  hasUnpaidFees: boolean;
  teacherSignatureUrl?: string;
  principalSignatureUrl?: string;
  schoolLogoUrl?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolMotto?: string;
  studentPassportUrl?: string;
  registrationNumber?: string;
  positionInClass?: string;
  dateProcessed?: string;
  subjects: Array<{
    subjectName: string;
    testScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remark: string;
  }>;
}

export default function ReportCard({ studentId, session, term, onClose, isInline }: ReportCardProps) {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId, session, term]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, profileRes] = await Promise.all([
        api.get(
          `/academics/students/${studentId}/report-card?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`,
        ),
        api.get('/setup/school-profile').catch(() => api.get('/setup/school/profile')).catch(() => ({ logoUrl: null })),
      ]);

      setData(reportRes);
      if (profileRes && profileRes.logoUrl) {
        setLogoUrl(profileRes.logoUrl);
      }
    } catch (err: any) {
      setError(err.message || 'No approved result sheet available for the selected term.');
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
        Loading Report Card...
      </div>
    );
  if (error) {
    const errorCard = (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          margin: '1rem 0',
          position: 'relative',
          boxShadow: isInline ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#64748b',
            }}
            title="Close Notice"
          >
            ✕
          </button>
        )}
        <BookOpen size={40} style={{ color: '#94a3b8', margin: '0 auto 0.75rem' }} />
        <h4 style={{ color: '#1e293b', margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
          Terminal Result Notice
        </h4>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{error}</p>
      </div>
    );

    if (isInline) return errorCard;

    return (
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>{errorCard}</div>
      </div>
    );
  }
  if (!data) return null;

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  const isSecondary = data.className?.includes('JSS') || data.className?.includes('SS');

  const logoSrc = data.schoolLogoUrl ? getFullUrl(data.schoolLogoUrl) : (logoUrl ? getFullUrl(logoUrl) : '/images/dotmond-logo-1.png');

  const sheetContent = (
    <div className="result-sheet-container">
      <div className="no-print actions-bar">
        <div className="actions-bar-left">
          {onClose && (
            <button className="sheet-btn sheet-btn-back" onClick={onClose}>
              <X size={16} />
              <span>Close</span>
            </button>
          )}
        </div>

        <div className="actions-bar-right">
          <button className="sheet-btn sheet-btn-print" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Print Result Sheet</span>
          </button>
        </div>
      </div>

      <div className="sheet">
        <div className="watermark-container">
          <img
            src={logoSrc}
            alt="Watermark"
            className="watermark-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/dotmond-logo-1.png';
            }}
          />
        </div>

        <div className="header">
          <div className="logo-box">
            <img
              src={logoSrc}
              alt={data.schoolName || 'School Logo'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/dotmond-logo-1.png';
              }}
            />
          </div>
          <div className="school-info">
            <h1>{data.schoolName || 'Dotmond School'}</h1>
            <div className="address">{data.schoolAddress || 'Happyland Estate, Ajah, Lagos State, Nigeria'}</div>
            <div className="motto">Motto: {data.schoolMotto || 'Steady Progress, Brighter Future'}</div>
          </div>
          <div className="photo-box">
            {data.studentPassportUrl ? (
              <img src={getFullUrl(data.studentPassportUrl)} alt="Student Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              'PHOTO'
            )}
          </div>
        </div>

        <div className="report-title">STUDENT'S TERMINAL REPORT</div>
        <hr className="top-rule" />

        <div className="info-grid">
          <div>
            <span className="label">Name:</span> <span className="value">{data.studentName}</span>
          </div>
          <div>
            <span className="label">Reg No:</span> <span className="value">{data.registrationNumber || '—'}</span>
          </div>
          <div>
            <span className="label">Class:</span> <span className="value">{data.className}</span>
          </div>

          <div>
            <span className="label">Parent:</span> <span className="value">{data.parentName || '—'}</span>
          </div>
          <div>
            <span className="label">Term:</span> <span className="value">{data.term}</span>
          </div>
          <div>
            <span className="label">Session:</span> <span className="value">{data.session}</span>
          </div>

          <div>
            <span className="label">Date Processed:</span>{' '}
            <span className="value">{data.dateProcessed || data.dateOfResult || '—'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SUBJECTS</th>
              {isSecondary ? (
                <>
                  <th>Total CA (40)</th>
                  <th>Exam (60)</th>
                  <th>Total (100)</th>
                </>
              ) : (
                <th>MARK (100)</th>
              )}
              <th>GRADE</th>
              <th>REMARK</th>
            </tr>
          </thead>
          <tbody>
            {(data.subjects || []).map((score: any, index: number) => (
              <tr key={index}>
                <td>{score.subjectName}</td>
                {isSecondary ? (
                  <>
                    <td>{Math.ceil(score.testScore ?? 0)}</td>
                    <td>{Math.ceil(score.examScore ?? 0)}</td>
                    <td>{Math.ceil(score.totalScore ?? 0)}</td>
                  </>
                ) : (
                  <td>{Math.ceil(score.totalScore ?? 0)}</td>
                )}
                <td className="grade">{score.grade}</td>
                <td className="remark">{score.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="panels">
          <div className="panel">
            <h3>ATTENDANCE</h3>
            <div className="row">
              <span>Days School Opened:</span>
              <span className="val">{data.daysSchoolOpened ?? 118}</span>
            </div>
            <div className="row">
              <span>Days Present:</span>
              <span className="val">{data.daysStudentPresent ?? 0}</span>
            </div>
            <div className="row">
              <span>Days Absent:</span>
              <span className="val">
                {(data.daysSchoolOpened ?? 118) - (data.daysStudentPresent ?? 0)}
              </span>
            </div>
          </div>

          <div className="panel">
            <h3>PERFORMANCE SUMMARY</h3>
            <div className="row">
              <span>Grand Total:</span>
              <span className="val">{Math.ceil(data.grandTotal ?? 0)}</span>
            </div>
            <div className="row">
              <span>Average:</span>
              <span className="val">{(data.average ?? 0).toFixed(1)}%</span>
            </div>
            {isSecondary ? (
              <div className="row">
                <span>Department/Percentage:</span>
                <span className="val">{Math.round(data.average ?? 0)}%</span>
              </div>
            ) : (
              <div className="row">
                <span>Grade/Position:</span>
                <span className="val">Grade {data.averageGrade || 'A'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="remarks-panel">
          <div className="remark-row">
            <span className="remark-label">Class Teacher's Remark:</span>
            <span className="remark-text">{data.teacherComment || 'Excellent Result, Keep up the good work'}</span>
            <div className="signature">
              {data.teacherSignatureUrl ? (
                <img src={getFullUrl(data.teacherSignatureUrl)} alt="Signature" style={{ maxHeight: '30px', objectFit: 'contain' }} />
              ) : (
                ' '
              )}
            </div>
          </div>

          <div className="remark-row">
            <span className="remark-label">Principal's Remark:</span>
            <span className="remark-text">{data.principalComment || 'Very good Result, Keep going'}</span>
            {data.principalSignatureUrl && (
              <div className="signature">
                <img src={getFullUrl(data.principalSignatureUrl)} alt="Signature" style={{ maxHeight: '30px', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>

        <div className="next-term">
          Next Term Resumes: {data.resumptionDate || '—'}
        </div>

        {/* Unpaid Fees Warning Banner */}
        {data.hasUnpaidFees && (
          <div
            className="no-print"
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⚠️ <strong>Notice:</strong> This student has unpaid fees for this term/session.
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return sheetContent;
  }

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.8)',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        padding: '20px',
      }}
    >
      {sheetContent}
    </div>
  );
}
