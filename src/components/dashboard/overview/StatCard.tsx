import React, { memo } from 'react';
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

export const StatCard: React.FC<StatCardProps> = memo(
  ({
    label,
    value,
    icon: Icon,
    topColor = 'var(--primary-color, #000080)',
    iconBg = '#EFF6FF',
    iconColor = 'var(--primary-color, #000080)',
    trendTag,
    subText,
  }) => (
    <article
      className="stat-card-executive"
      aria-label={`${label}: ${value}${trendTag ? `, ${trendTag.text}` : ''}`}
    >
      <div className="stat-top-bar" style={{ backgroundColor: topColor }} aria-hidden="true" />

      <div className="stat-header-row">
        <div>
          <p className="stat-label-text">{label}</p>
          <h3 className="stat-main-value">{value}</h3>
        </div>

        <div
          className="stat-icon-badge"
          style={{ background: iconBg, color: iconColor }}
          aria-hidden="true"
        >
          <Icon size={24} />
        </div>
      </div>

      <div className="stat-footer-row">
        {trendTag ? (
          <span className={`stat-trend-tag ${trendTag.type || 'positive'}`}>
            <span className="trend-dot" aria-hidden="true" />
            {trendTag.text}
          </span>
        ) : (
          <span className="stat-trend-tag positive">
            <span className="trend-dot" aria-hidden="true" />
            Active
          </span>
        )}
        <span className="stat-subtext">{subText || 'Verified System Metric'}</span>
      </div>
    </article>
  ),
);

export default StatCard;
