import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { monadTestnet } from "./chains";

export const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0]),
});

export const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http("https://bundler.metamask.io"),
});
