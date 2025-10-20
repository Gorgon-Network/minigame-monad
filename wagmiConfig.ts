// wagmiConfig.ts
import { createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { metaMask } from 'wagmi/connectors/metaMask';
import { mainnet, sepolia } from 'viem/chains';
import { createPublicClient, http } from 'viem';

const chains = [sepolia]; // hoặc chain bạn dùng (ví dụ monadTestnet nếu có)
const { provider } = configureChains(chains, [publicProvider()]);

export const publicClient = createPublicClient({
    chain: chains[0],
    transport: http(),
});

export const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: [
        metaMask(), // connector MetaMask (hỗ trợ MetaMask SDK)
        // ... các connector khác (WalletConnect, Injected...) nếu cần
    ],
    publicClient,
});
