import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
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
  Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import './Layout.css';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen?: boolean, setIsSidebarOpen?: (open: boolean) => void }) {
  const { logout, userRole, userName } = useAuth();
  const { schoolName, logoUrl } = useTenant();
  const navigate = useNavigate();
  
  const [isOpsOpen, setIsOpsOpen] = React.useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);
  const [isFinanceSetupOpen, setIsFinanceSetupOpen] = React.useState(false);
  const [isStaffOpen, setIsStaffOpen] = React.useState(false);
  const [isResultMgmtOpen, setIsResultMgmtOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!userName) return 'US';
    const parts = userName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      {setIsSidebarOpen && (
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
            
            {userRole === 'Teacher' && (
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
            )}

            {userRole === 'SubjectTeacher' && (
              <>
                <div className="sidebar-section-header">SUBJECT WORKSTATION</div>
                <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><FileText size={18} /></span>
                  Continuous Assessment
                </NavLink>
                <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><Wrench size={18} /></span>
                  Utilities
                </NavLink>
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

            {userRole !== 'Teacher' && userRole !== 'SubjectTeacher' && userRole !== 'Parent' && (
              <>
                <div className="sidebar-section-header">ACADEMICS & FACULTY</div>

                {userRole !== 'Accountant' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isStaffOpen ? 'open' : ''}`} 
                      onClick={() => setIsStaffOpen(!isStaffOpen)}
                    >
                      <span className="nav-icon-box"><Users size={18} /></span>
                      Staff Management
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isStaffOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isStaffOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/teachers" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Staff Roster
                        </NavLink>
                        {userRole !== 'Principal' && (
                          <>
                            <NavLink to="/dashboard/allocations/class-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                              Class Allocations
                            </NavLink>
                            <NavLink to="/dashboard/allocations/subject-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                              Subject Allocations
                            </NavLink>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <>
                    <NavLink to="/dashboard/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><GraduationCap size={18} /></span>
                      Students
                    </NavLink>
                    <NavLink to="/dashboard/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><School size={18} /></span>
                      Classes
                    </NavLink>
                    <NavLink to="/dashboard/subjects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon-box"><BookOpen size={18} /></span>
                      Subjects
                    </NavLink>
                  </>
                )}
                
                {userRole !== 'Admin' && userRole !== 'Accountant' && (
                  <NavLink to="/dashboard/approvals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon-box"><CheckCircle size={18} /></span>
                    Approvals
                  </NavLink>
                )}

                {(userRole === 'Admin' || userRole === 'Superadmin' || userRole === 'Principal') && (
                  <NavLink to="/dashboard/operations/promotions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon-box"><Sparkles size={18} /></span>
                    Student Promotions
                  </NavLink>
                )}

                {userRole !== 'Accountant' && userRole !== 'Parent' && userRole !== 'Teacher' && userRole !== 'SubjectTeacher' && (
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
                        <NavLink to="/dashboard/operations/result-management" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Compute Result
                        </NavLink>
                        <NavLink to="/dashboard/operations/review-results" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Review Result
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
                
                {(userRole === 'Accountant' || userRole === 'Superadmin') && (
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

                <div className="sidebar-section-header">SYSTEM & GOVERNANCE</div>

                <NavLink to="/dashboard/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon-box"><BarChart3 size={18} /></span>
                  Reports & Analytics
                </NavLink>

                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isOpsOpen ? 'open' : ''}`} 
                      onClick={() => setIsOpsOpen(!isOpsOpen)}
                    >
                      <span className="nav-icon-box"><Sliders size={18} /></span>
                      System Operations
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        {isOpsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isOpsOpen && (
                      <div className="submenu">
                        <NavLink to="/dashboard/operations/roles" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Role Management
                        </NavLink>
                        <NavLink to="/dashboard/operations/term-setup" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Term & Session Setup
                        </NavLink>
                        <NavLink to="/dashboard/operations/session" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Session Operation
                        </NavLink>

                        <NavLink to="/dashboard/operations/grading" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Grading Rules
                        </NavLink>
                        <NavLink to="/dashboard/operations/gate-scanner" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Gate Scanner
                        </NavLink>
                        <NavLink to="/dashboard/operations/gate-logs" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Gate Logs
                        </NavLink>
                        <NavLink to="/dashboard/operations/manual-clearance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}>
                          Manual Clearance
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
                
                {userRole !== 'Admin' && userRole !== 'Accountant' && (
                  <NavLink to="/dashboard/settings/school" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon-box"><Settings size={18} /></span>
                    Settings
                  </NavLink>
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
