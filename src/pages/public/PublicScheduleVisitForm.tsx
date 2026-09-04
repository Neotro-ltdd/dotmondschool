import React, { useState } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../context/TenantContext';
import './PublicScheduleVisitForm.css';

export default function PublicScheduleVisitForm() {
  const { schoolName: tenantSchoolName, logoUrl } = useTenant();

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
      <div className="public-visit-page">
        <div className="visit-container success-card">
          <div className="success-icon">🏫</div>
          <h2 className="success-title">School Visit Scheduled Successfully!</h2>
          <p className="success-message">
            Thank you for booking a campus tour with{' '}
            <strong>DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</strong>.
          </p>
          <div className="success-details-box">
            <p>
              <strong>Visitor Name:</strong> {formData.parentName}
            </p>
            <p>
              <strong>Scheduled Date:</strong>{' '}
              {new Date(formData.preferredDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p>
              <strong>Time Slot:</strong> {formData.timeSlot}
            </p>
            <p>
              <strong>Venue Address:</strong> Happyland Estate, Ajah, Lagos State, Nigeria
            </p>
          </div>
          <p className="success-next-steps">
            We have sent a <strong>Confirmation Email and SMS</strong> with your appointment
            details. Our administrative desk looks forward to receiving you!
          </p>
          <div className="btn-group-center">
            <a href="/" className="btn btn-secondary">
              Return to Home
            </a>
            <a href="/apply-admission" className="btn btn-primary">
              Apply for Admission
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-visit-page">
      <div className="visit-container">
        {/* Header Banner */}
        <div className="visit-header-card">
          <div className="school-logo-container">
            <img
              src={logoUrl || '/images/dotmond-logo-1.png'}
              alt={tenantSchoolName || 'Dotmond School'}
              className="visit-school-logo"
              onError={(e) => {
                // SAFETY: onError is attached directly to this <img>, so the event target is guaranteed to be that image element.
                (e.target as HTMLImageElement).src = '/images/dotmond-logo-1.png';
              }}
            />
          </div>
          <h1 className="school-visit-title">DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</h1>
          <h2 className="school-visit-subtitle">SCHEDULE A CAMPUS VISIT &amp; TOUR</h2>
          <p className="school-address">Happyland Estate, Ajah, Lagos State, Nigeria</p>
        </div>

        {error && <div className="alert-banner alert-danger">{error}</div>}

        {/* Visit Form */}
        <form onSubmit={handleSubmit} className="visit-form-card">
          <h3 className="section-heading">📋 VISITOR &amp; APPOINTMENT DETAILS</h3>

          <div className="form-grid-2">
            {/* Parent Name */}
            <div className="form-group full-width">
              <label>Parent / Visitor Full Name *</label>
              <input
                type="text"
                className="form-control"
                name="parentName"
                value={formData.parentName}
                onChange={handleInputChange}
                placeholder="e.g. Mr. & Mrs. Olanrewaju Adeyemi"
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address (For Appointment Confirmation) *</label>
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

            {/* Phone */}
            <div className="form-group">
              <label>Phone Number (For SMS Confirmation) *</label>
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

            {/* Child Name */}
            <div className="form-group">
              <label>Child's Name &amp; Age (Optional)</label>
              <input
                type="text"
                className="form-control"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                placeholder="e.g. David (Age 7)"
              />
            </div>

            {/* Class Level Interested In */}
            <div className="form-group">
              <label>Class Level Interested In</label>
              <select
                className="form-control"
                name="classLevelInterested"
                value={formData.classLevelInterested}
                onChange={handleInputChange}
              >
                <option value="Nursery & Early Years">
                  Nursery &amp; Early Years (Ages 2 - 5)
                </option>
                <option value="Lower Primary">Lower Primary (Primary 1 - 3)</option>
                <option value="Upper Primary">Upper Primary (Primary 4 - 6)</option>
                <option value="Junior Secondary">Junior Secondary (JSS 1 - 3)</option>
                <option value="Senior Secondary">Senior Secondary (SS 1 - 3)</option>
                <option value="General Tour">General School Campus Tour</option>
              </select>
            </div>

            {/* Preferred Date */}
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

            {/* Time Slot */}
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

            {/* Special Questions / Notes */}
            <div className="form-group full-width">
              <label>Special Questions / Notes for School Administration</label>
              <textarea
                className="form-control"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Let us know if you have specific facilities or subjects you would like to inspect during the tour..."
              />
            </div>
          </div>

          <div className="form-actions-row mt-4">
            <a href="/" className="btn btn-secondary">
              Cancel
            </a>
            <button type="submit" className="btn btn-primary submit-visit-btn" disabled={loading}>
              {loading ? 'Booking Visit...' : '📅 Confirm & Book Campus Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
