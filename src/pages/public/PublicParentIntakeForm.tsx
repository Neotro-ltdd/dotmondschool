import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Mail,
  Smartphone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  Building,
  User,
  Phone,
  MapPin,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useTenant } from '../../context/TenantContext';
import './PublicParentIntakeForm.css';

export default function PublicParentIntakeForm() {
  const { schoolName, logoUrl } = useTenant();

  const [formData, setFormData] = useState({
    title: 'Mr.',
    surname: '',
    firstName: '',
    otherName: '',
    whatsappNumber: '',
    email: '',
    address: '',
    notificationPreference: 'Email', // Default to Email (100%)
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !formData.surname.trim() ||
      !formData.firstName.trim() ||
      !formData.email.trim() ||
      !formData.whatsappNumber.trim() ||
      !formData.address.trim()
    ) {
      setErrorMessage('Please fill in all required fields (Surname, First Name, WhatsApp Number, Email, and Address).');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/parents/intake-form', formData);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit parent information. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-intake-wrapper">
      <div className="public-intake-container">
        {/* Header Branding */}
        <div className="public-intake-header">
          <div className="intake-logo-circle">
            {logoUrl ? (
              <img src={logoUrl} alt="School Logo" className="intake-logo-img" />
            ) : (
              <Building size={32} className="intake-fallback-icon" />
            )}
          </div>
          <h1 className="public-intake-title">{schoolName || 'School'}</h1>
          <p className="public-intake-subtitle">Parent Information & Gate Notification Setup</p>
        </div>

        {!isSubmitted ? (
          <form className="public-intake-form" onSubmit={handleSubmit}>
            <div className="intake-section-eyebrow">
              <Sparkles size={16} />
              <span>OFFICIAL PARENT INTAKE REGISTRATION</span>
            </div>

            <p className="intake-form-desc">
              Please complete your contact details and select your preferred notification channel for instant real-time gate entry & exit alerts for your child.
            </p>

            {errorMessage && (
              <div className="intake-error-alert">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Personal Information Grid */}
            <div className="intake-grid">
              <div className="intake-field span-2">
                <label className="intake-label">Title <span className="req">*</span></label>
                <select
                  name="title"
                  className="intake-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Chief">Chief</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Engr.">Engr.</option>
                  <option value="Alh.">Alh.</option>
                  <option value="Hajiya">Hajiya</option>
                  <option value="Ms.">Ms.</option>
                </select>
              </div>

              <div className="intake-field span-5">
                <label className="intake-label">Surname <span className="req">*</span></label>
                <input
                  type="text"
                  name="surname"
                  className="intake-input"
                  placeholder="e.g. Adebayo"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="intake-field span-5">
                <label className="intake-label">First Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  className="intake-input"
                  placeholder="e.g. Oluwaseun"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="intake-field span-6">
                <label className="intake-label">Other Name <span className="opt">(Optional)</span></label>
                <input
                  type="text"
                  name="otherName"
                  className="intake-input"
                  placeholder="e.g. Emmanuel"
                  value={formData.otherName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="intake-field span-6">
                <label className="intake-label">WhatsApp Number <span className="req">*</span></label>
                <div className="intake-input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    name="whatsappNumber"
                    className="intake-input padded"
                    placeholder="e.g. 08012345678"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="intake-field span-12">
                <label className="intake-label">Email Address <span className="req">*</span></label>
                <div className="intake-input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    className="intake-input padded"
                    placeholder="e.g. parent@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="intake-field span-12">
                <label className="intake-label">Residential Address <span className="req">*</span></label>
                <div className="intake-input-with-icon align-top">
                  <MapPin size={18} className="input-icon top" />
                  <textarea
                    name="address"
                    className="intake-textarea"
                    rows={3}
                    placeholder="Enter full home/office address..."
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notification Preference Selector */}
            <div className="pref-section">
              <label className="intake-label block">
                Select Preferred Gate Attendance Notification Mode <span className="req">*</span>
              </label>
              <p className="pref-help-text">
                Choose how you want to receive instant notifications whenever your child clocks in or out at the school gate:
              </p>

              <div className="pref-cards-grid">
                {/* 1. EMAIL (100%) */}
                <div
                  className={`pref-card ${formData.notificationPreference === 'Email' ? 'selected email-active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, notificationPreference: 'Email' }))}
                >
                  <div className="pref-card-header">
                    <div className="pref-icon-box green">
                      <Mail size={22} />
                    </div>
                    <div className="pref-rate-badge green">100% Delivery</div>
                  </div>
                  <h4 className="pref-card-title">Email Delivery</h4>
                  <p className="pref-card-desc">
                    Instant, free arrival & departure alerts sent directly to your email inbox. 100% reliable & guaranteed.
                  </p>
                  <div className="pref-select-indicator">
                    <span className="dot"></span>
                    <span>{formData.notificationPreference === 'Email' ? 'Selected Channel' : 'Select Email'}</span>
                  </div>
                </div>

                {/* 2. MOBILE APP (80%) */}
                <div
                  className={`pref-card ${formData.notificationPreference === 'MobileApp' ? 'selected app-active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, notificationPreference: 'MobileApp' }))}
                >
                  <div className="pref-card-header">
                    <div className="pref-icon-box blue">
                      <Smartphone size={22} />
                    </div>
                    <div className="pref-rate-badge blue">80% Delivery</div>
                  </div>
                  <h4 className="pref-card-title">Mobile App Notification</h4>
                  <p className="pref-card-desc">
                    Real-time pop-up notification on your smartphone via the official school mobile web app.
                  </p>
                  <div className="pref-select-indicator">
                    <span className="dot"></span>
                    <span>{formData.notificationPreference === 'MobileApp' ? 'Selected Channel' : 'Select Mobile App'}</span>
                  </div>
                </div>

                {/* 3. SMS (60%) */}
                <div
                  className={`pref-card ${formData.notificationPreference === 'Sms' ? 'selected sms-active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, notificationPreference: 'Sms' }))}
                >
                  <div className="pref-card-header">
                    <div className="pref-icon-box grey">
                      <MessageSquare size={22} />
                    </div>
                    <div className="pref-rate-badge grey">60% Delivery</div>
                  </div>
                  <h4 className="pref-card-title">SMS Notification</h4>
                  <p className="pref-card-desc">
                    Standard SMS text messages (subject to cellular network delays & DND operator blocks).
                  </p>
                  <div className="pref-select-indicator">
                    <span className="dot"></span>
                    <span>{formData.notificationPreference === 'Sms' ? 'Selected Channel' : 'Select SMS'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="intake-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Submitting Registration...</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Parent Information</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="intake-success-card">
            <div className="success-icon-circle">
              <CheckCircle size={54} />
            </div>
            <h2 className="success-title">Form Submitted Successfully!</h2>
            <p className="success-desc">
              Thank you, <strong>{formData.title} {formData.surname} {formData.firstName}</strong>. Your contact details and notification preference have been recorded.
            </p>

            <div className="success-summary-box">
              <div className="summary-row">
                <span className="label">Registered Email:</span>
                <span className="val">{formData.email}</span>
              </div>
              <div className="summary-row">
                <span className="label">WhatsApp Contact:</span>
                <span className="val">{formData.whatsappNumber}</span>
              </div>
              <div className="summary-row">
                <span className="label">Notification Channel:</span>
                <span className="val badge-chip">
                  {formData.notificationPreference === 'Email' && '📧 Email (100% Delivery)'}
                  {formData.notificationPreference === 'MobileApp' && '📱 Mobile App Notification (80% Delivery)'}
                  {formData.notificationPreference === 'Sms' && '💬 SMS Notification (60% Delivery)'}
                </span>
              </div>
            </div>

            <p className="success-footer-note">
              You will receive automated arrival & departure gate alerts according to your selected preference.
            </p>

            <button
              type="button"
              className="intake-reset-btn"
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  title: 'Mr.',
                  surname: '',
                  firstName: '',
                  otherName: '',
                  whatsappNumber: '',
                  email: '',
                  address: '',
                  notificationPreference: 'Email',
                });
              }}
            >
              Submit Another Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
