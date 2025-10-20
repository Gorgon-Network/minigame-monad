import React from 'react';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { useConnect, useDisconnect, useSwitchChain, useAccount } from 'wagmi';
import { monadTestnet } from 'viem/chains';
import { metaMask } from '@wagmi/connectors';
import { useSmartAccount } from '@/hooks/useSmartAccount';

const WalletSection = ({ isEthProviderAvailable }: { isEthProviderAvailable: boolean }) => {
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const { isConnected, address, chainId } = useAccount();

    const { smartAccount, loading: smartLoading } = useSmartAccount();

    const formatAddress = (addr?: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 7)}...${addr.slice(-5)}`;
    };

    return (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            {!isConnected ? (
                isEthProviderAvailable ? (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => connect({ connector: farcasterFrame() })}
                            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm font-semibold"
                        >
                            Connect via Warpcast
                        </button>

                        <button
                            onClick={() => connect({ connector: metaMask() })}
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-sm font-semibold"
                        >
                            Connect via MetaMask (Smart Account)
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 text-sm">
                        ⚠️ Wallet connection only available via Warpcast.
                    </p>
                )
            ) : (
                <div className="text-sm text-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Address:</span>
                        <span className="font-mono">{formatAddress(address)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Chain:</span>
                        <span>{chainId}</span>
                    </div>

                    {chainId !== monadTestnet.id && (
                        <button
                            onClick={() => switchChain({ chainId: monadTestnet.id })}
                            className="w-full mt-2 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs font-semibold transition"
                        >
                            Switch to Monad Testnet
                        </button>
                    )}

                    <button
                        onClick={() => disconnect()}
                        className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition"
                    >
                        Disconnect Wallet
                    </button>

                    <div className="pt-2 border-t border-gray-700">
                        {smartAccount ? (
                            <p className="text-xs text-green-400">
                                ✅ Smart Account Ready: <span className="font-mono">{formatAddress(smartAccount.address)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {smartLoading ? '⏳ Initializing smart account...' : '⚙️ Smart account not initialized'}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletSection;
