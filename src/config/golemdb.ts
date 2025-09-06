import { createClient, createROClient, Tagged } from "golem-base-sdk";
import 'dotenv/config';
import type { AccountData } from 'golem-base-sdk';

// Node.js process is available globally
declare const process: {
  env: Record<string, string | undefined>;
};

export function makeGolemClient() {
    // ETHWarsaw testnet configuration (from official documentation)
    const rpcUrl = process.env.GOLEMDB_RPC_URL || "https://ethwarsaw.holesky.golemdb.io/rpc";
    const wsUrl = process.env.GOLEMDB_WS_URL || "wss://ethwarsaw.holesky.golemdb.io/rpc/ws";
    const chainId = parseInt(process.env.GOLEMDB_CHAIN_ID || "60138453033");

    // Get private key from environment (following official documentation format)
    const rawPrivateKey = process.env.PRIVATE_KEY || process.env.GOLEMDB_ACCOUNT_DATA || '';
    
    if (!rawPrivateKey) {
        // No private key provided, create read-only client
        console.log("Creating GolemDB read-only client (no private key provided)");
        return createROClient(chainId, rpcUrl, wsUrl);
    }

    // Convert private key to proper format (following official documentation)
    const hexPrivateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey.slice(2) : rawPrivateKey;
    const privateKeyBytes = new Uint8Array(
        hexPrivateKey.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );

    // Create AccountData using Tagged (following official documentation)
    const accountData: AccountData = new Tagged(
        "privatekey",
        privateKeyBytes
    );

    if (!rpcUrl) {
        throw new Error("GOLEMDB_RPC_URL is required");
    }

    // Create full client with write permissions (following official documentation)
    console.log("Creating GolemDB client with account data");
    return createClient(
        chainId,
        accountData,
        rpcUrl,
        wsUrl
    );
}

export default makeGolemClient;