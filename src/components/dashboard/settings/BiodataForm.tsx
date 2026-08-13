import React from 'react';
import { Edit3, Lock, Shield, Check, Save } from 'lucide-react';

interface BiodataFormProps {
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
  email?: string;
  rolesList: string[];
  infoSaving: boolean;
  onSave: () => void;
  onRequestEmailChange?: () => void;
}

export const BiodataForm: React.FC<BiodataFormProps> = ({
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
  email,
  rolesList,
  infoSaving,
  onSave,
  onRequestEmailChange
}) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>Basic Profile Information</h3>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>View and update your personal bio-data details.</p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setIsEditing(!isEditing)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, borderColor: '#000080', color: '#000080' }}
        >
          <Edit3 size={15} />
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {/* Form Fields Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            Title
          </label>
          {isEditing ? (
            <select 
              className="form-control" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}
            >
              <option value="">-- Select Title --</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Miss">Miss</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
              <option value="Engr.">Engr.</option>
              <option value="Pastor">Pastor</option>
              <option value="Rev.">Rev.</option>
              <option value="Chief">Chief</option>
            </select>
          ) : (
            <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
              {title || '—'}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: 0 }}>
              Username (Email)
            </label>
            {onRequestEmailChange && (
              <button
                type="button"
                onClick={onRequestEmailChange}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000080',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Request Email Change
              </button>
            )}
          </div>
          <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{email}</span>
            <Lock size={14} style={{ color: '#94A3B8' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            First Name <span style={{ color: '#EF4444' }}>*</span>
          </label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A' }}
            />
          ) : (
            <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
              {firstName || '—'}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            Surname / Last Name <span style={{ color: '#EF4444' }}>*</span>
          </label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A' }}
            />
          ) : (
            <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
              {lastName || '—'}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            Middle Name
          </label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control" 
              value={middleName} 
              onChange={e => setMiddleName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A' }}
            />
          ) : (
            <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
              {middleName || '—'}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            Phone Number
          </label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0F172A' }}
            />
          ) : (
            <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
              {phoneNumber || '—'}
            </div>
          )}
        </div>

      </div>

      {/* Assigned System Roles Light Blue Box */}
      <div style={{ marginTop: '1.75rem', padding: '1.25rem', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#000080' }}>
          <Shield size={16} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Assigned System Roles</h4>
        </div>
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#475569' }}>
          Below are all administrative & instructional roles assigned to your user account across the portal.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {rolesList.map(r => (
            <span key={r} style={{ background: '#FFFFFF', color: '#000080', fontSize: '0.82rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', border: '1px solid #93C5FD', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Check size={13} /> {r}
            </span>
          ))}
        </div>
      </div>

      {/* Save Button Bar when Editing */}
      {isEditing && (
        <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditing(false)}
            disabled={infoSaving}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={infoSaving}
            style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.88rem', background: '#000080', borderColor: '#000080', color: '#ffffff' }}
          >
            <Save size={16} />
            {infoSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      )}

    </div>
  );
};

export default BiodataForm;
