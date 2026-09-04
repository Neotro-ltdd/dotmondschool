import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import '../SystemOperations.css';
import { useDialog } from '../../../../context/DialogContext';

interface TeacherItem {
  id: string;
  surname: string;
  firstName: string;
  role: string;
}

interface ClassItem {
  id: string;
  level: string;
  name: string;
  section: string;
}

interface SubjectItem {
  id: string;
  name: string;
  className: string;
}

export default function TeacherAssignment() {
  const { showAlert } = useDialog();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Class Assignment State
  const [classTeacherId, setClassTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [assigningClass, setAssigningClass] = useState(false);

  // Subject Assignment State
  const [subjectTeacherId, setSubjectTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [assigningSubject, setAssigningSubject] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tData, cData, sData] = await Promise.all([
        api.get('/setup/staff'),
        api.get('/setup/classes'),
        api.get('/academics/subjects'),
      ]);
      setTeachers(tData);
      setClasses(cData);
      setSubjects(sData);
    } catch (err: any) {
      console.error('Failed to load assignment data:', err);
    }
  };

  const handleManageClass = async (action: 'Assign' | 'Unassign') => {
    if (!classTeacherId || !classId) {
      showAlert('Please select both a class and a teacher.');
      return;
    }

    try {
      setAssigningClass(true);
      const res = await api.post(`/setup/staff/${classTeacherId}/manage-assignments`, {
        teacherId: classTeacherId,
        assignmentType: 'Class',
        targetId: classId,
        action: action,
      });
      showAlert(res.message || `Successfully ${action.toLowerCase()}ed class.`);
      if (action === 'Assign') {
        setClassTeacherId('');
        setClassId('');
      }
    } catch (err: any) {
      showAlert(err.message || `Failed to ${action.toLowerCase()} class.`);
    } finally {
      setAssigningClass(false);
    }
  };

  const handleManageSubject = async (action: 'Assign' | 'Unassign') => {
    if (!subjectTeacherId || !subjectId) {
      showAlert('Please select both a subject and a teacher.');
      return;
    }

    try {
      setAssigningSubject(true);
      const res = await api.post(`/setup/staff/${subjectTeacherId}/manage-assignments`, {
        teacherId: subjectTeacherId,
        assignmentType: 'Subject',
        targetId: subjectId,
        action: action,
      });
      showAlert(res.message || `Successfully ${action.toLowerCase()}ed subject.`);
      if (action === 'Assign') {
        setSubjectTeacherId('');
        setSubjectId('');
      }
    } catch (err: any) {
      showAlert(err.message || `Failed to ${action.toLowerCase()} subject.`);
    } finally {
      setAssigningSubject(false);
    }
  };

  return (
    <div className="operations-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teacher Assignment</h1>
          <p className="page-subtitle">Assign teachers to classes or specific subjects.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left Column: Class Assignment */}
        <div className="operations-card glass-panel">
          <h2>Class Assignment</h2>
          <p style={{ marginBottom: '1.5rem' }}>Map a Class Teacher to a specific class.</p>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Select Class</label>
            <select
              className="form-control"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">-- Choose a Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{`${c.level} ${c.name} ${c.section}`}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Select Class Teacher</label>
            <select
              className="form-control"
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
            >
              <option value="">-- Choose a Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{`${t.surname} ${t.firstName} (${t.role})`}</option>
              ))}
            </select>
          </div>

          <div className="action-row" style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleManageClass('Assign')}
              disabled={assigningClass}
            >
              {assigningClass ? 'Processing...' : 'Assign Class'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => handleManageClass('Unassign')}
              disabled={assigningClass}
              style={{ color: '#ff4136', borderColor: '#ff4136' }}
            >
              Unassign
            </button>
          </div>
        </div>

        {/* Right Column: Subject Assignment */}
        <div className="operations-card glass-panel">
          <h2>Subject Assignment</h2>
          <p style={{ marginBottom: '1.5rem' }}>Map a Subject Teacher to a specific subject.</p>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Select Subject</label>
            <select
              className="form-control"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">-- Choose a Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.className})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Select Subject Teacher</label>
            <select
              className="form-control"
              value={subjectTeacherId}
              onChange={(e) => setSubjectTeacherId(e.target.value)}
            >
              <option value="">-- Choose a Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{`${t.surname} ${t.firstName} (${t.role})`}</option>
              ))}
            </select>
          </div>

          <div className="action-row" style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleManageSubject('Assign')}
              disabled={assigningSubject}
            >
              {assigningSubject ? 'Processing...' : 'Assign Subject'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => handleManageSubject('Unassign')}
              disabled={assigningSubject}
              style={{ color: '#ff4136', borderColor: '#ff4136' }}
            >
              Unassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
