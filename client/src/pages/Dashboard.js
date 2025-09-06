import React from 'react';
import { useAuth } from '../components/AuthProvider';
import WalletConnector from '../components/WalletConnector';

const Dashboard = () => {
    const {
        user,
        isEmailUser,
        isWalletUser,
        isHybridUser,
        connectWallet
    } = useAuth();

    const handleConnectWallet = async (walletData) => {
        await connectWallet(walletData);
    };

    return (
        <div>
            <div className="mb-6">
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Welcome to your Dashboard
                </h1>
                <p style={{ color: '#64748b' }}>
                    Manage your invoices, payments, and account settings
                </p>
            </div>

            <div className="dashboard-grid">
                {/* User Info Card */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Account Information</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Account Type</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isEmailUser && (
                                    <span className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                                        📧 Email User
                                    </span>
                                )}
                                {isWalletUser && (
                                    <span className="btn btn-wallet" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                                        👛 Web3 User
                                    </span>
                                )}
                                {isHybridUser && (
                                    <span className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                                        🔗 Hybrid User
                                    </span>
                                )}
                            </div>
                        </div>

                        {user?.email && (
                            <div>
                                <label className="form-label">Email</label>
                                <p style={{ color: '#4b5563' }}>{user.email}</p>
                            </div>
                        )}

                        {user?.creator_type && (
                            <div>
                                <label className="form-label">Creator Type</label>
                                <p style={{ color: '#4b5563' }}>{user.creator_type}</p>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Member Since</label>
                            <p style={{ color: '#4b5563' }}>
                                {new Date(user?.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Wallet Information */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Wallet Information</h2>
                    </div>

                    {user?.managedWallet && (
                        <div className="mb-4">
                            <label className="form-label">Managed Wallet</label>
                            <div className="wallet-info">
                                <p className="wallet-address">{user.managedWallet}</p>
                            </div>
                            <p className="text-xs" style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                                This wallet is managed by FreelanceChain. You can receive payments here safely.
                            </p>
                        </div>
                    )}

                    {user?.primaryWallet && (
                        <div className="mb-4">
                            <label className="form-label">Connected Wallet</label>
                            <div className="wallet-info">
                                <p className="wallet-address">{user.primaryWallet}</p>
                            </div>
                            <p className="text-xs" style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                                This is your personal wallet that you control directly.
                            </p>
                        </div>
                    )}

                    {user?.connectedWallets && user.connectedWallets.length > 1 && (
                        <div className="mb-4">
                            <label className="form-label">Additional Wallets</label>
                            {user.connectedWallets.slice(1).map((wallet, index) => (
                                <div key={index} className="wallet-info" style={{ marginBottom: '0.5rem' }}>
                                    <p className="wallet-address">{wallet.wallet_address}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Connect Wallet Option for Email Users */}
                    {isEmailUser && !user?.primaryWallet && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                🚀 Upgrade to Web3
                            </h3>
                            <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                                Connect your own wallet to unlock advanced features like direct transaction signing and DeFi integration.
                            </p>
                            <WalletConnector
                                onConnect={handleConnectWallet}
                                buttonText="Connect Your Wallet"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">$0</div>
                    <div className="stat-label">Total Income</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Invoices Created</div>
                </div>

                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Payments Received</div>
                </div>
            </div>

            {/* Coming Soon Features */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Coming Soon</h2>
                    <p className="card-subtitle">Features we're working on for the hackathon demo</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📄 Invoice Creation</h3>
                        <p className="text-sm" style={{ color: '#6b7280' }}>
                            Create professional invoices with Request Network integration
                        </p>
                    </div>

                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🔗 Cross-Chain Payments</h3>
                        <p className="text-sm" style={{ color: '#6b7280' }}>
                            Accept payments across multiple blockchains via Beamer
                        </p>
                    </div>

                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>📊 Income Reports</h3>
                        <p className="text-sm" style={{ color: '#6b7280' }}>
                            Tax-ready reports and QuickBooks integration
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 