import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  role: string;
}

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
  session: string;
  classTeacherName: string | null;
  classTeacherId?: string; // Add if API returns it, or we will just use it for mapping
}

export default function ClassAllocations() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [levelFilter, setLevelFilter] = useState('');

  // Modal State for assigning
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classData, teacherData] = await Promise.all([
        api.get('/setup/classes'),
        api.get('/setup/staff')
      ]);
      setClasses(classData);
      setTeachers(teacherData);
    } catch (err: any) {
      console.error("Failed to load class allocations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const levelOrder: Record<string, number> = {
    'Senior Secondary': 1,
    'Junior Secondary': 2,
    'Upper Primary': 3,
    'Lower Primary': 4,
    'Primary': 5,
    'Nursery 2': 6,
    'Nursery 1': 7,
    'Nursery': 8,
    'Kindergarten': 9
  };

  const sortedClasses = [...classes].sort((a, b) => {
    const levelA = levelOrder[a.level] || 99;
    const levelB = levelOrder[b.level] || 99;
    
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    
    if (numA !== numB) {
      if (['Senior Secondary', 'Junior Secondary', 'Upper Primary', 'Lower Primary', 'Primary', 'Nursery 2', 'Nursery 1', 'Nursery'].includes(a.level)) {
        return numB - numA; // Descending
      }
      return numA - numB; // Ascending
    }
    
    return (a.section || '').localeCompare(b.section || '');
  });

  const filteredClasses = levelFilter ? sortedClasses.filter(c => c.level === levelFilter) : sortedClasses;

  const openAssignModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    
    // Attempt to find the teacher ID by name since GetClasses currently returns classTeacherName
    const teacherMatch = teachers.find(t => `${t.firstName} ${t.surname}` === cls.classTeacherName);
    setSelectedTeacherId(teacherMatch ? teacherMatch.id : '');
    
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      await api.post(`/setup/classes/${selectedClass.id}/assign-teacher`, {
        classId: selectedClass.id,
        teacherId: selectedTeacherId || null
      });
      setShowModal(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Failed to assign class teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Allocations</h1>
          <p className="page-subtitle">Assign Class Teachers to specific classes.</p>
        </div>
        <div className="filters" style={{ display: 'flex', gap: '1rem' }}>
          <select className="form-control" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">-- All Levels --</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {loading ? (
          <p>Loading allocations...</p>
        ) : filteredClasses.length === 0 ? (
          <p className="empty-text">No classes found for this level.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Level</th>
                <th>Class Teacher</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.id}>
                  <td style={{ fontWeight: '500' }}>{cls.name}</td>
                  <td>{cls.level}</td>
                  <td>
                    {cls.classTeacherName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="avatar-small placeholder-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                          {cls.classTeacherName.charAt(0)}
                        </span>
                        {cls.classTeacherName}
                      </div>
                    ) : (
                      <span className="badge badge-warning">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => openAssignModal(cls)}
                    >
                      {cls.classTeacherName ? 'Change' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Assign Class Teacher</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Assigning a Class Teacher for <strong>{selectedClass.name}</strong>
            </p>
            <form onSubmit={handleAssign}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>Select Teacher</label>
                <select 
                  className="form-control" 
                  value={selectedTeacherId} 
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{`${t.firstName} ${t.surname}`}</option>
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
