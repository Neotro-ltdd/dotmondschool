import React from 'react';
import { Palmtree } from 'lucide-react';

interface HolidayBannerProps {
  isHolidayMode?: boolean;
  resumptionDate?: string;
}

export const HolidayBanner: React.FC<HolidayBannerProps> = ({
  isHolidayMode = true,
  resumptionDate = '2026-09-14',
}) => {
  if (!isHolidayMode) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: '1px solid #FCD34D',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            background: '#F59E0B',
            color: '#FFF',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Palmtree size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.95rem' }}>
            🌴 School is Currently on Holiday
          </div>
          <div style={{ fontSize: '0.825rem', color: '#B45309' }}>
            Academic term break is active. Normal classes resume on{' '}
            <strong>{resumptionDate || 'September 14, 2026'}</strong>.
          </div>
        </div>
      </div>
      <span
        style={{
          background: '#FEF3C7',
          color: '#B45309',
          border: '1px solid #F59E0B',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        Status: Holiday Break
      </span>
    </div>
  );
};

export default HolidayBanner;
