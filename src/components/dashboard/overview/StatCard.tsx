import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  topColor?: string;
  iconBg?: string;
  iconColor?: string;
  trendTag?: {
    type?: 'positive' | 'negative' | 'neutral';
    text: string;
  };
  subText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  topColor = 'var(--primary-color, #000080)',
  iconBg = '#EFF6FF',
  iconColor = 'var(--primary-color, #000080)',
  trendTag,
  subText,
}) => (
  <div className="stat-card-executive">
    <div className="stat-top-bar" style={{ backgroundColor: topColor }} />

    <div className="stat-header-row">
      <div>
        <p className="stat-label-text">{label}</p>
        <h3 className="stat-main-value">{value}</h3>
      </div>

      <div className="stat-icon-badge" style={{ background: iconBg, color: iconColor }}>
        <Icon size={24} />
      </div>
    </div>

    <div className="stat-footer-row">
      {trendTag ? (
        <span className={`stat-trend-tag ${trendTag.type || 'positive'}`}>{trendTag.text}</span>
      ) : (
        <span className="stat-trend-tag positive">● Active</span>
      )}
      <span className="stat-subtext">{subText || 'Verified System Metric'}</span>
    </div>
  </div>
);

export default StatCard;
