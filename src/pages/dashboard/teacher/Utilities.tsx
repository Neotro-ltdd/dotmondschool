import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './TeacherAcademics.css';
import '../students/Management.css';

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

export default function Utilities() {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scoreFile, setScoreFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const handleDownloadTemplate = async () => {
    if (!selectedClass || !selectedSubjectId) return;
    try {
      const blob = await api.download(`/academics/scores/template?classId=${selectedClass.id}&subjectId=${selectedSubjectId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ScoreTemplate_${selectedClass.name}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error: any) {
      alert(error.message || 'Failed to download template.');
    }
  };

  const handleUploadScores = async () => {
    if (!scoreFile || !selectedClass) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', scoreFile);
      formData.append('session', filterSession);
      formData.append('term', filterTerm);
      formData.append('subjectId', selectedSubjectId);

      await api.post('/academics/scores/upload', formData);
      alert('Scores uploaded successfully!');
      setScoreFile(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to upload scores.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="teacher-hub-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilities</h1>
          <p className="page-subtitle">Bulk operations for uploading Test and Exam scores via CSV / Excel.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-light)', fontSize: '0.9rem' }}>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
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

        <div className="main-panel">
          {!selectedClass ? (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <h3>Select a class</h3>
              <p>Choose a class from the sidebar to perform bulk operations.</p>
            </div>
          ) : (
            <div className="fade-in">
              <div className="action-card" style={{ marginBottom: '1.5rem' }}>
                <h3>Hybrid Score Entry</h3>
                <p>Select your subject and download the Excel template. Fill it offline, then upload it back to securely save all student scores at once.</p>
                
                <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1rem' }}>
                  <label>Select Subject</label>
                  <select className="form-control" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                    <option value="">-- Choose Subject --</option>
                    {selectedClass.mySubjects?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="action-row">
                  <button className="btn btn-secondary" onClick={handleDownloadTemplate} disabled={!selectedSubjectId}>
                    ⬇️ Download Excel Template
                  </button>
                </div>
              </div>

              <div className="action-card">
                <h3>Upload Completed Scores</h3>
                <p>Upload your completed Excel or CSV template here to update all scores for the selected term and session.</p>
                <div className="action-row" style={{ marginTop: '1rem' }}>
                  <input type="file" accept=".xlsx, .xls, .csv" className="form-control" style={{ maxWidth: '300px' }} onChange={e => setScoreFile(e.target.files?.[0] || null)} />
                  <button className="btn btn-primary" onClick={handleUploadScores} disabled={!scoreFile || uploading}>
                    {uploading ? 'Uploading...' : '⬆️ Upload & Save Scores'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
