import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, API_ROOT, getTenantId, getPublicTenantDetails } from '../services/api';

interface TenantContextType {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  refreshTenantDetails: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  schoolName: 'Dotmond School',
  logoUrl: '/images/dotmond-logo-1.png',
  primaryColor: '#007bff',
  secondaryColor: '#cfecf7',
  refreshTenantDetails: async () => { }
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolName] = useState('Dotmond School');
  const [logoUrl, setLogoUrl] = useState<string | null>('/images/dotmond-logo-1.png');
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [secondaryColor, setSecondaryColor] = useState('#cfecf7');

  const refreshTenantDetails = async () => {
    const tenantId = getTenantId();
    if (tenantId) {
      try {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          // Override backend logo with the new system logo
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
      } catch (err) {
        console.error("Failed to load tenant details", err);
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
    <TenantContext.Provider value={{ schoolName, logoUrl, primaryColor, secondaryColor, refreshTenantDetails }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
