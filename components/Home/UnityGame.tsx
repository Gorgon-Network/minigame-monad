'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract, useWriteContract, useContractReads } from 'wagmi';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { monadTestnet } from 'viem/chains';
import ArcheryGameABI from '../abi/ArcheryGame.json';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';

const CONTRACT_ADDRESS = '0x7EF7a43EEDAB2854Fd901d68aab6cb1Dec769690';

const UnityGame = () => {
    const { unityProvider, sendMessage, isLoaded } = useUnityContext({
        loaderUrl: '/build/mygame.loader.js',
        dataUrl: '/build/mygame.data',
        frameworkUrl: '/build/mygame.framework.js',
        codeUrl: '/build/mygame.wasm',
    });

    const { isEthProviderAvailable } = useMiniAppContext();
    const { isConnected, address, chainId } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const { writeContract, isPending: isTxPending, error: txError } = useWriteContract();
    const [isGameOver, setIsGameOver] = useState(false);
    const [userName, setUserName] = useState('');
    const [score, setScore] = useState(0);
    const [gameId, setGameId] = useState(0);
    const [gameInfo, setGameInfo] = useState({ totalShots: 0, totalHits: 0 });
    const [error, setError] = useState('');
    const [shouldFetchGameCounter, setShouldFetchGameCounter] = useState(false);

    // Fetch thông tin trò chơi
    const { data: gameInfoData, refetch: refetchGameInfo } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ArcheryGameABI,
        functionName: 'getGameInfo',
        args: [gameId],
        chainId: monadTestnet.id,
        query: {
            enabled: gameId !== 0 && isConnected && chainId === monadTestnet.id,
        }
    });

    // Fetch ID trò chơi đang hoạt động
    const { data: activeGameId } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ArcheryGameABI,
        functionName: 'getActiveGameId',
        args: [address],
        chainId: monadTestnet.id,
        query: {
            enabled: isConnected && chainId === monadTestnet.id,
        }
    });

    // Fetch gameCounter
    const { data: contractReads } = useContractReads({
        contracts: [
            {
                address: CONTRACT_ADDRESS,
                abi: ArcheryGameABI,
                functionName: 'gameCounter',
                chainId: monadTestnet.id,
            },
        ],
        query: {
            enabled: shouldFetchGameCounter && isConnected && chainId === monadTestnet.id,
        }
    });

    useEffect(() => {
        if (gameInfoData) {
            const [player, isActive, totalShots, totalHits] = gameInfoData;
            setGameInfo({ totalShots: Number(totalShots), totalHits: Number(totalHits) });
        }
    }, [gameInfoData]);

    useEffect(() => {
        if (activeGameId) {
            setGameId(Number(activeGameId));
        }
    }, [activeGameId]);

    useEffect(() => {
        if (contractReads && contractReads[0]?.result && shouldFetchGameCounter) {
            setGameId(Number(contractReads[0].result));
            setShouldFetchGameCounter(false);
            refetchGameInfo();
            if (isLoaded) {
                sendMessage('GameController', 'StartGame');
            }
            setError('');
        }
    }, [contractReads, shouldFetchGameCounter, isLoaded, sendMessage]);

    // Bắt đầu trò chơi mới
    const startGame = async () => {
        if (!isConnected || chainId !== monadTestnet.id) {
            setError('Please connect wallet and switch to Monad Testnet');
            return;
        }
        try {
            await writeContract({
                address: CONTRACT_ADDRESS,
                abi: ArcheryGameABI,
                functionName: 'startGame',
                chainId: monadTestnet.id,
            });
            setShouldFetchGameCounter(true);
        } catch (err) {
            setError('Cannot start game: ' + err.message);
        }
    };

    // Xử lý sự kiện GameOver từ window.postMessage
    const handleGameOver = useCallback(
        (event) => {
            if (event.data.type === 'GameOver') {
                console.log('GameOver received:', event.data);
                const { userName, score } = event.data;
                setIsGameOver(true);
                setUserName(userName || address?.slice(0, 6));
                setScore(Number(score));
                if (gameId !== 0) {
                    writeContract(
                        {
                            address: CONTRACT_ADDRESS,
                            abi: ArcheryGameABI,
                            functionName: 'endGame',
                            args: [Number(score), Number(score)],
                            chainId: monadTestnet.id,
                        },
                        {
                            onSuccess: async () => {
                                await refetchGameInfo();
                                setError('');
                            },
                            onError: (err) => setError('Cannot end the game: ' + err.message),
                        }
                    );
                }
            }
        },
        [address, gameId, writeContract, refetchGameInfo]
    );

    useEffect(() => {
        console.log('Registering window.message event listener');
        window.addEventListener('message', handleGameOver);
        return () => {
            console.log('Removing window.message event listener');
            window.removeEventListener('message', handleGameOver);
        };
    }, [handleGameOver]);

    return (
        <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #333', borderRadius: '8px' }}>
            {isConnected ? (
                <>
                    <p className="text-sm">
                        Connected: <span className="bg-white font-mono text-black rounded-md p-1">{address}</span>
                    </p>
                    <p className="text-sm">
                        Chain ID: <span className="bg-white font-mono text-black rounded-md p-1">{chainId}</span>
                    </p>
                    {chainId !== monadTestnet.id && (
                        <button
                            className="bg-blue-400 text-black rounded-md p-2 text-sm mt-2"
                            onClick={() => switchChain({ chainId: monadTestnet.id })}
                        >
                            Switch to Monad Testnet
                        </button>
                    )}
                    <button
                        className="bg-red-700 text-white rounded-md p-2 text-sm mt-2"
                        onClick={() => disconnect()}
                    >
                        Disconnect wallet
                    </button>
                </>
            ) : (
                isEthProviderAvailable ? (
                    <button
                        className="bg-blue-400 text-white rounded-md p-2 text-sm mt-2 w-full"
                        onClick={() => connect({ connector: farcasterFrame() })}
                    >
                        Connect wallet via Warpcast
                    </button>
                ) : (
                    <p className="text-sm">Wallet connection only available via Warpcast</p>
                )
            )}
                <div>
                {isConnected && chainId === monadTestnet.id && (
                    <>
                        <button
                            className="bg-yellow-500 text-white font-bold rounded-md p-2 text-xl mt-6"
                            onClick={startGame}
                            disabled={isTxPending || gameId !== 0}
                        >
                            Start Game
                        </button>
                        {gameId !== 0 && (
                            <div className="mt-4">
                                <p className="text-sm">Game ID: {gameId}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Unity
                unityProvider={unityProvider}
                style={{ width: 360, height: 210, border: '1px solid black', marginTop: '16px', visibility: gameId ? 'visible' : 'hidden' }}
            />
            {isGameOver && (
                <p className="text-sm mt-4"></p>
            )}
            {(error || txError) && (
                <p className="text-sm text-red-500 mt-4">{error || txError?.message}</p>
            )}
            {isTxPending && <p className="text-sm mt-4">Processing transaction...</p>}
        </div>
    );
};

export default UnityGame;