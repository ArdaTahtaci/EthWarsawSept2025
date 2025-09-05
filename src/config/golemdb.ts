import { createClient, createROClient } from "golem-base-sdk";

export interface GolemDBConfig {
    chainId: number;
    rpcUrl: string;
    wsUrl?: string;
    accountData?: any;
    readOnly?: boolean;
}

export function makeGolemClient() {
    const config: GolemDBConfig = {
        chainId: parseInt(process.env.GOLEMDB_CHAIN_ID || "1"), // Default to Ethereum mainnet
        rpcUrl: process.env.GOLEMDB_RPC_URL || "https://eth.llamarpc.com",
        wsUrl: process.env.GOLEMDB_WS_URL,
        accountData: process.env.GOLEMDB_ACCOUNT_DATA,
        readOnly: process.env.GOLEMDB_READ_ONLY === "true" || !process.env.GOLEMDB_ACCOUNT_DATA,
    };

    if (!config.rpcUrl) {
        throw new Error("GOLEMDB_RPC_URL is required");
    }

    // Create read-only client if no account data or explicitly set to read-only
    if (!config.accountData || config.readOnly) {
        console.log("Creating GolemDB read-only client");
        return createROClient(
            config.chainId,
            config.rpcUrl,
            config.wsUrl || null
        );
    }

    // Create full client with write permissions
    console.log("Creating GolemDB client with account data");
    return createClient(
        config.chainId,
        config.accountData,
        config.rpcUrl,
        config.wsUrl || null
    );
}

export default makeGolemClient;
