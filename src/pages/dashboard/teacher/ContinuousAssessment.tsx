import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './TeacherAcademics.css';
import '../students/Management.css';
import { useDialog } from '../../../context/DialogContext';


interface MySubject {
  id: string;
  name: string;
}

interface MyClass {
  id: string;
  session: string;
  level: string;
  name: string;
  section: string;
  isClassTeacher: boolean;
  mySubjects: MySubject[];
}

interface ScoreRecord {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  scoreId?: string;
  caData: {
    "First Test": number | null;
    "Second Test": number | null;
  } | null;
  caTotal: number | null;
  exam: number | null;
  total: number | null;
  isSubmitted: boolean;
}

interface SubjectStatus {
  subjectId: string;
  subjectName: string;
  isSubmitted: boolean;
  scoresEntered: number;
  totalStudents: number;
}

export default function ContinuousAssessment() {
  const { showAlert } = useDialog();

  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [activeTab, setActiveTab] = useState<'ca' | 'exam' | 'compile'>('ca');
  
  // Tab 1 & 2 State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [lockingScores, setLockingScores] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compile State
  const [statusLoading, setStatusLoading] = useState(false);
  const [classStatus, setClassStatus] = useState<{ allSubmitted: boolean, subjects: SubjectStatus[] } | null>(null);
  const [compiling, setCompiling] = useState(false);

  // Term Setup
  const [termSetup, setTermSetup] = useState<{ caWeightFirst: number, caWeightSecond: number, examWeight: number } | null>(null);

  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  const fetchMyClasses = async () => {
    try {
      const data = await api.get('/academics/teacher/my-classes');
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0]);
        if (data[0].mySubjects?.length > 0) {
          setSelectedSubjectId(data[0].mySubjects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load classes', error);
    }
  };

  const fetchScores = async () => {
    try {
      setLoadingScores(true);
      const data = await api.get(`/academics/scores/subject?classId=${selectedClass!.id}&subjectId=${selectedSubjectId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      setScores(data || []);
    } catch (err) {
      console.error('Failed to fetch scores', err);
    } finally {
      setLoadingScores(false);
    }
  };

  const fetchClassStatus = async () => {
    try {
      setStatusLoading(true);
      const data = await api.get(`/academics/scores/status?classId=${selectedClass!.id}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      setClassStatus(data);
    } catch (err) {
      console.error('Failed to fetch class status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubjectId && (activeTab === 'ca' || activeTab === 'exam')) {
      fetchScores();
    }
  }, [selectedClass, selectedSubjectId, filterSession, filterTerm, activeTab]);

  useEffect(() => {
    if (filterSession && filterTerm) {
      api.get(`/setup/terms?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`)
        .then(data => setTermSetup(data))
        .catch(err => console.error('Failed to load term setup', err));
    }
  }, [filterSession, filterTerm]);

  useEffect(() => {
    if (selectedClass && activeTab === 'compile') {
      fetchClassStatus();
    }
  }, [selectedClass, filterSession, filterTerm, activeTab]);

  const handleScoreChange = (studentId: string, field: string, valueStr: string) => {
    setScores(prev => prev.map(s => {
      if (s.studentId !== studentId) return s;
      
      const newScore = { ...s };
      const value = valueStr === '' ? null : parseFloat(valueStr);
      
      if (field === 'exam') {
        const isNurseryPrimary = selectedClass && (
          selectedClass.level.toLowerCase().includes('nursery') ||
          selectedClass.level.toLowerCase().includes('kindergarten') ||
          selectedClass.level.toLowerCase().includes('primary')
        );
        const maxExam = isNurseryPrimary ? 100 : (termSetup?.examWeight ?? 60);
        newScore.exam = value !== null && value > maxExam ? maxExam : value;
      } else {
        const prevCaData = newScore.caData || { "First Test": null, "Second Test": null };
        const updatedCaData = { ...prevCaData, [field]: value } as { "First Test": number | null; "Second Test": number | null };
        newScore.caData = updatedCaData;
        
        const maxFirst = termSetup?.caWeightFirst ?? 20;
        const maxSecond = termSetup?.caWeightSecond ?? 20;

        // Enforce max limits
        if (field === 'First Test' && newScore.caData["First Test"] !== null && newScore.caData["First Test"]! > maxFirst) newScore.caData["First Test"] = maxFirst;
        if (field === 'Second Test' && newScore.caData["Second Test"] !== null && newScore.caData["Second Test"]! > maxSecond) newScore.caData["Second Test"] = maxSecond;
        
        const first = newScore.caData["First Test"] || 0;
        const second = newScore.caData["Second Test"] || 0;
        
        newScore.caTotal = (newScore.caData["First Test"] === null && newScore.caData["Second Test"] === null) 
                            ? null 
                            : (first + second);
      }
      
      if (newScore.caTotal === null && newScore.exam === null) {
          newScore.total = null;
      } else {
          newScore.total = (newScore.caTotal || 0) + (newScore.exam || 0);
      }
      
      return newScore;
    }));
  };

  const handleSaveScores = async () => {
    try {
      setSavingScores(true);
      const promises = scores.filter(s => !s.isSubmitted).map(s => {
        // Only send if not completely null
        const isCompletelyNull = s.exam === null && (!s.caData || (s.caData["First Test"] === null && s.caData["Second Test"] === null));
        return api.post('/academics/scores', {
          studentId: s.studentId,
          subjectId: selectedSubjectId,
          session: filterSession,
          term: filterTerm,
          caData: isCompletelyNull ? null : (s.caData || { "First Test": 0, "Second Test": 0 }),
          exam: isCompletelyNull ? null : (s.exam || 0)
        });
      });
      await Promise.all(promises);
      showAlert('Scores saved successfully!');
      fetchScores();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save scores.');
    } finally {
      setSavingScores(false);
    }
  };

  const handleLockScores = () => {
    setShowConfirmModal(true);
  };

  const confirmLockScores = async () => {
    setShowConfirmModal(false);
    try {
      setLockingScores(true);
      
      // Auto-save scores before locking to ensure no data is lost
      const savePromises = scores.filter(s => !s.isSubmitted).map(s => {
        const isCompletelyNull = s.exam === null && (!s.caData || (s.caData["First Test"] === null && s.caData["Second Test"] === null));
        return api.post('/academics/scores', {
          studentId: s.studentId,
          subjectId: selectedSubjectId,
          session: filterSession,
          term: filterTerm,
          caData: isCompletelyNull ? null : (s.caData || { "First Test": 0, "Second Test": 0 }),
          exam: isCompletelyNull ? null : (s.exam || 0)
        });
      });
      await Promise.all(savePromises);

      // Now lock the scores
      await api.post('/academics/scores/submit-batch', {
        classId: selectedClass!.id,
        subjectId: selectedSubjectId,
        session: filterSession,
        term: filterTerm
      });
      showAlert('Scores saved and submitted successfully!');
      fetchScores();
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || 'Failed to lock scores.');
    } finally {
      setLockingScores(false);
    }
  };

  const handleCompile = async () => {
    if (!selectedClass) return;
    try {
      setCompiling(true);
      await api.post('/academics/results/compile', {
        session: filterSession,
        term: filterTerm,
        classId: selectedClass.id
      });
      showAlert('Results compiled successfully and sent to Admin for approval!');
      fetchClassStatus();
      window.location.href = '/dashboard/teacher/results';
    } catch (error: any) {
      showAlert(error.response?.data?.message || error.message || 'Failed to compile results.');
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="teacher-hub-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Continuous Assessment</h1>
          <p className="page-subtitle">Enter student scores, review submissions, and compile final results.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-light)', fontSize: '0.9rem' }}>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            {getSessionOptions(filterSession).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-light)', fontSize: '0.9rem' }}>Term:</label>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      <div className="teacher-hub-grid">
        {/* Sidebar: My Classes */}
        <div className="sidebar-panel">
          <h3 style={{ marginBottom: '1rem' }}>Select Class</h3>
          {!classes || classes.length === 0 ? (
            <p className="text-muted">You have no assigned classes.</p>
          ) : (
            <div className="class-list">
              {classes.map(c => (
                <div 
                  key={c.id} 
                  className={`class-item ${selectedClass?.id === c.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedClass(c);
                    if (c.mySubjects.length > 0) setSelectedSubjectId(c.mySubjects[0].id);
                    else setSelectedSubjectId('');
                  }}
                >
                  <span className="class-name">{c.name} {c.section}</span>
                  <span className="class-meta">
                    {c.isClassTeacher ? '⭐ Class Teacher' : `${c.mySubjects?.length || 0} Subjects`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="main-panel">
          {!selectedClass ? (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <h3>Select a class</h3>
              <p>Choose a class from the sidebar to manage its assessments.</p>
            </div>
          ) : (
            <>
              {(() => {
                const isNurseryPrimary = selectedClass && (
                  selectedClass.level.toLowerCase().includes('nursery') ||
                  selectedClass.level.toLowerCase().includes('kindergarten') ||
                  selectedClass.level.toLowerCase().includes('primary')
                );
                
                // Force activeTab to 'exam' if it was 'ca' but we are on a primary class
                if (isNurseryPrimary && activeTab === 'ca') {
                  setTimeout(() => setActiveTab('exam'), 0);
                }

                return (
                  <div className="tabs-container">
                    {!isNurseryPrimary && (
                      <button className={`tab-btn ${activeTab === 'ca' ? 'active' : ''}`} onClick={() => setActiveTab('ca')}>CA Scores</button>
                    )}
                    <button className={`tab-btn ${activeTab === 'exam' ? 'active' : ''}`} onClick={() => setActiveTab('exam')}>
                      {isNurseryPrimary ? 'Exam / Total Scores' : 'Exam Scores'}
                    </button>
                    <button className={`tab-btn ${activeTab === 'compile' ? 'active' : ''}`} onClick={() => setActiveTab('compile')}>Review & Compute</button>
                  </div>
                );
              })()}

              {/* CA SCORES TAB */}
              {activeTab === 'ca' && (
                <div className="tab-content fade-in">
                  <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1rem' }}>
                    <label>Select Subject</label>
                    <select className="form-control" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                      <option value="">-- Choose Subject --</option>
                      {selectedClass.mySubjects?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {loadingScores ? (
                    <p>Loading students...</p>
                  ) : !selectedSubjectId ? (
                    <p>Please select a subject to enter CA scores.</p>
                  ) : scores.length === 0 ? (
                    <p>No students found in this class.</p>
                  ) : (
                    <div className="action-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th style={{ width: '120px' }}>1st Test ({termSetup?.caWeightFirst ?? 20})</th>
                            <th style={{ width: '120px' }}>2nd Test ({termSetup?.caWeightSecond ?? 20})</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Total CA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map(score => {
                            const isLocked = score.isSubmitted;
                            return (
                              <tr key={score.studentId}>
                                <td>
                                  <strong>{score.studentName}</strong>
                                  <div className="text-sm text-muted">{score.registrationNumber}</div>
                                  {isLocked && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Submitted</span>}
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ width: '100%', padding: '0.3rem' }}
                                    min="0" max={termSetup?.caWeightFirst ?? 20} 
                                    value={score.caData?.["First Test"] ?? ''}
                                    disabled={isLocked}
                                    onChange={e => handleScoreChange(score.studentId, 'First Test', e.target.value)} 
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ width: '100%', padding: '0.3rem' }}
                                    min="0" max={termSetup?.caWeightSecond ?? 20} 
                                    value={score.caData?.["Second Test"] ?? ''}
                                    disabled={isLocked}
                                    onChange={e => handleScoreChange(score.studentId, 'Second Test', e.target.value)} 
                                  />
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  {score.caTotal} / {(termSetup?.caWeightFirst ?? 20) + (termSetup?.caWeightSecond ?? 20)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="action-row" style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={handleSaveScores} disabled={savingScores || scores.every(s => s.isSubmitted)}>
                          {savingScores ? 'Saving...' : '💾 Save Draft'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXAM SCORES TAB */}
              {activeTab === 'exam' && (
                <div className="tab-content fade-in">
                  <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1rem' }}>
                    <label>Select Subject</label>
                    <select className="form-control" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                      <option value="">-- Choose Subject --</option>
                      {selectedClass.mySubjects?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {loadingScores ? (
                    <p>Loading students...</p>
                  ) : !selectedSubjectId ? (
                    <p>Please select a subject to enter Exam scores.</p>
                  ) : scores.length === 0 ? (
                    <p>No students found in this class.</p>
                  ) : (
                    <div className="action-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Total CA</th>
                            {(() => {
                              const isNurseryPrimary = selectedClass && (
                                selectedClass.level.toLowerCase().includes('nursery') ||
                                selectedClass.level.toLowerCase().includes('kindergarten') ||
                                selectedClass.level.toLowerCase().includes('primary')
                              );
                              return (
                                <th style={{ width: '150px' }}>
                                  {isNurseryPrimary ? 'Total Score (100)' : `Exam Score (${termSetup?.examWeight ?? 60})`}
                                </th>
                              );
                            })()}
                            <th style={{ width: '100px', textAlign: 'center' }}>Total Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map(score => {
                            const isLocked = score.isSubmitted;
                            return (
                              <tr key={score.studentId}>
                                <td>
                                  <strong>{score.studentName}</strong>
                                  <div className="text-sm text-muted">{score.registrationNumber}</div>
                                  {isLocked && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Submitted</span>}
                                </td>
                                <td style={{ textAlign: 'center' }}>{score.caTotal} / {(termSetup?.caWeightFirst ?? 20) + (termSetup?.caWeightSecond ?? 20)}</td>
                                <td>
                                  {(() => {
                                    const isNurseryPrimary = selectedClass && (
                                      selectedClass.level.toLowerCase().includes('nursery') ||
                                      selectedClass.level.toLowerCase().includes('kindergarten') ||
                                      selectedClass.level.toLowerCase().includes('primary')
                                    );
                                    return (
                                      <input 
                                        type="number" 
                                        className="form-control" 
                                        style={{ width: '100%', padding: '0.3rem' }}
                                        min="0" max={isNurseryPrimary ? 100 : (termSetup?.examWeight ?? 60)} 
                                        value={score.exam ?? ''}
                                        disabled={isLocked}
                                        onChange={e => handleScoreChange(score.studentId, 'exam', e.target.value)} 
                                      />
                                    );
                                  })()}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  {score.total} / 100
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="action-row" style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={handleSaveScores} disabled={savingScores || scores.every(s => s.isSubmitted)}>
                          {savingScores ? 'Saving...' : '💾 Save Draft'}
                        </button>
                        <button className="btn btn-primary" onClick={handleLockScores} disabled={lockingScores || scores.every(s => s.isSubmitted)}>
                          {lockingScores ? 'Submitting...' : '🔒 Submit Scores'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEW AND COMPUTE TAB */}
              {activeTab === 'compile' && (
                <div className="tab-content fade-in">
                  <div className="action-card" style={{ border: '1px solid var(--primary)' }}>
                    <h3 style={{ color: 'var(--primary)' }}>Final Result Compilation</h3>
                    <p>Review the submission status of all subjects for <strong>{selectedClass.name}</strong>. You can only compile the final results once every subject has been submitted.</p>
                    
                    {!selectedClass.isClassTeacher ? (
                      <div className="alert alert-warning" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                        ⚠️ Only the designated Class Teacher for <strong>{selectedClass.name}</strong> can compile final results.
                      </div>
                    ) : statusLoading ? (
                      <p>Loading subject status...</p>
                    ) : classStatus ? (
                      <>
                        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                          <h4 style={{ marginBottom: '0.5rem' }}>Subject Status Checklist</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {classStatus.subjects.map(sub => (
                              <div key={sub.subjectId} style={{ 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: `1px solid ${sub.isSubmitted ? '#10b981' : '#e2e8f0'}`,
                                backgroundColor: sub.isSubmitted ? 'rgba(16, 185, 129, 0.05)' : '#fff'
                              }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                  {sub.subjectName}
                                  <span>{sub.isSubmitted ? '✅' : '⏳'}</span>
                                </div>
                                <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
                                  {sub.scoresEntered} / {sub.totalStudents} Scores
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {!classStatus.allSubmitted ? (
                          <div className="alert alert-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px' }}>
                            ⚠️ Not all subject scores have been submitted yet. Please remind the relevant subject teachers to lock their scores.
                          </div>
                        ) : (
                          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={handleCompile} disabled={compiling}>
                              {compiling ? 'Compiling...' : `📊 Compute Results for ${selectedClass.name}`}
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Custom Styled Confirm Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%' }}>
                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Confirm Submission</h3>
            </div>
            
            <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Are you sure you want to <strong>submit</strong> these scores?
              <br /><br />
              <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9rem' }}>
                Existing scores will be locked
              </span> from editing, but you can still add scores later for students who missed the exam.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLockScores}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none',
                  background: '#2563eb', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
              >
                Yes, Submit Scores
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
