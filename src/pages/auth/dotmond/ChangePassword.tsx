import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api, getTenantId, getPublicTenantDetails, API_ROOT } from '../../../services/api';
import './Login.css';
import { useDialog } from '../../../context/DialogContext';
import { Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
  const { showAlert } = useDialog();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [schoolName, setSchoolName] = useState('Dotmond School');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      const tenantId = getTenantId();
      if (tenantId && tenantId !== 'dbo' && tenantId !== 'system') {
        const details = await getPublicTenantDetails(tenantId);
        if (details) {
          if (details.schoolName) setSchoolName(details.schoolName);
          if (details.logoUrl) setLogoUrl(details.logoUrl);
        }
      }
    };
    fetchTenantDetails();
  }, []);

  const logoSrc = logoUrl
    ? logoUrl.startsWith('http')
      ? logoUrl
      : `${API_ROOT}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`
    : '/images/dotmond-logo-1.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      showAlert('Password changed successfully! Please log in again with your new password.');
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    logout();
    navigate('/login');
  };

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

              <h1 className="title">Change Password</h1>
              <p className="subtitle">Please update your password to secure your account.</p>

              {error && <div className="alert-error">{error}</div>}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="field">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
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
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
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

                <button type="submit" className="signin" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>

                <div className="bottom-links">
                  <button type="button" onClick={handleBackToLogin}>
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
