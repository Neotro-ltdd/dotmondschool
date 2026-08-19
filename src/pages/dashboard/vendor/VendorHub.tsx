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
  principalSignatureUrl?: string;
  signatureUrl?: string;
}

const formatDisplayName = (surname?: string, firstName?: string, otherNames?: string) => {
  const s = (surname || '').trim().toUpperCase();
  const f = (firstName || '').trim().toUpperCase();
  if (!s && !f) return 'MEMBER';
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
    fetchStudents();
    fetchStaff();
  }, []);

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
    } catch {
      setSchoolProfile({
        schoolName: schoolName || "DOTMOND SCHOOL",
        address: "Happyland Estate, Ajah, Lagos State, Nigeria",
        logoUrl: logoUrl || "",
        primaryColor: "#000080",
        secondaryColor: "#C4293A",
        currentSession: "2026/2027"
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

  // Derive unique levels from classes
  const availableLevels = Array.from(new Set(classes.map(c => c.level))).filter(Boolean);

  // Filter classes based on selected level
  const filteredClasses = selectedLevel
    ? classes.filter(c => c.level === selectedLevel)
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

  // Student Checkbox handlers
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

  // Staff Checkbox handlers
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

  const getFullUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_ROOT}${url}` : url;
  };

  const principalSig = schoolProfile?.principalSignatureUrl || schoolProfile?.signatureUrl;

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
            <div className="stat-card glass-panel">
              <span className="stat-label">Total Students</span>
              <span className="stat-value text-white">{stats?.totalStudents || 0}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Fee Cleared</span>
              <span className="stat-value text-emerald">{stats?.clearedStudents ?? '-'}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Owing Fees</span>
              <span className="stat-value text-amber">{stats?.owingStudents ?? '-'}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Printed Cards</span>
              <span className="stat-value text-emerald">{stats?.printedCards || 0}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Pending Cards</span>
              <span className="stat-value text-amber">{stats?.pendingCards || 0}</span>
            </div>
          </div>
        ) : (
          <div className="stats-grid grid-cols-3">
            <div className="stat-card glass-panel">
              <span className="stat-label">Total Active Staff</span>
              <span className="stat-value text-white">{stats?.totalStaff || staffList.length}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Teaching Staff</span>
              <span className="stat-value text-emerald">{staffList.filter(s => s.staffCategory === 'Teaching').length}</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Non-Teaching Staff</span>
              <span className="stat-value text-amber">{staffList.filter(s => s.staffCategory !== 'Teaching').length}</span>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="glass-panel filter-toolbar-panel">
          {activeTab === 'students' ? (
            <div className="filter-grid-4">
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
                  {availableLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
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
        <div className="glass-panel main-table-panel">
          <div className="table-header-bar">
            <div>
              <h2 className="table-title">Student Directory</h2>
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
                      <td className="font-bold">{formatDisplayName(student.surname, student.firstName, student.otherNames)}</td>
                      <td>{student.className || '-'}</td>
                      <td>
                        {student.isCleared || (student.totalBalance !== undefined && student.totalBalance <= 0) ? (
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
        <div className="glass-panel main-table-panel">
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
                      <td className="font-bold">{formatDisplayName(staff.surname, staff.firstName, staff.otherNames)}</td>
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

      {/* Hidden printable area for batch printing CR80 Cards */}
      <div style={{ display: 'none' }}>
        <div className="id-cards-grid print-section" ref={printRef}>
          {/* STUDENT CARDS PRINT LOOP */}
          {selectedStudentsToPrint.map(student => (
            <React.Fragment key={student.id}>
              {/* FRONT OF STUDENT CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark">
                    <div className="header-content">
                      {logoUrl ? (
                        <img src={getFullUrl(logoUrl)} alt="Logo" className="card-logo" />
                      ) : (
                        <div className="card-logo-placeholder"></div>
                      )}
                      <div className="header-text">
                        <div className="school-title">{(schoolName || 'DOTMOND SCHOOL').toUpperCase()}</div>
                        <div className="school-subtitle">{schoolProfile?.address || 'Lekki, Lagos, Nigeria'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="student-badge-label">
                      <span>STUDENT ID</span>
                    </div>
                    
                    <div className="photo-container">
                      {student.passportUrl ? (
                        <img src={getFullUrl(student.passportUrl)} alt="Student" className="student-photo" />
                      ) : (
                        <div className="student-photo placeholder">NO PHOTO</div>
                      )}
                    </div>
                    
                    <div className="student-name">
                      {formatDisplayName(student.surname, student.firstName, student.otherNames)}
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

              {/* BACK OF STUDENT CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark center-text">
                    <div className="back-title">NEOTRO ATTENDANCE SYSTEM</div>
                    <div className="back-subtitle">{(schoolName || 'DOTMOND SCHOOL')}</div>
                  </div>
                  
                  <div className="card-body back-body">
                    <div className="back-heading">
                      {(schoolName || 'DOTMOND SCHOOL').toUpperCase()}
                    </div>
                    
                    <div className="qr-container" style={{ padding: '4px', marginBottom: '4px' }}>
                      <QRCodeSVG 
                        value={student.registrationNumber} 
                        size={110}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div className="scan-instruction">SCAN TO CLOCK IN</div>
                    
                    <div className="encoded-id-pill">
                      ENCODED ID: {student.registrationNumber}
                    </div>
                    
                    <div className="signature-overlay-block">
                      {principalSig && (
                        <img src={getFullUrl(principalSig)} alt="Signature" className="card-sig-img" />
                      )}
                      <div className="sig-line">Signed ....................................................</div>
                    </div>

                    <div className="disclaimer-text">
                      This card is the property of {(schoolName || 'DOTMOND SCHOOL')}.<br/>
                      If found, please return to the school office.
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

          {/* STAFF CARDS PRINT LOOP */}
          {selectedStaffToPrint.map(staff => (
            <React.Fragment key={staff.id}>
              {/* FRONT OF STAFF CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark">
                    <div className="header-content">
                      {logoUrl ? (
                        <img src={getFullUrl(logoUrl)} alt="Logo" className="card-logo" />
                      ) : (
                        <div className="card-logo-placeholder"></div>
                      )}
                      <div className="header-text">
                        <div className="school-title">{(schoolName || 'DOTMOND SCHOOL').toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="student-badge-label">
                      <span>STAFF ID</span>
                    </div>
                    
                    <div className="photo-container" style={{ height: '1.4in' }}>
                      {staff.passportUrl || staff.avatarUrl ? (
                        <img src={getFullUrl(staff.passportUrl || staff.avatarUrl)} alt="Staff" className="student-photo" />
                      ) : (
                        <div className="student-photo placeholder">NO PHOTO</div>
                      )}
                    </div>
                    
                    <div className="student-name">
                      {formatDisplayName(staff.surname, staff.firstName, staff.otherNames)}
                    </div>
                    
                    <div className="student-details-grid">
                      <div className="detail-label">DESIGNATION</div>
                      <div className="detail-value">{(staff.designation || staff.role || 'STAFF').toUpperCase()}</div>
                      
                      <div className="detail-label">CODE</div>
                      <div className="detail-value">{staff.staffCode}</div>
                    </div>
                  </div>
                  
                  <div className="card-footer-dark">
                    <div className="footer-left">OFFICIAL STAFF ID</div>
                    <div className="footer-right">2026 — 2028</div>
                  </div>
                </div>
              </div>

              {/* BACK OF STAFF CARD */}
              <div className="id-card-wrapper">
                <div className="id-card vertical-card">
                  <div className="card-header-dark center-text">
                    <div className="back-title">NEOTRO ATTENDANCE SYSTEM</div>
                    <div className="back-subtitle">{schoolProfile?.address || 'Lekki, Lagos, Nigeria'}</div>
                  </div>
                  
                  <div className="card-body back-body">
                    <div className="back-heading">
                      {(schoolName || 'DOTMOND SCHOOL').toUpperCase()}
                    </div>
                    
                    <div className="qr-container" style={{ padding: '4px', marginBottom: '4px' }}>
                      <QRCodeSVG 
                        value={staff.staffCode} 
                        size={110}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div className="scan-instruction">SCAN TO CLOCK IN</div>
                    
                    <div className="encoded-id-pill">
                      ENCODED ID: {staff.staffCode}
                    </div>

                    <div className="signature-overlay-block">
                      {principalSig && (
                        <img src={getFullUrl(principalSig)} alt="Signature" className="card-sig-img" />
                      )}
                      <div className="sig-line">Signed ....................................................</div>
                    </div>
                    
                    <div className="disclaimer-text">
                      This card is the property of {(schoolName || 'DOTMOND SCHOOL')}.<br/>
                      If found, please return to the school office.
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
