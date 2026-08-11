import React from 'react';
import { Calendar, Sparkles, Activity, FileText } from 'lucide-react';
import { formatDisplayName } from '../../../utils/nameFormatter';

interface OverviewHeaderProps {
  userName?: string;
  userTitle?: string;
  schoolName?: string;
  session?: string;
  displayTerm?: string;
  isHolidayMode?: boolean;
  userRole?: string;
  onToggleActivityLog?: () => void;
}

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  userName,
  userTitle,
  schoolName,
  session,
  displayTerm,
  isHolidayMode,
  userRole,
  onToggleActivityLog
}) => {
  return (
    <div className="overview-header-executive" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              background: 'rgba(0, 0, 128, 0.1)', 
              color: 'var(--primary-color, #000080)', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={12} /> {schoolName || 'Institution Platform'}
            </span>
            {userRole && (
              <span style={{ 
                background: '#F3F4F6', 
                color: '#4B5563', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: 600 
              }}>
                Role: {userRole}
              </span>
            )}
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Welcome back, {formatDisplayName(userTitle, userName)}
          </h1>
          <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Executive Dashboard & Real-Time Operational Monitoring
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: isHolidayMode ? '#FEF3C7' : '#EFF6FF', 
            border: `1px solid ${isHolidayMode ? '#F59E0B' : '#BFDBFE'}`, 
            padding: '8px 14px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Calendar size={18} color={isHolidayMode ? '#B45309' : '#1D4ED8'} />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Academic Session</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                {session || 'Current Session'} ({displayTerm || 'Term'})
              </div>
            </div>
          </div>

          {onToggleActivityLog && (
            <button 
              onClick={onToggleActivityLog}
              className="btn-executive-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Activity size={16} /> Audit Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewHeader;
