export const POPULATED_SESSIONS = [
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
  '2031/2032',
  '2032/2033',
  '2033/2034',
];

export function getSessionOptions(currentSession?: string): string[] {
  const valid = POPULATED_SESSIONS.filter((s) => {
    const year = parseInt(s.split('/')[0], 10);
    return year >= 2025;
  });
  if (currentSession && !valid.includes(currentSession)) {
    const year = parseInt(currentSession.split('/')[0], 10);
    if (year >= 2025) {
      return [currentSession, ...valid];
    }
  }
  return valid;
}

export function getTermOptions(session?: string): string[] {
  if (session === '2025/2026') {
    return ['Third Term'];
  }
  return ['First Term', 'Second Term', 'Third Term'];
}
