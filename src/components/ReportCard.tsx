import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../services/api';
import '../pages/dashboard/reports/ResultSheet.css';

interface ReportCardProps {
  studentId: string;
  session: string;
  term: string;
  onClose: () => void;
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

export default function ReportCard({ studentId, session, term, onClose }: ReportCardProps) {
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
        api.get(`/academics/students/${studentId}/report-card?session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`),
        api.get('/setup/school/profile').catch(() => ({ logoUrl: null }))
      ]);
      
      setData(reportRes);
      if (profileRes && profileRes.logoUrl) {
        setLogoUrl(profileRes.logoUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Report Card...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!data) return null;

  const getFullUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.8)', position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', padding: '20px' }}>
      <div className="result-sheet-container" style={{ margin: '0 auto', maxWidth: '800px', background: '#fff', position: 'relative' }}>
        <div className="no-print actions-bar" style={{ padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Result</button>
        </div>

        <div className="result-sheet-paper" style={{ position: 'relative', padding: '40px' }}>
          {/* Watermark */}
          {data.schoolLogoUrl && (
            <div className="watermark-container">
              <img src={getFullUrl(data.schoolLogoUrl) as string} alt="Watermark" className="watermark-image" />
            </div>
          )}

          {/* Header section */}
          <div className="result-header">
            <div className="school-logo-placeholder">
              {data.schoolLogoUrl ? <img src={getFullUrl(data.schoolLogoUrl) as string} alt="School Logo" style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'contain'}} /> : "LOGO"}
            </div>
            <div className="school-info">
              <h1>{data.schoolName?.toUpperCase()}</h1>
              <p>{data.schoolAddress}</p>
              <p>Motto: {data.schoolMotto}</p>
              <h2>STUDENT'S TERMINAL REPORT</h2>
            </div>
            <div className="student-photo-placeholder">
              {data.studentPassportUrl ? <img src={getFullUrl(data.studentPassportUrl) as string} alt="Student Photo" style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'cover'}} /> : "PHOTO"}
            </div>
          </div>

          <div className="divider" />

          {/* Bio Data Section */}
          <div className="bio-data-grid">
            <div className="bio-item"><strong>Name:</strong> {data.studentName}</div>
            <div className="bio-item"><strong>Reg No:</strong> {data.registrationNumber}</div>
            <div className="bio-item"><strong>Class:</strong> {data.className}</div>
            <div className="bio-item"><strong>Parent:</strong> {data.parentName}</div>
            <div className="bio-item"><strong>Term:</strong> {data.term}</div>
            <div className="bio-item"><strong>Session:</strong> {data.session}</div>
            <div className="bio-item"><strong>Position:</strong> {data.positionInClass}</div>
            <div className="bio-item"><strong>Date Processed:</strong> {data.dateProcessed}</div>
          </div>

          {/* Scores Table */}
          <table className="result-table">
            <thead>
              <tr>
                <th>SUBJECTS</th>
                <th>Total CA<br/>(40)</th>
                <th>Exam<br/>(60)</th>
                <th>Total<br/>(100)</th>
                <th>Grade</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((score, index) => (
                <tr key={index}>
                  <td className="subject-name">{score.subjectName}</td>
                  <td>{Math.ceil(score.testScore)}</td>
                  <td>{Math.ceil(score.examScore)}</td>
                  <td>{Math.ceil(score.totalScore)}</td>
                  <td>{score.grade}</td>
                  <td>{score.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary & Attendance Grid */}
          <div className="summary-grid">
            <div className="attendance-box custom-box">
              <h4>ATTENDANCE</h4>
              <div className="att-row"><span>Days School Opened:</span> <span className="att-val">118</span></div>
              <div className="att-row"><span>Days Present:</span> <span className="att-val">{data.daysStudentPresent}</span></div>
              <div className="att-row"><span>Days Absent:</span> <span className="att-val">{118 - data.daysStudentPresent}</span></div>
            </div>
            
            <div className="performance-box custom-box">
              <h4>PERFORMANCE SUMMARY</h4>
              <div className="att-row"><span>Grand Total:</span> <span className="att-val">{Math.ceil(data.grandTotal)}</span></div>
              <div className="att-row"><span>Average:</span> <span className="att-val">{data.average.toFixed(1)}%</span></div>
              <div className="att-row"><span>Department/Percentage:</span> <span className="att-val">{Math.round(data.average)}%</span></div>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="signatures-section custom-box">
            <div className="remark-row">
              <span className="remark-label">Class Teacher's Remark:</span>
              <span className="remark-text">{data.teacherComment}</span>
              <div className="signature-area">
                {data.teacherSignatureUrl ? <img src={getFullUrl(data.teacherSignatureUrl) as string} alt="Teacher Signature" /> : <span>_________________</span>}
              </div>
            </div>

            <div className="remark-row">
              <span className="remark-label">Principal's Remark:</span>
              <span className="remark-text">{data.principalComment}</span>
              <div className="signature-area">
                {data.principalSignatureUrl ? <img src={getFullUrl(data.principalSignatureUrl) as string} alt="Principal Signature" /> : <span>_________________</span>}
              </div>
            </div>
          </div>

          <div className="footer-section">
            <strong>Next Term Resumes:</strong> {data.resumptionDate ? new Date(data.resumptionDate).toLocaleDateString() : 'To Be Announced'}
          </div>
        </div>
      </div>
    </div>
  );
}
