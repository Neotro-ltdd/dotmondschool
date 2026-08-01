import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    userRole: string | null;
    availableRoles: string[];
    setActiveRole: (role: string) => void;
    userName: string;
    userTitle: string | null;
    userEmail: string | null;
    userAvatar: string | null;
    requiresPasswordChange: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT parser
function parseJwt (token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('srms_token'));
    const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('srms_active_role') || null);
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
                    setAvailableRoles(roles);
                    // Use previously saved active role if it's valid for this user
                    const savedRole = localStorage.getItem('srms_active_role');
                    if (savedRole && roles.includes(savedRole)) {
                        setUserRole(savedRole);
                    } else {
                        // Default priority: SystemAdmin -> Admin -> Teacher -> SubjectTeacher -> Staff
                        if (roles.includes("SystemAdmin")) setUserRole("SystemAdmin");
                        else if (roles.includes("Admin")) setUserRole("Admin");
                        else if (roles.includes("Teacher")) setUserRole("Teacher");
                        else if (roles.includes("SubjectTeacher")) setUserRole("SubjectTeacher");
                        else if (roles.includes("Accountant")) setUserRole("Accountant");
                        else setUserRole(roles[0]);
                    }
                } else {
                    setAvailableRoles([]);
                }
                
                const email = decoded['email'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
                if (email) {
                    setUserEmail(email);
                }
                
                const firstName = decoded['first_name'] || '';
                const lastName = decoded['last_name'] || '';
                const title = decoded['title'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/title'] || '';
                setUserTitle(title || null);
                
                if (firstName || lastName) {
                    const fullName = `${lastName} ${firstName}`.trim();
                    setUserName(title ? `${title} ${fullName}` : fullName);
                } else if (email) {
                    const namePart = email.split('@')[0];
                    const defaultName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                    setUserName(title ? `${title} ${defaultName}` : defaultName);
                }
                
                const avatar = decoded['avatar_url'] || null;
                setUserAvatar(avatar);

                if (decoded['requires_password_change'] === 'true') {
                    setRequiresPasswordChange(true);
                } else {
                    setRequiresPasswordChange(false);
                }
            }
        } else {
            localStorage.removeItem('srms_token');
            localStorage.removeItem('srms_active_role');
            setUserRole(null);
            setAvailableRoles([]);
            setUserEmail(null);
            setUserName('User');
            setUserTitle(null);
            setUserAvatar(null);
            setRequiresPasswordChange(false);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    const setActiveRole = (role: string) => {
        if (availableRoles.includes(role)) {
            setUserRole(role);
            localStorage.setItem('srms_active_role', role);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, token, userRole, availableRoles, setActiveRole, userName, userTitle, userEmail, userAvatar, requiresPasswordChange, login, logout }}>
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
