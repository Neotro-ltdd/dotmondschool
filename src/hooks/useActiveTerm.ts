import { useState, useEffect } from 'react';
import { api } from '../services/api';

let cachedSession = '2026/2027';
let cachedTerm = 'First Term';
let cachedIsHoliday = false;
let cachedStatus = 'Active';
let cachedResumptionDate = '';
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

export function useActiveTerm() {
  const [session, setSession] = useState<string>(cachedSession);
  const [term, setTerm] = useState<string>(cachedTerm);
  const [isHoliday, setIsHoliday] = useState<boolean>(cachedIsHoliday);
  const [status, setStatus] = useState<string>(cachedStatus);
  const [resumptionDate, setResumptionDate] = useState<string>(cachedResumptionDate);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!fetchPromise) {
      isFetching = true;
      fetchPromise = (async () => {
        try {
          const data = await api.get('/setup/school-profile');
          if (data) {
            if (data.currentSession) cachedSession = data.currentSession;
            if (data.currentTerm) {
              cachedTerm = (data.currentTerm === 'Holiday' || data.isHoliday) ? 'First Term' : data.currentTerm;
            }
            if (data.isHoliday !== undefined) cachedIsHoliday = !!data.isHoliday;
            if (data.status) cachedStatus = data.status;
            if (data.resumptionDate && typeof data.resumptionDate === 'string') {
              cachedResumptionDate = data.resumptionDate.split('T')[0];
            }
          }
        } catch (err) {
          console.error('Failed to load active term profile:', err);
        } finally {
          isFetching = false;
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
