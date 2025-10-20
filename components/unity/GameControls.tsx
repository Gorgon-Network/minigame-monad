import React from 'react';

const GameControls = ({ gameId, startGame, isTxPending, error }: any) => (
    <div>
        <button onClick={startGame} disabled={isTxPending}>
            {isTxPending ? 'Starting...' : 'Start Game'}
        </button>
        {gameId !== 0 && <p>Game ID: {gameId}</p>}
        {isTxPending && <p>Processing transaction...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
);

export default GameControls;
