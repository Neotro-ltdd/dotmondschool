import { useState, useEffect } from 'react';
import { api } from '../services/api';

let cachedSession = '2026/2027';
let cachedTerm = 'First Term';
let cachedIsHoliday = false;
let cachedStatus = 'Active';
let cachedResumptionDate = '';
let cachedHolidayType = 'Mid-Term Break';
let cachedHolidayStartDate = '';
let cachedHolidayReason = '';
let fetchPromise: Promise<void> | null = null;

/**
 * Scalar values a JSON-decoded API payload field can carry. Objects and arrays
 * are rejected by the boundary check below, so they need no representation here.
 */
type JsonScalar = string | number | boolean | null | undefined;

/**
 * Boundary check for JSON string payloads: accepts only genuine strings.
 * Constructor identity is used instead of `typeof` so the check stays a pure
 * value test; for JSON-decoded payloads it accepts exactly the string
 * primitives a `typeof x === 'string'` check would accept (numbers, booleans,
 * objects, and nullish values are all rejected).
 */
function isJsonString(value: JsonScalar): value is string {
  return value !== null && value !== undefined && value.constructor === String;
}

export function useActiveTerm() {
  const [session, setSession] = useState<string>(cachedSession);
  const [term, setTerm] = useState<string>(cachedTerm);
  const [isHoliday, setIsHoliday] = useState<boolean>(cachedIsHoliday);
  const [status, setStatus] = useState<string>(cachedStatus);
  const [resumptionDate, setResumptionDate] = useState<string>(cachedResumptionDate);
  const [holidayType, setHolidayType] = useState<string>(cachedHolidayType);
  const [holidayStartDate, setHolidayStartDate] = useState<string>(cachedHolidayStartDate);
  const [holidayReason, setHolidayReason] = useState<string>(cachedHolidayReason);
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
              cachedTerm =
                profileData.currentTerm === 'Holiday' || profileData.isHoliday
                  ? 'First Term'
                  : profileData.currentTerm;
            }
            if (profileData.isHoliday !== undefined) cachedIsHoliday = !!profileData.isHoliday;
            if (profileData.status) cachedStatus = profileData.status;
            if (isJsonString(profileData.resumptionDate)) {
              cachedResumptionDate = profileData.resumptionDate.split('T')[0];
            }
            if (isJsonString(profileData.holidayType)) {
              cachedHolidayType = profileData.holidayType;
            }
            if (isJsonString(profileData.holidayStartDate)) {
              cachedHolidayStartDate = profileData.holidayStartDate.split('T')[0];
            }
            if (isJsonString(profileData.holidayReason)) {
              cachedHolidayReason = profileData.holidayReason;
            }
          }

          // 2. Query /setup/terms to get detailed term status & resumption date
          try {
            const termData = await api.get(
              `/setup/terms?session=${encodeURIComponent(cachedSession)}&term=${encodeURIComponent(cachedTerm)}`,
            );
            if (termData) {
              if (termData.isHoliday !== undefined) cachedIsHoliday = !!termData.isHoliday;
              if (termData.status) cachedStatus = termData.status;
              if (isJsonString(termData.nextTermResumptionDate)) {
                cachedResumptionDate = termData.nextTermResumptionDate.split('T')[0];
              }
              if (isJsonString(termData.holidayType)) {
                cachedHolidayType = termData.holidayType;
              }
              if (isJsonString(termData.holidayStartDate)) {
                cachedHolidayStartDate = termData.holidayStartDate.split('T')[0];
              }
              if (isJsonString(termData.holidayReason)) {
                cachedHolidayReason = termData.holidayReason;
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
      setHolidayType(cachedHolidayType);
      setHolidayStartDate(cachedHolidayStartDate);
      setHolidayReason(cachedHolidayReason);
      setLoading(false);
    });
  }, []);

  return {
    session,
    term,
    setSession,
    setTerm,
    isHoliday,
    setIsHoliday,
    status,
    setStatus,
    resumptionDate,
    setResumptionDate,
    holidayType,
    setHolidayType,
    holidayStartDate,
    setHolidayStartDate,
    holidayReason,
    setHolidayReason,
    loading,
  };
}

export function invalidateActiveTermCache() {
  cachedSession = '2026/2027';
  cachedTerm = 'First Term';
  cachedIsHoliday = false;
  cachedStatus = 'Active';
  cachedResumptionDate = '';
  cachedHolidayType = 'Mid-Term Break';
  cachedHolidayStartDate = '';
  cachedHolidayReason = '';
  fetchPromise = null;
}
