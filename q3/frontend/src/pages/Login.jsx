import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [accountEmail, setAccountEmail] = useState('customer@cartcraft.com');
  const [accountSecret, setAccountSecret] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setAuthenticating(true);
    try {
      await login(accountEmail, accountSecret);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In to CartCraft</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginBottom: '1.4rem' }}>
        Access your account
      </p>
      {errorMessage && <div className="banner-failure">{errorMessage}</div>}
      <form onSubmit={handleSignIn}>
        <div className="field-group">
          <label>Registered Email</label>
          <input
            type="email"
            required
            value={accountEmail}
            onChange={(e) => setAccountEmail(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Security Password</label>
          <input
            type="password"
            required
            value={accountSecret}
            onChange={(e) => setAccountSecret(e.target.value)}
          />
        </div>
        <button type="submit" className="action-btn btn-teal full-width" disabled={authenticating}>
          {authenticating ? 'Verifying...' : 'Authorize Sign In'}
        </button>
      </form>
      <div className="switch-line">
        <span>Need an account? </span>
        <button className="link-btn" onClick={onSwitch}>Create account</button>
      </div>
      <div className="account-cheatsheet">
        <strong>Pre-configured Accounts:</strong>
        <div>Customer: customer@cartcraft.com / password123</div>
        <div>Admin: admin@cartcraft.com / password123</div>
      </div>
    </div>
  );
}
