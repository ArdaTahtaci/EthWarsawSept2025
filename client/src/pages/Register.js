import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import WalletConnector from '../components/WalletConnector';

const Register = () => {
    const [authType, setAuthType] = useState('email'); // 'email' or 'wallet'
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        creatorType: 'Instagram'
    });

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEmailRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await register(formData, false);

        if (result.success) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    const handleWalletRegister = async (walletData) => {
        setLoading(true);

        const result = await register({
            ...walletData,
            creatorType: formData.creatorType
        }, true);

        if (result.success) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card">
                <div className="card-header text-center">
                    <h1 className="card-title">Create Your Account</h1>
                    <p className="card-subtitle">
                        Join thousands of creators already using FreelanceChain
                    </p>
                </div>

                {/* Auth Type Selector */}
                <div className="auth-selector">
                    <div
                        className={`auth-option ${authType === 'email' ? 'selected' : ''}`}
                        onClick={() => setAuthType('email')}
                    >
                        <div className="auth-option-icon">📧</div>
                        <h3 className="auth-option-title">Email Registration</h3>
                        <p className="auth-option-subtitle">
                            Start with email/password. Get a managed wallet automatically.
                        </p>
                    </div>

                    <div
                        className={`auth-option ${authType === 'wallet' ? 'selected' : ''}`}
                        onClick={() => setAuthType('wallet')}
                    >
                        <div className="auth-option-icon">👛</div>
                        <h3 className="auth-option-title">Connect Wallet</h3>
                        <p className="auth-option-subtitle">
                            Use MetaMask or WalletConnect. Full Web3 experience.
                        </p>
                    </div>
                </div>

                {/* Creator Type Selection */}
                <div className="form-group">
                    <label className="form-label">What type of creator are you?</label>
                    <select
                        name="creatorType"
                        value={formData.creatorType}
                        onChange={handleInputChange}
                        className="form-input"
                    >
                        <option value="Instagram">Instagram Influencer</option>
                        <option value="TikTok">TikTok Creator</option>
                        <option value="YouTube">YouTube Creator</option>
                        <option value="Twitch">Twitch Streamer</option>
                        <option value="Twitter">Twitter/X Influencer</option>
                        <option value="LinkedIn">LinkedIn Creator</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Email Registration Form */}
                {authType === 'email' && (
                    <form onSubmit={handleEmailRegister}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="creator@example.com"
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
                                placeholder="Choose a strong password"
                                required
                                minLength={6}
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
                                    Creating Account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                )}

                {/* Wallet Registration */}
                {authType === 'wallet' && (
                    <WalletConnector
                        onConnect={handleWalletRegister}
                        loading={loading}
                        buttonText="Register with Wallet"
                    />
                )}

                <div className="text-center mt-4">
                    <p className="text-sm">
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#2563eb', fontWeight: '600' }}>
                            Sign in here
                        </Link>
                    </p>
                </div>

                {authType === 'email' && (
                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem' }}>
                        <p className="text-sm">
                            <strong>🎯 Perfect for traditional creators:</strong> We'll create a secure wallet for you automatically.
                            You can connect your own wallet later for full Web3 features.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register; 