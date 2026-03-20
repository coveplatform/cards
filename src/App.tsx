import { useGameStore } from './store/gameStore'
import { Lobby } from './components/screens/Lobby'
import { GameBoard } from './components/game/GameBoard'
import { GameOver } from './components/screens/GameOver'
import { DeckBuilder } from './components/screens/DeckBuilder'

export default function App() {
  const appStatus = useGameStore(s => s.appStatus)

  if (appStatus === 'IN_GAME') return <GameBoard />
  if (appStatus === 'GAME_OVER') return <GameOver />
  if (appStatus === 'DISCONNECTED') return <Disconnected />
  if (appStatus === 'DECK_BUILDER') return <DeckBuilder />
  return <Lobby />
}

function Disconnected() {
  const reset = useGameStore(s => s.reset)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 gap-6">
      <div className="text-4xl">🔌</div>
      <h2 className="text-red-400 text-2xl font-bold">Opponent Disconnected</h2>
      <button
        onClick={reset}
        className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold rounded-lg cursor-pointer transition-colors"
      >
        Back to Menu
      </button>
    </div>
  )
}
