import { useEffect, useState } from 'react';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit';
import { createPublicClient, createWalletClient, http, custom } from 'viem';
import { monadTestnet } from 'viem/chains';
import { useAccount } from 'wagmi';

export function useSmartAccount() {
    const { address: eoaAddress, isConnected } = useAccount();
    const [smartAccount, setSmartAccount] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isConnected || !eoaAddress || typeof window === 'undefined' || !window.ethereum) return;

        (async () => {
            setLoading(true);
            try {
                const publicClient = createPublicClient({
                    chain: monadTestnet,
                    transport: http(),
                });

                const walletClient : any = await createWalletClient({
                    chain: monadTestnet,
                    transport: custom(window.ethereum),
                });
                // @ts-ignore
                const smart = await toMetaMaskSmartAccount({
                    client: publicClient,
                    implementation: Implementation.Stateless7702,
                    address: eoaAddress,
                    signer: { walletClient },
                });

                setSmartAccount(smart);
                console.log('Smart account ready:', smart.address);
            } catch (err) {
                console.error('Smart account init error', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [isConnected, eoaAddress]);

    return { smartAccount, loading };
}
