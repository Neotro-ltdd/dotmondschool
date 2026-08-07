export const POPULATED_SESSIONS = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
  '2031/2032'
];

export function getSessionOptions(currentSession?: string): string[] {
  if (currentSession && !POPULATED_SESSIONS.includes(currentSession)) {
    return [currentSession, ...POPULATED_SESSIONS];
  }
  return POPULATED_SESSIONS;
}
