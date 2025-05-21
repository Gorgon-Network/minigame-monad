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
        enabled: gameId !== 0 && isConnected && chainId === monadTestnet.id,
    });

    // Fetch ID trò chơi đang hoạt động
    const { data: activeGameId } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ArcheryGameABI,
        functionName: 'getActiveGameId',
        args: [address],
        chainId: monadTestnet.id,
        enabled: isConnected && chainId === monadTestnet.id,
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
        enabled: shouldFetchGameCounter && isConnected && chainId === monadTestnet.id,
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
            setError('Vui lòng kết nối ví và chuyển sang Monad Testnet');
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
            setError('Không thể bắt đầu trò chơi: ' + err.message);
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
                            onError: (err) => setError('Không thể kết thúc trò chơi: ' + err.message),
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
            <h2 className="text-lg font-semibold">Trò Chơi Bắn Cung trên Farcaster</h2>
            {isConnected ? (
                <>
                    <p className="text-sm">
                        Đã kết nối: <span className="bg-white font-mono text-black rounded-md p-1">{address}</span>
                    </p>
                    <p className="text-sm">
                        Chain ID: <span className="bg-white font-mono text-black rounded-md p-1">{chainId}</span>
                    </p>
                    {chainId !== monadTestnet.id && (
                        <button
                            className="bg-white text-black rounded-md p-2 text-sm mt-2"
                            onClick={() => switchChain({ chainId: monadTestnet.id })}
                        >
                            Chuyển sang Monad Testnet
                        </button>
                    )}
                    <button
                        className="bg-white text-black rounded-md p-2 text-sm mt-2"
                        onClick={() => disconnect()}
                    >
                        Ngắt kết nối ví
                    </button>
                </>
            ) : (
                isEthProviderAvailable ? (
                    <button
                        className="bg-white text-black rounded-md p-2 text-sm mt-2 w-full"
                        onClick={() => connect({ connector: farcasterFrame() })}
                    >
                        Kết nối ví qua Warpcast
                    </button>
                ) : (
                    <p className="text-sm">Kết nối ví chỉ khả dụng qua Warpcast</p>
                )
            )}
            <div>
                {isConnected && chainId === monadTestnet.id && (
                    <>
                        <button
                            className="bg-white text-black rounded-md p-2 text-sm mt-2"
                            onClick={startGame}
                            disabled={isTxPending || gameId !== 0}
                        >
                            Bắt đầu trò chơi
                        </button>
                        {gameId !== 0 && (
                            <div className="mt-4">
                                <p className="text-sm">ID trò chơi: {gameId}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Unity
                unityProvider={unityProvider}
                style={{ width: 360, height: 210, border: '1px solid black', marginTop: '16px' }}
            />
            {isGameOver && (
                <p className="text-sm mt-4">{`Kết thúc trò chơi ${userName}! Điểm: ${score} | Bắn trúng: ${gameInfo.totalHits}/${gameInfo.totalShots}`}</p>
            )}
            {(error || txError) && (
                <p className="text-sm text-red-500 mt-4">{error || txError?.message}</p>
            )}
            {isTxPending && <p className="text-sm mt-4">Đang xử lý giao dịch...</p>}
        </div>
    );
};

export default UnityGame;