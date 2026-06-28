import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    userRole: string | null;
    userName: string;
    userEmail: string | null;
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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('User');
    const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);

    useEffect(() => {
        if (token) {
            localStorage.setItem('srms_token', token);
            const decoded = parseJwt(token);
            if (decoded) {
                if (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
                    setUserRole(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
                }
                
                const email = decoded['email'] || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
                if (email) {
                    setUserEmail(email);
                    // Extract name from email (e.g. admin@vsa.local -> Admin)
                    const namePart = email.split('@')[0];
                    setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
                }

                if (decoded['requires_password_change'] === 'true') {
                    setRequiresPasswordChange(true);
                } else {
                    setRequiresPasswordChange(false);
                }
            }
        } else {
            localStorage.removeItem('srms_token');
            setUserRole(null);
            setUserEmail(null);
            setUserName('User');
            setRequiresPasswordChange(false);
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, token, userRole, userName, userEmail, requiresPasswordChange, login, logout }}>
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
