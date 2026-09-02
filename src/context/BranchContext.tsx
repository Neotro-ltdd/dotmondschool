import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Branch {
    id: string;
    name: string;
    code: string;
    address: string;
    phoneNumber: string;
    email: string;
    isMainBranch: boolean;
    isActive: boolean;
}

interface BranchContextType {
    branches: Branch[];
    activeBranchId: string | null;
    setActiveBranchId: (id: string | null) => void;
    isGlobalRole: boolean;
    assignedBranchName: string;
    loading: boolean;
    refreshBranches: () => Promise<void>;
}

const GLOBAL_ROLES = ['SuperAdmin', 'Superadmin', 'SystemAdmin', 'Director', 'Chairman', 'Vendor'];

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const { userRole, isAuthenticated } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() => {
        const saved = localStorage.getItem('srms_activeBranchId');
        return (saved && saved !== 'ALL') ? saved : null;
    });
    const [loading, setLoading] = useState<boolean>(false);

    const isGlobalRole = React.useMemo(() => {
        if (!userRole) return false;
        return GLOBAL_ROLES.includes(userRole);
    }, [userRole]);

    const fetchBranches = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await api.get('/setup/branches');
            if (Array.isArray(data)) {
                setBranches(data.filter(b => b.isActive));
            }
        } catch (err) {
            console.error('Failed to fetch campus branches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchBranches();
        }
    }, [isAuthenticated]);

    const setActiveBranchId = (id: string | null) => {
        setActiveBranchIdState(id);
        if (id) {
            localStorage.setItem('srms_activeBranchId', id);
        } else {
            localStorage.setItem('srms_activeBranchId', 'ALL');
        }
    };

    const assignedBranchName = React.useMemo(() => {
        if (activeBranchId) {
            const found = branches.find(b => b.id === activeBranchId);
            if (found) return found.name;
        }
        const main = branches.find(b => b.isMainBranch);
        return main ? main.name : 'Main Campus';
    }, [activeBranchId, branches]);

    return (
        <BranchContext.Provider value={{
            branches,
            activeBranchId,
            setActiveBranchId,
            isGlobalRole,
            assignedBranchName,
            loading,
            refreshBranches: fetchBranches
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranchContext() {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranchContext must be used within a BranchProvider');
    }
    return context;
}
