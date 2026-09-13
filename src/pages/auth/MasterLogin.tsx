import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, Server, ArrowRight, AlertCircle } from 'lucide-react';
import './MasterLogin.css';

const MasterLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Force tenant context to 'system'
      localStorage.setItem('srms_tenantId', 'system');

      const res = await api.post('/auth/login', { email, password });

      login(res.token);
      if (res.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/system-admin');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid master credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-login-wrapper">
      <div className="master-bg-grid"></div>
      <div className="master-orb master-orb-1"></div>
      <div className="master-orb master-orb-2"></div>

      <div className="master-login-card">
        <div className="master-card-header">
          <div className="master-shield-badge">
            <ShieldCheck size={32} />
          </div>
          <div className="master-pill-tag">
            <Server size={12} />
            Neotro Platform Control
          </div>
          <h1 className="master-card-title">System Master Portal</h1>
          <p className="master-card-subtitle">
            Enter superadmin credentials to access multi-tenant administration & school management.
          </p>
        </div>

        {error && (
          <div className="master-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="master-form">
          <div className="master-input-group">
            <label htmlFor="master-email" className="master-input-label">
              Master Admin Email
            </label>
            <div className="master-input-wrapper">
              <Mail className="master-input-icon" size={18} />
              <input
                id="master-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@neotro.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="master-input"
              />
            </div>
          </div>

          <div className="master-input-group">
            <label htmlFor="master-password" className="master-input-label">
              Master Security Key / Password
            </label>
            <div className="master-input-wrapper">
              <Lock className="master-input-icon" size={18} />
              <input
                id="master-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="master-input"
              />
              <button
                type="button"
                className="master-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="master-submit-btn">
            {loading ? (
              <>
                <div className="master-spinner" />
                Authenticating Master Access...
              </>
            ) : (
              <>
                Sign In to Control Center
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="master-card-footer">
          <ShieldCheck size={14} className="master-footer-icon" />
          <span>Encrypted 256-bit TLS Session · IP & Audit Monitored</span>
        </div>
      </div>
    </div>
  );
};

export default MasterLogin;
