import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="text-center">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '2rem', color: '#1a202c' }}>
                    Professional Invoicing for the Creator Economy
                </h1>

                <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '3rem', lineHeight: '1.8' }}>
                    The first platform that bridges traditional social media creators to Web3 payments.
                    Create professional invoices, accept crypto payments, and track your income seamlessly.
                </p>

                <div className="auth-selector" style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
                    <div className="auth-option">
                        <div className="auth-option-icon">📧</div>
                        <h3 className="auth-option-title">Traditional Creators</h3>
                        <p className="auth-option-subtitle">
                            Instagram, TikTok, YouTube creators. Start with email, upgrade to crypto when ready.
                        </p>
                    </div>

                    <div className="auth-option">
                        <div className="auth-option-icon">👛</div>
                        <h3 className="auth-option-title">Web3 Natives</h3>
                        <p className="auth-option-subtitle">
                            Connect your wallet directly. Full control, advanced features, DeFi integration.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                                Get Started Free
                            </Link>
                            <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                                Sign In
                            </Link>
                        </>
                    )}
                </div>

                <div style={{ marginTop: '4rem', padding: '2rem', background: '#f8fafc', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Why FreelanceChain?
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                        <div>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🚀 Easy Onboarding</h3>
                            <p className="text-sm text-gray-600">Start with familiar email/password. No wallet needed initially.</p>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💰 Crypto Payments</h3>
                            <p className="text-sm text-gray-600">Accept payments in ETH, USDC, DAI and more. Lower fees, faster transfers.</p>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📊 Tax Ready</h3>
                            <p className="text-sm text-gray-600">Automatic income tracking and tax-ready reports. Export to QuickBooks.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 