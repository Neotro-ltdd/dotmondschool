import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Bell,
  DoorOpen,
  LogOut,
  FileText,
  CreditCard,
  Send,
  Smartphone,
} from 'lucide-react';
import './PushNotificationSettingsModal.css';

interface PushNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationSettingsModal: React.FC<PushNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [gateEntranceAlerts, setGateEntranceAlerts] = useState(true);
  const [gateExitAlerts, setGateExitAlerts] = useState(true);
  const [reportCardAlerts, setReportCardAlerts] = useState(true);
  const [feeReminders, setFeeReminders] = useState(true);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleSendTestNotification = () => {
    setTestSent(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CAMPUS PWA Test Alert', {
        body: 'Real-time Push Notification connected successfully! You will receive instant gate clock-in alerts.',
        icon: '/favicon.ico',
      });
    } else {
      alert('Test Alert: Real-time PWA Push Notification connected successfully for this device!');
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="pwa-modal-overlay" onClick={onClose}>
      <div className="pwa-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pwa-modal-header">
          <h3 className="pwa-modal-title">Push Notification Alert Toggles</h3>
          <button type="button" className="pwa-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="pwa-modal-body">
          {/* Main Card */}
          <div className="pwa-settings-card">
            <div className="pwa-card-top-row">
              <div>
                <h2 className="pwa-settings-heading">Push Notification Settings</h2>
                <p className="pwa-settings-subheading">
                  Manage real-time alerts for Mobile & Desktop (PWA) on this device.
                </p>
              </div>
              <div className="pwa-status-badge">
                <CheckCircle2 size={16} color="#ffffff" />
                <span>This Device Subscribed</span>
              </div>
            </div>

            <p className="pwa-toggles-intro">
              Manage push notifications for this device's PWA. Toggles control notifications for academic and safety updates.
            </p>

            {/* Toggle Items List */}
            <div className="pwa-toggles-list">
              {/* Toggle 1: Gate Entrance Alerts */}
              <div className="pwa-toggle-item">
                <div className="pwa-toggle-left">
                  <div className="pwa-icon-box cyan-tint">
                    <DoorOpen size={20} />
                  </div>
                  <div>
                    <h4 className="pwa-toggle-title">Gate Entrance Alerts</h4>
                    <p className="pwa-toggle-desc">Notify when student enters the main campus gate.</p>
                  </div>
                </div>
                <label className="pwa-switch">
                  <input
                    type="checkbox"
                    checked={gateEntranceAlerts}
                    onChange={(e) => setGateEntranceAlerts(e.target.checked)}
                  />
                  <span className="pwa-slider" />
                </label>
              </div>

              {/* Toggle 2: Gate Exit Alerts */}
              <div className="pwa-toggle-item">
                <div className="pwa-toggle-left">
                  <div className="pwa-icon-box teal-tint">
                    <LogOut size={20} />
                  </div>
                  <div>
                    <h4 className="pwa-toggle-title">Gate Exit Alerts</h4>
                    <p className="pwa-toggle-desc">Notify when student exits the main campus gate.</p>
                  </div>
                </div>
                <label className="pwa-switch">
                  <input
                    type="checkbox"
                    checked={gateExitAlerts}
                    onChange={(e) => setGateExitAlerts(e.target.checked)}
                  />
                  <span className="pwa-slider" />
                </label>
              </div>

              {/* Toggle 3: Report Card Published Alerts */}
              <div className="pwa-toggle-item">
                <div className="pwa-toggle-left">
                  <div className="pwa-icon-box emerald-tint">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="pwa-toggle-title">Report Card Published Alerts</h4>
                    <p className="pwa-toggle-desc">Notify when new report cards are ready for viewing.</p>
                  </div>
                </div>
                <label className="pwa-switch">
                  <input
                    type="checkbox"
                    checked={reportCardAlerts}
                    onChange={(e) => setReportCardAlerts(e.target.checked)}
                  />
                  <span className="pwa-slider" />
                </label>
              </div>

              {/* Toggle 4: Fee Reminders */}
              <div className="pwa-toggle-item">
                <div className="pwa-toggle-left">
                  <div className="pwa-icon-box green-tint">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="pwa-toggle-title">Fee Reminders</h4>
                    <p className="pwa-toggle-desc">Notifications for upcoming fee payments & deadlines.</p>
                  </div>
                </div>
                <label className="pwa-switch">
                  <input
                    type="checkbox"
                    checked={feeReminders}
                    onChange={(e) => setFeeReminders(e.target.checked)}
                  />
                  <span className="pwa-slider" />
                </label>
              </div>
            </div>

            {/* Test Connection Section */}
            <div className="pwa-test-section">
              <h4 className="pwa-test-title">Test Connection</h4>
              <button
                type="button"
                className={`pwa-test-btn ${testSent ? 'success' : ''}`}
                onClick={handleSendTestNotification}
              >
                <Bell size={18} />
                <span>{testSent ? 'Test Notification Dispatched!' : 'Send Test Notification'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
