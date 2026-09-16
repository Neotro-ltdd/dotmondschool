import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api, getTenantId } from '../../../services/api';
import { Search, QrCode, Clock } from 'lucide-react';

interface ScanResult {
  message?: string;
  studentName?: string;
  staffName?: string;
  staffCategory?: string;
  designation?: string;
  time?: string;
  status?: string;
}

const ManualScan: React.FC = () => {
  const { userName } = useAuth();
  const [manualPayload, setManualPayload] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (name: string) => {
    if (!name) return 'ID';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCleanMessage = (result: ScanResult) => {
    if (result.status === 'AlreadyClockedIn') {
      return result.message || 'Staff or student already clocked in today.';
    }
    if (result.status === 'ClockIn') {
      return 'Morning gate attendance successfully verified and recorded.';
    }
    if (result.status === 'ClockOut') {
      return 'Evening gate checkout successfully verified and recorded.';
    }
    return result.message || 'Gate attendance recorded successfully.';
  };

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const formatPayload = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return trimmed;

    // Check if it's already a valid Base64 string starting with RMS|
    try {
      const decoded = atob(trimmed);
      if (decoded.startsWith('RMS|')) {
        return trimmed;
      }
    } catch (e) {}

    // Check if it's plain text starting with RMS|
    if (trimmed.startsWith('RMS|')) {
      return btoa(trimmed);
    }

    // Check if it's a Guid (36 chars: 8-4-4-4-12)
    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(trimmed)) {
      const tenantId = getTenantId() || '1';
      return btoa(`RMS|${tenantId}|${trimmed}`);
    }

    return trimmed;
  };

  const handleManualSubmit = async () => {
    const trimmedInput = manualPayload.trim();
    if (!trimmedInput || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setScanResult(null);

    const payloadToSend = formatPayload(trimmedInput);

    try {
      const res = await api.post('/attendance/scan', {
        qrPayload: payloadToSend,
        scannedById: userName,
      });
      const resultData = res?.data || res;
      setScanResult(resultData);

      // Audio feedback
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      } catch (e) {}
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.data?.message ||
        err?.data?.Message ||
        err?.message ||
        'Failed to verify ID or log attendance.';
      setError(errorMsg);

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      } catch (e) {}
    } finally {
      setIsProcessing(false);
      setManualPayload('');
    }
  };

  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
        }}
      >
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <QrCode size={24} style={{ color: '#0f172a' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Manual Scan
          </h1>
        </div>

        {/* UPPER DISPLAY AREA (Replaces camera, shows Profile / Scan Result) */}
        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
          {isProcessing ? (
            <div
              style={{
                width: '100%',
                minHeight: '200px',
                borderRadius: '20px',
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: '#38bdf8',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '1rem',
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Verifying Identity...
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', margin: 0 }}>
                Logging gate attendance and retrieving profile.
              </p>
            </div>
          ) : scanResult ? (
            /* SUCCESS VERIFIED PROFILE CARD */
            <div
              style={{
                width: '100%',
                borderRadius: '20px',
                padding: '1.25rem 1.5rem',
                background:
                  scanResult.status === 'AlreadyClockedIn'
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : scanResult.status === 'Offline'
                    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor:
                  scanResult.status === 'AlreadyClockedIn'
                    ? '#f97316'
                    : scanResult.status === 'Offline'
                    ? '#f59e0b'
                    : '#10b981',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 12px 28px -5px rgba(5, 150, 105, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Top Status Header Pill */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '0.35rem 0.9rem',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {scanResult.status === 'AlreadyClockedIn'
                    ? 'ℹ️ ALREADY CLOCKED IN TODAY'
                    : scanResult.status === 'Offline'
                    ? '⏳ SAVED OFFLINE'
                    : '✓ ATTENDANCE RECORDED'}
                </span>
              </div>

              {/* Profile Avatar & Name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', margin: '0.4rem 0', width: '100%' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(scanResult.staffName || scanResult.studentName || '')}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
                    {scanResult.staffName || scanResult.studentName || 'Attendance Logged'}
                  </h3>
                  {(scanResult.staffCategory || scanResult.designation) && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.95)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {scanResult.staffCategory ? `${scanResult.staffCategory} Staff` : scanResult.designation}
                    </span>
                  )}
                </div>
              </div>

              {/* Verified Message */}
              <p
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '12px',
                  width: '100%',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  margin: '0.75rem 0 0 0',
                }}
              >
                {getCleanMessage(scanResult)}
              </p>

              {/* Timestamp Badge */}
              {scanResult.time && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.25)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Clock size={12} />
                  <span>Clocked in at {formatTime(scanResult.time)}</span>
                </div>
              )}
            </div>
          ) : error ? (
            /* ERROR NOTIFICATION CARD */
            <div
              style={{
                width: '100%',
                borderRadius: '20px',
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
                border: '1px solid #ef4444',
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', opacity: 0.9 }}>
                ✕ IDENTITY VERIFICATION FAILED
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95, fontWeight: 500 }}>{error}</p>
            </div>
          ) : (
            /* DEFAULT UPPER PLACEHOLDER (No camera needed) */
            <div
              style={{
                width: '100%',
                minHeight: '200px',
                borderRadius: '20px',
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: '1.75rem 1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <Search size={26} style={{ color: '#38bdf8' }} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                Manual ID Verification
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.5rem', margin: '0.5rem 0 0 0', maxWidth: '340px', lineHeight: 1.4 }}>
                Enter a Student or Staff ID, Reg No, Phone Number or Email below to log attendance and view profile.
              </p>
            </div>
          )}
        </div>

        {/* MANUAL ID ENTRY CARD (Matching Image 2 design) */}
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '1.25rem',
            background: '#ffffff',
          }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Search size={15} style={{ color: '#64748b' }} />
              MANUAL ID VERIFICATION
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
              Student / Staff ID
            </span>
          </div>

          {/* Input & Action Row */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Enter Student or Staff ID, Reg No, Phone or Email..."
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualPayload.trim() && !isProcessing) {
                    handleManualSubmit();
                  }
                }}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '0.85rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  color: '#0f172a',
                  background: '#ffffff',
                  fontWeight: 500,
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={!manualPayload.trim() || isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                background: !manualPayload.trim() || isProcessing ? '#94a3b8' : '#3b5284',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: !manualPayload.trim() || isProcessing ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(59, 82, 132, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <QrCode size={16} />
              <span>{isProcessing ? 'Verifying...' : 'Submit Scan'}</span>
            </button>
          </div>

          {/* Hint Text */}
          <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '0.85rem', margin: '0.85rem 0 0 0', lineHeight: 1.35 }}>
            Align a Student or Staff ID card within the scanning frame above or enter ID details manually.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualScan;
