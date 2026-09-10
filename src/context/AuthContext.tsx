import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cleanDuplicateTitles, formatDisplayName } from '../utils/nameFormatter';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  availableRoles: string[];
  setActiveRole: (role: string) => void;
  userName: string;
  userTitle: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  requiresPasswordChange: boolean;
  updateUserInfo: (data: {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    userName?: string;
  }) => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT parser
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('srms_token'));
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem('srms_active_role') || null,
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userTitle, setUserTitle] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('srms_token', token);
      const decoded = parseJwt(token);
      if (decoded) {
        const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (roleClaim) {
          const roles = Array.isArray(roleClaim) ? roleClaim : [roleClaim];
          const isDevAccount = roles.some(
            (r) => r === 'SuperAdmin' || r === 'Superadmin' || r === 'SystemAdmin',
          );
          setIsSuperAdmin(isDevAccount);

          if (isDevAccount) {
            const devRoles = [
              'SuperAdmin',
              'Director',
              'Admin',
              'Accountant',
              'Teacher',
              'SubjectTeacher',
              'Vendor',
              'Parent',
            ];
            setAvailableRoles(devRoles);
            const savedRole = localStorage.getItem('srms_active_role');
            if (savedRole && devRoles.includes(savedRole)) {
              setUserRole(savedRole);
            } else {
              setUserRole('SuperAdmin');
            }
          } else {
            setAvailableRoles(roles);
            // Use previously saved active role if it's valid for this user
            const savedRole = localStorage.getItem('srms_active_role');
            if (savedRole && roles.includes(savedRole)) {
              setUserRole(savedRole);
            } else {
              // Default priority: SystemAdmin -> Admin -> Teacher -> SubjectTeacher -> Staff
              if (roles.includes('SystemAdmin')) setUserRole('SystemAdmin');
              else if (roles.includes('Admin')) setUserRole('Admin');
              else if (roles.includes('Teacher')) setUserRole('Teacher');
              else if (roles.includes('SubjectTeacher')) setUserRole('SubjectTeacher');
              else if (roles.includes('Accountant')) setUserRole('Accountant');
              else setUserRole(roles[0]);
            }
          }
        } else {
          setAvailableRoles([]);
        }
        const email =
          decoded['email'] ||
          decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        if (email) {
          setUserEmail(email);
        }

        const firstName = decoded['first_name'] || '';
        const lastName = decoded['last_name'] || '';
        const title =
          decoded['title'] ||
          decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/title'] ||
          '';
        const overrideTitle = localStorage.getItem('srms_override_title');
        const finalTitle = overrideTitle !== null ? overrideTitle : title || null;
        setUserTitle(finalTitle);

        const overrideName = localStorage.getItem('srms_override_name');
        if (overrideName) {
          const cleanedOverride = cleanDuplicateTitles(overrideName);
          setUserName(cleanedOverride);
          if (cleanedOverride !== overrideName) {
            localStorage.setItem('srms_override_name', cleanedOverride);
          }
        } else if (firstName || lastName) {
          const fullName = `${firstName} ${lastName}`.trim();
          setUserName(formatDisplayName(finalTitle, fullName));
        } else if (email) {
          const namePart = email.split('@')[0];
          const defaultName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          setUserName(formatDisplayName(finalTitle, defaultName));
        }

        const avatar = decoded['avatar_url'] || null;
        const overrideAvatar = localStorage.getItem('srms_override_avatar');
        setUserAvatar(overrideAvatar !== null ? overrideAvatar : avatar);

        if (decoded['requires_password_change'] === 'true') {
          setRequiresPasswordChange(true);
        } else {
          setRequiresPasswordChange(false);
        }
      }
    } else {
      localStorage.removeItem('srms_token');
      localStorage.removeItem('srms_active_role');
      localStorage.removeItem('srms_override_avatar');
      localStorage.removeItem('srms_override_name');
      localStorage.removeItem('srms_override_title');
      setUserRole(null);
      setAvailableRoles([]);
      setUserEmail(null);
      setUserName('User');
      setUserTitle(null);
      setUserAvatar(null);
      setRequiresPasswordChange(false);
    }
  }, [token]);

  const updateUserInfo = (data: {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    userName?: string;
  }) => {
    if (data.avatarUrl !== undefined) {
      setUserAvatar(data.avatarUrl || null);
      if (data.avatarUrl) {
        localStorage.setItem('srms_override_avatar', data.avatarUrl);
      } else {
        localStorage.removeItem('srms_override_avatar');
      }
    }

    let activeTitle = userTitle;
    if (data.title !== undefined) {
      activeTitle = data.title || null;
      setUserTitle(activeTitle);
      if (activeTitle) {
        localStorage.setItem('srms_override_title', activeTitle);
      } else {
        localStorage.removeItem('srms_override_title');
      }
    }

    let baseName = '';
    if (data.userName) {
      baseName = cleanDuplicateTitles(data.userName);
    } else if (data.firstName !== undefined && data.lastName !== undefined) {
      baseName = `${data.firstName} ${data.lastName}`.trim();
    } else {
      baseName = cleanDuplicateTitles(userName);
    }

    if (baseName) {
      const formattedName = formatDisplayName(activeTitle, baseName);
      setUserName(formattedName);
      localStorage.setItem('srms_override_name', formattedName);
    }
  };

  const login = (newToken: string) => {
    localStorage.removeItem('srms_override_avatar');
    localStorage.removeItem('srms_override_name');
    localStorage.removeItem('srms_override_title');
    localStorage.removeItem('srms_activeBranchId');

    try {
      const decoded: any = parseJwt(newToken);
      if (decoded && decoded['branch_id']) {
        localStorage.setItem('srms_activeBranchId', decoded['branch_id']);
      }
    } catch (e) {
      console.warn('Failed to parse branch_id from token on login', e);
    }

    localStorage.setItem('srms_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('srms_token');
    localStorage.removeItem('srms_override_avatar');
    localStorage.removeItem('srms_override_name');
    localStorage.removeItem('srms_override_title');
    localStorage.removeItem('srms_activeBranchId');
    localStorage.removeItem('srms_active_role');
    setToken(null);
  };

  const setActiveRole = (role: string) => {
    if (availableRoles.includes(role)) {
      setUserRole(role);
      localStorage.setItem('srms_active_role', role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        userRole,
        isSuperAdmin,
        availableRoles,
        setActiveRole,
        userName,
        userTitle,
        userEmail,
        userAvatar,
        requiresPasswordChange,
        updateUserInfo,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
