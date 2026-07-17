import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, getTenantId, getPublicTenantDetails, API_ROOT } from '../../services/api';
import './Login.css';
import { useDialog } from '../../context/DialogContext';


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
  
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [schoolName, setSchoolName] = useState("Neotro SMS");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyParam = params.get('verify');
    const emailParam = params.get('email');
    if (verifyParam === 'true') {
      setIsOtpMode(true);
      if (emailParam) setEmail(emailParam);
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
        setSchoolName("Neotro SMS");
        setLogoUrl(null);
      }
    };
    
    // Only fetch if it's a reasonable length to avoid spamming the API while typing
    if (schoolCode && schoolCode.length > 2) {
        const timer = setTimeout(() => {
            fetchTenantDetails();
        }, 500);
        return () => clearTimeout(timer);
    } else if (!schoolCode) {
        setSchoolName("Neotro SMS");
        setLogoUrl(null);
    }
  }, [schoolCode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!schoolCode) {
        setError("Please enter your School Code.");
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
        setError("Account not verified. Please check your email for the OTP.");
      } else {
        setError(err.message || "Failed to log in.");
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
        setError("Please enter your School Code.");
        setLoading(false);
        return;
    }

    localStorage.setItem('srms_tenantId', schoolCode.toLowerCase().trim());

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify-account', { email, otp, newPassword });
      
      const loginPassword = newPassword || password;
      if (!loginPassword) {
        setIsOtpMode(false);
        setOtp('');
        showAlert("Account verified successfully! Please enter your password to log in.");
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
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!schoolCode) {
        setError("Please enter your School Code.");
        setLoading(false);
        return;
    }

    localStorage.setItem('srms_tenantId', schoolCode.toLowerCase().trim());

    try {
      if (forgotPasswordStep === 1) {
        // Request OTP
        await api.post('/auth/forgot-password', { email });
        setForgotPasswordStep(2);
        showAlert("A 6-digit reset code has been sent to your email.");
      } else {
        // Reset Password
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
      setError(err.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel glass-panel">
        <div className="login-header">
          {logoUrl ? (
            <img 
              src={logoUrl.startsWith('http') ? logoUrl : `${API_ROOT}${logoUrl}`} 
              alt={`${schoolName} Logo`} 
              className="school-logo" 
              style={{ maxHeight: '80px', marginBottom: '10px' }} 
            />
          ) : (
            <div className="school-logo-placeholder">{schoolName === "Neotro SMS" ? "NS" : schoolName.substring(0, 2).toUpperCase()}</div>
          )}
          <h1>Welcome to {schoolName}</h1>
          <p>
            {isOtpMode 
              ? 'Enter the OTP sent to your email to verify your account.' 
              : isForgotPasswordMode
                ? (forgotPasswordStep === 1 ? 'Enter your email to receive a password reset code.' : 'Enter the 6-digit code and your new password.')
                : 'Sign in to access your portal'
            }
          </p>
        </div>
        
        {error && <div className="alert-error">{error}</div>}

        {isForgotPasswordMode ? (
          <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
            <div className="form-group">
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
            <div className="form-group">
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
                <div className="form-group">
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
                <div className="form-group">
                  <label htmlFor="resetNewPassword">New Password</label>
                  <input
                    type="password"
                    id="resetNewPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={otp.length !== 6}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="resetConfirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="resetConfirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={otp.length !== 6}
                  />
                </div>
              </>
            )}
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Processing..." : (forgotPasswordStep === 1 ? "Send Reset Code" : "Reset Password")}
              </button>
            </div>
            <div className="mt-3 text-center">
              <button 
                type="button" 
                className="btn btn-outline btn-full" 
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
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="newPassword">New Permanent Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </div>
            <div className="mt-3 text-center">
              <button type="button" className="btn btn-outline btn-full" onClick={() => setIsOtpMode(false)}>
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
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
            <div className="form-group">
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
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-link" 
                  style={{ background: 'none', border: 'none', color: '#0F1F5C', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  onClick={() => setIsForgotPasswordMode(true)}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        )}

        {!isOtpMode && !isForgotPasswordMode && (
          <div className="login-footer">
            <button className="btn btn-outline btn-full mt-3" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
