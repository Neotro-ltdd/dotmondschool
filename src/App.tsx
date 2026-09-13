import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { DialogProvider } from './context/DialogContext';
import { BranchProvider } from './context/BranchContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import SchoolConfig from './pages/dashboard/settings/SchoolConfig';
import Classes from './pages/dashboard/academics/Classes';
import Subjects from './pages/dashboard/academics/Subjects';
import Teachers from './pages/dashboard/teachers/Teachers';
import Students from './pages/dashboard/students/Students';
import Approvals from './pages/dashboard/approvals/Approvals';
import OnlineVerifications from './pages/dashboard/finance/OnlineVerifications';
import PointOfSale from './pages/dashboard/finance/PointOfSale';
import ProxyPaymentUpload from './pages/dashboard/finance/ProxyPaymentUpload';
import StudentLedger from './pages/dashboard/finance/StudentLedger';
import TermInvoices from './pages/dashboard/finance/TermInvoices';
import FinancialReportsHub from './pages/dashboard/finance/FinancialReportsHub';
import ReceiptViewer from './pages/dashboard/finance/ReceiptViewer';
import FinanceAssets from './pages/dashboard/finance-setup/FinanceAssets';
import FinanceFeeBuilder from './pages/dashboard/finance-setup/FinanceFeeBuilder';
import ClassFees from './pages/dashboard/finance-setup/ClassFees';
import Reports from './pages/dashboard/reports/Reports';
import AcademicAnalysis from './pages/dashboard/reports/AcademicAnalysis';
import AttendanceReport from './pages/dashboard/reports/AttendanceReport';
import ResultSheetViewer from './pages/dashboard/reports/ResultSheetViewer';
import ResultSample from './pages/dashboard/reports/ResultSample';
import ResultManagement from './pages/dashboard/results/ResultManagement';
import AdminReviewResults from './pages/dashboard/results/AdminReviewResults';
import RoleManagement from './pages/dashboard/admin/operations/RoleManagement';
import SubjectAllocations from './pages/dashboard/admin/operations/SubjectAllocations';
import ClassAllocations from './pages/dashboard/admin/operations/ClassAllocations';
import SessionOperation from './pages/dashboard/admin/operations/SessionOperation';
import TermSetup from './pages/dashboard/admin/operations/TermSetup';
import TemplateGallery from './pages/dashboard/admin/operations/TemplateGallery';
import GradingRules from './pages/dashboard/admin/operations/GradingRules';
import GateScanner from './pages/dashboard/admin/GateScanner';
import GateAttendanceLog from './pages/dashboard/admin/GateAttendanceLog';
import ManualClearance from './pages/dashboard/admin/ManualClearance';
import MasterLogin from './pages/auth/MasterLogin';
import SystemLayout from './components/layout/SystemLayout';
import SystemOverview from './pages/dashboard/admin/SystemOverview';
import SystemSchools from './pages/dashboard/admin/SystemSchools';
import SchoolManagement from './pages/dashboard/admin/SchoolManagement';
import SystemSettings from './pages/dashboard/admin/SystemSettings';
import PromotionManagement from './pages/dashboard/operations/PromotionManagement';
import { BranchManagement } from './pages/dashboard/operations/BranchManagement';
import MyClass from './pages/dashboard/teacher/MyClass';
import ContinuousAssessment from './pages/dashboard/teacher/ContinuousAssessment';
import AttendanceRegister from './pages/dashboard/teacher/AttendanceRegister';
import Utilities from './pages/dashboard/teacher/Utilities';
import TeacherResults from './pages/dashboard/teacher/TeacherResults';
import StaffAttendanceReport from './pages/dashboard/attendance/StaffAttendanceReport';
import ParentHub from './pages/dashboard/parent/ParentHub';
import VendorHub from './pages/dashboard/vendor/VendorHub';
import PublicAdmissionForm from './pages/public/PublicAdmissionForm';
import PublicScheduleVisitForm from './pages/public/PublicScheduleVisitForm';
import AdmissionsHub from './pages/dashboard/admissions/AdmissionsHub';
import ProfileSettings from './pages/dashboard/ProfileSettings';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { InstallAppPrompt } from './components/pwa/InstallAppPrompt';
import { PwaUpdateBanner } from './components/pwa/PwaUpdateBanner';
import { PWAProvider } from './context/PWAContext';
import './App.css';

