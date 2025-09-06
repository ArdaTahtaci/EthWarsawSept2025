import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

const WalletConnector = ({ onConnect, loading, buttonText = "Connect Wallet" }) => {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const { generateSiweMessage } = useAuth();

    useEffect(() => {
        const initProvider = async () => {
            const ethereumProvider = await detectEthereumProvider();
            if (ethereumProvider) {
                setProvider(new ethers.BrowserProvider(ethereumProvider));

                // Check if already connected
                try {
                    const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }
                } catch (error) {
                    console.error('Error checking accounts:', error);
                }
            }
        };

        initProvider();
    }, []);

    const connectWallet = async () => {
        if (!provider) {
            toast.error('Please install MetaMask or another Web3 wallet');
            return;
        }

        setIsConnecting(true);

        try {
            // Request account access
            const accounts = await provider.send('eth_requestAccounts', []);
            const rawWalletAddress = accounts[0];

            // Ensure proper EIP-55 checksumming
            const walletAddress = ethers.getAddress(rawWalletAddress);
            setAccount(walletAddress);

            // Generate SIWE message
            const messageResult = await generateSiweMessage(walletAddress);
            if (!messageResult.success) {
                throw new Error(messageResult.error);
            }

            // Get signer and sign the message
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(messageResult.message);

            // Call the onConnect callback with wallet data
            await onConnect({
                walletAddress,
                signature,
                message: messageResult.message
            });

        } catch (error) {
            console.error('Wallet connection error:', error);
            if (error.code === 4001) {
                toast.error('Please approve the connection in your wallet');
            } else if (error.message?.includes('User rejected')) {
                toast.error('Signature rejected. Please sign the message to continue.');
            } else {
                toast.error('Failed to connect wallet: ' + error.message);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    if (!provider) {
        return (
            <div className="text-center">
                <p className="mb-4">No Web3 wallet detected.</p>
                <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wallet"
                >
                    Install MetaMask
                </a>
            </div>
        );
    }

    return (
        <div>
            {account && (
                <div className="wallet-info mb-4">
                    <p className="text-sm mb-2">Connected Wallet:</p>
                    <p className="wallet-address">{account}</p>
                </div>
            )}

            <button
                onClick={connectWallet}
                disabled={loading || isConnecting}
                className="btn btn-wallet"
                style={{ width: '100%' }}
            >
                {loading || isConnecting ? (
                    <span className="loading">
                        <div className="spinner"></div>
                        {isConnecting ? 'Connecting Wallet...' : 'Processing...'}
                    </span>
                ) : (
                    <>
                        👛 {buttonText}
                    </>
                )}
            </button>

            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <p className="text-sm">
                    <strong>🔒 Secure Authentication:</strong> We use Sign-In with Ethereum (SIWE) standard.
                    Your wallet signature proves ownership without revealing your private key.
                </p>
            </div>
        </div>
    );
};

export default WalletConnector; 