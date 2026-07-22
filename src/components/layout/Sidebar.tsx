import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { api } from '../../services/api';
import './Layout.css';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen?: boolean, setIsSidebarOpen?: (open: boolean) => void }) {
  const { logout, userRole, availableRoles, setActiveRole } = useAuth();
  const { schoolName, logoUrl } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpsOpen, setIsOpsOpen] = React.useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);
  const [isFinanceSetupOpen, setIsFinanceSetupOpen] = React.useState(false);
  const [isStaffOpen, setIsStaffOpen] = React.useState(false);
  const [isResultMgmtOpen, setIsResultMgmtOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
      {setIsSidebarOpen && (
        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
          ×
        </button>
      )}
      <div className="sidebar-brand" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem 1.5rem 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="brand-logo-img" style={{ maxHeight: '40px', maxWidth: '40px', borderRadius: '4px' }} />
          ) : (
            <div className="brand-logo">SP</div>
          )}
          <span className="brand-name" style={{ fontSize: schoolName.length > 15 ? '0.9rem' : '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{schoolName}</span>
        </div>
        
        {availableRoles && availableRoles.length > 1 && (
          <div className="role-switcher" style={{ width: '100%', marginTop: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', display: 'block' }}>Active Role</label>
            <select 
              value={userRole || ''} 
              onChange={(e) => setActiveRole(e.target.value)}
              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', fontSize: '0.85rem' }}
            >
              {availableRoles.map(role => (
                <option key={role} value={role} style={{ color: 'black' }}>{role}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {userRole === 'Vendor' ? (
          <NavLink to="/dashboard/vendor-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🖨️</span>
            Printing Hub
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📊</span>
              Overview
            </NavLink>
            
            {userRole === 'Teacher' && (
              <>
                <NavLink to="/dashboard/teacher/my-class" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">👥</span>
                  My Class
                </NavLink>
                <NavLink to="/dashboard/teacher/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">📅</span>
                  Attendance Register
                </NavLink>
                <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">📝</span>
                  Continuous Assessment
                </NavLink>
                <NavLink to="/dashboard/teacher/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">✅</span>
                  Review Results
                </NavLink>
                <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">🛠️</span>
                  Utilities
                </NavLink>
              </>
            )}

            {userRole === 'SubjectTeacher' && (
              <>
                <NavLink to="/dashboard/teacher/assessment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">📝</span>
                  Continuous Assessment
                </NavLink>
                <NavLink to="/dashboard/teacher/utilities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">🛠️</span>
                  Utilities
                </NavLink>
              </>
            )}

            {userRole === 'Parent' && (
              <NavLink to="/dashboard/parent-hub" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">👨‍👩‍👧‍👦</span>
                My Kids
              </NavLink>
            )}

            {userRole !== 'Teacher' && userRole !== 'SubjectTeacher' && userRole !== 'Parent' && (
              <>
                {userRole !== 'Accountant' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isStaffOpen ? 'open' : ''}`} 
                      onClick={() => setIsStaffOpen(!isStaffOpen)}
                    >
                      <span className="nav-icon">👥</span>
                      Staff Management
                      <span className="chevron" style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isStaffOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </button>
                    {isStaffOpen && (
                      <div className="submenu" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <NavLink to="/dashboard/teachers" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Staff
                      </NavLink>
                      {userRole !== 'Principal' && (
                        <>
                          <NavLink to="/dashboard/allocations/class-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Class Allocations
                          </NavLink>
                          <NavLink to="/dashboard/allocations/subject-allocations" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
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
                      <span className="nav-icon">🎓</span>
                      Students
                    </NavLink>
                    <NavLink to="/dashboard/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon">🏫</span>
                      Classes
                    </NavLink>
                    <NavLink to="/dashboard/subjects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon">📚</span>
                      Subjects
                    </NavLink>
                  </>
                )}
                
                {userRole !== 'Admin' && userRole !== 'Accountant' && (
                  <NavLink to="/dashboard/approvals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">✅</span>
                    Approvals
                  </NavLink>
                )}

                {userRole !== 'Accountant' && userRole !== 'Parent' && userRole !== 'Teacher' && userRole !== 'SubjectTeacher' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isResultMgmtOpen ? 'open' : ''}`} 
                      onClick={() => setIsResultMgmtOpen(!isResultMgmtOpen)}
                    >
                      <span className="nav-icon">📊</span>
                      Result Management
                      <span className="chevron" style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isResultMgmtOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </button>
                    {isResultMgmtOpen && (
                      <div className="submenu" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <NavLink to="/dashboard/operations/result-management" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Compute Result
                        </NavLink>
                        <NavLink to="/dashboard/operations/review-results" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Review Result
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
                
                {(userRole === 'Accountant' || userRole === 'Superadmin') && (
                  <>
                    <NavLink to="/dashboard/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <span className="nav-icon">🎓</span>
                      Students
                    </NavLink>
                    <div className="nav-group">
                      <button 
                        className={`nav-item dropdown-toggle ${isFinanceOpen ? 'open' : ''}`} 
                        onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                      >
                        <span className="nav-icon">💰</span>
                        Finance
                        <span className="chevron" style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isFinanceOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      </button>
                      {isFinanceOpen && (
                        <div className="submenu" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                          <NavLink to="/dashboard/finance/verifications" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Online Verifications
                          </NavLink>
                          <NavLink to="/dashboard/finance/pos" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Point of Sale
                          </NavLink>
                          <NavLink to="/dashboard/finance/proxy-upload" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Proxy Upload
                          </NavLink>
                          <NavLink to="/dashboard/finance/ledger" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Student Ledger
                          </NavLink>
                          <NavLink to="/dashboard/operations/manual-clearance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', color: '#ef4444' }}>
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
                        <span className="nav-icon">⚙️</span>
                        Finance Setup
                        <span className="chevron" style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isFinanceSetupOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      </button>
                      {isFinanceSetupOpen && (
                        <div className="submenu" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                          <NavLink to="/dashboard/finance-setup/assets" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Upload Assets
                          </NavLink>
                          <NavLink to="/dashboard/finance-setup/builder" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Fee Builder
                          </NavLink>
                          <NavLink to="/dashboard/finance-setup/class-fees" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Class Fees
                          </NavLink>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <NavLink to="/dashboard/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">📈</span>
                  Reports
                </NavLink>

                {userRole !== 'Accountant' && userRole !== 'Principal' && (
                  <div className="nav-group">
                    <button 
                      className={`nav-item dropdown-toggle ${isOpsOpen ? 'open' : ''}`} 
                      onClick={() => setIsOpsOpen(!isOpsOpen)}
                    >
                      <span className="nav-icon">⚙️</span>
                      System Operations
                      <span className="chevron" style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: isOpsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </button>
                    {isOpsOpen && (
                      <div className="submenu" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <NavLink to="/dashboard/operations/roles" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Role Management
                        </NavLink>
                        <NavLink to="/dashboard/operations/term-setup" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Term Setup
                        </NavLink>
                        <NavLink to="/dashboard/operations/session" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Session Operation
                        </NavLink>

                        <NavLink to="/dashboard/operations/grading" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Grading Rules
                        </NavLink>
                        <NavLink to="/dashboard/operations/gate-scanner" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Gate Scanner
                        </NavLink>
                        <NavLink to="/dashboard/operations/gate-logs" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                          Gate Logs
                        </NavLink>
                        <NavLink to="/dashboard/operations/manual-clearance" className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', color: '#ef4444' }}>
                          Manual Clearance
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}
                
                {userRole !== 'Admin' && userRole !== 'Accountant' && (
                  <NavLink to="/dashboard/settings/school" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🛠️</span>
                    Settings
                  </NavLink>
                )}
              </>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item btn-logout" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
