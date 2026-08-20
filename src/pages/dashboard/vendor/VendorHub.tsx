import React, { useState, useEffect, useRef } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import './VendorHub.css';
import '../students/IdCardPrintModal.css';
import { useDialog } from '../../../context/DialogContext';

interface Student {
  id: string;
  surname: string;
  firstName: string;
  otherNames: string;
  registrationNumber: string;
  passportUrl: string | null;
  className: string;
  level: string | null;
  classId: string;
  isIdCardPrinted: boolean;
  totalBalance?: number;
  isCleared?: boolean;
}

interface StaffMember {
  id: string;
  staffCode: string;
  surname: string;
  firstName: string;
  otherNames?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  designation?: string;
  staffCategory?: string;
  employmentType?: string;
  isActive: boolean;
  passportUrl?: string;
  avatarUrl?: string;
}

interface VendorStats {
  totalStudents: number;
  printedCards: number;
  pendingCards: number;
  clearedStudents?: number;
  owingStudents?: number;
  totalStaff?: number;
}

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
}

interface SchoolProfile {
  schoolName: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  currentSession: string;
  currentTerm?: string;
  principalSignatureUrl?: string;
  signatureUrl?: string;
}

const formatStudentDisplayName = (surname?: string, firstName?: string, otherNames?: string) => {
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

  // Active Category Tab: 'students' | 'staff'
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');

  // Metadata & Stats
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);

  // Student Section State & Filters
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('2025/2026');
  const [selectedTerm, setSelectedTerm] = useState<string>('Third Term');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClearanceStatus, setSelectedClearanceStatus] = useState<string>(''); // '', 'cleared', 'owing'
  const [selectedPrintStatus, setSelectedPrintStatus] = useState<string>(''); // '', 'pending', 'printed'
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Staff Section State & Filters
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffCategory, setSelectedStaffCategory] = useState<string>('');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');

  // Print Queue State
  const [selectedStudentsToPrint, setSelectedStudentsToPrint] = useState<Student[]>([]);
  const [selectedStaffToPrint, setSelectedStaffToPrint] = useState<StaffMember[]>([]);
  const [checkedStudentIds, setCheckedStudentIds] = useState<Set<string>>(new Set());
  const [checkedStaffIds, setCheckedStaffIds] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClasses();
    fetchStats();
    fetchSchoolProfile();
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedSession, selectedTerm]);

  const fetchStats = async () => {
    try {
      const data = await api.get('/setup/students/vendor/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchSchoolProfile = async () => {
    try {
      const profile = await api.get('/setup/school-profile');
      setSchoolProfile(profile);
      if (profile?.currentSession) {
        setSelectedSession(profile.currentSession);
      }
      if (profile?.currentTerm) {
        setSelectedTerm(profile.currentTerm);
      }
    } catch {
      setSchoolProfile({
        schoolName: schoolName || "DOTMOND SCHOOL",
        address: "Happyland Estate, Ajah, Lagos State, Nigeria",
        logoUrl: logoUrl || "",
        primaryColor: "#12386E",
        secondaryColor: "#C4293A",
        currentSession: "2025/2026",
        currentTerm: "Third Term"
      });
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

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      let queryParams = [];
      if (selectedSession) queryParams.push(`session=${encodeURIComponent(selectedSession)}`);
      if (selectedTerm) queryParams.push(`term=${encodeURIComponent(selectedTerm)}`);
      if (selectedClassId) queryParams.push(`classId=${selectedClassId}`);
      if (selectedLevel) queryParams.push(`level=${encodeURIComponent(selectedLevel)}`);
      if (selectedClearanceStatus) queryParams.push(`clearanceStatus=${selectedClearanceStatus}`);
      if (selectedPrintStatus) queryParams.push(`printStatus=${selectedPrintStatus}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await api.get(`/setup/students/vendor${queryString}`);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const data = await api.get('/setup/staff');
      setStaffList(data);
    } catch (err) {
      console.error('Failed to fetch staff list', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Unique levels from classes
  const availableLevels = Array.from(new Set(classes.map(c => c.level))).filter(Boolean);

  // Filter classes based on selected level
  const filteredClasses = selectedLevel
    ? classes.filter(c => c.level === selectedLevel || c.level.toLowerCase().includes(selectedLevel.toLowerCase()))
    : classes;

  // Filtered Students List
  const filteredStudents = students.filter(s => {
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase();
      const fullName = `${s.surname} ${s.firstName} ${s.otherNames}`.toLowerCase();
      const reg = (s.registrationNumber || '').toLowerCase();
      return fullName.includes(q) || reg.includes(q);
    }
    return true;
  });

  // Filtered Staff List
  const filteredStaff = staffList.filter(s => {
    if (selectedStaffCategory && s.staffCategory !== selectedStaffCategory) {
      return false;
    }
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      const fullName = `${s.surname} ${s.firstName} ${s.otherNames}`.toLowerCase();
      const code = (s.staffCode || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      return fullName.includes(q) || code.includes(q) || email.includes(q);
    }
    return true;
  });

  // Print Hook
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: activeTab === 'students' ? 'Student_ID_Cards_Batch' : 'Staff_ID_Cards_Batch',
    onAfterPrint: async () => {
      if (activeTab === 'students' && selectedStudentsToPrint.length > 0) {
        try {
          const studentIds = selectedStudentsToPrint.map(s => s.id);
          await api.post('/setup/students/vendor/mark-printed', { studentIds });
          fetchStats();
          fetchStudents();
        } catch (err) {
          console.error('Failed to mark cards as printed', err);
        }
      }

      setSelectedStudentsToPrint([]);
      setSelectedStaffToPrint([]);
      setIsPrinting(false);
      setCheckedStudentIds(new Set());
      setCheckedStaffIds(new Set());
    }
  });

  useEffect(() => {
    if (isPrinting && (selectedStudentsToPrint.length > 0 || selectedStaffToPrint.length > 0)) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, selectedStudentsToPrint, selectedStaffToPrint, handlePrint]);

  // Single Actions
  const handlePrintSingleStudent = (student: Student) => {
    setSelectedStudentsToPrint([student]);
    setSelectedStaffToPrint([]);
    setIsPrinting(true);
  };

  const handlePrintSingleStaff = (staff: StaffMember) => {
    setSelectedStaffToPrint([staff]);
    setSelectedStudentsToPrint([]);
    setIsPrinting(true);
  };

  // Checked Actions
  const handlePrintCheckedStudents = () => {
    const toPrint = filteredStudents.filter(s => checkedStudentIds.has(s.id));
    if (toPrint.length === 0) {
      showAlert("Please check at least one student to print.");
      return;
    }
    setSelectedStudentsToPrint(toPrint);
    setSelectedStaffToPrint([]);
    setIsPrinting(true);
  };

  const handlePrintAllStudents = () => {
    if (filteredStudents.length === 0) {
      showAlert("No students match the current filters.");
      return;
    }
    setSelectedStudentsToPrint(filteredStudents);
    setSelectedStaffToPrint([]);
    setIsPrinting(true);
  };

  const handlePrintCheckedStaff = () => {
    const toPrint = filteredStaff.filter(s => checkedStaffIds.has(s.id));
    if (toPrint.length === 0) {
      showAlert("Please check at least one staff member to print.");
      return;
    }
    setSelectedStaffToPrint(toPrint);
    setSelectedStudentsToPrint([]);
    setIsPrinting(true);
  };

  const handlePrintAllStaff = () => {
    if (filteredStaff.length === 0) {
      showAlert("No staff members match the current filters.");
      return;
    }
    setSelectedStaffToPrint(filteredStaff);
    setSelectedStudentsToPrint([]);
    setIsPrinting(true);
  };

  // Checkbox Handlers
  const toggleStudentCheck = (id: string) => {
    const newChecked = new Set(checkedStudentIds);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedStudentIds(newChecked);
  };

  const toggleStudentCheckAll = () => {
    if (checkedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setCheckedStudentIds(new Set());
    } else {
      setCheckedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleStaffCheck = (id: string) => {
    const newChecked = new Set(checkedStaffIds);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedStaffIds(newChecked);
  };

  const toggleStaffCheckAll = () => {
    if (checkedStaffIds.size === filteredStaff.length && filteredStaff.length > 0) {
      setCheckedStaffIds(new Set());
    } else {
      setCheckedStaffIds(new Set(filteredStaff.map(s => s.id)));
    }
  };

  // URL Helper with Timestamp Cache Buster
  const getFullUrl = (url?: string | null) => {
    if (!url) return '';
    const fullUrl = url.startsWith('/') ? `${API_ROOT}${url}` : url;
    return fullUrl.includes('?') ? `${fullUrl}&t=${Date.now()}` : `${fullUrl}?t=${Date.now()}`;
  };

  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;
  const fullSchoolTitle = (schoolProfile?.schoolName || schoolName || "DOTMOND SCHOOL").toUpperCase();
  const schoolAddress = schoolProfile?.address || "Happyland Estate, Ajah, Lagos State, Nigeria";
  const activeSession = selectedSession || schoolProfile?.currentSession || "2025/2026";

  return (
    <div className="vendor-hub-page">
      <div className="no-print">
        {/* Header Title & Tab Controls */}
        <div className="vendor-page-header">
          <div>
            <h1 className="vendor-page-title">Vendor Printing Hub</h1>
            <p className="vendor-page-subtitle">Batch print official student and staff ID cards with multi-level filtering and status tracking.</p>
          </div>

          {/* Primary Category Tabs */}
          <div className="category-tabs-container">
            <button 
              className={`category-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              🎓 Student ID Cards ({stats?.totalStudents || 0})
            </button>
            <button 
              className={`category-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              👔 Staff ID Cards ({stats?.totalStaff || staffList.length || 0})
            </button>
          </div>
        </div>

        {/* Executive Stats Cards */}
        {activeTab === 'students' ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Students</span>
                <span className="stat-value">{stats?.totalStudents || 0}</span>
              </div>
              <div className="stat-icon-box icon-blue">👥</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Fee Cleared</span>
                <span className="stat-value">{students.filter(s => s.isCleared).length}</span>
              </div>
              <div className="stat-icon-box icon-green">🛡️</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Owing Fees</span>
                <span className="stat-value">{students.filter(s => !s.isCleared).length}</span>
              </div>
              <div className="stat-icon-box icon-amber">⚠️</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Printed Cards</span>
                <span className="stat-value">{stats?.printedCards || 0}</span>
              </div>
              <div className="stat-icon-box icon-purple">🖨️</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Pending Cards</span>
                <span className="stat-value">{stats?.pendingCards || 0}</span>
              </div>
              <div className="stat-icon-box icon-rose">⏳</div>
            </div>
          </div>
        ) : (
          <div className="stats-grid grid-cols-3">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Active Staff</span>
                <span className="stat-value">{stats?.totalStaff || staffList.length}</span>
              </div>
              <div className="stat-icon-box icon-blue">👔</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Teaching Staff</span>
                <span className="stat-value">{staffList.filter(s => s.staffCategory === 'Teaching').length}</span>
              </div>
              <div className="stat-icon-box icon-green">📚</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Non-Teaching Staff</span>
                <span className="stat-value">{staffList.filter(s => s.staffCategory !== 'Teaching').length}</span>
              </div>
              <div className="stat-icon-box icon-amber">💼</div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="filter-toolbar-panel">
          {activeTab === 'students' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.85rem', marginBottom: '1rem' }}>
              {/* Session Filter */}
              <div className="form-group">
                <label>Academic Session</label>
                <select 
                  className="form-control" 
                  value={selectedSession} 
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="2025/2026">Session 2025/2026</option>
                  <option value="2026/2027">Session 2026/2027</option>
                  <option value="2027/2028">Session 2027/2028</option>
                  <option value="">All Sessions</option>
                </select>
              </div>

              {/* Term Filter */}
              <div className="form-group">
                <label>Academic Term</label>
                <select 
                  className="form-control" 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <option value="Third Term">Third Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="First Term">First Term</option>
                  <option value="">All Terms</option>
                </select>
              </div>

              {/* Level Filter */}
              <div className="form-group">
                <label>Filter by Level</label>
                <select 
                  className="form-control" 
                  value={selectedLevel} 
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setSelectedClassId('');
                  }}
                >
                  <option value="">All Educational Levels</option>
                  <option value="Junior Secondary">Junior Secondary (JSS)</option>
                  <option value="Senior Secondary">Senior Secondary (SSS)</option>
                  <option value="Primary">Primary</option>
                  <option value="Nursery">Nursery</option>
                </select>
              </div>

              {/* Class Filter */}
              <div className="form-group">
                <label>Filter by Class</label>
                <select 
                  className="form-control" 
                  value={selectedClassId} 
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{`${c.level} ${c.name} ${c.section}`}</option>
                  ))}
                </select>
              </div>

              {/* Fee Clearance Filter */}
              <div className="form-group">
                <label>Fee Clearance Status</label>
                <select 
                  className="form-control" 
                  value={selectedClearanceStatus} 
                  onChange={(e) => setSelectedClearanceStatus(e.target.value)}
                >
                  <option value="">All Clearance Statuses</option>
                  <option value="cleared">✅ Fee Cleared Only</option>
                  <option value="owing">⚠️ Owing Fees Only</option>
                </select>
              </div>

              {/* ID Card Print Status Filter */}
              <div className="form-group">
                <label>ID Card Print Status</label>
                <select 
                  className="form-control" 
                  value={selectedPrintStatus} 
                  onChange={(e) => setSelectedPrintStatus(e.target.value)}
                >
                  <option value="">All Card Statuses</option>
                  <option value="pending">⏳ Pending Printing</option>
                  <option value="printed">🖨️ Already Printed</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="filter-grid-2">
              <div className="form-group">
                <label>Filter by Category</label>
                <select 
                  className="form-control" 
                  value={selectedStaffCategory} 
                  onChange={(e) => setSelectedStaffCategory(e.target.value)}
                >
                  <option value="">All Staff Categories</option>
                  <option value="Teaching">Teaching Staff</option>
                  <option value="NonTeaching">Non-Teaching Staff</option>
                  <option value="Contract">Contract Staff</option>
                </select>
              </div>

              <div className="form-group">
                <label>Search Staff</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by name, code or email..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action Trigger Row */}
          <div className="filter-action-row">
            {activeTab === 'students' && (
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search student name or registration number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                />
              </div>
            )}
            
            {activeTab === 'students' && (
              <button className="btn btn-primary" onClick={fetchStudents} disabled={loadingStudents}>
                {loadingStudents ? 'Querying...' : '🔍 Apply Filters'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Data Section */}
      {activeTab === 'students' ? (
        <div className="main-table-panel">
          <div className="table-header-bar">
            <div>
              <h2 className="table-title">Student Directory ({selectedSession} - {selectedTerm || 'All Terms'})</h2>
              <span className="table-subtitle">Showing {filteredStudents.length} student records</span>
            </div>
            <div className="batch-action-buttons">
              <button 
                className="btn btn-secondary action-btn-selected" 
                onClick={handlePrintCheckedStudents} 
                disabled={checkedStudentIds.size === 0 || isPrinting}
              >
                🖨️ Print Selected ({checkedStudentIds.size})
              </button>
              <button 
                className="btn btn-success action-btn-all" 
                onClick={handlePrintAllStudents} 
                disabled={filteredStudents.length === 0 || isPrinting}
              >
                🖨️ Print All Filtered ({filteredStudents.length})
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={checkedStudentIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleStudentCheckAll}
                    />
                  </th>
                  <th>Photo</th>
                  <th>Registration No</th>
                  <th>Student Full Name</th>
                  <th>Level / Class</th>
                  <th>Fee Clearance</th>
                  <th>ID Card Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">Loading student records...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">No student records found matching the selected filters.</td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={checkedStudentIds.has(student.id)}
                          onChange={() => toggleStudentCheck(student.id)}
                        />
                      </td>
                      <td>
                        {student.passportUrl ? (
                          <img src={getFullUrl(student.passportUrl)} alt="passport" className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">N/A</div>
                        )}
                      </td>
                      <td><span className="code-pill">{student.registrationNumber}</span></td>
                      <td className="font-bold">{formatStudentDisplayName(student.surname, student.firstName, student.otherNames)}</td>
                      <td>{student.className || '-'}</td>
                      <td>
                        {student.isCleared ? (
                          <span className="badge badge-cleared">✅ Cleared</span>
                        ) : (
                          <span className="badge badge-owing">⚠️ Owing Fees</span>
                        )}
                      </td>
                      <td>
                        {student.isIdCardPrinted ? (
                          <span className="badge badge-printed">Printed</span>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handlePrintSingleStudent(student)}
                          disabled={isPrinting}
                        >
                          Print Card
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="main-table-panel">
          <div className="table-header-bar">
            <div>
              <h2 className="table-title">Staff Directory</h2>
              <span className="table-subtitle">Showing {filteredStaff.length} staff records</span>
            </div>
            <div className="batch-action-buttons">
              <button 
                className="btn btn-secondary action-btn-selected" 
                onClick={handlePrintCheckedStaff} 
                disabled={checkedStaffIds.size === 0 || isPrinting}
              >
                🖨️ Print Selected ({checkedStaffIds.size})
              </button>
              <button 
                className="btn btn-success action-btn-all" 
                onClick={handlePrintAllStaff} 
                disabled={filteredStaff.length === 0 || isPrinting}
              >
                🖨️ Print All Filtered ({filteredStaff.length})
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={checkedStaffIds.size === filteredStaff.length && filteredStaff.length > 0}
                      onChange={toggleStaffCheckAll}
                    />
                  </th>
                  <th>Photo</th>
                  <th>Staff Code</th>
                  <th>Staff Full Name</th>
                  <th>Designation / Category</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingStaff ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">Loading staff records...</td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">No staff records found matching the selected filters.</td>
                  </tr>
                ) : (
                  filteredStaff.map(staff => (
                    <tr key={staff.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={checkedStaffIds.has(staff.id)}
                          onChange={() => toggleStaffCheck(staff.id)}
                        />
                      </td>
                      <td>
                        {staff.passportUrl || staff.avatarUrl ? (
                          <img src={getFullUrl(staff.passportUrl || staff.avatarUrl)} alt="passport" className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">STF</div>
                        )}
                      </td>
                      <td><span className="code-pill">{staff.staffCode}</span></td>
                      <td className="font-bold">{formatStudentDisplayName(staff.surname, staff.firstName, staff.otherNames)}</td>
                      <td>{staff.designation || 'Staff Member'} ({staff.staffCategory || 'Teaching'})</td>
                      <td><span className="badge badge-role">{staff.role || 'Staff'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handlePrintSingleStaff(staff)}
                          disabled={isPrinting}
                        >
                          Print Staff Card
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden printable area for batch printing CR80 Cards (MATCHING IMAGE 2 OFFICIAL DESIGN) */}
      <div style={{ display: 'none' }}>
        <div className="id-cards-grid print-section" ref={printRef}>
          {/* STUDENT CARDS PRINT LOOP */}
          {selectedStudentsToPrint.map(student => (
            <React.Fragment key={student.id}>
              {/* FRONT OF STUDENT CARD */}
              <div className="id-card-wrapper">
                <div className="card front">
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {schoolProfile?.logoUrl ? (
                          <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.45in', height: 'auto', display: 'block' }} />
                        ) : (
                          <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.45in' }}>
                            <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#12386E" strokeWidth="10" strokeLinejoin="round"/>
                            <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#12386E"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                          </svg>
                        )}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond">{fullSchoolTitle}</div>
                        <div className="subline">{schoolAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rule"></div>
                  <div className="id-row"><span className="id-pill">STUDENT ID</span></div>

                  <div className="photo-box">
                    <div className="cell">
                      {student.passportUrl ? (
                        <img src={getFullUrl(student.passportUrl)} alt="Student" className="student-photo-img" />
                      ) : (
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="38" r="20" fill="#B9C2CA"/>
                          <path d="M12,98 C12,72 28,58 50,58 C72,58 88,72 88,98 Z" fill="#B9C2CA"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="name-band">
                    <div className="name">{formatStudentDisplayName(student.surname, student.firstName, student.otherNames)}</div>
                    <div className="field"><b>Admission No:</b> {student.registrationNumber}</div>
                    <div className="field"><b>Session:</b> {activeSession}</div>
                  </div>

                  <div className="foot-strip">
                    <div className="cell">VALID</div>
                    <div className="cell">{activeSession}</div>
                  </div>
                </div>
              </div>

              {/* BACK OF STUDENT CARD */}
              <div className="id-card-wrapper">
                <div className="card back">
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {schoolProfile?.logoUrl ? (
                          <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.45in', height: 'auto', display: 'block' }} />
                        ) : (
                          <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.45in' }}>
                            <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#12386E" strokeWidth="10"/>
                            <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#12386E"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                          </svg>
                        )}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond">{fullSchoolTitle}</div>
                        <div className="subline">Attendance &amp; Identification System</div>
                      </div>
                    </div>
                  </div>

                  <div className="rule"></div>

                  <p className="notice">
                    This card is the property of {fullSchoolTitle}. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
                  </p>

                  <div className="rule"></div>

                  <div className="scan-block" style={{ height: '1.58in', marginTop: '0.02in', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="scan-label" style={{ color: '#000080', fontSize: '9px', fontWeight: 800, letterSpacing: '1.2px', marginBottom: '4px' }}>
                      SCAN TO CLOCK IN
                    </div>
                    <div className="qr-wrap" style={{ width: '1.15in', height: '1.15in', padding: '5px', background: '#FFFFFF', border: '2px solid #CBD5E1', borderRadius: '10px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)', display: 'block' }}>
                      <div className="cell" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QRCodeSVG 
                          value={student.registrationNumber} 
                          size={95}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <span className="encoded-pill" style={{ background: '#000080', color: '#FFFFFF', fontSize: '8px', fontWeight: 800, letterSpacing: '0.8px', padding: '3px 10px', borderRadius: '12px', marginTop: '6px' }}>
                      ENCODED ID: {student.registrationNumber}
                    </span>
                  </div>

                  <div className="sig-block" style={{ marginTop: '0.06in', marginBottom: '0.04in', padding: '0 0.16in', textAlign: 'center', position: 'relative', zIndex: 5 }}>
                    {principalSig && (
                      <img src={getFullUrl(principalSig)} alt="Principal Signature" style={{ height: '0.28in', width: 'auto', maxWidth: '100%', display: 'block', margin: '0 auto -6px', objectFit: 'contain', position: 'relative', zIndex: 6 }} />
                    )}
                    <div style={{ fontSize: '7.5px', color: '#000080', fontWeight: 700, letterSpacing: '0.2px' }}>
                      Signed ....................................................
                    </div>
                  </div>

                  <div className="foot-strip compact-back-footer">
                    <div>Powered by NEOTRO ATTENDANCE SYSTEM</div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* STAFF CARDS PRINT LOOP */}
          {selectedStaffToPrint.map(staff => (
            <React.Fragment key={staff.id}>
              {/* FRONT OF STAFF CARD */}
              <div className="id-card-wrapper">
                <div className="card front">
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {schoolProfile?.logoUrl ? (
                          <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.38in', height: 'auto', display: 'block' }} />
                        ) : (
                          <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.38in' }}>
                            <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#000080" strokeWidth="10"/>
                            <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#000080"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                          </svg>
                        )}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond">{fullSchoolTitle}</div>
                        <div className="subline-addr">{schoolAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="top-divider-row">
                    <div className="divider-line"></div>
                    <span className="id-pill">STAFF ID</span>
                  </div>

                  <div className="large-photo-box">
                    <img 
                      src={getFullUrl(staff.passportUrl || staff.avatarUrl)} 
                      alt={staff.surname} 
                      className="student-photo-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.surname + ' ' + staff.firstName)}&background=000080&color=ffffff&size=256`;
                      }}
                    />
                  </div>

                  <div className="slanted-name-band">
                    <div className="name">{formatStudentDisplayName(staff.surname, staff.firstName, staff.otherNames)}</div>
                    <div className="field"><b>Role:</b> {(staff.designation || staff.role || 'STAFF').toUpperCase()}</div>
                    <div className="field"><b>Staff No:</b> {staff.staffCode}</div>
                  </div>

                  <div className="red-accent-line"></div>

                  <div className="foot-strip">
                    <div>VALID</div>
                    <div>PERMANENT</div>
                  </div>
                </div>
              </div>

              {/* BACK OF STAFF CARD */}
              <div className="id-card-wrapper">
                <div className="card back">
                  <div className="head">
                    <div className="head-row">
                      <div className="mark-cell">
                        {schoolProfile?.logoUrl ? (
                          <img src={getFullUrl(schoolProfile.logoUrl)} alt="Logo" style={{ width: '0.38in', height: 'auto', display: 'block' }} />
                        ) : (
                          <svg viewBox="0 0 500 660" xmlns="http://www.w3.org/2000/svg" style={{ width: '0.38in' }}>
                            <path d="M250,55 L425,118 L425,300 C425,435 342,502 250,545 C158,502 75,435 75,300 L75,118 Z" fill="#FFFFFF" stroke="#000080" strokeWidth="10"/>
                            <g font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="40" fill="#000080"><text x="250" y="182" textAnchor="middle">RMS</text></g>
                          </svg>
                        )}
                      </div>
                      <div className="text-cell">
                        <div className="word-dotmond">DOTMOND SCHOOL</div>
                        <div className="subline">Attendance &amp; Identification System</div>
                      </div>
                    </div>
                  </div>

                  <div className="rule"></div>

                  <p className="notice">
                    This card is the property of Dotmond Primary &amp; Secondary School. If found, please return to the school office. Unauthorised use of this card is strictly prohibited.
                  </p>

                  <div className="rule"></div>

                  <div className="scan-block">
                    <div className="scan-label">
                      SCAN TO CLOCK IN
                    </div>
                    <div className="qr-wrap">
                      <div className="cell">
                        <QRCodeSVG 
                          value={staff.staffCode} 
                          size={95}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <span className="encoded-pill">
                      ENCODED ID: {staff.staffCode}
                    </span>
                  </div>

                  <div className="sig-block">
                    {principalSig && (
                      <img src={getFullUrl(principalSig)} alt="Principal Signature" className="sig-img" />
                    )}
                    <div className="sig-line-text">
                      Authorised Signature
                    </div>
                  </div>

                  <div className="foot-strip compact-back-footer">
                    <div>Powered by NEOTRO ATTENDANCE SYSTEM</div>
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
