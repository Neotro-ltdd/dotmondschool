import React, { useState } from 'react';
import { api } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import { Shield, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import './NeotroScheduleVisitForm.css';

export default function NeotroScheduleVisitForm() {
  const { schoolName: tenantSchoolName, logoUrl } = useTenant();
  const displaySchoolName = (tenantSchoolName && tenantSchoolName.toLowerCase() !== 'dbo') ? tenantSchoolName : 'Neotro Academy';
  const hasCustomLogo = logoUrl && !logoUrl.includes('dotmond-logo-1');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phoneNumber: '',
    childName: '',
    classLevelInterested: 'Nursery & Early Years',
    preferredDate: '',
    timeSlot: '10:00 AM - 11:00 AM',
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.parentName.trim()) {
      setError('Please enter your Full Name.');
      return;
    }
    if (!formData.email.trim() || !formData.phoneNumber.trim()) {
      setError('Please enter a valid Email Address and Phone Number.');
      return;
    }
    if (!formData.preferredDate) {
      setError('Please select a Preferred Visit Date.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/public/schedule-visit', formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="neotro-visit-page">
        <div className="neotro-visit-container success-card">
          <div className="success-icon"><CheckCircle2 size={54} color="#1B5E4B" /></div>
          <h2 className="success-title">Campus Visit Scheduled Successfully!</h2>
          <p className="success-message">
            Thank you for booking a campus tour with{' '}
            <strong>{displaySchoolName}</strong>.
          </p>
          <div className="success-details-box">
            <p><strong>Visitor Name:</strong> {formData.parentName}</p>
            <p>
              <strong>Scheduled Date:</strong>{' '}
              {new Date(formData.preferredDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p><strong>Time Slot:</strong> {formData.timeSlot}</p>
            <p><strong>Venue Address:</strong> Victoria Island Campus, Lagos State, Nigeria</p>
          </div>
          <p className="success-next-steps">
            We have sent a <strong>Confirmation Email and SMS</strong> with your appointment details. Our administrative desk looks forward to receiving you!
          </p>
          <div className="btn-group-center">
            <a href="/" className="neotro-btn neotro-btn-secondary">Return to Home</a>
            <a href="/apply-admission" className="neotro-btn neotro-btn-primary">Apply for Admission</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neotro-visit-page">
      <div className="neotro-visit-container">
        {/* Header Banner */}
        <div className="neotro-visit-header-card">
          <div className="neotro-logo-container">
            {hasCustomLogo ? (
              <img src={logoUrl} alt={displaySchoolName} className="neotro-visit-logo" />
            ) : (
              <div className="neotro-logo-icon">
                <Shield size={32} color="#FFFFFF" />
              </div>
            )}
          </div>
          <h1 className="neotro-visit-title">{displaySchoolName}</h1>
          <h2 className="neotro-visit-subtitle">SCHEDULE A VIRTUAL OR CAMPUS TOUR</h2>
          <p className="neotro-address">Victoria Island Campus, Lagos State, Nigeria</p>
        </div>

        {error && <div className="neotro-alert alert-danger">{error}</div>}

        {/* Visit Form */}
        <form onSubmit={handleSubmit} className="neotro-visit-card">
          <h3 className="section-heading">VISITOR &amp; TOUR DETAILS</h3>

          <div className="form-grid-2">
            <div className="form-group full-width">
              <label>Parent / Visitor Full Name *</label>
              <input
                type="text"
                className="form-control"
                name="parentName"
                value={formData.parentName}
                onChange={handleInputChange}
                placeholder="e.g. Dr. & Mrs. Alexander Wright"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="visitor@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                className="form-control"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="08031234567"
                required
              />
            </div>

            <div className="form-group">
              <label>Child's Name &amp; Age (Optional)</label>
              <input
                type="text"
                className="form-control"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                placeholder="e.g. Sarah (Age 9)"
              />
            </div>

            <div className="form-group">
              <label>Class Level Interested In</label>
              <select
                className="form-control"
                name="classLevelInterested"
                value={formData.classLevelInterested}
                onChange={handleInputChange}
              >
                <option value="Nursery & Early Years">Early Years &amp; Kindergarten</option>
                <option value="Lower Primary">Primary Academy (Grades 1-3)</option>
                <option value="Upper Primary">Primary Academy (Grades 4-6)</option>
                <option value="Junior Secondary">Junior Secondary College</option>
                <option value="Senior Secondary">Senior Secondary &amp; Sixth Form</option>
                <option value="General Tour">General Institutional Campus Tour</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Visit Date *</label>
              <input
                type="date"
                className="form-control"
                name="preferredDate"
                value={formData.preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Preferred Time Slot *</label>
              <select
                className="form-control"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
              >
                <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                <option value="01:30 PM - 02:30 PM">01:30 PM - 02:30 PM</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Special Notes for Admissions Office</label>
              <textarea
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Specify any facilities, sports arenas, or STEM labs you wish to view during your tour..."
              />
            </div>
          </div>

          <div className="form-actions-row">
            <a href="/" className="neotro-btn neotro-btn-secondary">
              Cancel
            </a>
            <button type="submit" className="neotro-btn neotro-btn-primary" disabled={loading}>
              {loading ? 'Booking Visit...' : 'Confirm Campus Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
