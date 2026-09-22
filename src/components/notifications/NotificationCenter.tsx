import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  X,
  ShieldCheck,
  FileText,
  CreditCard,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import './NotificationCenter.css';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'gate' | 'academics' | 'fees' | 'general';
  createdAt: string;
  isRead: boolean;
  linkTab?: string;
  studentName?: string;
}

interface NotificationCenterProps {
  notifications?: AppNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPushSettings?: () => void;
}

export const DEFAULT_MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Campus Gate Entry (Clock-In)',
    message: 'David scanned IN at Main Campus Gate at 07:42 AM.',
    category: 'gate',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    isRead: false,
    linkTab: 'attendance',
    studentName: 'David Nenty',
  },
  {
    id: 'notif-2',
    title: 'Terminal Report Card Published',
    message: 'First Term Terminal Report Card for JSS 2 is now available for viewing and PDF download.',
    category: 'academics',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    isRead: false,
    linkTab: 'academics',
    studentName: 'David Nenty',
  },
  {
    id: 'notif-3',
    title: 'Bank Teller Receipt Verified',
    message: 'Bursary has verified payment receipt of ₦150,000 for Tuition Fees.',
    category: 'fees',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    linkTab: 'fees',
    studentName: 'David Nenty',
  },
  {
    id: 'notif-4',
    title: 'Campus Gate Exit (Clock-Out)',
    message: 'David scanned OUT at Main Campus Gate at 03:30 PM.',
    category: 'gate',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: true,
    linkTab: 'attendance',
    studentName: 'David Nenty',
  },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = DEFAULT_MOCK_NOTIFICATIONS,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
  onOpenPushSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'unread' | 'gate' | 'academics' | 'fees'>('all');
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>(notifications);

  const unreadCount = localNotifs.filter((n) => !n.isRead).length;

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkOne = (id: string) => {
    setLocalNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAll = () => {
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const filteredList = localNotifs.filter((n) => {
    if (filterCategory === 'unread') return !n.isRead;
    if (filterCategory === 'gate') return n.category === 'gate';
    if (filterCategory === 'academics') return n.category === 'academics';
    if (filterCategory === 'fees') return n.category === 'fees';
    return true;
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'gate':
        return <ShieldCheck size={18} className="notif-cat-icon icon-gate" />;
      case 'academics':
        return <FileText size={18} className="notif-cat-icon icon-academic" />;
      case 'fees':
        return <CreditCard size={18} className="notif-cat-icon icon-fee" />;
      default:
        return <Bell size={18} className="notif-cat-icon icon-general" />;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="notif-center-rel-container">
      {/* Trigger Bell Button */}
      <button
        type="button"
        className={`notif-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggleOpen}
        title="Notification Center"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge-pill">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Drawer */}
      {isOpen && (
        <>
          <div className="notif-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notif-drawer-panel">
            {/* Drawer Header */}
            <div className="notif-drawer-header">
              <div className="notif-drawer-title-group">
                <Bell size={18} style={{ color: 'var(--primary-color, #0f172a)' }} />
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="notif-count-chip">{unreadCount} new</span>
                )}
              </div>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-action-text-btn"
                    onClick={handleMarkAll}
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
                <button
                  type="button"
                  className="notif-close-btn"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-Header Push Alert Banner */}
            {onOpenPushSettings && (
              <div className="notif-push-banner">
                <div>
                  <strong>Free Real-Time PWA Alerts</strong>
                  <p>Get instant gate clock-in & departure notifications on your device screen.</p>
                </div>
                <button
                  type="button"
                  className="notif-push-config-btn"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPushSettings();
                  }}
                >
                  Configure
                </button>
              </div>
            )}

            {/* Filter Tabs Bar */}
            <div className="notif-filters-bar">
              <button
                type="button"
                className={`notif-filter-tab ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${filterCategory === 'unread' ? 'active' : ''}`}
                onClick={() => setFilterCategory('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${filterCategory === 'gate' ? 'active' : ''}`}
                onClick={() => setFilterCategory('gate')}
              >
                Gate Logs
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${filterCategory === 'academics' ? 'active' : ''}`}
                onClick={() => setFilterCategory('academics')}
              >
                Academics
              </button>
              <button
                type="button"
                className={`notif-filter-tab ${filterCategory === 'fees' ? 'active' : ''}`}
                onClick={() => setFilterCategory('fees')}
              >
                Fees
              </button>
            </div>

            {/* Notification Items List */}
            <div className="notif-items-scroll-list">
              {filteredList.length === 0 ? (
                <div className="notif-empty-box">
                  <Bell size={36} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No notifications found</p>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    All caught up! Real-time alerts will appear here.
                  </span>
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    className={`notif-item-card ${!item.isRead ? 'unread' : ''}`}
                    onClick={() => {
                      if (!item.isRead) handleMarkOne(item.id);
                      if (item.linkTab && onNavigateTab) {
                        setIsOpen(false);
                        onNavigateTab(item.linkTab);
                      }
                    }}
                  >
                    <div className="notif-item-left">
                      {getIcon(item.category)}
                    </div>
                    <div className="notif-item-body">
                      <div className="notif-item-top">
                        <span className="notif-item-title">{item.title}</span>
                        <span className="notif-item-time">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className="notif-item-msg">{item.message}</p>
                      {item.studentName && (
                        <span className="notif-student-pill">{item.studentName}</span>
                      )}
                    </div>
                    {!item.isRead && <span className="notif-unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
