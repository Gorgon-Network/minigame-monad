import React, { useEffect, useCallback, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';

const UnityGame = () => {
    const { unityProvider, addEventListener, removeEventListener, sendMessage } =
        useUnityContext({
            loaderUrl: '/build/mygame.loader.js',
            dataUrl: '/build/mygame.data',
            frameworkUrl: '/build/mygame.framework.js',
            codeUrl: '/build/mygame.wasm',
        });

    const [isGameOver, setIsGameOver] = useState(false);
    const [userName, setUserName] = useState('');
    const [score, setScore] = useState(0);

    // Xử lý sự kiện GameOver từ Unity
    const handleGameOver = useCallback((userName: string, score: number) => {
        setIsGameOver(true);
        setUserName(userName);
        setScore(score);
    }, []);

    useEffect(() => {
        addEventListener('GameOver', handleGameOver);
        return () => {
            removeEventListener('GameOver', handleGameOver);
        };
    }, [addEventListener, removeEventListener, handleGameOver]);

    // Gửi lệnh tới Unity
    const handleClickSpawnEnemies = () => {
        sendMessage('GameController', 'SpawnEnemies', 100);
    };

    return (
        <div>
            <Unity
                unityProvider={unityProvider}
                style={{ width: 800, height: 600, border: '1px solid black' }}
            />
            <button onClick={handleClickSpawnEnemies}>Spawn Enemies</button>
            {isGameOver && (
                <p>{`Game Over ${userName}! You've scored ${score} points.`}</p>
            )}
        </div>
    );
};

export default UnityGame;