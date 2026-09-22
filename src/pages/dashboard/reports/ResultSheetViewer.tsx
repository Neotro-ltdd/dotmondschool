import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
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
        { batchId },
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
        const data = await api.get(`/academics/students/${studentId}/report-card/${batchId}`);
        setResult(data);
      } catch (error) {
        console.error('Failed to fetch result', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [studentId, batchId]);

  if (loading)
    return (
      <div className="result-sheet-container">
        <p className="py-8 text-center text-gray-500">Loading terminal report sheet...</p>
      </div>
    );
  if (!result)
    return (
      <div className="result-sheet-container">
        <p className="py-8 text-center text-red-500">Result sheet not found.</p>
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
            <label>Name:</label>
            <span>{result.studentName}</span>
          </div>
          <div className="field">
            <label>Reg No:</label>
            <span>{result.registrationNumber}</span>
          </div>
          <div className="field">
            <label>Class:</label>
            <span>{result.className}</span>
          </div>

          <div className="field">
            <label>Parent:</label>
            <span>{result.parentName || 'Mr & Mrs. Parent'}</span>
          </div>
          <div className="field">
            <label>Term:</label>
            <span>{result.term}</span>
          </div>
          <div className="field">
            <label>Session:</label>
            <span>{result.session}</span>
          </div>

          <div className="field field-full">
            <label>Date Processed:</label>
            <span>{result.dateProcessed || new Date().toLocaleDateString('en-US')}</span>
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

        {/* Remarks & Signatures Section */}
        <div className="remarks-panel">
          <div className="remark-row">
            <span className="remark-label">Class Teacher's Remark:</span>
            <span className="remark-text">
              {result.teacherComment || 'Average Result, you can do better'}
            </span>
            <div className="signature">
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

          <div className="remark-row">
            <span className="remark-label">Principal's Remark:</span>
            <span className="remark-text">
              {result.principalComment || 'There is room for improvement, Just keep improving'}
            </span>
            <div className="signature">
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
