import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useWriteContract, useContractReads } from 'wagmi';
import { monadTestnet } from 'viem/chains';
import ArcheryGameABI from '@/abi/ArcheryGame.json';

const CONTRACT_ADDRESS = '0x7EF7a43EEDAB2854Fd901d68aab6cb1Dec769690';

export const useGameContract = (address?: string, chainId?: number, isConnected?: boolean) => {
    const [gameId, setGameId] = useState(0);
    const [gameInfo, setGameInfo] = useState({ totalShots: 0, totalHits: 0 });
    const [shouldFetchGameCounter, setShouldFetchGameCounter] = useState(false);
    const [error, setError] = useState('');

    const { writeContract, isPending: isTxPending, error: txError } = useWriteContract();

    const { data: activeGameId } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ArcheryGameABI,
        functionName: 'getActiveGameId',
        args: [address],
        chainId: monadTestnet.id,
        query: { enabled: isConnected && chainId === monadTestnet.id },
    });

    const { data: gameInfoData, refetch: refetchGameInfo } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ArcheryGameABI,
        functionName: 'getGameInfo',
        args: [gameId],
        chainId: monadTestnet.id,
        query: { enabled: gameId !== 0 && isConnected && chainId === monadTestnet.id },
    });

    const { data: contractReads } = useContractReads({
        contracts: [{ address: CONTRACT_ADDRESS, abi: ArcheryGameABI, functionName: 'gameCounter', chainId: monadTestnet.id }],
        query: { enabled: shouldFetchGameCounter && isConnected && chainId === monadTestnet.id },
    });

    useEffect(() => {
        if (activeGameId) setGameId(Number(activeGameId));
    }, [activeGameId]);

    useEffect(() => {
        if (gameInfoData) {
            const [totalShots, totalHits] = gameInfoData as any;
            setGameInfo({ totalShots: Number(totalShots), totalHits: Number(totalHits) });
        }
    }, [gameInfoData]);

    useEffect(() => {
        if (contractReads && contractReads[0]?.result && shouldFetchGameCounter) {
            setGameId(Number(contractReads[0].result));
            setShouldFetchGameCounter(false);
            refetchGameInfo();
            setError('');
        }
    }, [contractReads, shouldFetchGameCounter, refetchGameInfo]);

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
        } catch (err: any) {
            setError('Cannot start game: ' + err.message);
        }
    };

    const endGame = useCallback(async (score: number) => {
        if (gameId === 0) return;
        try {
            await writeContract({
                address: CONTRACT_ADDRESS,
                abi: ArcheryGameABI,
                functionName: 'endGame',
                args: [score, score],
                chainId: monadTestnet.id,
            });
            await refetchGameInfo();
        } catch (err: any) {
            setError('Cannot end game: ' + err.message);
        }
    }, [gameId, writeContract, refetchGameInfo]);

    return { gameId, gameInfo, startGame, endGame, error, txError, isTxPending };
};
