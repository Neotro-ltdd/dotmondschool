import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';

interface RolesTabProps {
  rolesList: string[];
  userRole: string | null;
  onSwitchRole: (roleName: string) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ rolesList, userRole, onSwitchRole }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '1.75rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{ marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}
      >
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
          Active Context & Role Switcher
        </h3>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
          Switch your active operational perspective across the portal.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {rolesList.map((roleName) => {
          const isCurrent = userRole === roleName;
          return (
            <div
              key={roleName}
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: isCurrent ? '2px solid #000080' : '1px solid #E2E8F0',
                background: isCurrent ? '#EFF6FF' : '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isCurrent ? '#000080' : '#E2E8F0',
                    color: isCurrent ? '#ffffff' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={20} />
                </div>
                {isCurrent && (
                  <span
                    style={{
                      background: '#000080',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Active Context
                  </span>
                )}
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#0F172A',
                  }}
                >
                  {roleName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                  {roleName === 'Admin' || roleName === 'SuperAdmin'
                    ? 'Full administrative control over portal setup, staff, and records.'
                    : roleName === 'Teacher'
                      ? 'Manage classroom rosters, attendance, subject continuous assessment, and termly scores.'
                      : roleName === 'Accountant'
                        ? 'Manage fee setups, tuition receipts, payment verifications, and financial reporting.'
                        : 'Standard portal operational access.'}
                </p>
              </div>

              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => onSwitchRole(roleName)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #000080',
                    background: '#ffffff',
                    color: '#000080',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  Switch to {roleName} <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RolesTab;
