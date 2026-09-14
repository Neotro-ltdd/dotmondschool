import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, API_ROOT, getTenantId, getPublicTenantDetails } from '../services/api';

export interface TenantFeatures {
  subscriptionTier: string;
  academics: boolean;
  finance: boolean;
  attendance: boolean;
  admissions: boolean;
  pushNotifications: boolean;
  maxBranchCount: number;
  maxStudentCount: number;
}

interface TenantContextType {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  features: TenantFeatures;
  refreshTenantDetails: () => Promise<void>;
  updateFeatures: (newFeatures: Partial<TenantFeatures>) => void;
}

const defaultFeatures: TenantFeatures = {
  subscriptionTier: 'EnterpriseSuite',
  academics: true,
  finance: true,
  attendance: true,
  admissions: true,
  pushNotifications: true,
  maxBranchCount: -1,
  maxStudentCount: -1,
};

const TenantContext = createContext<TenantContextType>({
  schoolName: 'Dotmond School',
  logoUrl: '/images/dotmond-logo-1.png',
  primaryColor: '#007bff',
  secondaryColor: '#cfecf7',
  features: defaultFeatures,
  refreshTenantDetails: async () => {},
  updateFeatures: () => {},
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolName] = useState('Dotmond School');
  const [logoUrl, setLogoUrl] = useState<string | null>('/images/dotmond-logo-1.png');
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [secondaryColor, setSecondaryColor] = useState('#cfecf7');
  const [features, setFeatures] = useState<TenantFeatures>(defaultFeatures);

  const updateFeatures = (newFeatures: Partial<TenantFeatures>) => {
    setFeatures((prev) => ({ ...prev, ...newFeatures }));
  };

  const refreshTenantDetails = async () => {
    const tenantId = getTenantId();
    if (tenantId) {
      try {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          // Override backend logo with system logo
          setLogoUrl('/images/dotmond-logo-1.png');
          if (details.primaryColor) {
            setPrimaryColor(details.primaryColor);
            document.documentElement.style.setProperty('--primary-color', details.primaryColor);
            document.documentElement.style.setProperty('--color-primary', details.primaryColor);
          }
          if (details.secondaryColor) {
            setSecondaryColor(details.secondaryColor);
            document.documentElement.style.setProperty('--secondary-color', details.secondaryColor);
            document.documentElement.style.setProperty('--color-secondary', details.secondaryColor);
            document.documentElement.style.setProperty('--color-accent', details.secondaryColor);
            document.documentElement.style.setProperty('--accent-color', details.secondaryColor);
          }
        }

        // If authenticated, fetch profile to get actual tenant features
        const token = localStorage.getItem('srms_token');
        if (token) {
          try {
            const profile = await api.get('/setup/school-profile');
            if (profile?.features) {
              setFeatures({
                subscriptionTier: profile.features.subscriptionTier || 'EnterpriseSuite',
                academics: profile.features.academics ?? true,
                finance: profile.features.finance ?? true,
                attendance: profile.features.attendance ?? true,
                admissions: profile.features.admissions ?? true,
                pushNotifications: profile.features.pushNotifications ?? true,
                maxBranchCount: profile.features.maxBranchCount ?? -1,
                maxStudentCount: profile.features.maxStudentCount ?? -1,
              });
            }
          } catch {
            // Ignore if profile fetch fails
          }
        }
      } catch (err) {
        console.error('Failed to load tenant details', err);
      }
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
    refreshTenantDetails();
  }, []);

  return (
    <TenantContext.Provider
      value={{ schoolName, logoUrl, primaryColor, secondaryColor, features, refreshTenantDetails, updateFeatures }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
