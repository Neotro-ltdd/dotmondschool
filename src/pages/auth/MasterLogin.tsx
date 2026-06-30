import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const MasterLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-container">
      <div className="login-panel glass-panel" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <div className="school-logo-placeholder" style={{ background: '#1e293b', color: '#38bdf8' }}>NA</div>
          <h1>Platform Admin</h1>
          <p>Secure System Management</p>
        </div>
        
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email-address">Master Email</label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              placeholder="admin@neotro.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Master Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading ? 'Authenticating...' : 'Sign in securely'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterLogin;
