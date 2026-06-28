import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface ScanResult {
  message: string;
  studentName: string;
  time: string;
  status: string;
}

const GateScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
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
      } catch (e) { }
    }
  }, []);

  // Background sync interval for offline scans
  useEffect(() => {
    const syncOfflineScans = async () => {
      const savedQueue = localStorage.getItem('offline_scans_queue');
      if (!savedQueue) return;
      
      let queue: string[];
      try {
        queue = JSON.parse(savedQueue);
      } catch (e) { return; }
      
      if (queue.length === 0) return;

      // Try to sync the oldest scan
      const payload = queue[0];
      try {
        await api.post('/attendance/scan', { qrPayload: payload, scannedById: userName });
        // Success, remove from queue
        queue.shift();
        localStorage.setItem('offline_scans_queue', JSON.stringify(queue));
        setOfflineQueue(queue);
      } catch (err: any) {
        // If it's a validation error (400) or not found (404), it will never succeed, discard it.
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
            queue.shift();
            localStorage.setItem('offline_scans_queue', JSON.stringify(queue));
            setOfflineQueue(queue);
        }
      }
    };

    const interval = setInterval(syncOfflineScans, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: 250 },
          (decodedText) => {
             if (!isProcessingRef.current) {
                 onScanSuccess(decodedText);
             }
          },
          onScanFailure
        );
      } catch (err) {
        console.error("Camera startup failed:", err);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
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
    let scannedString = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime > 50) {
        scannedString = "";
      }
      
      lastKeyTime = currentTime;

      if (e.key === "Enter" && scannedString.length > 0) {
        e.preventDefault();
        if (!isProcessingRef.current) {
            onScanSuccess(scannedString);
        }
        scannedString = "";
      } else if (e.key !== "Enter" && e.key.length === 1) {
        scannedString += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);

    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause(true);
    }

    try {
      setError(null);
      const res = await api.post('/attendance/scan', { qrPayload: decodedText, scannedById: userName });
      setScanResult(res.data);
      
      // Play a success beep
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
      } catch(e) {}

      
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 3000);

    } catch (err: any) {
      if (!err.response) {
        // Network Error -> Queue Offline
        const savedQueue = localStorage.getItem('offline_scans_queue');
        let queue: string[] = [];
        if (savedQueue) {
            try { queue = JSON.parse(savedQueue); } catch(e){}
        }
        if (!queue.includes(decodedText)) {
            queue.push(decodedText);
            localStorage.setItem('offline_scans_queue', JSON.stringify(queue));
            setOfflineQueue(queue);
        }

        setScanResult({
            message: "Saved to offline queue",
            studentName: "Offline Scan Saved",
            time: new Date().toISOString(),
            status: "Offline"
        });

        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
            setScanResult(null);
        }, 3000);
      } else {
        setError(err.response?.data?.message || 'Failed to scan ID.');
        
        // Play error beep
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
        } catch(e) {}
        
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 3000);
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 flex flex-col items-center relative">
        
        {offlineQueue.length > 0 && (
            <div className="absolute top-6 right-6 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold border border-orange-300 shadow-sm animate-pulse">
                {offlineQueue.length} Offline Scan(s)
            </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gate Scanner</h2>
        
        {/* Small Screen viewport */}
        <div className={`w-full max-w-[350px] mx-auto relative rounded-lg overflow-hidden border-2 ${isProcessing ? 'border-blue-400 opacity-80' : 'border-gray-200'} bg-black transition-all`} style={{ minHeight: '250px' }}>
            <style>
              {`
                #qr-reader {
                  width: 100% !important;
                }
              `}
            </style>
            <div id="qr-reader"></div>
            {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            
            {/* OVERLAYS */}
            {scanResult && !isProcessing && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center z-30 animate-fade-in ${scanResult.status === 'Offline' ? 'bg-orange-500 bg-opacity-95' : 'bg-green-500 bg-opacity-95'}`}>
                    <svg className="w-16 h-16 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={scanResult.status === 'Offline' ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" : "M5 13l4 4L19 7"} />
                    </svg>
                    <p className="text-white font-bold text-xl text-center px-4">{scanResult.studentName}</p>
                    <p className="text-white text-md text-center font-medium mt-1">{scanResult.message}</p>
                </div>
            )}
            {error && !isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-fade-in bg-red-500 bg-opacity-95">
                    <svg className="w-16 h-16 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-white font-bold text-xl text-center">Error</p>
                    <p className="text-white text-md text-center px-4 font-medium mt-1">{error}</p>
                </div>
            )}
        </div>

        <div className="mt-8 w-full flex flex-col items-center justify-center">
          {!scanResult && !error && (
            <p className="text-gray-500 text-sm text-center px-4">
              {isProcessing ? "Processing scan..." : "Align the student's ID card within the scanning frame above."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GateScanner;
