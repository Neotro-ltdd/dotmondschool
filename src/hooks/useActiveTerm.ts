import { useState, useEffect } from 'react';
import { api } from '../services/api';

let cachedSession = '2026/2027';
let cachedTerm = 'First Term';
let cachedIsHoliday = false;
let cachedStatus = 'Active';
let cachedResumptionDate = '';
let fetchPromise: Promise<void> | null = null;

export function useActiveTerm() {
  const [session, setSession] = useState<string>(cachedSession);
  const [term, setTerm] = useState<string>(cachedTerm);
  const [isHoliday, setIsHoliday] = useState<boolean>(cachedIsHoliday);
  const [status, setStatus] = useState<string>(cachedStatus);
  const [resumptionDate, setResumptionDate] = useState<string>(cachedResumptionDate);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!fetchPromise) {
      fetchPromise = (async () => {
        try {
          // 1. Fetch main school profile
          const profileData = await api.get('/setup/school-profile');
          if (profileData) {
            if (profileData.currentSession) cachedSession = profileData.currentSession;
            if (profileData.currentTerm) {
              cachedTerm = (profileData.currentTerm === 'Holiday' || profileData.isHoliday) ? 'First Term' : profileData.currentTerm;
            }
            if (profileData.isHoliday !== undefined) cachedIsHoliday = !!profileData.isHoliday;
            if (profileData.status) cachedStatus = profileData.status;
            if (profileData.resumptionDate && typeof profileData.resumptionDate === 'string') {
              cachedResumptionDate = profileData.resumptionDate.split('T')[0];
            }
          }

          // 2. Query /setup/terms to get detailed term status & resumption date
          try {
            const termData = await api.get(`/setup/terms?session=${encodeURIComponent(cachedSession)}&term=${encodeURIComponent(cachedTerm)}`);
            if (termData) {
              if (termData.isHoliday !== undefined) cachedIsHoliday = !!termData.isHoliday;
              if (termData.status) cachedStatus = termData.status;
              if (termData.nextTermResumptionDate && typeof termData.nextTermResumptionDate === 'string') {
                cachedResumptionDate = termData.nextTermResumptionDate.split('T')[0];
              }
            }
          } catch (termErr) {
            // Ignore term setup 404 gracefully if not configured yet
          }
        } catch (err) {
          console.error('Failed to load active term profile:', err);
        }
      })();
    }

    fetchPromise.finally(() => {
      setSession(cachedSession);
      setTerm(cachedTerm);
      setIsHoliday(cachedIsHoliday);
      setStatus(cachedStatus);
      setResumptionDate(cachedResumptionDate);
      setLoading(false);
    });
  }, []);

  return { session, term, setSession, setTerm, isHoliday, setIsHoliday, status, setStatus, resumptionDate, loading };
}

export function invalidateActiveTermCache() {
  cachedSession = '2026/2027';
  cachedTerm = 'First Term';
  cachedIsHoliday = false;
  cachedStatus = 'Active';
  cachedResumptionDate = '';
  fetchPromise = null;
}

