import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { getSessionOptions } from '../../../utils/sessionOptions';
import './ResultManagement.css';
import { useDialog } from '../../../context/DialogContext';
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  X, 
  Play, 
  Layers, 
  List, 
  LayoutGrid 
} from 'lucide-react';

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

interface SubjectStatus {
  subjectId: string;
  subjectName: string;
  isSubmitted: boolean;
  totalStudents: number;
  scoresEntered: number;
}

export default function ResultManagement() {
  const { showAlert, showConfirm } = useDialog();

  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'broadsheet'>('overview');
  const [compiling, setCompiling] = useState(false);
  const [uploadingBroadsheet, setUploadingBroadsheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [classStatus, setClassStatus] = useState<{ allSubmitted: boolean, subjects: SubjectStatus[] } | null>(null);

  // Slide-Over Drawer State
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    fetchActiveTerm();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStatus();
    } else {
      setClassStatus(null);
    }
  }, [selectedClassId, session, term]);

  const fetchActiveTerm = async () => {
    try {
      const data = await api.get('/setup/school-profile');
      if (data.currentSession) setSession(data.currentSession);
      if (data.currentTerm) setTerm(data.currentTerm);
    } catch (err) {
      console.error('Failed to load active term', err);
      if (!session) setSession(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
      if (!term) setTerm('First Term');
    }
  };

  const fetchClassStatus = async () => {
    if (!session || !term || !selectedClassId) return;
    try {
      setStatusLoading(true);
      const data = await api.get(`/academics/scores/status?classId=${selectedClassId}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`);
      setClassStatus(data);
    } catch (err) {
      console.error('Failed to fetch class status', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      
      const levelWeights: Record<string, number> = {
        'Senior Secondary': 1,
        'Junior Secondary': 2,
        'Upper Primary': 3,
        'Lower Primary': 4,
        'Middle Primary': 5,
        'Primary': 5,
        'Nursery 2': 6,
        'Nursery 1': 7,
        'Nursery': 8,
        'Kindergarten': 9
      };

      const sortedClasses = (data as ClassItem[]).sort((a, b) => {
        const weightA = levelWeights[a.level] || 99;
        const weightB = levelWeights[b.level] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      setClasses(sortedClasses);
      if (sortedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(sortedClasses[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const handleCompile = async () => {
    if (!selectedClassId) {
      showAlert('Please select a class to compute results for.');
      return;
    }
    
    try {
      setCompiling(true);
      await api.post('/academics/results/compile', { 
        classId: selectedClassId, 
        session, 
        term 
      });
      setShowDrawer(false);
      showAlert('Results computed successfully and sent to Admin for final approval!');
      fetchClassStatus();
    } catch (err: any) {
      showAlert(err.message || 'Failed to compute results.');
    } finally {
      setCompiling(false);
    }
  };

  const handleUnlockSubject = async (subjectId: string, subjectName: string) => {
    if (!await showConfirm(`Are you sure you want to unlock ${subjectName} scores? The teacher will be able to modify them again.`)) {
      return;
    }
    
    try {
      await api.post('/academics/scores/unlock-batch', {
        classId: selectedClassId,
        subjectId,
        session,
        term
      });
      showAlert(`${subjectName} scores have been unlocked successfully.`);
      fetchClassStatus();
    } catch (err: any) {
      showAlert(err.message || `Failed to unlock ${subjectName} scores.`);
    }
  };

  const handleLockSubject = async (subjectId: string, subjectName: string) => {
    if (!await showConfirm(`Are you sure you want to submit and lock ${subjectName} scores on behalf of the teacher?`)) {
      return;
    }
    
    try {
      await api.post('/academics/scores/submit-batch', {
        classId: selectedClassId,
        subjectId,
        session,
        term
      });
      showAlert(`${subjectName} scores have been submitted successfully.`);
      fetchClassStatus();
    } catch (err: any) {
      showAlert(err.message || `Failed to submit ${subjectName} scores.`);
    }
  };

  const handleDownloadBroadsheet = async () => {
    if (!selectedClassId) {
      showAlert('Please select a class first.');
      return;
    }
    
    try {
      showAlert('Generating broadsheet template... Please wait.');
      const blob = await api.download(`/academics/scores/broadsheet/template?classId=${selectedClassId}`);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Broadsheet_${selectedClass?.name || 'Class'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert(err.message || 'Failed to download broadsheet.');
    }
  };

  const handleUploadBroadsheet = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClassId) return;

    try {
      setUploadingBroadsheet(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', selectedClassId);

      const response = await api.post('/academics/scores/broadsheet/upload', formData);

      showAlert(response.message || 'Broadsheet uploaded successfully!');
      fetchClassStatus();
    } catch (err: any) {
      showAlert(err.message || 'Failed to upload broadsheet.');
    } finally {
      setUploadingBroadsheet(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const totalClasses = classes.length;
  const totalSubjectsCount = classStatus?.subjects.length || 0;
  const submittedSubjectsCount = classStatus?.subjects.filter(s => s.isSubmitted).length || 0;
  const isReadyForComputation = classStatus?.allSubmitted || false;

  return (
    <div className="result-page-container">
      {/* Page Header */}
      <div className="result-page-header">
        <div>
          <h1 className="result-page-title">Result Management</h1>
          <p className="result-page-subtitle">Command center for score readiness, broadsheet utilities, and end-of-term result computation</p>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="result-metrics-grid">
        <div className="result-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Total Classes</span>
            <span className="metric-number">{totalClasses}</span>
          </div>
          <div className="metric-icon-badge classes">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="result-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Active Session & Term</span>
            <span className="metric-number" style={{ fontSize: '1.25rem', marginTop: '0.4rem' }}>
              {session || '2025/2026'} - {term || 'First Term'}
            </span>
          </div>
          <div className="metric-icon-badge session">
            <Calendar size={24} />
          </div>
        </div>

        <div className="result-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Subject Readiness</span>
            <span className="metric-number">
              {submittedSubjectsCount} / {totalSubjectsCount}
            </span>
          </div>
          <div className="metric-icon-badge readiness">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="result-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">Computation Readiness</span>
            <span className="metric-number" style={{ fontSize: '1.1rem', marginTop: '0.4rem', color: isReadyForComputation ? '#047857' : '#B45309' }}>
              {isReadyForComputation ? '✅ Ready to Compute' : '⏳ Pending Scores'}
            </span>
          </div>
          <div className="metric-icon-badge status">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="result-controls-card">
        <div className="result-filter-group">
          {/* Session Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Academic Session</label>
            <select 
              className="select-filter-input"
              value={session} 
              onChange={(e) => setSession(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              {getSessionOptions(session).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Term Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Academic Term</label>
            <select 
              className="select-filter-input"
              value={term} 
              onChange={(e) => setTerm(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Class Select Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Select Class Room</label>
            <select 
              className="select-filter-input"
              value={selectedClassId} 
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- Choose Class Room --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{`${c.level} ${c.name} ${c.section || ''}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="view-mode-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
            title="Overview Panel"
          >
            <List size={16} /> Readiness Roster
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'broadsheet' ? 'active' : ''}`}
            onClick={() => setViewMode('broadsheet')}
            title="Broadsheet Utilities"
          >
            <FileSpreadsheet size={16} /> Excel Broadsheet
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="result-workspace-card">
        {selectedClass ? (
          <>
            <div className="workspace-header-bar">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                    {selectedClass.name} {selectedClass.section || ''} ({selectedClass.level})
                  </h2>
                  <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {session} - {term}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Monitor subject score submissions and trigger final result compilation.
                </p>
              </div>

              <button 
                className="btn-compute-main" 
                onClick={() => setShowDrawer(true)} 
                disabled={!selectedClassId}
              >
                <Play size={16} /> Compute Class Results
              </button>
            </div>

            {viewMode === 'overview' ? (
              /* SUBJECT READINESS ROSTER GRID */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>Subject Submission Status</h3>
                  {classStatus && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: classStatus.allSubmitted ? '#047857' : '#B45309' }}>
                      {classStatus.allSubmitted ? '✅ All Subject Scores Submitted' : '⚠️ Pending Subject Submissions'}
                    </span>
                  )}
                </div>

                {statusLoading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                    Loading subject readiness roster...
                  </div>
                ) : !classStatus || classStatus.subjects.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                    No configured subjects found for this class room.
                  </div>
                ) : (
                  <div className="subject-status-grid">
                    {classStatus.subjects.map(sub => (
                      <div 
                        key={sub.subjectId} 
                        className={`subject-status-card ${sub.isSubmitted ? 'submitted' : 'pending'}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{sub.subjectName}</h4>
                          <span style={{ fontSize: '1.1rem' }}>{sub.isSubmitted ? '✅' : '⏳'}</span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                          {sub.scoresEntered} of {sub.totalStudents} Scores Recorded
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sub.isSubmitted ? '#047857' : '#B45309' }}>
                            {sub.isSubmitted ? 'Submitted & Locked' : 'Scores Open'}
                          </span>

                          {sub.isSubmitted ? (
                            <button 
                              className="btn-lock-toggle"
                              onClick={() => handleUnlockSubject(sub.subjectId, sub.subjectName)}
                              title="Unlock scores for modification"
                            >
                              <Unlock size={13} color="#D97706" /> Unlock
                            </button>
                          ) : (
                            <button 
                              className="btn-lock-toggle"
                              onClick={() => handleLockSubject(sub.subjectId, sub.subjectName)}
                              title="Submit and lock scores on behalf of teacher"
                            >
                              <Lock size={13} color="#059669" /> Lock & Submit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* BROADSHEET EXCEL UTILITIES */
              <div className="broadsheet-utilities-card">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Master Broadsheet Excel Utilities</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
                    Download a comprehensive Excel master sheet to enter scores for all subjects simultaneously, then upload it. Highly recommended for Nursery and Primary classes managed by a single form teacher.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleDownloadBroadsheet}
                    disabled={!selectedClassId}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                  >
                    <Download size={16} /> Download Class Broadsheet (.xlsx)
                  </button>

                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept=".xlsx, .xls"
                      style={{ display: 'none' }}
                      onChange={handleUploadBroadsheet}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selectedClassId || uploadingBroadsheet}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                      <Upload size={16} /> {uploadingBroadsheet ? 'Uploading...' : 'Upload Completed Broadsheet'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            Please select a class room above to manage score readiness and result computation.
          </div>
        )}
      </div>

      {/* SLIDE-OVER DRAWER FORM FOR RESULT COMPUTATION */}
      {showDrawer && selectedClass && (
        <div className="result-slideover-backdrop" onClick={() => setShowDrawer(false)}>
          <div className="result-slideover-panel" onClick={(e) => e.stopPropagation()}>
            <div className="result-slideover-header">
              <div>
                <h2 className="result-slideover-title">Compute Class Results</h2>
                <p className="result-slideover-subtitle">Process final student positions and GPA grades for <strong>{selectedClass.name}</strong></p>
              </div>
              <button className="btn-close-slideover" onClick={() => setShowDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="result-slideover-body">
                {/* Summary Card */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{selectedClass.name} {selectedClass.section || ''}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {selectedClass.level}
                    </span>
                  </div>

                  <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748B' }}>
                    Target Session / Term: <strong>{session} - {term}</strong>
                  </div>
                </div>

                {/* Readiness Verification */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                    Subject Submission Verification
                  </label>
                  
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: '#475569' }}>Submitted Subjects:</span>
                      <strong style={{ color: '#0F172A' }}>{submittedSubjectsCount} of {totalSubjectsCount}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: '#475569' }}>Readiness Check:</span>
                      {isReadyForComputation ? (
                        <span style={{ color: '#047857', fontWeight: 700 }}>✅ All Subjects Verified</span>
                      ) : (
                        <span style={{ color: '#D97706', fontWeight: 700 }}>⚠️ Incomplete Scores</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Computing results will calculate student position ranks, average scores, and mark the class results as <strong>"Submitted to Admin for Approval"</strong>.</span>
                </div>
              </div>

              {/* Fixed Sticky Footer */}
              <div className="result-slideover-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDrawer(false)} disabled={compiling}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCompile} disabled={compiling}>
                  {compiling ? 'Processing...' : 'Compute & Submit Results'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
