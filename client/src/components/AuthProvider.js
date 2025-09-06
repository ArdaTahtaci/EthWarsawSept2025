import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const API_BASE_URL = 'http://localhost:3000';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Check if user is logged in on app start
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/auth/me`);
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    const login = async (credentials, isWallet = false) => {
        try {
            const endpoint = isWallet ? '/auth/wallet-login' : '/auth/login';
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, credentials);

            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);

            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }

            toast.success(`Welcome back${userData.email ? `, ${userData.email.split('@')[0]}` : ''}!`);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const register = async (userData, isWallet = false) => {
        try {
            const endpoint = isWallet ? '/auth/register-wallet' : '/auth/register';
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, userData);

            const { token: newToken, user: newUser } = response.data;

            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('token', newToken);

            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }

            toast.success('Account created successfully!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const connectWallet = async (walletData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/connect-wallet`, walletData);

            // Refresh user data
            const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
            setUser(userResponse.data.user);

            toast.success('Wallet connected successfully!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to connect wallet';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const generateSiweMessage = async (walletAddress) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/siwe-message`, {
                walletAddress
            });
            return { success: true, message: response.data.message };
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to generate message';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['Authorization'];
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        connectWallet,
        generateSiweMessage,
        isAuthenticated: !!user,
        isEmailUser: user?.authType === 'email',
        isWalletUser: user?.authType === 'wallet',
        isHybridUser: user?.authType === 'hybrid',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider; 