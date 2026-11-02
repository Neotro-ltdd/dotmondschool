import React from 'react';
import { Palmtree, Calendar, Sparkles } from 'lucide-react';

interface HolidayBannerProps {
  isHolidayMode?: boolean;
  resumptionDate?: string;
  holidayType?: string;
  holidayStartDate?: string;
}

export const HolidayBanner: React.FC<HolidayBannerProps> = ({
  isHolidayMode = true,
  resumptionDate = '2026-11-09',
  holidayType = 'Mid-Term Break',
}) => {
  if (!isHolidayMode) return null;

  // Format date nicely: e.g. 2026-11-09 -> Monday, November 9, 2026
  const formatResumptionDate = (dateStr?: string) => {
    if (!dateStr) return 'Monday, November 9, 2026';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isMidTermBreak =
    holidayType?.toLowerCase().includes('mid-term') ||
    holidayType?.toLowerCase().includes('mtb');

  const title = isMidTermBreak
    ? '🌴 School is on Mid-Term Break (5 Days)'
    : holidayType?.toLowerCase().includes('session')
    ? '🎓 Academic Session Has Concluded'
    : `🌴 School Holiday Mode Active (${holidayType || 'Break'})`;

  const description = isMidTermBreak
    ? `Classes, gate attendance scanning, and daily attendance emails are paused for 5 days. Normal school operations and classes resume on `
    : `Academic activities are currently paused. Normal classes and portal operations resume on `;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        border: '1px solid #FCD34D',
        borderRadius: '14px',
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.09)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: '#F59E0B',
            color: '#FFF',
            padding: '10px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Palmtree size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, color: '#92400E', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: '2px' }}>
            {description}
            <strong style={{ color: '#78350F', textDecoration: 'underline' }}>
              {formatResumptionDate(resumptionDate)}
            </strong>.
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #F59E0B',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Sparkles size={14} />
          {holidayType || 'Mid-Term Break'}
        </span>
      </div>
    </div>
  );
};

export default HolidayBanner;
