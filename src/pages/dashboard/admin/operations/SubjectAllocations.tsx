import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  role: string;
}

interface SubjectItem {
  subjectId: string;
  subjectName: string;
  assignedTeacher: {
    teacherId: string;
    teacherName: string;
  } | null;
}

interface ClassAllocationItem {
  classId: string;
  className: string;
  level: string;
  subjects: SubjectItem[];
}

export default function SubjectAllocations() {
  const [allocations, setAllocations] = useState<ClassAllocationItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Modal State for assigning
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = levelFilter ? `?level=${encodeURIComponent(levelFilter)}` : '';
      const [allocData, teacherData] = await Promise.all([
        api.get(`/academics/subject-allocations${query}`),
        api.get('/setup/staff')
      ]);
      setAllocations(allocData);
      setTeachers(teacherData.filter((t: any) => t.role?.includes('Teacher')));
      
      // Auto-select first class if none selected or if level changes
      if (allocData.length > 0) {
        if (!selectedClassId || !allocData.find((c: any) => c.classId === selectedClassId)) {
          setSelectedClassId(allocData[0].classId);
        }
      } else {
        setSelectedClassId('');
      }
    } catch (err: any) {
      console.error("Failed to load subject allocations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [levelFilter]);

  const activeClass = allocations.find(c => c.classId === selectedClassId);
  const isPrimaryOrNursery = levelFilter.toLowerCase().includes('primary') || levelFilter.toLowerCase().includes('nursery') || levelFilter.toLowerCase().includes('kindergarten');

  const openAssignModal = (sub: SubjectItem) => {
    setSelectedSubject(sub);
    setSelectedTeacherId(sub.assignedTeacher?.teacherId || '');
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !selectedSubject) return;

    try {
      setSubmitting(true);
      await api.post('/academics/subject-allocations', {
        classId: activeClass.classId,
        subjectId: selectedSubject.subjectId,
        teacherId: selectedTeacherId || null
      });
      setShowModal(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to assign subject teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Allocations</h1>
          <p className="page-subtitle">Assign Subject Teachers to specific classes.</p>
        </div>
        <div className="filters" style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-control" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">-- Select Level --</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>

          {allocations.length > 0 && (
            <select className="form-control" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              {allocations.map(cls => (
                <option key={cls.classId} value={cls.classId}>{cls.className}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {loading ? (
          <p>Loading allocations...</p>
        ) : allocations.length === 0 ? (
          <p className="empty-text">Please select a level with configured classes.</p>
        ) : isPrimaryOrNursery ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👩‍🏫</span>
            <h2>Managed by Class Teacher</h2>
            <p className="text-muted" style={{ maxWidth: '500px', margin: '0 auto' }}>
              Because this is a Primary/Nursery class, the assigned <strong>Class Teacher</strong> automatically takes all subjects. You do not need to do any manual subject allocations here.
            </p>
          </div>
        ) : activeClass ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--primary-color)' }}>{activeClass.className} Roster</h2>
              <span className="badge badge-outline">{activeClass.subjects.length} Subjects configured</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assigned Teacher</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeClass.subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center' }}>No subjects found. Please configure subjects first.</td>
                  </tr>
                ) : activeClass.subjects.map(sub => (
                  <tr key={sub.subjectId}>
                    <td style={{ fontWeight: '500' }}>{sub.subjectName}</td>
                    <td>
                      {sub.assignedTeacher ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="avatar-small placeholder-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                            {sub.assignedTeacher.teacherName.charAt(0)}
                          </span>
                          {sub.assignedTeacher.teacherName}
                        </div>
                      ) : (
                        <span className="badge badge-warning">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => openAssignModal(sub)}
                      >
                        {sub.assignedTeacher ? 'Change' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>

      {showModal && activeClass && selectedSubject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Assign Teacher</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Assigning for <strong>{selectedSubject.subjectName}</strong> in <strong>{activeClass.className}</strong>
            </p>
            <form onSubmit={handleAssign}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Select Subject Teacher</label>
                <select 
                  className="form-control" 
                  value={selectedTeacherId} 
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{`${t.surname} ${t.firstName}`}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
