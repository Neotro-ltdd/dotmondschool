import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, getTenantId, getPublicTenantDetails, API_ROOT } from '../../services/api';
import './Login.css';

export default function Login() {
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
      navigate('/dashboard'); 
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
        alert("Account verified successfully! Please enter your password to log in.");
        return;
      }
      
      const response = await api.post('/auth/login', { email, password: loginPassword });
      login(response.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel glass-panel">
        <div className="login-header">
          {logoUrl ? (
            <img src={`${API_ROOT}${logoUrl}`} alt={`${schoolName} Logo`} className="school-logo" style={{ maxHeight: '80px', marginBottom: '10px' }} />
          ) : (
            <div className="school-logo-placeholder">{schoolName === "Neotro SMS" ? "NS" : schoolName.substring(0, 2).toUpperCase()}</div>
          )}
          <h1>Welcome to {schoolName}</h1>
          <p>{isOtpMode ? 'Enter the OTP sent to your email to verify your account.' : 'Sign in to access your portal'}</p>
        </div>
        
        {error && <div className="error-alert">{error}</div>}

        {!isOtpMode ? (
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
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        ) : (
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
        )}

        {!isOtpMode && (
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