function App() {
  return (
    <PWAProvider>
      <ThemeProvider>
        <OfflineIndicator />
        <PwaUpdateBanner />
        <TenantProvider>
        <AuthProvider>
          <BranchProvider>
            <DialogProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/apply-admission" element={<PublicAdmissionForm />} />
                  <Route path="/schedule-visit" element={<PublicScheduleVisitForm />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/master-login" element={<MasterLogin />} />

                  <Route path="/system-admin" element={<SystemLayout />}>
                    <Route index element={<SystemOverview />} />
                    <Route path="schools" element={<SystemSchools />} />
                    <Route path="schools/:id" element={<SchoolManagement />} />
                    <Route path="settings" element={<SystemSettings />} />
                  </Route>

                  {/* Protected Dashboard Routes */}
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="settings/school" element={<SchoolConfig />} />
                    <Route path="classes" element={<Classes />} />
                    <Route path="subjects" element={<Subjects />} />
                    <Route path="test-result-sample" element={<ResultSample />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="staff" element={<Teachers />} />
                    <Route path="admin/staff" element={<Teachers />} />
                    <Route path="admin/students" element={<Students />} />
                    <Route path="staff-attendance" element={<StaffAttendanceReport />} />
                    <Route path="gate-scanner" element={<GateScanner />} />
                    <Route path="scanner-preview" element={<GateScanner />} />
                    <Route path="gate-logs" element={<GateAttendanceLog />} />
                    <Route path="students" element={<Students />} />
                    <Route path="approvals" element={<Approvals />} />
                    <Route path="finance">
                      <Route path="invoices" element={<TermInvoices />} />
                      <Route path="verifications" element={<OnlineVerifications />} />
                      <Route path="pos" element={<PointOfSale />} />
                      <Route path="proxy-upload" element={<ProxyPaymentUpload />} />
                      <Route path="ledger" element={<StudentLedger />} />
                      <Route path="reports" element={<FinancialReportsHub />} />
                      <Route path="receipt/:paymentId" element={<ReceiptViewer />} />
                    </Route>
                    <Route path="finance-setup">
                      <Route path="assets" element={<FinanceAssets />} />
                      <Route path="builder" element={<FinanceFeeBuilder />} />
                      <Route path="class-fees" element={<ClassFees />} />
                    </Route>
                    <Route path="reports">
                      <Route index element={<Reports />} />
                      <Route path="academic-analysis" element={<AcademicAnalysis />} />
                      <Route path="attendance" element={<AttendanceReport />} />
                      <Route path="result/:studentId/:batchId" element={<ResultSheetViewer />} />
                    </Route>
                    <Route path="operations">
                      <Route path="roles" element={<RoleManagement />} />
                      <Route path="term-setup" element={<TermSetup />} />
                      <Route path="session" element={<SessionOperation />} />
                      <Route path="template-gallery" element={<TemplateGallery />} />
                      <Route path="grading" element={<GradingRules />} />
                      <Route path="gate-scanner" element={<GateScanner />} />
                      <Route path="gate-logs" element={<GateAttendanceLog />} />
                      <Route path="result-management" element={<ResultManagement />} />
                      <Route path="review-results" element={<AdminReviewResults />} />
                      <Route path="manual-clearance" element={<ManualClearance />} />
                      <Route path="promotions" element={<PromotionManagement />} />
                      <Route path="branches" element={<BranchManagement />} />
                    </Route>
                    <Route path="allocations">
                      <Route path="class-allocations" element={<ClassAllocations />} />
                      <Route path="subject-allocations" element={<SubjectAllocations />} />
                    </Route>
                    <Route path="teacher">
                      <Route path="my-class" element={<MyClass />} />
                      <Route path="attendance" element={<AttendanceRegister />} />
                      <Route path="assessment" element={<ContinuousAssessment />} />
                      <Route path="utilities" element={<Utilities />} />
                      <Route path="results" element={<TeacherResults />} />
                    </Route>
                    <Route path="parent-hub" element={<ParentHub />} />
                    <Route path="parent" element={<ParentHub />} />
                    <Route path="vendor-hub" element={<VendorHub />} />
                    <Route path="admissions" element={<AdmissionsHub />} />
                    <Route path="profile" element={<ProfileSettings />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </DialogProvider>
          </BranchProvider>
        </AuthProvider>
      </TenantProvider>
      <InstallAppPrompt />
    </ThemeProvider>
    </PWAProvider>
  );
}

export default App;
