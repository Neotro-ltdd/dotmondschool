import React, { useState, useEffect } from 'react';
import {
  isPushNotificationSupported,
  getCurrentPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../../utils/pushNotifications';
import './PushNotificationToggle.css';

export const PushNotificationToggle: React.FC = () => {
  const [supported, setSupported] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isSupp = isPushNotificationSupported();
      setSupported(isSupp);
      if (!isSupp) {
        setLoading(false);
        return;
      }

      const sub = await getCurrentPushSubscription();
      setIsSubscribed(!!sub);
      setLoading(false);
    };

    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setFeedback(null);

    if (isSubscribed) {
      const unsubbed = await unsubscribeUserFromPush();
      if (unsubbed) {
        setIsSubscribed(false);
        setFeedback({ message: 'Push notifications turned off on this device.', type: 'info' });
      } else {
        setFeedback({ message: 'Failed to turn off notifications.', type: 'error' });
      }
    } else {
      const res = await subscribeUserToPush();
      if (res.success) {
        setIsSubscribed(true);
        setFeedback({ message: 'Web Push alerts active! You will receive instant notifications for grade releases & invoice updates.', type: 'success' });
      } else {
        setFeedback({ message: res.message || 'Failed to enable push notifications.', type: 'error' });
      }
    }

    setLoading(false);
  };

  if (!supported) {
    return (
      <div className="push-toggle-container">
        <div className="push-toggle-header">
          <div className="push-toggle-info">
            <div className="push-icon-wrapper">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="push-title-block">
              <h4>Push Notifications</h4>
              <p>Not supported in this browser mode.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="push-toggle-container">
      <div className="push-toggle-header">
        <div className="push-toggle-info">
          <div className={`push-icon-wrapper ${isSubscribed ? 'active' : ''}`}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isSubscribed
                    ? 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                    : 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                }
              />
            </svg>
          </div>
          <div className="push-title-block">
            <h4>Push Notifications</h4>
            <p>{isSubscribed ? 'Alerts active for results & invoices' : 'Get instant alerts for grades & fee invoices'}</p>
          </div>
        </div>
      </div>

      <div className="push-action-row">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`push-btn-primary ${isSubscribed ? 'push-btn-active' : ''}`}
          aria-label={isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
        >
          {loading ? (
            'Processing...'
          ) : isSubscribed ? (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Push Alerts Enabled
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Enable Push Notifications
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div className={`push-feedback-banner ${feedback.type}`} role="alert">
          {feedback.message}
        </div>
      )}
    </div>
  );
};
