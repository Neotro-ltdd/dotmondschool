import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../admin/SystemOperations.css';
import { useDialog } from '../../../context/DialogContext';


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
  const [compiling, setCompiling] = useState(false);
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [classStatus, setClassStatus] = useState<{ allSubmitted: boolean, subjects: SubjectStatus[] } | null>(null);

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
      // Fallback
      if (!session) setSession(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
      if (!term) setTerm('First Term');
    }
  };

  const fetchClassStatus = async () => {
    if (!session || !term) return; // Wait until defaults are loaded
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
      
      // Sort classes chronologically by level, then by name
      const levelWeights: Record<string, number> = {
        'Nursery': 1,
        'Nursery 1': 2,
        'Nursery 2': 3,
        'Kindergarten': 4,
        'Lower Primary': 5,
        'Primary': 6,
        'Middle Primary': 7,
        'Upper Primary': 8,
        'Junior Secondary': 9,
        'Senior Secondary': 10
      };

      const sortedClasses = (data as ClassItem[]).sort((a, b) => {
        const weightA = levelWeights[a.level] || 99;
        const weightB = levelWeights[b.level] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.name.localeCompare(b.name);
      });

      setClasses(sortedClasses);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const handleCompile = async () => {
    if (!selectedClassId) {
      showAlert('Please select a class to compute results for.');
      return;
    }
    
    if (!await showConfirm('Are you sure you want to compute final results for this class? This will overwrite any currently compiled but unapproved results.')) {
      return;
    }

    try {
      setCompiling(true);
      await api.post('/academics/results/compile', { 
        classId: selectedClassId, 
        session, 
        term 
      });
      showAlert('Results computed successfully and sent to Admin for approval!');
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

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Result Management</h1>
          <p className="page-subtitle">Administer and compute end-of-term results for classes.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={session} onChange={(e) => setSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="operations-card glass-panel">
          <h2>Compute Class Results</h2>
          <p>
            Trigger the computation of final grades for a specific class. This is usually done by the Class Teacher, 
            but an Administrator can manually trigger it here if all subject teachers have submitted their scores.
          </p>
          
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Class</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="form-control" 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.level} {c.name} {c.section}</option>
                ))}
              </select>
              <button 
                className="btn btn-primary" 
                onClick={handleCompile} 
                disabled={compiling || !selectedClassId}
              >
                {compiling ? 'Computing...' : 'Compute Results'}
              </button>
            </div>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
              Requires all subjects to be submitted. Results will be marked as "Submitted to Admin".
            </small>
          </div>

          {statusLoading && <p style={{ marginTop: '1rem' }}>Loading subject status...</p>}
          
          {!statusLoading && classStatus && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Subject Submission Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {classStatus.subjects.map(sub => (
                  <div key={sub.subjectId} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: `1px solid ${sub.isSubmitted ? '#10b981' : '#e2e8f0'}`,
                    backgroundColor: sub.isSubmitted ? 'rgba(16, 185, 129, 0.05)' : '#fff',
                    color: sub.isSubmitted ? 'inherit' : '#333'
                  }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {sub.subjectName}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>{sub.isSubmitted ? '✅' : '⏳'}</span>
                        {sub.isSubmitted && (
                          <button 
                            onClick={() => handleUnlockSubject(sub.subjectId, sub.subjectName)}
                            title="Unlock scores for modification"
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer', 
                              fontSize: '1.1rem', padding: '0 4px' 
                            }}>
                            🔓
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
                      {sub.scoresEntered} / {sub.totalStudents} Scores
                    </div>
                  </div>
                ))}
              </div>

              {!classStatus.allSubmitted && (
                <div className="alert alert-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                  ⚠️ Not all subject scores have been submitted yet. 
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
