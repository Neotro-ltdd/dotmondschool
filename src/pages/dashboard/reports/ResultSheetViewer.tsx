import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, API_ROOT } from '../../../services/api';
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

  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
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

  if (loading) return <div>Loading result sheet...</div>;
  if (!result) return <div>Result not found.</div>;

  const isSecondary = result.className?.includes('JSS') || result.className?.includes('SS');

  return (
    <div className="result-sheet-container">
      <div className="no-print actions-bar">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Result</button>
      </div>

      <div className="result-sheet-paper">
        {/* Watermark */}
        {result.schoolLogoUrl && (
          <div className="watermark-container">
            <img src={getFullUrl(result.schoolLogoUrl) as string} alt="Watermark" className="watermark-image" />
          </div>
        )}

        {/* Header section */}
        <div className="result-header">
          <div className="school-logo-placeholder">
            {result.schoolLogoUrl ? <img src={getFullUrl(result.schoolLogoUrl) as string} alt="School Logo" style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'contain'}} /> : "LOGO"}
          </div>
          <div className="school-info">
            <h1>{result.schoolName.toUpperCase()}</h1>
            <p>{result.schoolAddress}</p>
            <p>Motto: {result.schoolMotto}</p>
            <h2>STUDENT'S TERMINAL REPORT</h2>
          </div>
          <div className="student-photo-placeholder">
            {result.studentPassportUrl ? <img src={getFullUrl(result.studentPassportUrl) as string} alt="Student Photo" style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'cover'}} /> : "PHOTO"}
          </div>
        </div>

        <div className="divider" />

        {/* Bio Data Section */}
        <div className="bio-data-grid">
          <div className="bio-item"><strong>Name:</strong> {result.studentName}</div>
          <div className="bio-item"><strong>Reg No:</strong> {result.registrationNumber}</div>
          <div className="bio-item"><strong>Class:</strong> {result.className}</div>
          <div className="bio-item"><strong>Parent:</strong> {result.parentName}</div>
          <div className="bio-item"><strong>Term:</strong> {result.term}</div>
          <div className="bio-item"><strong>Session:</strong> {result.session}</div>
          {!isSecondary && <div className="bio-item"><strong>Position:</strong> {result.positionInClass}</div>}
          <div className="bio-item"><strong>Date Processed:</strong> {result.dateProcessed}</div>
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
            {result.subjects.map((score, index) => (
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
            <div className="att-row"><span>Days Present:</span> <span className="att-val">{result.daysStudentPresent}</span></div>
            <div className="att-row"><span>Days Absent:</span> <span className="att-val">{118 - result.daysStudentPresent}</span></div>
          </div>
          
          <div className="performance-box custom-box">
            <h4>PERFORMANCE SUMMARY</h4>
            <div className="att-row"><span>Grand Total:</span> <span className="att-val">{Math.ceil(result.grandTotal)}</span></div>
            <div className="att-row"><span>Average:</span> <span className="att-val">{result.average.toFixed(1)}%</span></div>
            <div className="att-row"><span>Department/Percentage:</span> <span className="att-val">{Math.round(result.average)}%</span></div>
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="signatures-section custom-box">
          <div className="remark-row">
            <span className="remark-label">Class Teacher's Remark:</span>
            <span className="remark-text">{result.teacherComment}</span>
            <div className="signature-area">
              {result.teacherSignatureUrl ? <img src={getFullUrl(result.teacherSignatureUrl) as string} alt="Teacher Signature" /> : <span>_________________</span>}
            </div>
          </div>

          <div className="remark-row">
            <span className="remark-label">Principal's Remark:</span>
            <span className="remark-text">{result.principalComment}</span>
            <div className="signature-area">
              {result.principalSignatureUrl ? <img src={getFullUrl(result.principalSignatureUrl) as string} alt="Principal Signature" /> : <span>_________________</span>}
            </div>
          </div>
        </div>

        <div className="footer-section">
          <strong>Next Term Resumes:</strong> {result.resumptionDate ? new Date(result.resumptionDate).toLocaleDateString() : 'To Be Announced'}
        </div>
      </div>
    </div>
  );
};

export default ResultSheetViewer;
