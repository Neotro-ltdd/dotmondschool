import React, { useState, useEffect, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import './VendorHub.css';
import { useDialog } from '../../../context/DialogContext';


interface Student {
  id: string;
  surname: string;
  firstName: string;
  otherNames: string;
  registrationNumber: string;
  passportUrl: string | null;
  className: string;
  isIdCardPrinted: boolean;
}

interface VendorStats {
  totalStudents: number;
  printedCards: number;
  pendingCards: number;
}

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
}

const formatVendorStudentName = (surname?: string, firstName?: string, otherNames?: string) => {
  const s = (surname || '').trim().toUpperCase();
  const f = (firstName || '').trim().toUpperCase();
  if (!s && !f) return 'STUDENT';
  if (!f) return s;
  if (!s) return f;

  if (!otherNames || !otherNames.trim()) {
    return `${s}, ${f}`;
  }

  const otherParts = otherNames.trim().split(/\s+/).filter(Boolean);
  const abbreviatedOthers = otherParts.map(p => {
    if (p.length <= 2 && p.endsWith('.')) return p.toUpperCase();
    return `${p[0].toUpperCase()}.`;
  }).join(' ');

  return `${s}, ${f} ${abbreviatedOthers}`.trim();
};

export default function VendorHub() {
  const { showAlert } = useDialog();

  const { schoolName, logoUrl } = useTenant();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VendorStats | null>(null);
  
  const [selectedStudentsToPrint, setSelectedStudentsToPrint] = useState<Student[]>([]);
  const [checkedStudentIds, setCheckedStudentIds] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/setup/students/vendor/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const handleFetchStudents = async () => {
    if (!selectedClassId) {
      showAlert("Please select a class first.");
      return;
    }

    try {
      setLoading(true);
      // Calls the restricted vendor endpoint
      const data = await api.get(`/setup/students/vendor?classId=${selectedClassId}`);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
      showAlert("Error loading students for this class.");
    } finally {
      setLoading(false);
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Student_ID_Cards',
    onAfterPrint: async () => {
      // Mark as printed
      try {
        const studentIds = selectedStudentsToPrint.map(s => s.id);
        await api.post('/setup/students/vendor/mark-printed', { studentIds });
        
        // Refresh data
        fetchStats();
        if (selectedClassId) {
          handleFetchStudents();
        }
      } catch (err) {
        console.error('Failed to mark cards as printed', err);
      }

      setSelectedStudentsToPrint([]);
      setIsPrinting(false);
      setCheckedStudentIds(new Set());
    }
  });

  useEffect(() => {
    if (isPrinting && selectedStudentsToPrint.length > 0) {
      // Small timeout to allow the DOM to update with the selected students' cards before printing
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, selectedStudentsToPrint, handlePrint]);

  const handlePrintSingle = (student: Student) => {
    setSelectedStudentsToPrint([student]);
    setIsPrinting(true);
  };

  const handlePrintChecked = () => {
    const toPrint = students.filter(s => checkedStudentIds.has(s.id));
    if (toPrint.length === 0) {
      showAlert("Please check at least one student to print.");
      return;
    }
    setSelectedStudentsToPrint(toPrint);
    setIsPrinting(true);
  };

  const handlePrintAll = () => {
    setSelectedStudentsToPrint(students);
    setIsPrinting(true);
  };

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedStudentIds);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedStudentIds(newChecked);
  };

  const toggleCheckAll = () => {
    if (checkedStudentIds.size === students.length) {
      setCheckedStudentIds(new Set());
    } else {
      setCheckedStudentIds(new Set(students.map(s => s.id)));
    }
  };

  return (
    <div className="vendor-hub-page">
      <div className="no-print">
        <div className="page-header">
          <div>
            <h1 className="page-title">Vendor Printing Hub</h1>
            <p className="page-subtitle">Securely print student ID cards and track printing status.</p>
          </div>
        </div>

        {stats && (
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Students</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#f8fafc' }}>{stats.totalStudents}</span>
            </div>
            <div className="stat-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '0.5rem' }}>Printed ID Cards</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.printedCards}</span>
            </div>
            <div className="stat-card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '0.5rem' }}>Pending ID Cards</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingCards}</span>
            </div>
          </div>
        )}

        <div className="glass-panel filter-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Select Class to Print</label>
              <select 
                className="form-control" 
                value={selectedClassId} 
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setStudents([]);
                  setCheckedStudentIds(new Set());
                }}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{`${c.level} ${c.name} ${c.section}`}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleFetchStudents} disabled={loading}>
              {loading ? 'Loading...' : 'Load Students'}
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: 0 }}>Student List</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handlePrintChecked} 
                disabled={checkedStudentIds.size === 0 || isPrinting}
                style={{ backgroundColor: checkedStudentIds.size > 0 ? '#0ea5e9' : '', color: checkedStudentIds.size > 0 ? 'white' : '' }}
              >
                🖨️ Print Selected ({checkedStudentIds.size})
              </button>
              <button className="btn btn-primary" onClick={handlePrintAll} disabled={isPrinting} style={{ backgroundColor: '#10b981' }}>
                🖨️ Print All ({students.length})
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={checkedStudentIds.size === students.length && students.length > 0}
                      onChange={toggleCheckAll}
                    />
                  </th>
                  <th>Passport</th>
                  <th>Registration No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={checkedStudentIds.has(student.id)}
                        onChange={() => toggleCheck(student.id)}
                      />
                    </td>
                    <td>
                      {student.passportUrl ? (
                        <img src={student.passportUrl.startsWith('/') ? `${API_ROOT}${student.passportUrl}` : student.passportUrl} alt="passport" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>N/A</div>
                      )}
                    </td>
                    <td>{student.registrationNumber}</td>
                    <td>{student.surname.toUpperCase()} {student.firstName.toUpperCase()} {student.otherNames}</td>
                    <td>
                      {student.isIdCardPrinted ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Printed</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => handlePrintSingle(student)}
                        disabled={isPrinting}
                      >
                        Print Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden printable area */}
      <div style={{ display: 'none' }}>
        <div className="id-cards-grid print-section" ref={printRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', padding: '2rem' }}>
          {selectedStudentsToPrint.map(student => (
            <React.Fragment key={student.id}>
              {/* FRONT OF CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark">
                    <div className="header-content">
                      {logoUrl ? (
                        <img src={logoUrl.startsWith('/') ? `${API_ROOT}${logoUrl}` : logoUrl} alt="Logo" className="card-logo" />
                      ) : (
                        <div className="card-logo-placeholder"></div>
                      )}
                      <div className="header-text">
                        <div className="school-title">{schoolName.toUpperCase()}</div>
                        <div className="school-subtitle">Lekki, Lagos, Nigeria</div>
                        <div className="school-motto">"EXCELLENCE & GROWTH"</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="student-badge-label">
                      <span>STUDENT ID</span>
                    </div>
                    
                    <div className="photo-container">
                      {student.passportUrl ? (
                        <img src={student.passportUrl.startsWith('/') ? `${API_ROOT}${student.passportUrl}` : student.passportUrl} alt="Student" className="student-photo" />
                      ) : (
                        <div className="student-photo placeholder">NO PHOTO</div>
                      )}
                    </div>
                    
                    <div className="student-name">
                      {formatVendorStudentName(student.surname, student.firstName, student.otherNames)}
                    </div>
                    
                    <div className="student-details-grid">
                      <div className="detail-label">ADMISSION</div>
                      <div className="detail-value">{student.registrationNumber}</div>
                      
                      <div className="detail-label">SECTION</div>
                      <div className="detail-value">{student.className}</div>
                    </div>
                  </div>
                  
                  <div className="card-footer-dark">
                    <div className="footer-left">VALID</div>
                    <div className="footer-right">2026 — 2029</div>
                  </div>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark center-text">
                    <div className="back-title">ATTENDANCE SYSTEM</div>
                    <div className="back-subtitle">{schoolName} · Lekki, Lagos</div>
                  </div>
                  
                  <div className="card-body back-body">
                    <div className="back-heading">
                      {schoolName.toUpperCase()}
                    </div>
                    
                    <div className="qr-container" style={{ padding: '2px', marginBottom: '4px' }}>
                      <QRCodeSVG 
                        value={student.registrationNumber} 
                        size={120}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div className="scan-instruction">SCAN TO CLOCK IN</div>
                    
                    <div className="encoded-id-pill">
                      ENCODED ID: {student.registrationNumber}
                    </div>
                    
                    <div className="disclaimer-text">
                      This card is the property of {schoolName}.<br/>
                      If found, please return to the school office.<br/>
                      Unauthorised use is strictly prohibited.
                    </div>
                  </div>
                  
                  <div className="card-footer-dark center-text back-footer">
                    <span className="powered-by">Powered by</span>
                    <span className="rms-badge">Neotro Attendance System</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
