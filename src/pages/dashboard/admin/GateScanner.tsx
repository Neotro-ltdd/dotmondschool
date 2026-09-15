import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Search } from 'lucide-react';
import { api, getTenantId } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import './GateScanner.css';

interface ScanResult {
  message: string;
  studentName?: string;
  staffName?: string;
  time: string;
  status: string;
  staffCategory?: string;
  designation?: string;
}

const GateScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [manualPayload, setManualPayload] = useState('');
  const [cameraError, setCameraError] = useState<boolean>(false);
  const { userName } = useAuth();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // Load offline queue on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offline_scans_queue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (e) {}
    }
  }, []);

  const clearOfflineQueue = () => {
    localStorage.removeItem('offline_scans_queue');
    setOfflineQueue([]);
  };

  // Background sync interval for offline scans
  useEffect(() => {
    const syncOfflineScans = async () => {
      const savedQueue = localStorage.getItem('offline_scans_queue');
      if (!savedQueue) return;

      let queue: string[];
      try {
        queue = JSON.parse(savedQueue);
      } catch (e) {
        return;
      }

      if (queue.length === 0) return;

      const payload = queue[0];
      try {
        await api.post('/attendance/scan', { qrPayload: payload, scannedById: userName });
      } catch (err: any) {
        console.warn('Offline scan sync processed/discarded:', err);
      } finally {
        queue.shift();
        localStorage.setItem('offline_scans_queue', JSON.stringify(queue));
        setOfflineQueue([...queue]);
      }
    };

    const interval = setInterval(syncOfflineScans, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(false);
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (!isProcessingRef.current) {
              onScanSuccess(decodedText);
            }
          },
          onScanFailure,
        );
      } catch (err) {
        console.error('Camera startup failed:', err);
        if (isMounted) setCameraError(true);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current?.clear();
            })
            .catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Support for Physical USB Scanners
  useEffect(() => {
    let scannedString = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();

      if (currentTime - lastKeyTime > 50) {
        scannedString = '';
      }

      lastKeyTime = currentTime;

      if (e.key === 'Enter' && scannedString.length > 0) {
        e.preventDefault();
        if (!isProcessingRef.current) {
          onScanSuccess(scannedString);
        }
        scannedString = '';
      } else if (e.key !== 'Enter' && e.key.length === 1) {
        scannedString += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      return result.message || 'Staff member already clocked in today.';
    }
    if (result.status === 'ClockIn') {
      return 'Morning gate attendance successfully verified and recorded.';
    }
    if (result.status === 'ClockOut') {
      return 'Evening gate checkout successfully verified and recorded.';
    }
    return result.message || 'Gate attendance recorded.';
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
    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (guidRegex.test(trimmed)) {
      const tenantId = getTenantId() || '1';
      return btoa(`RMS|${tenantId}|${trimmed}`);
    }

    return trimmed;
  };

  const onScanSuccess = async (rawDecodedText: string) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause(true);
    }

    const payloadToSend = formatPayload(rawDecodedText);

    try {
      setError(null);
      const res = await api.post('/attendance/scan', {
        qrPayload: payloadToSend,
        scannedById: userName,
      });
      const resultData = res?.data || res;
      setScanResult(resultData);

      // Play a success beep
      try {
        // SAFETY: webkitAudioContext is Safari's legacy alias of AudioContext with the same constructor; wrapped in try/catch so unsupported browsers silently skip the beep.
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

      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 6000);
    } catch (err: any) {
      const errorMsg =
        err?.data?.message || err?.data?.Message || err?.message || 'Failed to scan ID.';

      if (!err.response && !err.status && err.message === 'Failed to fetch') {
        // Network Error -> Queue Offline
        const savedQueue = localStorage.getItem('offline_scans_queue');
        let queue: string[] = [];
        if (savedQueue) {
          try {
            queue = JSON.parse(savedQueue);
          } catch (e) {}
        }
        if (!queue.includes(rawDecodedText)) {
          queue.push(rawDecodedText);
          localStorage.setItem('offline_scans_queue', JSON.stringify(queue));
          setOfflineQueue(queue);
        }

        setScanResult({
          message: 'Saved to offline queue',
          studentName: 'Offline Scan Saved',
          time: new Date().toISOString(),
          status: 'Offline',
        });

        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          setScanResult(null);
        }, 6000);
      } else {
        setError(errorMsg);

        // Play error beep
        try {
          // SAFETY: webkitAudioContext is Safari's legacy alias of AudioContext with the same constructor; wrapped in try/catch so unsupported browsers silently skip the beep.
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

        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 6000);
      }
    } finally {
      // Reduced debounce timeout to keep the line moving, but still prevents double-fires
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (scannerRef.current && scannerRef.current.isScanning === false) {
          scannerRef.current.resume();
        } else if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 2000);
    }
  };

  const onScanFailure = (error: any) => {
    // ignore frequent scan failures
  };

  return (
    <div className="gate-scanner-page fade-in">
      <div className="scanner-main-card">
        {offlineQueue.length > 0 && (
          <div className="offline-queue-badge">
            <span className="offline-badge-pill">
              {offlineQueue.length} Offline Scan(s)
            </span>
            <button
              type="button"
              onClick={clearOfflineQueue}
              className="offline-clear-btn"
              title="Clear saved offline queue"
            >
              Clear
            </button>
          </div>
        )}

        <h2 className="scanner-header-title">
          <QrCode size={26} style={{ color: 'var(--primary-color, #000080)' }} />
          Gate Scanner
        </h2>

        {/* Camera Viewport Frame */}
        <div className="camera-viewport-frame">
          <style>
            {`
              #qr-reader {
                width: 100% !important;
              }
            `}
          </style>
          <div id="qr-reader"></div>
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 20 }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            </div>
          )}

          {/* OVERLAYS */}
          {scanResult && !isProcessing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                background: scanResult.status === 'Offline' ? 'rgba(234, 88, 12, 0.95)' : scanResult.status === 'AlreadyClockedIn' ? 'rgba(217, 119, 6, 0.95)' : 'rgba(5, 150, 105, 0.95)',
                color: '#fff',
                padding: '1rem',
              }}
            >
              <svg className="w-12 h-12 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d={
                    scanResult.status === 'Offline'
                      ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      : 'M5 13l4 4L19 7'
                  }
                />
              </svg>
              <p style={{ fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', margin: 0 }}>
                {scanResult.studentName || scanResult.staffName || 'Attendance Logged'}
              </p>
              <p style={{ fontSize: '0.9rem', textAlign: 'center', margin: '4px 0 0 0', opacity: 0.9 }}>
                {scanResult.message}
              </p>
            </div>
          )}

          {error && !isProcessing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, background: 'rgba(220, 38, 38, 0.95)', color: '#fff', padding: '1rem' }}>
              <svg className="w-12 h-12 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Verification Failed</p>
              <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: '4px 0 0 0', opacity: 0.9 }}>{error}</p>
            </div>
          )}
        </div>

        {/* VERIFICATION NOTIFICATION CARD */}
        {scanResult && (
          <div
            style={{
              marginTop: '1.25rem',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              background:
                scanResult.status === 'AlreadyClockedIn'
                  ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                  : scanResult.status === 'Offline'
                    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', opacity: 0.9 }}>
              {scanResult.status === 'AlreadyClockedIn'
                ? 'ℹ️ ALREADY CLOCKED IN TODAY'
                : scanResult.status === 'Offline'
                  ? '⏳ SAVED OFFLINE'
                  : '✓ ATTENDANCE RECORDED'}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
              {scanResult.staffName || scanResult.studentName || 'Attendance Logged'}
            </h3>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95 }}>
              {getCleanMessage(scanResult)}
            </p>
            {scanResult.time && (
              <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0,0,0,0.25)', padding: '0.25rem 0.75rem', borderRadius: '20px', display: 'inline-block' }}>
                Clocked in at {formatTime(scanResult.time)}
              </div>
            )}
          </div>
        )}

        {/* ERROR NOTIFICATION CARD */}
        {error && (
          <div
            style={{
              marginTop: '1.25rem',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', opacity: 0.9 }}>
              ✕ IDENTITY VERIFICATION FAILED
            </div>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95 }}>{error}</p>
          </div>
        )}

        {/* MANUAL ID ENTRY & VERIFICATION CARD */}
        <div className="manual-verification-card">
          <div className="manual-verification-header">
            <span className="manual-verification-title">
              <Search size={15} />
              Manual ID Verification
            </span>
            <span className="manual-verification-badge">
              Student / Staff ID
            </span>
          </div>

          <div className="manual-input-row">
            <div className="manual-input-wrapper">
              <Search size={16} className="manual-input-icon" />
              <input
                type="text"
                placeholder="Enter Student or Staff ID, Reg No, Phone or Email..."
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualPayload.trim()) {
                    onScanSuccess(manualPayload.trim());
                    setManualPayload('');
                  }
                }}
                className="manual-id-input"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (manualPayload.trim()) {
                  onScanSuccess(manualPayload.trim());
                  setManualPayload('');
                }
              }}
              disabled={!manualPayload.trim() || isProcessing}
              className="manual-submit-btn"
            >
              <QrCode size={16} />
              <span>{isProcessing ? 'Verifying...' : 'Submit Scan'}</span>
            </button>
          </div>

          {!scanResult && !error && (
            <p className="manual-hint-text">
              {isProcessing
                ? 'Processing attendance verification...'
                : 'Align a Student or Staff ID card within the scanning frame above or enter ID details manually.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GateScanner;
