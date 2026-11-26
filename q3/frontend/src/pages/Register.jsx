import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitch }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [assignedRole, setAssignedRole] = useState('customer');
  const [errorNotice, setErrorNotice] = useState('');
  const [submittingUser, setSubmittingUser] = useState(false);

  const handleEnrollment = async (e) => {
    e.preventDefault();
    setErrorNotice('');
    setSubmittingUser(true);
    try {
      await register(fullName, userEmail, userPass, assignedRole);
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create New Account</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginBottom: '1.4rem' }}>
        Register on CartCraft
      </p>
      {errorNotice && <div className="banner-failure">{errorNotice}</div>}
      <form onSubmit={handleEnrollment}>
        <div className="field-group">
          <label>Full Name</label>
          <input
            type="text"
            required
            placeholder="Muhammad Sami Ullah"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Email Address</label>
          <input
            type="email"
            required
            placeholder="user@example.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Password</label>
          <input
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={userPass}
            onChange={(e) => setUserPass(e.target.value)}
          />
        </div>
        <div className="field-group">
          <label>Account Role</label>
          <select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="action-btn btn-teal full-width" disabled={submittingUser}>
          {submittingUser ? 'Registering...' : 'Complete Registration'}
        </button>
      </form>
      <div className="switch-line">
        <span>Already have an account? </span>
        <button className="link-btn" onClick={onSwitch}>Sign In</button>
      </div>
    </div>
  );
}
