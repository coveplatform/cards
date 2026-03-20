import { useGameStore } from '../../store/gameStore'

export function GameOver() {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const reset = useGameStore(s => s.reset)

  const winner = gameState?.winner
  const playerWon = winner === myPlayerId
  const message = gameState?.message ?? ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950">
      <div className="text-center">
        <div className="text-8xl mb-6">{playerWon ? '👑' : '💀'}</div>
        <h1 className={`text-5xl font-bold mb-4 ${playerWon ? 'text-amber-400' : 'text-red-500'}`}>
          {playerWon ? 'Victory' : 'Defeat'}
        </h1>
        <p className="text-stone-400 text-xl mb-10">{message}</p>
        <button
          onClick={reset}
          className="px-10 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold text-lg rounded-lg tracking-wide cursor-pointer transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
