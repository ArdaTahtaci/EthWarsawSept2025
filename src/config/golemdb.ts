import { createClient, createROClient, Tagged } from "golem-base-sdk";
import 'dotenv/config';
import type { AccountData } from 'golem-base-sdk';

export function makeGolemClient() {
    const rpcUrl = process.env.GOLEMDB_RPC_URL || "https://ethwarsaw.holesky.golemdb.io/rpc";
    const wsUrl = process.env.GOLEMDB_WS_URL || "wss://ethwarsaw.holesky.golemdb.io/rpc/ws";
    const chainId = parseInt(process.env.GOLEMDB_CHAIN_ID || "60138453033");

    // GolemDB'nin beklediği Tagged nesnesini doğru tipte oluştur.
    // AccountData tipi, Tagged<"privatekey", Uint8Array> tipine eşittir.
    const rawPrivateKey = process.env.GOLEMDB_ACCOUNT_DATA || '';
    const hexPrivateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey.slice(2) : rawPrivateKey;

    // AccountData tipini kullanarak değişkeni tanımla
    const accountData: AccountData = new Tagged(
        "privatekey",
        Buffer.from(hexPrivateKey, 'hex')
    );

    if (!rpcUrl) {
        throw new Error("GOLEMDB_RPC_URL is required");
    }

    if (!accountData) {
        // Okuma-yazma istemcisi için hesap verisi yoksa, salt okunur (read-only) istemci oluştur.
        return createROClient(chainId, rpcUrl, wsUrl);
    }

    // Doğru accountData formatıyla tam istemci oluştur
    console.log("Creating GolemDB client with account data");
    return createClient(
        chainId,
        accountData,
        rpcUrl,
        wsUrl
    );
}

export default makeGolemClient;