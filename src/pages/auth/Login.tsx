import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, getTenantId, getPublicTenantDetails, API_ROOT } from '../../services/api';
import './Login.css';
import { useDialog } from '../../context/DialogContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { showAlert } = useDialog();

  const navigate = useNavigate();
  const { login } = useAuth();

  const initialTenant = getTenantId();
  const [schoolCode, setSchoolCode] = useState(initialTenant === 'dbo' ? '' : initialTenant);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNeotroBranding = (import.meta.env.VITE_CLIENT_BRANDING || 'dotmond') === 'neotro';
  const [schoolName, setSchoolName] = useState(isNeotroBranding ? 'Neotro Academic System' : 'Neotro SMS');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyParam = params.get('verify');
    const emailParam = params.get('email');
    if (verifyParam === 'true') {
      setIsOtpMode(true);
      if (emailParam) setEmail(emailParam);
    }

    const authErr = sessionStorage.getItem('srms_auth_error');
    if (authErr) {
      setError(authErr);
      sessionStorage.removeItem('srms_auth_error');
    }
  }, []);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      const tenantId = schoolCode || getTenantId();
      if (tenantId && tenantId !== 'dbo' && tenantId !== 'system') {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          if (details.logoUrl) setLogoUrl(details.logoUrl);
        }
      } else {
        setSchoolName(isNeotroBranding ? 'Neotro Academic System' : 'Neotro SMS');
        setLogoUrl(null);
      }
    };

    if (schoolCode && schoolCode.length > 2) {
      const timer = setTimeout(() => {
        fetchTenantDetails();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!schoolCode) {
      setSchoolName(isNeotroBranding ? 'Neotro Academic System' : 'Neotro SMS');
      setLogoUrl(null);
    }
  }, [schoolCode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!schoolCode) {
      setError('Please enter your School Code.');
      setLoading(false);
      return;
    }

    localStorage.setItem('srms_tenantId', schoolCode.toLowerCase().trim());

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.token);
      if (response.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.message.includes('Account not verified')) {
        setIsOtpMode(true);
        setError('Account not verified. Please check your email for the OTP.');
      } else {
        setError(err.message || 'Failed to log in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!schoolCode) {
      setError('Please enter your School Code.');
      setLoading(false);
      return;
    }

    localStorage.setItem('srms_tenantId', schoolCode.toLowerCase().trim());

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify-account', { email, otp, newPassword });

      const loginPassword = newPassword || password;
      if (!loginPassword) {
        setIsOtpMode(false);
        setOtp('');
        showAlert('Account verified successfully! Please enter your password to log in.');
        return;
      }

      const response = await api.post('/auth/login', { email, password: loginPassword });
      login(response.token);
      if (response.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!schoolCode) {
      setError('Please enter your School Code.');
      setLoading(false);
      return;
    }

    localStorage.setItem('srms_tenantId', schoolCode.toLowerCase().trim());

    try {
      if (forgotPasswordStep === 1) {
        await api.post('/auth/forgot-password', { email });
        setForgotPasswordStep(2);
        showAlert('A 6-digit reset code has been sent to your email.');
      } else {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await api.post('/auth/reset-password', { email, token: otp, newPassword });
        setIsForgotPasswordMode(false);
        setForgotPasswordStep(1);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert('Password reset successfully! You can now log in.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const defaultLogo = isNeotroBranding ? '/logo192.png' : '/images/dotmond-logo-1.png';

  const logoSrc = logoUrl
    ? logoUrl.startsWith('http')
      ? logoUrl
      : `${API_ROOT}${logoUrl}`
    : defaultLogo;

  return (
    <div className="login-container">
      <div className="split">
        <div className="panel-brand">
          <div className="ribbon-decor" aria-hidden="true">
            <svg className="rd-1" viewBox="0 0 400 120">
              <path d="M-50,60 C100,10 250,110 450,30" stroke="#B2CEB6" strokeWidth="3" fill="none" opacity="0.3" />
            </svg>
            <svg className="rd-2" viewBox="0 0 400 120">
              <path d="M-20,30 C120,90 280,10 420,80" stroke="#B2CEB6" strokeWidth="2.5" fill="none" opacity="0.2" />
            </svg>
          </div>

          <div className="brand-hero-content">
            <div className="brand-logo-card">
              <img
                className="brand-logo-img"
                src={logoSrc}
                alt={`${schoolName} Logo`}
              />
            </div>
            
            <h1 className="brand-system-title">{schoolName.toUpperCase()}</h1>
            <p className="brand-system-subtitle">Enterprise Education Management Platform</p>

            <div className="brand-trust-pills">
              <span className="trust-pill">✓ Bank-Grade Schema Isolation</span>
              <span className="trust-pill">✓ Realtime Gate & Results Engine</span>
            </div>
          </div>
        </div>

        <div className="panel-form">
          <div className="curve-frame">
            <div className="form-card">
              <div className="form-glow"></div>

              <img className="crest-steady" src={logoSrc} alt={`${schoolName} Logo`} />

              <h1 className="title">
                {isForgotPasswordMode ? 'Reset Password' : isOtpMode ? 'Verify Account' : 'Sign In'}
              </h1>
              <p className="subtitle">
                {isOtpMode
                  ? 'Enter the OTP sent to your email.'
                  : isForgotPasswordMode
                    ? forgotPasswordStep === 1
                      ? 'Enter your email to receive a code.'
                      : 'Enter the code and your new password.'
                    : `Welcome to ${schoolName}`}
              </p>

              {error && <div className="alert-error">{error}</div>}

              {isForgotPasswordMode ? (
                <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
                  <div className="field">
                    <label htmlFor="schoolCodeForgot">School Code</label>
                    <input
                      type="text"
                      id="schoolCodeForgot"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      placeholder="e.g. myschool"
                      required
                      disabled={forgotPasswordStep === 2}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="emailForgot">Email Address</label>
                    <input
                      type="email"
                      id="emailForgot"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.edu"
                      required
                      disabled={forgotPasswordStep === 2}
                    />
                  </div>

                  {forgotPasswordStep === 2 && (
                    <>
                      <div className="field">
                        <label htmlFor="resetOtp">6-Digit Reset Code</label>
                        <input
                          type="text"
                          id="resetOtp"
                          placeholder="123456"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          className="otp-input"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="resetNewPassword">New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="resetNewPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            disabled={otp.length !== 6}
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="resetConfirmPassword">Confirm New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="resetConfirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            disabled={otp.length !== 6}
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" className="signin" disabled={loading}>
                    {loading
                      ? 'Processing...'
                      : forgotPasswordStep === 1
                        ? 'Send Reset Code'
                        : 'Reset Password'}
                  </button>

                  <div className="bottom-links">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setForgotPasswordStep(1);
                        setOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : isOtpMode ? (
                <form className="login-form" onSubmit={handleOtpSubmit}>
                  <div className="field">
                    <label htmlFor="otp">One-Time Password (OTP)</label>
                    <input
                      type="text"
                      id="otp"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="otp-input"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="newPassword">New Permanent Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="signin" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>

                  <div className="bottom-links">
                    <button type="button" onClick={() => setIsOtpMode(false)}>
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="login-form">
                  <div className="field">
                    <label htmlFor="schoolCode">School Code</label>
                    <input
                      type="text"
                      id="schoolCode"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value)}
                      placeholder="e.g. myschool"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.edu"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="row-between">
                    <button
                      type="button"
                      className="link"
                      onClick={() => setIsForgotPasswordMode(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button type="submit" className="signin" disabled={loading}>
                    {loading ? 'Logging in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {!isOtpMode && !isForgotPasswordMode && (
                <div className="bottom-links">
                  <button onClick={() => navigate('/')}>Back to Home</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
