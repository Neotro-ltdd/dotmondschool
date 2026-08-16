import React, { useState, useEffect } from 'react';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { api } from '../../../services/api';
import { useDialog } from '../../../context/DialogContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  School, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import './TeacherAcademics.css';
import '../students/Students.css';

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
  const { showAlert } = useDialog();
  const { userRole } = useAuth();
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [templateType, setTemplateType] = useState<'broadsheet' | 'subject'>('broadsheet');
  const [scoreFile, setScoreFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isSuperUser = ['SuperAdmin', 'Superadmin', 'SystemAdmin', 'Director', 'Admin', 'Principal'].includes(userRole || '');

  // Helper: Detect if a class should use Full Class Broadsheet Mode (Nursery 1 to Primary 5 / Primary & Early Childhood)
  const isBroadsheetClass = (c: MyClass | null) => {
    if (!c) return false;
    const level = (c.level || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const combined = `${level} ${name}`;
    
    // Secondary classes (JSS 1 - SS 3) use single subject templates by default
    const isSecondary = combined.includes('jss') || 
                        combined.includes('ss 1') || combined.includes('ss 2') || combined.includes('ss 3') || 
                        combined.includes('ss1') || combined.includes('ss2') || combined.includes('ss3') ||
                        combined.includes('secondary') || combined.includes('senior') || combined.includes('junior secondary');

    if (isSecondary) return false;

    // Nursery 1 to Primary 5 and Nursery / Early Childhood always use Broadsheet Mode
    return true;
  };

  // 1. Fetch Classes Roster
  const fetchMyClasses = async () => {
    try {
      const myClassesResponse = await api.get('/academics/teacher/my-classes').catch(() => []);
      const myClasses: MyClass[] = myClassesResponse || [];

      if (myClasses.length > 0 && !isSuperUser) {
        setClasses(myClasses);
        const initialClass = myClasses[0];
        setSelectedClass(initialClass);
        setIsDeveloperMode(false);
        if (initialClass.mySubjects?.length > 0) {
          setSelectedSubjectId(initialClass.mySubjects[0].id);
        }
        setTemplateType(isBroadsheetClass(initialClass) ? 'broadsheet' : 'subject');
      } else {
        // Fallback for SuperAdmin / Admin / Unallocated: Fetch All System Classes & Subjects
        const allSystemClasses = await api.get('/setup/classes').catch(() => []);
        const allSubjectsResponse = await api.get('/setup/subjects').catch(() => []);
        const allSubjects: MySubject[] = (allSubjectsResponse || []).map((s: any) => ({ id: s.id, name: s.name }));

        const formattedClasses: MyClass[] = (allSystemClasses || []).map((c: any) => ({
          id: c.id,
          session: c.session || filterSession,
          level: c.level || 'Class',
          name: `${c.level || ''} ${c.name || ''}`.trim(),
          section: c.section || '',
          isClassTeacher: true,
          mySubjects: allSubjects
        }));

        setClasses(formattedClasses);
        setIsDeveloperMode(true);
        if (formattedClasses.length > 0) {
          const initialClass = formattedClasses[0];
          setSelectedClass(initialClass);
          if (allSubjects.length > 0) setSelectedSubjectId(allSubjects[0].id);
          setTemplateType(isBroadsheetClass(initialClass) ? 'broadsheet' : 'subject');
        }
      }
    } catch (error) {
      console.error('Failed to load classes', error);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, [userRole]);

  // Update Template Type default when Selected Class changes
  useEffect(() => {
    if (selectedClass) {
      setTemplateType(isBroadsheetClass(selectedClass) ? 'broadsheet' : 'subject');
    }
  }, [selectedClass]);

  // Handle Download Excel Template (Broadsheet or Single Subject)
  const handleDownloadTemplate = async () => {
    if (!selectedClass) return;

    try {
      setDownloading(true);
      if (templateType === 'broadsheet') {
        // Broadsheet Template for Full Class (All subjects in 1 sheet)
        const blob = await api.download(`/academics/scores/broadsheet/template?classId=${selectedClass.id}`);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Broadsheet_Template_${selectedClass.name.replace(/\s+/g, '_')}_${filterTerm.replace(/\s+/g, '_')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        showAlert('Full Class Broadsheet Excel template downloaded successfully!');
      } else {
        // Single Subject Score Template
        if (!selectedSubjectId) {
          showAlert('Please select a subject to download a single subject template.');
          return;
        }
        const blob = await api.download(`/academics/scores/template?classId=${selectedClass.id}&subjectId=${selectedSubjectId}&session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ScoreTemplate_${selectedClass.name.replace(/\s+/g, '_')}_${filterTerm.replace(/\s+/g, '_')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        showAlert('Single subject score template downloaded successfully!');
      }
    } catch (error: any) {
      showAlert(error.message || 'Failed to download score template.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle Upload Completed Excel Scores
  const handleUploadScores = async () => {
    if (!scoreFile || !selectedClass) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', scoreFile);

      if (templateType === 'broadsheet') {
        formData.append('classId', selectedClass.id);
        const response = await api.post('/academics/scores/broadsheet/upload', formData);
        showAlert(response?.message || 'Full Class Broadsheet scores uploaded and saved successfully!');
      } else {
        formData.append('session', filterSession);
        formData.append('term', filterTerm);
        formData.append('subjectId', selectedSubjectId);
        await api.post('/academics/scores/upload', formData);
        showAlert('Single subject scores uploaded and saved successfully!');
      }

      setScoreFile(null);
    } catch (error: any) {
      showAlert(error.response?.data?.message || error.message || 'Failed to upload score spreadsheet.');
    } finally {
      setUploading(false);
    }
  };

  const isPrimaryNursery = selectedClass ? isBroadsheetClass(selectedClass) : false;

  return (
    <div className="teacher-hub-page fade-in">
      
      {/* HERO BANNER & STATS */}
      <div className="ca-hero-banner">
        <h1 className="ca-hero-title">
          <span>📥</span> Offline Excel Utilities & Import Hub
        </h1>
        <p className="ca-hero-subtitle">
          Download pre-formatted Excel templates for offline mark entry, or bulk upload completed score spreadsheets directly into the system.
        </p>

        <div className="ca-stats-grid">
          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
              <School size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ fontSize: '1.2rem' }}>
                {selectedClass ? `${selectedClass.name} ${selectedClass.section}` : 'N/A'}
              </div>
              <div className="ca-stat-label">Active Class</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>
              <Layers size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ fontSize: '1.1rem', color: templateType === 'broadsheet' ? '#34D399' : '#60A5FA' }}>
                {templateType === 'broadsheet' ? 'Full Broadsheet' : 'Single Subject'}
              </div>
              <div className="ca-stat-label">Template Mode</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ fontSize: '1.1rem', color: selectedClass ? '#34D399' : '#9CA3AF' }}>
                {selectedClass ? 'Template Ready' : 'Select Class'}
              </div>
              <div className="ca-stat-label">Excel Export</div>
            </div>
          </div>

          <div className="ca-stat-card">
            <div className="ca-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <div className="ca-stat-value" style={{ fontSize: '1.1rem', color: scoreFile ? '#34D399' : '#9CA3AF' }}>
                {scoreFile ? 'File Attached' : 'No File Picked'}
              </div>
              <div className="ca-stat-label">Upload Readiness</div>
            </div>
          </div>
        </div>
      </div>

      {/* DEVELOPER SUPERADMIN OVERLAY BANNER */}
      {isDeveloperMode && (
        <div className="ca-dev-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="ca-dev-badge">Developer & Admin Mode</span>
            <span style={{ fontSize: '0.9rem', color: '#1E40AF', fontWeight: 500 }}>
              You are accessing offline Excel utilities as a System Admin / SuperAdmin. Select any class below to download templates or upload scores.
            </span>
          </div>
        </div>
      )}

      {/* SESSION & TERM SELECTION BAR */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ flex: 1, maxWidth: '240px' }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Academic Session
          </label>
          <select 
            value={filterSession} 
            onChange={(e) => setFilterSession(e.target.value)} 
            style={{
              width: '100%', padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
              fontWeight: '600', color: '#0F172A', background: '#F8FAFC'
            }}
          >
            {getSessionOptions(filterSession).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, maxWidth: '240px' }}>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '700', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Academic Term
          </label>
          <select 
            value={filterTerm} 
            onChange={(e) => setFilterTerm(e.target.value)} 
            style={{
              width: '100%', padding: '0.55rem 1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1',
              fontWeight: '600', color: '#0F172A', background: '#F8FAFC'
            }}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="teacher-hub-grid">
        
        {/* SIDEBAR PANEL: CLASS SELECTION */}
        <div className="sidebar-panel">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <School size={18} style={{ color: '#2563EB' }} /> Select Class
          </h3>

          {!classes || classes.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>No assigned classes found.</p>
          ) : (
            <div className="class-list">
              {classes.map(c => {
                const isPrimary = isBroadsheetClass(c);
                return (
                  <div 
                    key={c.id} 
                    className={`class-item ${selectedClass?.id === c.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedClass(c);
                      if (c.mySubjects?.length > 0) setSelectedSubjectId(c.mySubjects[0].id);
                      else setSelectedSubjectId('');
                    }}
                  >
                    <span className="class-name">{c.name} {c.section}</span>
                    <span className="class-meta">
                      {isPrimary ? '📋 Broadsheet Mode (Primary)' : c.isClassTeacher ? '⭐ Class Teacher' : `${c.mySubjects?.length || 0} Subjects`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MAIN PANEL: TEMPLATE DOWNLOAD & UPLOAD */}
        <div className="main-panel">
          {!selectedClass ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748B' }}>
              <School size={48} style={{ margin: '0 auto 1rem', color: '#CBD5E1' }} />
              <h3 style={{ color: '#0F172A', fontWeight: 800, marginBottom: '0.5rem' }}>Select a Class</h3>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Choose a class from the sidebar to perform Excel import and export operations.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* TEMPLATE MODE TOGGLE BAR */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: '#2563EB' }} />
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                    Template Format Mode:
                  </span>
                </div>

                <div className="view-mode-toggle">
                  <button 
                    type="button" 
                    className={`view-toggle-btn ${templateType === 'broadsheet' ? 'active' : ''}`}
                    onClick={() => setTemplateType('broadsheet')}
                  >
                    <Layers size={14} /> Full Class Broadsheet Template
                  </button>
                  <button 
                    type="button" 
                    className={`view-toggle-btn ${templateType === 'subject' ? 'active' : ''}`}
                    onClick={() => setTemplateType('subject')}
                  >
                    <FileText size={14} /> Single Subject Template
                  </button>
                </div>
              </div>

              {/* CARD 1: DOWNLOAD EXCEL TEMPLATE */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '0.5rem', borderRadius: '10px' }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                      {templateType === 'broadsheet' 
                        ? 'Full Class Broadsheet Template (All Subjects in 1 Sheet)'
                        : 'Single Subject Mark Sheet Template'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                      {templateType === 'broadsheet'
                        ? `One teacher handles all subjects for ${selectedClass.name}. Downloading this template generates a single Excel sheet containing columns for all subjects.`
                        : `Select your target subject below to generate and download a subject-specific Excel score template.`}
                    </p>
                  </div>
                </div>

                {/* PRIMARY / NURSERY BROADSHEET NOTICE */}
                {isPrimaryNursery && templateType === 'broadsheet' && (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    margin: '1.25rem 0',
                    color: '#065F46',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0, color: '#059669' }} />
                    <div>
                      <strong style={{ display: 'block' }}>Broadsheet Mode Active (Nursery 1 – Primary 5)</strong>
                      <span>The downloaded template includes columns for all subjects assigned to {selectedClass.name}. Fill it offline and upload it below.</span>
                    </div>
                  </div>
                )}

                {/* SINGLE SUBJECT CHIPS (Only shown when Single Subject Mode is active) */}
                {templateType === 'subject' && (
                  <div style={{ margin: '1.25rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Choose Subject Template
                    </label>
                    {!selectedClass.mySubjects || selectedClass.mySubjects.length === 0 ? (
                      <p style={{ color: '#991B1B', fontSize: '0.88rem', background: '#FEF2F2', padding: '0.75rem', borderRadius: '8px' }}>
                        No subjects available for this class.
                      </p>
                    ) : (
                      <div className="ca-subjects-chips">
                        {selectedClass.mySubjects.map(s => (
                          <button
                            type="button"
                            key={s.id}
                            className={`ca-subject-chip ${selectedSubjectId === s.id ? 'active' : ''}`}
                            onClick={() => setSelectedSubjectId(s.id)}
                          >
                            <BookOpen size={14} /> {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="btn-submit-scores" 
                  onClick={handleDownloadTemplate} 
                  disabled={(templateType === 'subject' && !selectedSubjectId) || downloading}
                >
                  <Download size={16} /> {downloading ? 'Generating Template...' : templateType === 'broadsheet' ? 'Download Full Broadsheet Template (.xlsx)' : 'Download Subject Template (.xlsx)'}
                </button>
              </div>

              {/* CARD 2: UPLOAD COMPLETED SCORES */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ background: '#ECFDF5', color: '#047857', padding: '0.5rem', borderRadius: '10px' }}>
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                      {templateType === 'broadsheet' ? 'Upload Completed Broadsheet Spreadsheet' : 'Upload Single Subject Scores Spreadsheet'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                      Upload your filled Excel (`.xlsx`) or CSV template here to update all scores for {selectedClass.name}.
                    </p>
                  </div>
                </div>

                {/* DROPZONE / FILE INPUT */}
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  margin: '1.25rem 0',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}>
                  <FileCode size={36} style={{ margin: '0 auto 0.75rem', color: '#94A3B8' }} />
                  <p style={{ fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem' }}>
                    {scoreFile ? scoreFile.name : 'Select or drag completed score spreadsheet here'}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem' }}>
                    Supported formats: `.xlsx`, `.xls`, `.csv`
                  </p>

                  <input 
                    type="file" 
                    id="excelFileInput"
                    accept=".xlsx, .xls, .csv" 
                    onChange={e => setScoreFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />

                  <label 
                    htmlFor="excelFileInput"
                    className="btn-save-draft"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    Browse Local File
                  </label>
                </div>

                <button 
                  className="btn-submit-scores" 
                  onClick={handleUploadScores} 
                  disabled={!scoreFile || uploading}
                  style={{ background: '#059669' }}
                >
                  <UploadCloud size={16} /> {uploading ? 'Processing & Saving Scores...' : 'Upload & Save Scores'}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
