import { useState, useEffect } from 'react';
import { api } from '../services/api';

let cachedSession = '';
let cachedTerm = '';
let cachedIsHoliday = false;
let cachedStatus = 'Active';
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

export function useActiveTerm() {
  const [session, setSession] = useState<string>(cachedSession || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [term, setTerm] = useState<string>(cachedTerm || 'First Term');
  const [isHoliday, setIsHoliday] = useState<boolean>(cachedIsHoliday);
  const [status, setStatus] = useState<string>(cachedStatus);
  const [loading, setLoading] = useState<boolean>(!cachedSession);

  useEffect(() => {
    if (cachedSession && cachedTerm) {
      setSession(cachedSession);
      setTerm(cachedTerm);
      setIsHoliday(cachedIsHoliday);
      setStatus(cachedStatus);
      return;
    }

    if (!fetchPromise) {
      isFetching = true;
      fetchPromise = api.get('/setup/school-profile')
        .then(data => {
          if (data.currentSession) cachedSession = data.currentSession;
          if (data.currentTerm) cachedTerm = data.currentTerm;
          if (data.isHoliday !== undefined) cachedIsHoliday = data.isHoliday;
          if (data.status) cachedStatus = data.status;
        })
        .catch(err => {
          console.error('Failed to load active term', err);
          cachedSession = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
          cachedTerm = 'First Term';
          cachedIsHoliday = false;
          cachedStatus = 'Active';
        })
        .finally(() => {
          isFetching = false;
        });
    }

    fetchPromise.then(() => {
      setSession(cachedSession);
      setTerm(cachedTerm);
      setIsHoliday(cachedIsHoliday);
      setStatus(cachedStatus);
      setLoading(false);
    });
  }, []);

  return { session, term, setSession, setTerm, isHoliday, setIsHoliday, status, setStatus, loading };
}
