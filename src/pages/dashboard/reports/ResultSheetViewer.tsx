import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Loader2, AlertCircle } from 'lucide-react';
import { api, API_ROOT, downloadReportCardPdf } from '../../../services/api';
import './ResultSheet.css';

interface StudentScore {
  subjectName: string;
  testScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

interface ResultData {
  schoolName: string;
  schoolAddress: string;
  schoolMotto: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  session: string;
  term: string;
  parentName: string;
  dateProcessed: string;
  subjects: StudentScore[];
  grandTotal: number;
  average: number;
  averageGrade?: string;
  positionInClass: string;
  daysStudentPresent: number;
  principalComment: string;
  teacherComment: string;
  principalSignatureUrl: string | null;
  teacherSignatureUrl: string | null;
  studentPassportUrl: string | null;
  schoolLogoUrl: string | null;
  resumptionDate: string;
}

const ResultSheetViewer: React.FC = () => {
  const { studentId, batchId } = useParams<{ studentId: string; batchId: string }>();
  const [searchParams] = useSearchParams();
  const querySession = searchParams.get('session');
  const queryTerm = searchParams.get('term');
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  const handleDownloadPdf = async () => {
    if (!studentId) return;
    try {
      setDownloadingPdf(true);
      await downloadReportCardPdf(
        studentId,
        {
          batchId: batchId && batchId !== 'latest' ? batchId : undefined,
          session: querySession || result?.session,
          term: queryTerm || result?.term,
        },
        `Report_Card_${result?.registrationNumber || 'Student'}_${result?.session || ''}_${result?.term || ''}.pdf`
      );
    } catch (err: any) {
      alert(err?.message || 'Could not download PDF report card. Please ensure your fee clearance is up to date.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const params = new URLSearchParams();
        if (querySession) params.set('session', querySession);
        if (queryTerm) params.set('term', queryTerm);
        const qs = params.toString() ? `?${params.toString()}` : '';

        const effectiveBatch = batchId || 'latest';
        const data = await api.get(`/academics/students/${studentId}/report-card/${effectiveBatch}${qs}`);
        setResult(data);
      } catch (error: any) {
        console.error('Failed to fetch result', error);
        setErrorMessage(error?.message || 'Result sheet not found for the selected session and term.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [studentId, batchId, querySession, queryTerm]);

  if (loading)
    return (
      <div className="result-sheet-container">
        <p className="py-8 text-center text-gray-500">Loading terminal report sheet...</p>
      </div>
    );
  if (!result)
    return (
      <div className="result-sheet-container">
        <div style={{ maxWidth: '480px', margin: '48px auto', padding: '32px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Result Card Status</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5', marginBottom: '24px' }}>
            {errorMessage || 'Result sheet not found for the selected session and term.'}
          </p>
          <button
            className="sheet-btn sheet-btn-back"
            onClick={() => navigate(-1)}
            style={{ margin: '0 auto', display: 'inline-flex', padding: '8px 18px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );

  const isSecondary = result.className?.includes('JSS') || result.className?.includes('SS');

  const logoSrc = result.schoolLogoUrl ? getFullUrl(result.schoolLogoUrl) : '/images/dotmond-logo-1.png';

  return (
    <div className="result-sheet-container">
      <div className="no-print actions-bar">
        <div className="actions-bar-left">
          <button className="sheet-btn sheet-btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        <div className="actions-bar-right">
          <button className="sheet-btn sheet-btn-print" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Print Result Sheet</span>
          </button>
          
          <button
            className="sheet-btn sheet-btn-download"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Official PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="sheet">
        {/* Faint Watermark Logo */}
        <div
          className="watermark"
          style={{
            backgroundImage: `url("${logoSrc}")`,
          }}
        ></div>

        {/* Header Section */}
        <div className="header">
          <div className="logo-box">
            <img
              src={logoSrc}
              alt={result.schoolName || 'School Logo'}
              onError={(e) => {
                // Fallback to local default school logo asset if remote logo URL fails
                (e.target as HTMLImageElement).src = '/images/dotmond-logo-1.png';
              }}
            />
          </div>

          <div className="school-block">
            <h1 className="school-name">{result.schoolName || 'DOTMOND SCHOOL'}</h1>
            <p className="school-addr">
              {result.schoolAddress || 'Happyland Estate, Ajah, Lagos State, Nigeria'}
            </p>
            <p className="school-motto">
              Motto: {result.schoolMotto || 'Steady Progress, Brighter Future'}
            </p>
            <span className="report-title">STUDENT'S TERMINAL REPORT</span>
          </div>

          <div className="photo-box">
            {result.studentPassportUrl ? (
              <img
                src={getFullUrl(result.studentPassportUrl)}
                alt="Student Photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>PHOTO</span>
            )}
          </div>
        </div>

        <div className="rule"></div>

        {/* Student Bio Data Info Grid */}
        <div className="info-grid">
          <div className="field">
            <span className="label">Name:</span>
            <span className="value">{result.studentName}</span>
          </div>
          <div className="field">
            <span className="label">Reg No:</span>
            <span className="value">{result.registrationNumber}</span>
          </div>
          <div className="field">
            <span className="label">Class:</span>
            <span className="value">{result.className}</span>
          </div>

          <div className="field">
            <span className="label">Parent:</span>
            <span className="value">{result.parentName || 'Mr & Mrs. Parent'}</span>
          </div>
          <div className="field">
            <span className="label">Term:</span>
            <span className="value">{result.term}</span>
          </div>
          <div className="field">
            <span className="label">Session:</span>
            <span className="value">{result.session}</span>
          </div>

          <div className="field">
            <span className="label">Date Processed:</span>
            <span className="value">{result.dateProcessed || new Date().toLocaleDateString('en-US')}</span>
          </div>
        </div>

        {/* Subjects Performance Table */}
        <table className="subjects">
          <thead>
            <tr>
              <th>Subjects</th>
              {isSecondary ? (
                <>
                  <th>Total CA (40)</th>
                  <th>Exam (60)</th>
                  <th>Total (100)</th>
                </>
              ) : (
                <th>Mark (100)</th>
              )}
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {result.subjects.map((s, idx) => (
              <tr key={idx}>
                <td>{s.subjectName}</td>
                {isSecondary ? (
                  <>
                    <td>{Math.ceil(s.testScore)}</td>
                    <td>{Math.ceil(s.examScore)}</td>
                    <td>{Math.ceil(s.totalScore)}</td>
                  </>
                ) : (
                  <td>{Math.ceil(s.totalScore)}</td>
                )}
                <td className={s.grade === 'F' ? 'grade-F' : ''}>{s.grade}</td>
                <td>{s.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Panels Grid */}
        <div className="panels">
          <div className="panel">
            <h4>ATTENDANCE</h4>
            <div className="row">
              <span>Days School Opened:</span>
              <b>118</b>
            </div>
            <div className="row">
              <span>Days Present:</span>
              <b>{result.daysStudentPresent || 118}</b>
            </div>
            <div className="row">
              <span>Days Absent:</span>
              <b>{Math.max(0, 118 - (result.daysStudentPresent || 118))}</b>
            </div>
          </div>

          <div className="panel">
            <h4>PERFORMANCE SUMMARY</h4>
            <div className="row">
              <span>Grand Total:</span>
              <b>{Math.ceil(result.grandTotal)}</b>
            </div>
            <div className="row">
              <span>Average:</span>
              <b>{result.average.toFixed(1)}%</b>
            </div>
            {isSecondary ? (
              <div className="row">
                <span>Department/Percentage:</span>
                <b>{Math.round(result.average)}%</b>
              </div>
            ) : (
              <div className="row">
                <span>Grade/Position:</span>
                <b>Grade {result.averageGrade || 'A'}</b>
              </div>
            )}
          </div>
        </div>

        {/* Remarks & Signatures Section (Split 2-Card Layout) */}
        <div className="remarks-grid">
          {/* Class Teacher Card (Left) */}
          <div className="remark-card teacher-card">
            <div className="remark-card-header">
              <span className="remark-label">Class Teacher's Remark:</span>
            </div>
            <div className="remark-card-body">
              <p className="remark-text">
                {result.teacherComment || 'Average Result, you can do better'}
              </p>
            </div>
            <div className="remark-card-footer">
              <span className="sig-label">Signature:</span>
              <div className="signature teacher-signature">
                {result.teacherSignatureUrl ? (
                  <img
                    src={getFullUrl(result.teacherSignatureUrl)}
                    alt="Teacher Signature"
                  />
                ) : (
                  <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 38 C 18 12, 26 44, 36 22 S 54 10, 60 30 S 78 40, 86 18 S 104 8, 114 26"
                      stroke="#5B6672"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Principal Card (Right) */}
          <div className="remark-card principal-card">
            <div className="remark-card-header">
              <span className="remark-label">Principal's Remark:</span>
            </div>
            <div className="remark-card-body">
              <p className="remark-text">
                {result.principalComment || 'There is room for improvement, Just keep improving'}
              </p>
            </div>
            <div className="remark-card-footer">
              {/* Official Approved Stamp Seal */}
              <div className="school-stamp" title="Official Approved Stamp">
                <svg viewBox="0 0 120 120" className="stamp-svg">
                  <defs>
                    <path id="viewerStampArc" d="M 15,60 A 45,45 0 1,1 105,60" fill="none" />
                  </defs>
                  <circle cx="60" cy="60" r="56" stroke="#1e40af" strokeWidth="2.5" fill="none" />
                  <circle cx="60" cy="60" r="51" stroke="#1e40af" strokeWidth="1" strokeDasharray="3 2" fill="none" />
                  <circle cx="60" cy="60" r="37" stroke="#1e40af" strokeWidth="1.5" fill="none" />

                  <text fill="#1e40af" fontSize="8" fontWeight="bold" letterSpacing="0.8">
                    <textPath href="#viewerStampArc" startOffset="50%" textAnchor="middle">
                      {(result.schoolName || 'DOTMOND SCHOOL').toUpperCase()}
                    </textPath>
                  </text>

                  <rect x="20" y="46" width="80" height="26" rx="4" fill="#ffffff" stroke="#1e40af" strokeWidth="1.8" />
                  <text x="60" y="64" fill="#1e40af" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="1.2">
                    APPROVED
                  </text>

                  <text x="60" y="93" fill="#1e40af" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
                    OFFICIAL SEAL
                  </text>
                </svg>
              </div>

              <div className="sig-group">
                <span className="sig-label">Signature:</span>
                <div className="signature principal-signature">
                  {result.principalSignatureUrl ? (
                    <img
                      src={getFullUrl(result.principalSignatureUrl)}
                      alt="Principal Signature"
                    />
                  ) : (
                    <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 30 C 14 40, 20 8, 32 26 C 40 38, 46 14, 58 24 C 70 34, 78 12, 92 22 C 100 28, 106 20, 116 24"
                        stroke="#5B6672"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Term Resumes */}
        <div className="next-term">
          Next Term Resumes:{' '}
          {result.resumptionDate
            ? (new Date(result.resumptionDate).toString() !== 'Invalid Date'
                ? new Date(result.resumptionDate).toLocaleDateString('en-US')
                : result.resumptionDate)
            : '9/14/2026'}
        </div>
      </div>
    </div>
  );
};

export default ResultSheetViewer;
