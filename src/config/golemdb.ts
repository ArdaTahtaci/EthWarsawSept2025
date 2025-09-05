import { GolemNetwork } from "@golem-sdk/golem-js";

export interface GolemConfig {
    network: "polygon" | "holesky" | "mainnet";
    apiKey?: string;
    walletPrivateKey?: string;
    yagnaAppKey?: string;
    subnetTag?: string;
    payment: {
        network: "polygon" | "holesky" | "mainnet";
        driver: "erc20" | "polygon";
    };
}

export function makeGolemClient(): GolemNetwork {
    const config: GolemConfig = {
        network: (process.env.GOLEM_NETWORK as "polygon" | "holesky" | "mainnet") || "holesky",
        apiKey: process.env.GOLEM_API_KEY,
        walletPrivateKey: process.env.GOLEM_WALLET_PRIVATE_KEY,
        yagnaAppKey: process.env.YAGNA_APPKEY,
        subnetTag: process.env.GOLEM_SUBNET_TAG || "public",
        payment: {
            network: (process.env.GOLEM_PAYMENT_NETWORK as "polygon" | "holesky" | "mainnet") || "holesky",
            driver: (process.env.GOLEM_PAYMENT_DRIVER as "erc20" | "polygon") || "erc20",
        },
    };

    const golemOptions: any = {
        payment: {
            network: config.payment.network,
            driver: config.payment.driver,
        },
        market: {
            pricing: {
                model: "linear",
                maxStartPrice: parseFloat(process.env.GOLEM_MAX_START_PRICE || "1.0"),
                maxCpuPerHourPrice: parseFloat(process.env.GOLEM_MAX_CPU_PER_HOUR_PRICE || "1.0"),
                maxEnvPerHourPrice: parseFloat(process.env.GOLEM_MAX_ENV_PER_HOUR_PRICE || "1.0"),
            },
        },
    };

    // Add API key if provided
    if (config.apiKey) {
        golemOptions.api = {
            key: config.apiKey,
        };
    }

    // Add Yagna app key if provided
    if (config.yagnaAppKey) {
        golemOptions.yagna = {
            apiKey: config.yagnaAppKey,
        };
    }

    const golem = new GolemNetwork(golemOptions);

    return golem;
}

export default makeGolemClient;
