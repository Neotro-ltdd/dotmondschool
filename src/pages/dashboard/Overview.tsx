import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useActiveTerm } from '../../hooks/useActiveTerm';
import { api } from '../../services/api';
import SlideOver from '../../components/ui/SlideOver';
import AdminDashboardView from '../../components/dashboard/overview/AdminDashboardView';
import TeacherDashboardView from '../../components/dashboard/overview/TeacherDashboardView';
import AccountantDashboardView from '../../components/dashboard/overview/AccountantDashboardView';
import PrincipalDashboardView from '../../components/dashboard/overview/PrincipalDashboardView';
import ParentDashboardView from '../../components/dashboard/overview/ParentDashboardView';
import VendorDashboardView from '../../components/dashboard/overview/VendorDashboardView';
import { getParentDisplayName } from '../../utils/nameFormatter';
import './Dashboard.css';

interface SystemActivityItem {
  id: string;
  title: string;
  desc: string;
  initiatedBy?: string;
  time: string;
  timestamp: string;
  status: string;
  color: string;
}

export default function Overview() {
  const { userRole, userName, userTitle, updateUserInfo } = useAuth();
  const { schoolName } = useTenant();
  const { session, term, isHoliday, resumptionDate, holidayType } = useActiveTerm();

  const isHolidayMode =
    isHoliday || term === 'Holiday' || term === 'MTB (Mid Term Break)' || term === 'MTB';
  const displayTerm =
    term === 'MTB (Mid Term Break)' || term === 'MTB' ? 'Mid Term Break (MTB)' : term;

  const [showActivityLog, setShowActivityLog] = React.useState(false);
  const [accountantData, setAccountantData] = React.useState<any>(null);
  const [teacherData, setTeacherData] = React.useState<any>(null);
  const [adminData, setAdminData] = React.useState<any>(null);
  const [principalData, setPrincipalData] = React.useState<any>(null);
  const [vendorData, setVendorData] = React.useState<any>(null);
  const [parentData, setParentData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // Fetch Live Activity Log from Database
  const { data: activityLogs = [], isLoading: loadingActivities } = useQuery<SystemActivityItem[]>({
    queryKey: ['system-activities'],
    queryFn: async () => {
      const res = await api.get('/setup/activities');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
    enabled: showActivityLog,
    refetchInterval: 15000,
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!userRole) return;
      try {
        setLoading(true);
        if (userRole === 'Accountant' || userRole === 'Bursar') {
          const res = await api.get(
            `/finance/dashboard?session=${encodeURIComponent(session || '')}&term=${encodeURIComponent(term || '')}`
          );
          setAccountantData(res?.data || res);
        } else if (userRole === 'Teacher' || userRole === 'SubjectTeacher' || userRole === 'FormMaster') {
          const res = await api.get('/academics/teacher/dashboard');
          setTeacherData(res?.data || res);
        } else if (
          userRole === 'Admin' ||
          userRole === 'SuperAdmin' ||
          userRole === 'SystemAdmin'
        ) {
          let res;
          try {
            res = await api.get('/setup/admin/dashboard');
          } catch {
            if (userRole === 'SuperAdmin' || userRole === 'SystemAdmin') {
              res = await api.get('/platform/summary').catch(() => null);
            }
          }
          setAdminData(res?.data || res);
        } else if (userRole === 'Director' || userRole === 'Principal' || userRole === 'Chairman') {
          const [pData, pSummary] = await Promise.all([
            api.get('/academics/principal/dashboard').catch(() => null),
            api
              .get('/setup/admin/dashboard')
              .catch(() => null),
          ]);
          setPrincipalData({
            ...(pSummary?.data || pSummary || {}),
            ...(pData?.data || pData || {}),
          });
        } else if (userRole === 'Parent') {
          let res: any = null;
          try {
            res = await api.get('/parents/my-kids');
          } catch {
            res = await api.get('/parents/wards').catch(() => null);
          }
          const kids = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

          // Compute parent display name using child surname if parent name is missing or auto-generated
          const computedParentName = getParentDisplayName(userName, kids);
          if (
            computedParentName &&
            computedParentName !== userName &&
            (!userName ||
              userName.toLowerCase().startsWith('parent_') ||
              userName.toLowerCase().startsWith('parent-') ||
              userName.toLowerCase() === 'user' ||
              userName.toLowerCase() === 'parent')
          ) {
            updateUserInfo({ userName: computedParentName });
          }

          // Fetch real fee and attendance statuses for each kid
          let feeSummaries: any[] = [];
          let attendanceRates: number[] = [];

          if (kids.length > 0) {
            const results = await Promise.all(
              kids.map(async (k: any) => {
                const [invRes, attRes] = await Promise.all([
                  api.get(`/parents/my-kids/${k.id}/invoices`).catch(() => null),
                  api
                    .get(
                      `/reports/attendance/student/${k.id}?session=${encodeURIComponent(session || '2026/2027')}&term=${encodeURIComponent(term || 'First Term')}`,
                    )
                    .catch(() => null),
                ]);

                const invoices = invRes?.invoices || [];
                const unpaid = invoices.filter(
                  (i: any) =>
                    i.status !== 'Completed' && i.status !== 'Verified' && i.status !== 'Paid',
                );
                const isOwing = unpaid.length > 0 || k.isCleared === false;
                const owingAmount = unpaid.reduce(
                  (sum: number, i: any) => sum + ((i.totalAmount || 0) - (i.amountPaid || 0)),
                  0,
                );

                const attRate =
                  attRes?.attendancePercentage ??
                  (attRes?.history && attRes.history.length > 0
                    ? Math.round(
                        (attRes.history.filter((h: any) => h.status === 'Present').length /
                          attRes.history.length) *
                          100,
                      )
                    : null);

                return {
                  kidId: k.id,
                  isOwing,
                  owingAmount,
                  invoicesCount: invoices.length,
                  attendanceRate: attRate,
                };
              }),
            );

            feeSummaries = results;
            attendanceRates = results
              .map((r) => r.attendanceRate)
              .filter((r): r is number => r !== null && !isNaN(r));
          }

          const hasOwing = feeSummaries.some((f) => f.isOwing);
          const totalOwing = feeSummaries.reduce((sum, f) => sum + f.owingAmount, 0);
          const clearedCount = feeSummaries.filter((f) => !f.isOwing).length;
          const owingCount = feeSummaries.filter((f) => f.isOwing).length;
          const avgAttendance =
            attendanceRates.length > 0
              ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
              : 96;

          setParentData({
            kids,
            feeSummaries,
            totalOwing,
            hasOwing,
            clearedCount,
            owingCount,
            averageAttendance: avgAttendance,
            computedParentName,
          });
        } else if (userRole === 'Vendor' || userRole === 'GateSecurity') {
          const res = await api.get('/vendor/dashboard');
          setVendorData(res?.data || res);
        } else {
          // Only attempt admin endpoints if the user has an Admin role
          const isAdmin = ['Admin', 'SuperAdmin', 'Superadmin', 'SystemAdmin'].includes(userRole);
          if (isAdmin) {
            let res;
            try {
              res = await api.get('/setup/admin/dashboard');
            } catch {
              if (['SuperAdmin', 'Superadmin', 'SystemAdmin'].includes(userRole)) {
                res = await api.get('/platform/summary').catch(() => null);
              }
            }
            setAdminData(res?.data || res);
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, session, term]);

  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  React.useEffect(() => {
    api
      .get('/identity/my-permissions')
      .then((res: any) => {
        if (res && Array.isArray(res.permissions)) {
          setUserPermissions(res.permissions);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overview-page-container">
      {userRole === 'Accountant' || userRole === 'Bursar' ? (
        <AccountantDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          accountantData={accountantData}
          loading={loading}
        />
      ) : userRole === 'Teacher' || userRole === 'SubjectTeacher' ? (
        <TeacherDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          teacherData={teacherData}
          loading={loading}
        />
      ) : userRole === 'Director' || userRole === 'Principal' ? (
        <PrincipalDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          principalData={principalData}
          loading={loading}
        />
      ) : userRole === 'Parent' ? (
        <ParentDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          parentData={parentData}
          loading={loading}
        />
      ) : userRole === 'Vendor' || userRole === 'GateSecurity' ? (
        <VendorDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          vendorData={vendorData}
          loading={loading}
        />
      ) : (
        <AdminDashboardView
          userName={userName || undefined}
          userTitle={userTitle || undefined}
          userRole={userRole || undefined}
          userPermissions={userPermissions}
          session={session || '2026/2027'}
          displayTerm={displayTerm || 'First Term'}
          isHolidayMode={isHolidayMode}
          resumptionDate={resumptionDate}
          holidayType={holidayType}
          adminData={adminData}
          loading={loading}
          onToggleActivityLog={() => setShowActivityLog((prev) => !prev)}
        />
      )}

      {/* ════════ AUDIT & ACTIVITY SLIDEOVER ════════ */}
      <SlideOver
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        title="Recent System Activity Log"
        subtitle="Live audit tracking of administrative actions across the portal."
        width="md"
        footer={
          <button
            type="button"
            onClick={() => setShowActivityLog(false)}
            className="banner-btn"
            style={{
              background: '#000080',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Close Panel
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loadingActivities ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              Loading recent system activity...
            </div>
          ) : activityLogs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              No system activity logs found.
            </div>
          ) : (
            activityLogs.map((item, i) => (
              <div
                key={item.id || i}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FAFCFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{item.title}</strong>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: item.color || '#10B981',
                      background: `${item.color || '#10B981'}15`,
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.status || 'Success'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {item.initiatedBy || 'Initiated by School Administrator'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </SlideOver>
    </div>
  );
}
