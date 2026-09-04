import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ResultSheet.css';

const ResultSample: React.FC = () => {
  const navigate = useNavigate();

  const dummyResult = {
    schoolName: 'Dotmond School',
    schoolAddress: 'Happyland Estate, Ajah, Lagos State, Nigeria',
    schoolMotto: 'Steady Progress, Brighter Future',
    studentName: 'Sunday, Micheal Chukwuma',
    registrationNumber: 'DOTJSS1-030',
    className: 'NURSERY 1',
    session: '2025/2026',
    term: 'First Term',
    daysStudentPresent: 118,
    parentName: 'Mr & Mrs. Uhama',
    dateProcessed: '07/22/2026',
    positionInClass: '15',
    averageGrade: 'C',
    grandTotal: 374,
    average: 62.3,
    teacherComment: 'A good performance, keep it up.',
    principalComment: 'Satisfactory result, you can do better.',
    teacherSignatureUrl: null,
    principalSignatureUrl: null,
    studentPassportUrl: null,
    schoolLogoUrl: null,
    resumptionDate: '2026-09-14',
    subjects: [
      {
        subjectName: 'Basic Science and Technology (BST)',
        testScore: 33,
        examScore: 26,
        totalScore: 59,
        grade: 'C',
        remark: 'Credit',
      },
      {
        subjectName: 'Business Studies',
        testScore: 25,
        examScore: 30,
        totalScore: 55,
        grade: 'C',
        remark: 'Credit',
      },
      {
        subjectName: 'Christian Religious Studies (CRS)',
        testScore: 35,
        examScore: 33,
        totalScore: 68,
        grade: 'B',
        remark: 'Good',
      },
      {
        subjectName: 'Cultural and Creative Arts (CCA)',
        testScore: 30,
        examScore: 44,
        totalScore: 74,
        grade: 'A',
        remark: 'Excellent',
      },
      {
        subjectName: 'English Studies',
        testScore: 27,
        examScore: 26,
        totalScore: 53,
        grade: 'C',
        remark: 'Credit',
      },
      {
        subjectName: 'French Language',
        testScore: 30,
        examScore: 35,
        totalScore: 65,
        grade: 'B',
        remark: 'Good',
      },
    ],
  };

  const isSecondary =
    dummyResult.className?.includes('JSS') || dummyResult.className?.includes('SS');

  return (
    <div className="result-sheet-container">
      <div className="no-print actions-bar">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print Result
        </button>
      </div>

      <div className="result-sheet-paper">
        <div className="result-header">
          <div className="school-logo-placeholder">LOGO</div>
          <div className="school-info">
            <h1>{dummyResult.schoolName.toUpperCase()}</h1>
            <p>{dummyResult.schoolAddress}</p>
            <p>Motto: {dummyResult.schoolMotto}</p>
            <h2>STUDENT'S TERMINAL REPORT</h2>
          </div>
          <div className="student-photo-placeholder">PHOTO</div>
        </div>

        <div className="divider" />

        {/* Bio Data Section */}
        <div className="bio-data-grid">
          <div className="bio-item">
            <strong>Name:</strong> {dummyResult.studentName}
          </div>
          <div className="bio-item">
            <strong>Reg No:</strong> {dummyResult.registrationNumber}
          </div>
          <div className="bio-item">
            <strong>Class:</strong> {dummyResult.className}
          </div>
          <div className="bio-item">
            <strong>Parent:</strong> {dummyResult.parentName}
          </div>
          <div className="bio-item">
            <strong>Term:</strong> {dummyResult.term}
          </div>
          <div className="bio-item">
            <strong>Session:</strong> {dummyResult.session}
          </div>
          <div className="bio-item">
            <strong>Date Processed:</strong> {dummyResult.dateProcessed}
          </div>
        </div>

        {/* Scores Table */}
        <table className="result-table">
          <thead>
            <tr>
              <th>SUBJECTS</th>
              {isSecondary ? (
                <>
                  <th>
                    Total CA
                    <br />
                    (40)
                  </th>
                  <th>
                    Exam
                    <br />
                    (60)
                  </th>
                  <th>
                    Total
                    <br />
                    (100)
                  </th>
                </>
              ) : (
                <th>
                  Mark
                  <br />
                  (100)
                </th>
              )}
              <th>Grade</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {dummyResult.subjects.map((score, index) => (
              <tr key={index}>
                <td className="subject-name">{score.subjectName}</td>
                {isSecondary ? (
                  <>
                    <td>{Math.ceil(score.testScore)}</td>
                    <td>{Math.ceil(score.examScore)}</td>
                    <td>{Math.ceil(score.totalScore)}</td>
                  </>
                ) : (
                  <td>{Math.ceil(score.totalScore)}</td>
                )}
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
            <div className="att-row">
              <span>Days School Opened:</span> <span className="att-val">118</span>
            </div>
            <div className="att-row">
              <span>Days Present:</span>{' '}
              <span className="att-val">{dummyResult.daysStudentPresent}</span>
            </div>
            <div className="att-row">
              <span>Days Absent:</span>{' '}
              <span className="att-val">{118 - dummyResult.daysStudentPresent}</span>
            </div>
          </div>

          <div className="performance-box custom-box">
            <h4>PERFORMANCE SUMMARY</h4>
            <div className="att-row">
              <span>Grand Total:</span>{' '}
              <span className="att-val">{Math.ceil(dummyResult.grandTotal)}</span>
            </div>
            <div className="att-row">
              <span>Average:</span>{' '}
              <span className="att-val">{dummyResult.average.toFixed(1)}%</span>
            </div>
            {isSecondary ? (
              <div className="att-row">
                <span>Department/Percentage:</span>{' '}
                <span className="att-val">{Math.round(dummyResult.average)}%</span>
              </div>
            ) : (
              <div className="att-row">
                <span>Grade/Position:</span>{' '}
                <span className="att-val">Grade {dummyResult.averageGrade}</span>
              </div>
            )}
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="signatures-section custom-box">
          <div className="remark-row">
            <span className="remark-label">Class Teacher's Remark:</span>
            <span className="remark-text">{dummyResult.teacherComment}</span>
            <div className="signature-area">
              <span>_________________</span>
            </div>
          </div>

          <div className="remark-row">
            <span className="remark-label">Principal's Remark:</span>
            <span className="remark-text">{dummyResult.principalComment}</span>
            <div className="signature-area">
              <span>_________________</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <strong>Next Term Resumes:</strong>{' '}
          {new Date(dummyResult.resumptionDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ResultSample;
