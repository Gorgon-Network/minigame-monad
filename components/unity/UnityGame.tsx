import React, { useEffect, useCallback, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { useGameContract } from './useGameContract';
import WalletSection from './WalletSection';
import GameControls from './GameControls';

const UnityGame = () => {
    const { unityProvider, sendMessage, isLoaded } = useUnityContext({
        loaderUrl: '/build/mygame.loader.js',
        dataUrl: '/build/mygame.data',
        frameworkUrl: '/build/mygame.framework.js',
        codeUrl: '/build/mygame.wasm',
    });

    const { isEthProviderAvailable } = useMiniAppContext();
    const { isConnected, address, chainId } = useAccount();
    const { gameId, startGame, endGame, error, txError, isTxPending } = useGameContract(address, chainId, isConnected);
    const [hasStarted, setHasStarted] = useState(false);

    const handleGameOver = useCallback(
        (event: any) => {
            if (event.data.type === 'GameOver') {
                const { score } = event.data;
                endGame(Number(score));
                setHasStarted(false);
            }
        },
        [endGame]
    );

    useEffect(() => {
        window.addEventListener('message', handleGameOver);
        return () => window.removeEventListener('message', handleGameOver);
    }, [handleGameOver]);

    const handleStartGame = async () => {
        await startGame();
        setHasStarted(true);
        if (isLoaded) sendMessage('GameController', 'StartGame');
    };

    const formatAddress = (addr?: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 7)}...${addr.slice(-5)}`;
    };

    return (
        <div className="max-w-md mx-auto mt-8 bg-gray-900 text-white rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
            {/* Wallet Info */}
            <div className="p-4 border-b border-gray-800">
                <WalletSection isEthProviderAvailable={isEthProviderAvailable} />
                {isConnected && (
                    <div className="mt-2 text-sm text-gray-400 text-center">
                        Connected: <span className="text-gray-200 font-mono">{formatAddress(address)}</span>
                    </div>
                )}
            </div>

            {/* Game Controls */}
            {isConnected && (
                <div className="p-4 border-b border-gray-800">
                    <GameControls
                        gameId={gameId}
                        startGame={handleStartGame}
                        isTxPending={isTxPending}
                        error={error || txError?.message}
                    />
                </div>
            )}

            {/* Game View */}
            <div className="p-4 text-center">
                {isConnected && hasStarted && gameId !== 0 ? (
                    <div>
                        <Unity
                            unityProvider={unityProvider}
                            style={{
                                width: 360,
                                height: 210,
                                border: '2px solid #4b5563',
                                borderRadius: 12,
                                margin: '10px auto',
                            }}
                        />
                        <p className="text-xs text-gray-400 mt-2">Game running... good luck!</p>
                    </div>
                ) : (
                    <div className="bg-gray-800 text-center p-6 rounded-lg mt-2 border border-gray-700">
                        {!isConnected ? (
                            <p className="text-gray-300 text-sm">👋 Please connect your wallet to start playing.</p>
                        ) : (
                            <p className="text-gray-300 text-sm">🎮 Press “Start Game” to begin your challenge.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnityGame;
