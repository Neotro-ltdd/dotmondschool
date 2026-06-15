import React, { useState } from 'react';
import { api, API_ROOT } from '../../../services/api';

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

  const [formData, setFormData] = useState({
    surname: student.surname || '',
    firstName: student.firstName || '',
    otherNames: student.otherNames || '',
    gender: student.gender || 'Male',
    parentPhoneNumber: student.parentPhoneNumber || '',
    parentEmail: student.parentEmail || '',
  });
  const [passport, setPassport] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(student.passportUrl ? (getFullUrl(student.passportUrl) as string) : null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const payload = new FormData();
      payload.append('surname', formData.surname);
      payload.append('firstName', formData.firstName);
      payload.append('otherNames', formData.otherNames);
      payload.append('gender', formData.gender);
      payload.append('parentPhoneNumber', formData.parentPhoneNumber);
      payload.append('parentEmail', formData.parentEmail);
      if (passport) {
        payload.append('passport', passport);
      }

      await api.put(`/setup/students/${student.id}`, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update student details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Edit Student Record</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error" style={{ marginBottom: '1rem', color: '#dc3545' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Surname</label>
                <input type="text" name="surname" className="form-control" value={formData.surname} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="form-label">First Name</label>
                <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="form-label">Other Names</label>
                <input type="text" name="otherNames" className="form-control" value={formData.otherNames} onChange={handleInputChange} />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select name="gender" className="form-control" value={formData.gender} onChange={handleInputChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="form-label">Parent Phone</label>
                <input type="text" name="parentPhoneNumber" className="form-control" value={formData.parentPhoneNumber} onChange={handleInputChange} />
              </div>
              <div>
                <label className="form-label">Parent Email</label>
                <input type="email" name="parentEmail" className="form-control" value={formData.parentEmail} onChange={handleInputChange} />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label className="form-label">Passport Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '80px', height: '80px', border: '1px dashed #ccc', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {passportPreview ? (
                    <img src={passportPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>No Image</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="form-control" style={{ flex: 1 }} onChange={handleFileChange} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
