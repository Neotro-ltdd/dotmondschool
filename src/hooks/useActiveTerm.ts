import { useState, useEffect } from 'react';
import { api } from '../services/api';

let cachedSession = '';
let cachedTerm = '';
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

export function useActiveTerm() {
  const [session, setSession] = useState<string>(cachedSession || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [term, setTerm] = useState<string>(cachedTerm || 'First Term');
  const [loading, setLoading] = useState<boolean>(!cachedSession);

  useEffect(() => {
    if (cachedSession && cachedTerm) {
      setSession(cachedSession);
      setTerm(cachedTerm);
      return;
    }

    if (!fetchPromise) {
      isFetching = true;
      fetchPromise = api.get('/setup/school-profile')
        .then(data => {
          if (data.currentSession) cachedSession = data.currentSession;
          if (data.currentTerm) cachedTerm = data.currentTerm;
        })
        .catch(err => {
          console.error('Failed to load active term', err);
          cachedSession = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
          cachedTerm = 'First Term';
        })
        .finally(() => {
          isFetching = false;
        });
    }

    fetchPromise.then(() => {
      setSession(cachedSession);
      setTerm(cachedTerm);
      setLoading(false);
    });
  }, []);

  return { session, term, setSession, setTerm, loading };
}
