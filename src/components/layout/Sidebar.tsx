import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  GraduationCap, 
  School, 
  BookOpen, 
  Award, 
  BarChart3, 
  Settings, 
  User, 
  Printer, 
  ChevronDown, 
  ChevronRight, 
  CreditCard, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  Sliders,
  Calendar,
  Wrench,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { api } from '../../services/api';
import './Layout.css';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen?: boolean, setIsSidebarOpen?: (open: boolean) => void }) {
  const { logout, userRole, userName } = useAuth();
  const { schoolName, logoUrl } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = userRole === 'Director' || userRole === 'Principal' || userRole === 'Superadmin' || userRole === 'SuperAdmin';
  const isDeveloperRoot = userRole === 'SuperAdmin' || userRole === 'Superadmin' || userRole === 'SystemAdmin';
  const [isFormClassTeacher, setIsFormClassTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    if (userRole === 'Teacher' || userRole === 'SubjectTeacher') {
      api.get('/academics/teacher/my-classes')
        .then((classes: any) => {
          const classList = Array.isArray(classes) ? classes : [];
          const isClassT = classList.some((c: any) => c.isClassTeacher);
          setIsFormClassTeacher(isClassT);
        })
        .catch(() => {
          setIsFormClassTeacher(false);
        });
    }
  }, [userRole]);

  // Accordion Group States
  const [isUserRoleOpen, setIsUserRoleOpen] = useState(false);
  const [isClassStudentOpen, setIsClassStudentOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isResultMgmtOpen, setIsResultMgmtOpen] = useState(false);
  const [isApprovalMgmtOpen, setIsApprovalMgmtOpen] = useState(false);
  const [isSetupsOpen, setIsSetupsOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isFinanceSetupOpen, setIsFinanceSetupOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Auto-expand accordion if current location is within that group
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard/teachers') || path.includes('/dashboard/operations/roles')) {
      setIsUserRoleOpen(true);
    }
    if (path.includes('/dashboard/classes') || path.includes('/dashboard/students') || path.includes('/dashboard/allocations/class-allocations')) {
      setIsClassStudentOpen(true);
    }
    if (path.includes('/dashboard/subjects') || path.includes('/dashboard/allocations/subject-allocations')) {
      setIsSubjectOpen(true);
    }
    if (path.includes('/dashboard/operations/result-management') || path.includes('/dashboard/operations/review-results')) {
      setIsResultMgmtOpen(true);
    }
    if (path.includes('/dashboard/approvals') || path.includes('/dashboard/operations/promotions')) {
      setIsApprovalMgmtOpen(true);
    }
    if (path.includes('/dashboard/operations/term-setup') || path.includes('/dashboard/operations/session') || path.includes('/dashboard/operations/grading') || path.includes('/dashboard/operations/manual-clearance')) {
      setIsSetupsOpen(true);
    }
    if (path.includes('/dashboard/operations/gate-scanner') || path.includes('/dashboard/operations/gate-logs')) {
      setIsAttendanceOpen(true);
    }
    if (path.includes('/dashboard/finance/')) {
      setIsFinanceOpen(true);
    }
    if (path.includes('/dashboard/finance-setup/')) {
      setIsFinanceSetupOpen(true);
    }
    if (path.includes('/dashboard/reports') || path.includes('/dashboard/finance/reports')) {
      setIsReportsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!userName) return 'U';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar glass-panel ${isSidebarOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Close Button */}
      {isSidebarOpen && setIsSidebarOpen && (
        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
          ×
        </button>
      )}

      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-container">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="brand-logo-img" />
          ) : (
            <div className="brand-logo">
              <School size={22} />
            </div>
          )}
        </div>
        <div className="brand-info">
          <span className="brand-name">{schoolName}</span>
          <span className="brand-tag">PORTAL CONTROL HUB</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {userRole === 'Vendor' ? (
          <>
            <div className="sidebar-section-header">VENDOR HUB</div>
            <NavLink to="/dashboard/vendor-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon-box"><Printer size={18} /></span>
              Printing Hub
            </NavLink>
          </>
        ) : (
          <>
            {/* CORE NAVIGATION */}
            <div className="sidebar-section-header">MAIN NAVIGATION</div>
            <NavLink to="/dashboard" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon-box"><LayoutDashboard size={18} /></span>
              Overview
            </NavLink>

            {/* DEVELOPER SAMPLE WORKSTATIONS FOR SUPERADMIN */}
            {isDeveloperRoot && (
              <>
                <div className="sidebar-section-header">TEACHER WORKSTATION (SAMPLE)</div>
                <NavLink to="/dashboard/teacher/my-class" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Users size={18} /></span>
                  My Class / Subjects
                </NavLink>
                <NavLink to="/dashboard/teacher/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Calendar size={18} /></span>
                  Attendance Register
                </NavLink>
                <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><FileText size={18} /></span>
                  Continuous Assessment
                </NavLink>
                <NavLink to="/dashboard/teacher/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><CheckCircle size={18} /></span>
                  Review Results
                </NavLink>
                <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Wrench size={18} /></span>
                  Utilities
                </NavLink>

                <div className="sidebar-section-header">VENDOR HUB (SAMPLE)</div>
                <NavLink to="/dashboard/vendor-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Printer size={18} /></span>
                  Printing Hub
                </NavLink>
              </>
            )}

            {(userRole === 'Teacher' || userRole === 'SubjectTeacher') && (
              <>
                {isFormClassTeacher !== false ? (
                  <>
                    <div className="sidebar-section-header">TEACHER WORKSTATION</div>
                    <NavLink to="/dashboard/teacher/my-class" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><Users size={18} /></span>
                      My Class
                    </NavLink>
                    <NavLink to="/dashboard/teacher/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><Calendar size={18} /></span>
                      Attendance Register
                    </NavLink>
                    <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><FileText size={18} /></span>
                      Continuous Assessment
                    </NavLink>
                    <NavLink to="/dashboard/teacher/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><CheckCircle size={18} /></span>
                      Review Results
                    </NavLink>
                    <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><Wrench size={18} /></span>
                      Utilities
                    </NavLink>
                  </>
                ) : (
                  <>
                    <div className="sidebar-section-header">SUBJECT WORKSTATION</div>
                    <NavLink to="/dashboard/teacher/my-class" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><BookOpen size={18} /></span>
                      My Subjects
                    </NavLink>
                    <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><FileText size={18} /></span>
                      Continuous Assessment
                    </NavLink>
                    <NavLink to="/dashboard/teacher/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><CheckCircle size={18} /></span>
                      Review Results
                    </NavLink>
                    <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><Wrench size={18} /></span>
                      Utilities
                    </NavLink>
                  </>
                )}
              </>
            )}

            {userRole === 'Parent' && (
              <>
                <div className="sidebar-section-header">PARENT PORTAL</div>
                <NavLink to="/dashboard/parent-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Users size={18} /></span>
                  My Kids
                </NavLink>
              </>
            )}

            {/* ADMIN & PRINCIPAL FEATURE-BASED NAVIGATION */}
            {userRole !== 'Teacher' && userRole !== 'SubjectTeacher' && userRole !== 'Parent' && (
              <>
                <div className="sidebar-section-header">MANAGEMENT MODULES</div>

                {/* 1. USER & ROLE MANAGEMENT */}
                {userRole !== 'Accountant' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isUserRoleOpen ? 'open' : ''}`} 
                      onClick={() => setIsUserRoleOpen(!isUserRoleOpen)}
                    >
                      <span className="nav-icon-box"><UserCheck size={18} /></span>
                      User & Role Management
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isUserRoleOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isUserRoleOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/teachers" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Staff Roster
                        </NavLink>
                        <NavLink to="/dashboard/operations/roles" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Role Management
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CLASS & STUDENT MANAGEMENT */}
                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isClassStudentOpen ? 'open' : ''}`} 
                      onClick={() => setIsClassStudentOpen(!isClassStudentOpen)}
                    >
                      <span className="nav-icon-box"><GraduationCap size={18} /></span>
                      Class & Student Mgmt
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isClassStudentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isClassStudentOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/classes" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Classes
                        </NavLink>
                        <NavLink to="/dashboard/students" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Students
                        </NavLink>
                        {userRole !== 'Principal' && (
                          <NavLink to="/dashboard/allocations/class-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Class Allocation
                          </NavLink>
                        )}
                        {(userRole === 'Admin' || userRole === 'Superadmin' || userRole === 'SuperAdmin' || userRole === 'Principal') && (
                          <NavLink to="/dashboard/operations/promotions" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Student Promotions
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SUBJECT MANAGEMENT */}
                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isSubjectOpen ? 'open' : ''}`} 
                      onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                    >
                      <span className="nav-icon-box"><BookOpen size={18} /></span>
                      Subject Management
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isSubjectOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isSubjectOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/subjects" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Subjects
                        </NavLink>
                        {userRole !== 'Principal' && (
                          <NavLink to="/dashboard/allocations/subject-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Subject Allocations
                          </NavLink>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. RESULT MANAGEMENT */}
                {userRole !== 'Accountant' && userRole !== 'Parent' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isResultMgmtOpen ? 'open' : ''}`} 
                      onClick={() => setIsResultMgmtOpen(!isResultMgmtOpen)}
                    >
                      <span className="nav-icon-box"><Award size={18} /></span>
                      Result Management
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isResultMgmtOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isResultMgmtOpen && (
                      <div className="submenu">
                        {userRole !== 'Principal' && (
                          <NavLink to="/dashboard/operations/result-management" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Compute Result
                          </NavLink>
                        )}
                        <NavLink to="/dashboard/operations/review-results" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Review Results
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. APPROVAL MANAGEMENT (PRINCIPAL ONLY) */}
                {(userRole === 'Principal' || userRole === 'Superadmin' || userRole === 'SuperAdmin') && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isApprovalMgmtOpen ? 'open' : ''}`} 
                      onClick={() => setIsApprovalMgmtOpen(!isApprovalMgmtOpen)}
                    >
                      <span className="nav-icon-box"><ShieldCheck size={18} /></span>
                      Approval Management
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isApprovalMgmtOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isApprovalMgmtOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/approvals" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Result Approval
                        </NavLink>
                        <NavLink to="/dashboard/operations/promotions" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Promotion Approval
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. SETUPS */}
                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isSetupsOpen ? 'open' : ''}`} 
                      onClick={() => setIsSetupsOpen(!isSetupsOpen)}
                    >
                      <span className="nav-icon-box"><Sliders size={18} /></span>
                      Setups
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isSetupsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isSetupsOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/operations/term-setup" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Term & Session Setup
                        </NavLink>
                        <NavLink to="/dashboard/operations/session" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Session Operations
                        </NavLink>
                        <NavLink to="/dashboard/operations/grading" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Grading Rules
                        </NavLink>
                        <NavLink to="/dashboard/operations/manual-clearance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Manual Clearance
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. ATTENDANCE MANAGEMENT */}
                <div className="nav-group">
                  <button 
                    className={`nav-item dropdown-toggle ${isAttendanceOpen ? 'open' : ''}`} 
                    onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                  >
                    <span className="nav-icon-box"><QrCode size={18} /></span>
                    Attendance Management
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                      {isAttendanceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>
                  {isAttendanceOpen && (
                    <div className="submenu">
                      {userRole !== 'Accountant' && userRole !== 'Principal' && (
                        <>
                          <NavLink to="/dashboard/operations/gate-scanner" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Gate Scanner
                          </NavLink>
                          <NavLink to="/dashboard/operations/gate-logs" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Gate Logs
                          </NavLink>
                        </>
                      )}
                      <NavLink to="/dashboard/staff-attendance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                        Staff Attendance Log
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* ACCOUNTANT / SUPERADMIN FINANCE MODULES */}
                {(userRole === 'Accountant' || userRole === 'Superadmin' || userRole === 'SuperAdmin') && (
                  <>
                    <div className="sidebar-section-header">FINANCE & BILLING</div>
                    <NavLink to="/dashboard/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><GraduationCap size={18} /></span>
                      Students
                    </NavLink>
                    <div className="nav-group">
                      <button 
                        className={`nav-item dropdown-toggle ${isFinanceOpen ? 'open' : ''}`} 
                        onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                      >
                        <span className="nav-icon-box"><CreditCard size={18} /></span>
                        Finance Operations
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          {isFinanceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </button>
                      {isFinanceOpen && (
                        <div className="submenu">
                          <NavLink to="/dashboard/finance/verifications" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Online Verifications
                          </NavLink>
                          <NavLink to="/dashboard/finance/pos" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Point of Sale
                          </NavLink>
                          <NavLink to="/dashboard/finance/proxy-upload" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Proxy Upload
                          </NavLink>
                          <NavLink to="/dashboard/finance/ledger" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Student Ledger
                          </NavLink>
                          <NavLink to="/dashboard/operations/manual-clearance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Manual Clearance
                          </NavLink>
                        </div>
                      )}
                    </div>

                    <div className="nav-group">
                      <button 
                        className={`nav-item dropdown-toggle ${isFinanceSetupOpen ? 'open' : ''}`} 
                        onClick={() => setIsFinanceSetupOpen(!isFinanceSetupOpen)}
                      >
                        <span className="nav-icon-box"><Settings size={18} /></span>
                        Finance Setup
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          {isFinanceSetupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </button>
                      {isFinanceSetupOpen && (
                        <div className="submenu">
                          <NavLink to="/dashboard/finance-setup/assets" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Upload Assets
                          </NavLink>
                          <NavLink to="/dashboard/finance-setup/builder" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Fee Builder
                          </NavLink>
                          <NavLink to="/dashboard/finance-setup/class-fees" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Class Fees
                          </NavLink>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 7. REPORTS & ANALYTICS (EXCLUDE ADMIN) */}
                {userRole !== 'Admin' && (
                  <>
                    <div className="sidebar-section-header">ANALYTICS & SETTINGS</div>

                    <div className="nav-group">
                      <button 
                        className={`nav-item dropdown-toggle ${isReportsOpen ? 'open' : ''}`} 
                        onClick={() => setIsReportsOpen(!isReportsOpen)}
                      >
                        <span className="nav-icon-box"><BarChart3 size={18} /></span>
                        Reports & Analytics
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          {isReportsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </button>
                      {isReportsOpen && (
                        <div className="submenu">
                          {userRole !== 'Accountant' && (
                            <NavLink to="/dashboard/reports" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                              Academic Reports
                            </NavLink>
                          )}
                          <NavLink to="/dashboard/finance/reports" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                            Financial Reports Hub
                          </NavLink>
                        </div>
                      )}
                    </div>

                    {userRole !== 'Accountant' && (
                      <NavLink to="/dashboard/settings/school" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon-box"><Settings size={18} /></span>
                        Settings
                      </NavLink>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </nav>

      {/* Sidebar Footer User Card */}
      <div className="sidebar-user-card">
        <div className="user-profile-box">
          <div className="user-avatar-badge">{getUserInitials()}</div>
          <div className="user-details-text">
            <span className="user-details-name">{userName || 'Administrator'}</span>
            <span className="user-details-role">{userRole || 'Staff User'}</span>
          </div>
          <button onClick={handleLogout} className="btn-sidebar-logout" title="Sign out of portal">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
