import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useDialog } from '../../../context/DialogContext';
import { api, getTenantId, getPublicTenantDetails, API_ROOT } from '../../../services/api';
import { Eye, EyeOff, Shield, Mail, Lock, ArrowRight, AlertCircle, Building2, KeyRound } from 'lucide-react';
import './NeotroLogin.css';

export default function NeotroLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert } = useDialog();

  const initialTenant = getTenantId();
  const [schoolCode, setSchoolCode] = useState(initialTenant === 'dbo' || initialTenant === 'system' ? 'neotro' : initialTenant);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [schoolName, setSchoolName] = useState('Neotro Academic System');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const authErr = sessionStorage.getItem('srms_auth_error');
    if (authErr) {
      setError(authErr);
      sessionStorage.removeItem('srms_auth_error');
    }
  }, []);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      const tenantId = schoolCode.trim().toLowerCase();
      if (tenantId && tenantId !== 'dbo' && tenantId !== 'system') {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          if (details.logoUrl) {
            const fullLogo = details.logoUrl.startsWith('http') ? details.logoUrl : `${API_ROOT}${details.logoUrl}`;
            setLogoUrl(fullLogo);
          }
          if (details.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', details.primaryColor);
          } else {
            document.documentElement.style.setProperty('--primary-color', '#1B5E4B');
          }
          if (details.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', details.secondaryColor);
          } else {
            document.documentElement.style.setProperty('--secondary-color', '#B2CEB6');
          }
        }
      } else {
        setSchoolName('Neotro Academic System');
        setLogoUrl(null);
        document.documentElement.style.setProperty('--primary-color', '#1B5E4B');
        document.documentElement.style.setProperty('--secondary-color', '#B2CEB6');
      }
    };

    if (schoolCode && schoolCode.length >= 2) {
      const timer = setTimeout(() => {
        fetchTenantDetails();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [schoolCode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const activeCode = schoolCode.trim().toLowerCase() || 'neotro';
    localStorage.setItem('srms_tenantId', activeCode);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.token);

      if (response.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Neotro Login error:', err);
      setError(err.message || 'Authentication failed. Please check your email, password, or school code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const activeCode = schoolCode.trim().toLowerCase() || 'neotro';
    localStorage.setItem('srms_tenantId', activeCode);

    try {
      if (forgotPasswordStep === 1) {
        await api.post('/auth/forgot-password', { email });
        setForgotPasswordStep(2);
        showAlert("A 6-digit reset code has been sent to your email.");
      } else {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        await api.post('/auth/reset-password', { email, token: otp, newPassword });
        setIsForgotPasswordMode(false);
        setForgotPasswordStep(1);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert("Password reset successfully! You can now log in.");
      }
    } catch (err: any) {
      console.error('Neotro forgot password error:', err);
      setError(err.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neotro-login-container">
      {/* Background Decorative Mesh & Geometry */}
      <div className="neotro-bg-mesh"></div>
      <div className="neotro-orb neotro-orb-1"></div>
      <div className="neotro-orb neotro-orb-2"></div>

      <div className="neotro-login-card">
        {/* Header Branding */}
        <div className="neotro-card-header">
          <div className="neotro-brand-badge">
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className="neotro-custom-logo" />
            ) : (
              <div className="neotro-logo-icon">
                <Shield size={28} />
              </div>
            )}
          </div>
          <span className="neotro-pill-tag">
            <Building2 size={12} />
            Neotro Enterprise Portal
          </span>
          <h1 className="neotro-card-title">
            {isForgotPasswordMode ? "Reset Password" : schoolName}
          </h1>
          <p className="neotro-card-subtitle">
            {isForgotPasswordMode
              ? (forgotPasswordStep === 1
                  ? "Enter your registered email to receive an OTP code."
                  : "Enter the 6-digit OTP sent to your email and your new password.")
              : "Sign in to access your administrative dashboard, academic broadsheets & student records."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="neotro-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {isForgotPasswordMode ? (
          <form onSubmit={handleForgotPasswordSubmit} className="neotro-form">
            {/* School Code Input */}
            <div className="neotro-input-group">
              <label htmlFor="neotro-school-code" className="neotro-input-label">
                School Code / Tenant ID
              </label>
              <div className="neotro-input-wrapper">
                <Building2 className="neotro-input-icon" size={18} />
                <input
                  id="neotro-school-code"
                  type="text"
                  required
                  placeholder="e.g. neotro or greenhillschools"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  disabled={forgotPasswordStep === 2}
                  className="neotro-input"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="neotro-input-group">
              <label htmlFor="neotro-email" className="neotro-input-label">
                Email Address
              </label>
              <div className="neotro-input-wrapper">
                <Mail className="neotro-input-icon" size={18} />
                <input
                  id="neotro-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="principal@neotro.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotPasswordStep === 2}
                  className="neotro-input"
                />
              </div>
            </div>

            {/* Step 2 Inputs */}
            {forgotPasswordStep === 2 && (
              <>
                <div className="neotro-input-group">
                  <label htmlFor="neotro-otp" className="neotro-input-label">
                    6-Digit Reset Code (OTP)
                  </label>
                  <div className="neotro-input-wrapper">
                    <Lock className="neotro-input-icon" size={18} />
                    <input
                      id="neotro-otp"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="neotro-input"
                    />
                  </div>
                </div>

                <div className="neotro-input-group">
                  <label htmlFor="neotro-new-password" className="neotro-input-label">
                    New Password
                  </label>
                  <div className="neotro-input-wrapper">
                    <Lock className="neotro-input-icon" size={18} />
                    <input
                      id="neotro-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={otp.length !== 6}
                      className="neotro-input"
                    />
                    <button
                      type="button"
                      className="neotro-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="neotro-input-group">
                  <label htmlFor="neotro-confirm-password" className="neotro-input-label">
                    Confirm New Password
                  </label>
                  <div className="neotro-input-wrapper">
                    <Lock className="neotro-input-icon" size={18} />
                    <input
                      id="neotro-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={otp.length !== 6}
                      className="neotro-input"
                    />
                    <button
                      type="button"
                      className="neotro-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="neotro-submit-btn">
              {loading ? (
                <>
                  <div className="neotro-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  {forgotPasswordStep === 1 ? "Send OTP Code" : "Reset Password"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="neotro-form">
            {/* School Code Input */}
            <div className="neotro-input-group">
              <label htmlFor="neotro-school-code" className="neotro-input-label">
                School Code / Institution ID
              </label>
              <div className="neotro-input-wrapper">
                <Building2 className="neotro-input-icon" size={18} />
                <input
                  id="neotro-school-code"
                  type="text"
                  required
                  placeholder="e.g. neotro or greenhillschools"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  className="neotro-input"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="neotro-input-group">
              <label htmlFor="neotro-email" className="neotro-input-label">
                Email Address
              </label>
              <div className="neotro-input-wrapper">
                <Mail className="neotro-input-icon" size={18} />
                <input
                  id="neotro-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="principal@neotro.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neotro-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="neotro-input-group">
              <div className="neotro-label-row">
                <label htmlFor="neotro-password" className="neotro-input-label">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="neotro-forgot-link"
                >
                  Reset Password?
                </button>
              </div>
              <div className="neotro-input-wrapper">
                <Lock className="neotro-input-icon" size={18} />
                <input
                  id="neotro-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neotro-input"
                />
                <button
                  type="button"
                  className="neotro-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="neotro-submit-btn">
              {loading ? (
                <>
                  <div className="neotro-spinner" />
                  Signing In...
                </>
              ) : (
                <>
                  Access Portal
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="neotro-card-footer">
          <div className="neotro-footer-links">
            {isForgotPasswordMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(false);
                  setForgotPasswordStep(1);
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="neotro-footer-btn"
              >
                ← Back to Login
              </button>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/')} className="neotro-footer-btn">
                  ← Return Home
                </button>
                <button type="button" onClick={() => navigate('/master-login')} className="neotro-footer-btn">
                  <KeyRound size={13} /> Master Admin
                </button>
              </>
            )}
          </div>
          <p className="neotro-copyright">
            © {new Date().getFullYear()} Neotro Academic System. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

