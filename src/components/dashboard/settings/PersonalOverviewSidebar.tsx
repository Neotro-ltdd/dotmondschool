import React from 'react';
import { Mail, Phone, Briefcase, Shield } from 'lucide-react';

interface PersonalOverviewSidebarProps {
  email?: string;
  phoneNumber?: string;
  title?: string;
  rolesList: string[];
}

export const PersonalOverviewSidebar: React.FC<PersonalOverviewSidebarProps> = ({
  email,
  phoneNumber,
  title,
  rolesList,
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '1.5rem',
        height: 'fit-content',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }}
    >
      <h4
        style={{
          margin: '0 0 1.25rem 0',
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748B',
        }}
      >
        PERSONAL OVERVIEW
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000080',
              flexShrink: 0,
            }}
          >
            <Mail size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94A3B8',
                display: 'block',
              }}
            >
              EMAIL
            </span>
            <span
              className="truncate block w-full"
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#0F172A',
              }}
            >
              {email || 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000080',
              flexShrink: 0,
            }}
          >
            <Phone size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94A3B8',
                display: 'block',
              }}
            >
              PHONE
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
              {phoneNumber || 'Not provided'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000080',
              flexShrink: 0,
            }}
          >
            <Briefcase size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94A3B8',
                display: 'block',
              }}
            >
              ACADEMIC TITLE
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
              {title || 'Not specified'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000080',
              flexShrink: 0,
            }}
          >
            <Shield size={18} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94A3B8',
                display: 'block',
              }}
            >
              ASSIGNED ROLES
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {rolesList.map((r) => (
                <span
                  key={r}
                  style={{
                    background: '#F1F5F9',
                    color: '#0F172A',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalOverviewSidebar;
