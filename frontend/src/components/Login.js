import React, { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/Login.css';

function Login({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [role, setRole] = useState('user');
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminCode: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setForm({ username: '', email: '', password: '', confirmPassword: '', adminCode: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'register') {
                if (form.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                if (form.password !== form.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                const payload = {
                    username: form.username,
                    email: form.email,
                    password: form.password,
                };
                if (role === 'admin') {
                    payload.adminCode = form.adminCode;
                }
                const response = await authAPI.register(payload);
                onLogin(response.data.token, response.data.user);
            } else {
                const response = await authAPI.login({
                    username: form.username,
                    password: form.password,
                });
                onLogin(response.data.token, response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || (mode === 'register' ? 'Registration failed' : 'Login failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-shield" role="img" aria-label="shield">&#x1F6E1;&#xFE0F;</span>
                        <h1>Disaster Management System</h1>
                    </div>
                    <p className="login-subtitle">Intelligent Disaster Management Platform</p>
                </div>

                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                        type="button"
                    >
                        <span className="tab-icon" role="img" aria-label="key">&#x1F511;</span> Login
                    </button>
                    <button
                        className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                        type="button"
                    >
                        <span className="tab-icon" role="img" aria-label="signup">&#x1F4DD;</span> Sign Up
                    </button>
                </div>

                {mode === 'register' && (
                    <div className="role-selector">
                        <button
                            className={`role-btn ${role === 'user' ? 'active' : ''}`}
                            onClick={() => setRole('user')}
                            type="button"
                        >
                            <span className="role-icon" role="img" aria-label="user">&#x1F464;</span>
                            <div>
                                <strong>User</strong>
                                <small>Report disasters &amp; view updates</small>
                            </div>
                        </button>
                        <button
                            className={`role-btn ${role === 'admin' ? 'active admin-active' : ''}`}
                            onClick={() => setRole('admin')}
                            type="button"
                        >
                            <span className="role-icon" role="img" aria-label="admin">&#x1F451;</span>
                            <div>
                                <strong>Admin</strong>
                                <small>Verify, approve &amp; manage operations</small>
                            </div>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            <span role="img" aria-label="warning">&#x26A0;&#xFE0F;</span> {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-wrapper">
                            <span className="input-icon" role="img" aria-label="user">&#x1F464;</span>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                                placeholder="Enter username"
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon" role="img" aria-label="email">&#x2709;&#xFE0F;</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon" role="img" aria-label="lock">&#x1F512;</span>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon" role="img" aria-label="lock">&#x1F512;</span>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'register' && role === 'admin' && (
                        <div className="form-group admin-code-group">
                            <label htmlFor="adminCode">Admin Authorization Code</label>
                            <div className="input-wrapper">
                                <span className="input-icon" role="img" aria-label="key">&#x1F510;</span>
                                <input
                                    type="password"
                                    id="adminCode"
                                    name="adminCode"
                                    value={form.adminCode}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter admin secret code"
                                />
                            </div>
                            <small className="field-hint">Contact your organization to get the admin code</small>
                        </div>
                    )}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? (
                            <><span className="spinner"></span> {mode === 'register' ? 'Creating Account...' : 'Signing In...'}</>
                        ) : (
                            mode === 'register' ? 'Create Account' : 'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="auth-switch">
                        {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <span
                            className="auth-switch-link"
                            onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
                        >
                            {mode === 'register' ? 'Sign In' : 'Sign Up'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
