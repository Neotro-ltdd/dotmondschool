import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api, getTenantId, getPublicTenantDetails, API_ROOT } from '../../../services/api';
import './NeotroLogin.css';
import { useDialog } from '../../../context/DialogContext';
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';

export default function NeotroChangePassword() {
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

  const [schoolName, setSchoolName] = useState('Neotro Academic System');
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
    : null;

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
      navigate('/neotro-login');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    logout();
    navigate('/neotro-login');
  };

  return (
    <div className="neotro-login-container">
      <div className="neotro-bg-mesh"></div>
      <div className="neotro-orb neotro-orb-1"></div>
      <div className="neotro-orb neotro-orb-2"></div>

      <div className="neotro-login-card">
        <div className="neotro-card-header">
          <div className="neotro-brand-badge">
            {logoSrc ? (
              <img src={logoSrc} alt={schoolName} className="neotro-custom-logo" />
            ) : (
              <div className="neotro-logo-icon">
                <Shield size={28} />
              </div>
            )}
          </div>
          <h1 className="neotro-card-title">Security & Password Update</h1>
          <p className="neotro-card-subtitle">Update your credentials to access {schoolName}.</p>
        </div>

        {error && <div className="neotro-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="neotro-form">
          <div className="neotro-input-group">
            <label htmlFor="currentPassword" className="neotro-input-label">
              Current Password
            </label>
            <div className="neotro-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="neotro-input"
                style={{ paddingLeft: '16px' }}
              />
              <button
                type="button"
                className="neotro-toggle-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="neotro-input-group">
            <label htmlFor="newPassword" className="neotro-input-label">
              New Password
            </label>
            <div className="neotro-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="neotro-input"
                style={{ paddingLeft: '16px' }}
              />
              <button
                type="button"
                className="neotro-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="neotro-input-group">
            <label htmlFor="confirmPassword" className="neotro-input-label">
              Confirm New Password
            </label>
            <div className="neotro-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="neotro-input"
                style={{ paddingLeft: '16px' }}
              />
              <button
                type="button"
                className="neotro-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="neotro-submit-btn" disabled={loading}>
            {loading ? 'Updating Credentials...' : 'Update Password'}
          </button>

          <div className="neotro-card-footer" style={{ marginTop: '16px', paddingTop: '12px' }}>
            <button type="button" onClick={handleBackToLogin} className="neotro-footer-btn">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
