import React, { useState } from 'react';
import { api, API_ROOT } from '../../../services/api';
import SlideOver from '../../../components/ui/SlideOver';
import { 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  UploadCloud, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import '../students/Students.css';

interface EditStudentModalProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStudentModal({ student, onClose, onSuccess }: EditStudentModalProps) {
  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_ROOT}${url}`;
  };

  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    surname: student?.surname || '',
    firstName: student?.firstName || '',
    otherNames: student?.otherNames || '',
    gender: student?.gender || 'Male',
    departmentTrack: student?.departmentTrack || 'General',
    parentPhoneNumber: student?.parentPhoneNumber || '',
    parentEmail: student?.parentEmail || '',
  });
  const [passport, setPassport] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(
    student?.passportUrl ? (getFullUrl(student.passportUrl) as string) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPassport(file);
      setPassportPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPassport(null);
    setPassportPreview(null);
  };

  const handleNextStep = () => {
    if (formStep === 1) {
      if (!formData.surname.trim() || !formData.firstName.trim()) {
        setError('Please provide both Surname and First Name before proceeding.');
        return;
      }
    }
    setError(null);
    setFormStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append('surname', formData.surname);
      payload.append('firstName', formData.firstName);
      payload.append('otherNames', formData.otherNames);
      payload.append('gender', formData.gender);
      payload.append('departmentTrack', formData.departmentTrack);
      payload.append('parentPhoneNumber', formData.parentPhoneNumber);
      payload.append('parentEmail', formData.parentEmail);
      if (passport) {
        payload.append('passport', passport);
      }

      await api.put(`/setup/students/${student.id}`, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update student details.');
      setLoading(false);
    }
  };

  const studentFullName = `${formData.surname} ${formData.firstName} ${formData.otherNames}`.trim();

  return (
    <SlideOver
      isOpen={true}
      onClose={onClose}
      title="Edit Student Record"
      subtitle="Update student bio-data, parent contact information, and passport photo."
      width="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {formStep > 1 ? (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setError(null);
                setFormStep(prev => prev - 1);
              }}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </button>
          )}

          {formStep < 3 ? (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleNextStep}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10B981' }}
            >
              <Check size={18} /> {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          )}
        </div>
      }
    >
      {/* MULTI-STAGE SLIDE STEPPER BAR */}
      <div className="slideover-stepper" style={{ margin: '-24px -24px 24px -24px' }}>
        <div className={`stepper-step ${formStep === 1 ? 'active' : formStep > 1 ? 'completed' : ''}`}>
          <span className="stepper-circle">{formStep > 1 ? '✓' : '1'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Student Bio-Data</span>
        </div>
        <div className="stepper-divider"></div>
        <div className={`stepper-step ${formStep === 2 ? 'active' : formStep > 2 ? 'completed' : ''}`}>
          <span className="stepper-circle">{formStep > 2 ? '✓' : '2'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> Guardian & Photo</span>
        </div>
        <div className="stepper-divider"></div>
        <div className={`stepper-step ${formStep === 3 ? 'active' : ''}`}>
          <span className="stepper-circle">3</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} /> Review & Save</span>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* SLIDE 1: STUDENT BIO-DATA */}
      {formStep === 1 && (
        <div className="slide-stage-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Sparkles size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 700, fontSize: '0.92rem' }}>Personal Identity</h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>Ensure official student names match statutory academic documents.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                Surname <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input 
                type="text" 
                name="surname" 
                value={formData.surname} 
                onChange={handleInputChange} 
                placeholder="e.g. Abiodun"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none'
                }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                First Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleInputChange} 
                placeholder="e.g. Josiah"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none'
                }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
              Other Names
            </label>
            <input 
              type="text" 
              name="otherNames" 
              value={formData.otherNames} 
              onChange={handleInputChange} 
              placeholder="e.g. Oluwasemilore"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0F172A',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                Gender
              </label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                Academic Department Track
              </label>
              <select 
                name="departmentTrack" 
                value={formData.departmentTrack} 
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="General">General</option>
                <option value="Science">Science</option>
                <option value="Commercial">Commercial</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE 2: GUARDIAN CONTACT & PASSPORT PHOTO */}
      {formStep === 2 && (
        <div className="slide-stage-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Phone size={20} style={{ color: '#2563EB', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 700, fontSize: '0.92rem' }}>Parent Contact & Photo</h4>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>Update guardian notification details and official student passport image.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                Parent / Guardian Phone
              </label>
              <input 
                type="text" 
                name="parentPhoneNumber" 
                value={formData.parentPhoneNumber} 
                onChange={handleInputChange} 
                placeholder="e.g. 08109271881"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                Parent / Guardian Email
              </label>
              <input 
                type="email" 
                name="parentEmail" 
                value={formData.parentEmail} 
                onChange={handleInputChange} 
                placeholder="e.g. janet@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* PASSPORT UPLOAD DROPZONE */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
              Student Passport Photo
            </label>

            <div style={{
              background: '#F8FAFC',
              border: '2px dashed #CBD5E1',
              borderRadius: '14px',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justify: 'center',
              gap: '0.75rem'
            }}>
              {passportPreview ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={passportPreview} 
                    alt="Passport Preview" 
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #FFFFFF',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                    }} 
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      cursor: 'pointer'
                    }}
                    title="Remove Photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#E2E8F0',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center'
                }}>
                  <ImageIcon size={28} />
                </div>
              )}

              <div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                  {passport ? passport.name : passportPreview ? 'Passport Photo Attached' : 'Upload Student Passport Photo'}
                </p>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.8rem' }}>
                  Supports PNG, JPG, or JPEG (Max 5MB)
                </p>
              </div>

              <input 
                type="file" 
                id="editStudentPassportInput" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="editStudentPassportInput" 
                className="btn btn-secondary"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}
              >
                <UploadCloud size={16} /> {passportPreview ? 'Change Photo' : 'Browse Local Image'}
              </label>
            </div>
          </div>

        </div>
      )}

      {/* SLIDE 3: REVIEW & SUMMARY */}
      {formStep === 3 && (
        <div className="slide-stage-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#065F46'
          }}>
            <ShieldCheck size={22} style={{ flexShrink: 0, color: '#059669' }} />
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>Ready to Update</h4>
              <p style={{ margin: 0, fontSize: '0.82rem' }}>Review the updated student details below before saving changes to the system database.</p>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9' }}>
              <img 
                src={passportPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentFullName)}&background=0F172A&color=fff&rounded=true&bold=true`} 
                alt="Student Avatar"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #E2E8F0'
                }} 
              />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  {studentFullName}
                </h3>
                <span className="role-pill" style={{ marginTop: '0.25rem', display: 'inline-block', background: '#EFF6FF', color: '#1E40AF' }}>
                  {formData.departmentTrack} Track • {formData.gender}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Surname
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.surname}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  First Name
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.firstName}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Other Names
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.otherNames || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gender
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.gender}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Parent Phone
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.parentPhoneNumber || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Parent Email
                </span>
                <strong style={{ color: '#0F172A' }}>{formData.parentEmail || 'N/A'}</strong>
              </div>
            </div>
          </div>

        </div>
      )}

    </SlideOver>
  );
}
