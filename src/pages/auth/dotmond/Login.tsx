import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, getTenantId, getPublicTenantDetails, API_ROOT } from '../../../services/api';
import './Login.css';
import { useDialog } from '../../../context/DialogContext';
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

  const [schoolName, setSchoolName] = useState('Dotmond School');
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
          if (details.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', details.primaryColor);
          }
          if (details.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', details.secondaryColor);
          }
        }
      } else {
        setSchoolName('Dotmond School');
        setLogoUrl(null);
      }
    };

    if (schoolCode && schoolCode.length > 2) {
      const timer = setTimeout(() => {
        fetchTenantDetails();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!schoolCode) {
      setSchoolName('Dotmond School');
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
      console.error('Login error details:', err);
      if (err instanceof ApiError) {
        if (err.data?.requiresOtp) {
          setIsOtpMode(true);
          setError(err.message || 'OTP verification required. Check your email for code.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, code: otp });
      showAlert('Account verified successfully! You can now log in.');
      setIsOtpMode(false);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email address to resend OTP.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { email });
      showAlert('A new verification OTP code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (forgotPasswordStep === 1) {
        await api.post('/identity/forgot-password/request', { email });
        showAlert('OTP reset code sent to your email.');
        setForgotPasswordStep(2);
      } else {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await api.post('/identity/forgot-password/reset', { email, otp, newPassword });
        showAlert('Password reset successful! Please login with your new password.');
        setIsForgotPasswordMode(false);
        setForgotPasswordStep(1);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = logoUrl
    ? logoUrl.startsWith('http')
      ? logoUrl
      : `${API_ROOT}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`
    : '/images/dotmond-logo-1.png';

  return (
    <div className="login-container">
      <div className="split">
        {/* LEFT BRAND PANEL WITH MOTION LOGO */}
        <div className="panel-brand">
          <div className="ribbon-decor" aria-hidden="true">
            <svg className="rd-1" viewBox="0 0 200 60">
              <path
                d="M5 25 Q 40 5, 80 30 T 170 15"
                stroke="#F0A93B"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <svg className="rd-2" viewBox="0 0 160 50">
              <path
                d="M10 40 Q 50 10, 90 35 T 150 20"
                stroke="#7FA6E0"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <svg className="rd-3" viewBox="0 0 180 50">
              <path
                d="M5 15 Q 45 40, 95 15 T 175 30"
                stroke="#F0A93B"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <svg className="rd-4" viewBox="0 0 200 60">
              <path
                d="M2 45 Q30 15 55 40 T110 20 T170 35"
                stroke="#7FA6E0"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="crest-motion-wrap">
            <div className="crest-glow-big" aria-hidden="true"></div>
            <img className="crest-motion" src={logoSrc} alt={`${schoolName} Logo`} />
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="panel-form">
          <div className="curve-frame">
            <div className="form-card">
              <div className="form-glow"></div>

              <img className="crest-steady" src={logoSrc} alt={`${schoolName} Logo`} />

              {isForgotPasswordMode ? (
                <>
                  <h1 className="title">Reset Password</h1>
                  <p className="subtitle">
                    {forgotPasswordStep === 1
                      ? 'Enter your registered email to receive an OTP code.'
                      : 'Enter the OTP sent to your email along with your new password.'}
                  </p>

                  {error && <div className="alert-error">{error}</div>}

                  <form onSubmit={handleForgotPasswordSubmit} className="login-form">
                    {forgotPasswordStep === 1 ? (
                      <div className="field">
                        <label htmlFor="reset-email">Email Address</label>
                        <input
                          type="email"
                          id="reset-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@school.com"
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div className="field">
                          <label htmlFor="otp-code">6-Digit OTP Code</label>
                          <input
                            type="text"
                            id="otp-code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            required
                          />
                        </div>

                        <div className="field">
                          <label htmlFor="new-password">New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              id="new-password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
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
                          <label htmlFor="confirm-password">Confirm New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirm-password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
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
                      </>
                    )}

                    <button type="submit" className="signin" disabled={loading}>
                      {loading
                        ? 'Processing...'
                        : forgotPasswordStep === 1
                        ? 'Send OTP Code'
                        : 'Reset Password'}
                    </button>

                    <div className="bottom-links">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(false);
                          setForgotPasswordStep(1);
                        }}
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </>
              ) : isOtpMode ? (
                <>
                  <h1 className="title">Verify Account</h1>
                  <p className="subtitle">Enter the 6-digit OTP code sent to your email.</p>

                  {error && <div className="alert-error">{error}</div>}

                  <form onSubmit={handleOtpVerify} className="login-form">
                    <div className="field">
                      <label htmlFor="verify-email">Email Address</label>
                      <input
                        type="email"
                        id="verify-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@school.com"
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="otp">6-Digit OTP Code</label>
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>

                    <button type="submit" className="signin" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <div className="bottom-links">
                      <button type="button" onClick={handleResendOtp} disabled={loading}>
                        Resend OTP
                      </button>
                      <button type="button" onClick={() => setIsOtpMode(false)}>
                        Back to Login
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="title">Welcome Back</h1>
                  <p className="subtitle">Please enter your school details to log in.</p>

                  {error && <div className="alert-error">{error}</div>}

                  <form onSubmit={handleLoginSubmit} className="login-form">
                    <div className="field">
                      <label htmlFor="schoolCode">School Code / Tenant ID</label>
                      <input
                        type="text"
                        id="schoolCode"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value)}
                        placeholder="e.g. dotmond"
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
                        placeholder="your.email@school.com"
                        required
                      />
                    </div>

                    <div className="field">
                      <div className="label-with-link">
                        <label htmlFor="password">Password</label>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => setIsForgotPasswordMode(true)}
                        >
                          Forgot Password?
                        </button>
                      </div>
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

                    <button type="submit" className="signin" disabled={loading}>
                      {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
