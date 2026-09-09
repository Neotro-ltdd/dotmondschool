import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { userRole, isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isDeveloperRoot =
    isSuperAdmin ||
    userRole === 'Director' ||
    userRole === 'Superadmin' ||
    userRole === 'SuperAdmin' ||
    userRole === 'SystemAdmin' ||
    userRole === 'Admin';

  useEffect(() => {
    let isMounted = true;
    api
      .get('/identity/my-permissions')
      .then((res: any) => {
        if (isMounted && res && Array.isArray(res.permissions)) {
          setPermissions(res.permissions);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasPermission = (permKey: string): boolean => {
    if (isDeveloperRoot) return true;
    return permissions.includes(permKey);
  };

  const canManageClasses = isDeveloperRoot || permissions.includes('classes.manage');
  const canViewClasses = isDeveloperRoot || permissions.includes('classes.view') || permissions.includes('classes.manage');
  const canPrintStudentIdCard = isDeveloperRoot || permissions.includes('students.idcard') || permissions.includes('vendor.idcards');

  return {
    permissions,
    loading,
    hasPermission,
    canManageClasses,
    canViewClasses,
    canPrintStudentIdCard,
    isDeveloperRoot,
  };
}
