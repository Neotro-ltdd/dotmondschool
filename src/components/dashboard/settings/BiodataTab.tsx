import React from 'react';
import { User, Phone, Mail, Edit3, Check, X } from 'lucide-react';

interface BiodataTabProps {
  profile: any;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  title: string;
  setTitle: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  middleName: string;
  setMiddleName: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  infoSaving: boolean;
  onSaveBioData: (e: React.FormEvent) => void;
}

export const BiodataTab: React.FC<BiodataTabProps> = ({
  profile,
  isEditing,
  setIsEditing,
  title,
  setTitle,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  middleName,
  setMiddleName,
  phoneNumber,
  setPhoneNumber,
  infoSaving,
  onSaveBioData,
}) => {
  return (
    <div
      className="biodata-tab-container"
      style={{
        background: '#FFFFFF',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#111827' }}>
          Personal Bio-Data
        </h3>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              background: '#F3F4F6',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      <form onSubmit={onSaveBioData}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                background: isEditing ? '#FFFFFF' : '#F9FAFB',
              }}
              placeholder="e.g. Mr / Mrs / Dr / Prof"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                background: isEditing ? '#FFFFFF' : '#F9FAFB',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Last Name / Surname
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                background: isEditing ? '#FFFFFF' : '#F9FAFB',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Middle Name
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                background: isEditing ? '#FFFFFF' : '#F9FAFB',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                background: isEditing ? '#FFFFFF' : '#F9FAFB',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Email Address (Read-only)
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                background: '#F3F4F6',
                color: '#6B7280',
              }}
            />
          </div>
        </div>

        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={infoSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#000080',
                color: '#FFFFFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Check size={16} /> {infoSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BiodataTab;
