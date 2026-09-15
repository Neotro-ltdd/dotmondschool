import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api, getTenantId, getPublicTenantDetails, API_ROOT } from '../../../services/api';
import { Eye, EyeOff, Shield, Mail, Lock, ArrowRight, AlertCircle, Building2, KeyRound } from 'lucide-react';
import './NeotroLogin.css';

export default function NeotroLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialTenant = getTenantId();
  const [schoolCode, setSchoolCode] = useState(initialTenant === 'dbo' || initialTenant === 'system' ? 'neotro' : initialTenant);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          <h1 className="neotro-card-title">{schoolName}</h1>
          <p className="neotro-card-subtitle">
            Sign in to access your administrative dashboard, academic broadsheets & student records.
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
                onClick={() => navigate('/change-password')}
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

        {/* Footer */}
        <div className="neotro-card-footer">
          <div className="neotro-footer-links">
            <button type="button" onClick={() => navigate('/')} className="neotro-footer-btn">
              ← Return Home
            </button>
            <button type="button" onClick={() => navigate('/master-login')} className="neotro-footer-btn">
              <KeyRound size={13} /> Master Admin
            </button>
          </div>
          <p className="neotro-copyright">
            © {new Date().getFullYear()} Neotro Academic System. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
