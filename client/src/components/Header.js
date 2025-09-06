import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    FreelanceChain
                </Link>

                <nav>
                    <ul className="nav-links">
                        {isAuthenticated ? (
                            <>
                                <li>
                                    <Link to="/dashboard">Dashboard</Link>
                                </li>
                                <li>
                                    <span className="text-sm">
                                        {user?.email || user?.walletAddress?.slice(0, 8) + '...'}
                                        {user?.authType === 'email' && ' 📧'}
                                        {user?.authType === 'wallet' && ' 👛'}
                                        {user?.authType === 'hybrid' && ' 🔗'}
                                    </span>
                                </li>
                                <li>
                                    <button onClick={handleLogout} className="btn btn-outline">
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link to="/login" className="btn btn-secondary">
                                        Login
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/register" className="btn btn-primary">
                                        Get Started
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header; 