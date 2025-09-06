import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import WalletConnector from '../components/WalletConnector';

const Login = () => {
    const [authType, setAuthType] = useState('email');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData, false);

        if (result.success) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    const handleWalletLogin = async (walletData) => {
        setLoading(true);

        const result = await login(walletData, true);

        if (result.success) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="card">
                <div className="card-header text-center">
                    <h1 className="card-title">Welcome Back</h1>
                    <p className="card-subtitle">
                        Sign in to your FreelanceChain account
                    </p>
                </div>

                {/* Auth Type Selector */}
                <div className="auth-selector">
                    <div
                        className={`auth-option ${authType === 'email' ? 'selected' : ''}`}
                        onClick={() => setAuthType('email')}
                    >
                        <div className="auth-option-icon">📧</div>
                        <h3 className="auth-option-title">Email Login</h3>
                        <p className="auth-option-subtitle">
                            Sign in with your email and password
                        </p>
                    </div>

                    <div
                        className={`auth-option ${authType === 'wallet' ? 'selected' : ''}`}
                        onClick={() => setAuthType('wallet')}
                    >
                        <div className="auth-option-icon">👛</div>
                        <h3 className="auth-option-title">Wallet Login</h3>
                        <p className="auth-option-subtitle">
                            Connect with MetaMask or WalletConnect
                        </p>
                    </div>
                </div>

                {/* Email Login Form */}
                {authType === 'email' && (
                    <form onSubmit={handleEmailLogin}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="Your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading">
                                    <div className="spinner"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                )}

                {/* Wallet Login */}
                {authType === 'wallet' && (
                    <WalletConnector
                        onConnect={handleWalletLogin}
                        loading={loading}
                        buttonText="Sign In with Wallet"
                    />
                )}

                <div className="text-center mt-4">
                    <p className="text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#2563eb', fontWeight: '600' }}>
                            Create one here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login; 