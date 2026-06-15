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
  schoolName: 'School Portal',
  logoUrl: null,
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  refreshTenantDetails: async () => {}
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolName] = useState('School Portal');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#007bff');
  const [secondaryColor, setSecondaryColor] = useState('#6c757d');

  const refreshTenantDetails = async () => {
    const tenantId = getTenantId();
    if (tenantId) {
      try {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          if (details.logoUrl) {
            const url = details.logoUrl.startsWith('http') || details.logoUrl.startsWith('data:') 
              ? details.logoUrl 
              : `${API_ROOT}${details.logoUrl}`;
            setLogoUrl(url);
          }
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
    refreshTenantDetails();
  }, []);

  return (
    <TenantContext.Provider value={{ schoolName, logoUrl, primaryColor, secondaryColor, refreshTenantDetails }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
