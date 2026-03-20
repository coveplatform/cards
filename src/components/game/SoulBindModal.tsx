import { useGameStore } from '../../store/gameStore'
import { getCard } from '../../data/registry'

export function SoulBindModal() {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const acceptSoulBind = useGameStore(s => s.acceptSoulBind)
  const declineSoulBind = useGameStore(s => s.declineSoulBind)

  const prompt = gameState?.soulBindPrompt
  if (!prompt || !myPlayerId || prompt.playerId !== myPlayerId) return null

  const player = gameState!.players[myPlayerId]
  const def = getCard(prompt.dyingMinion.definitionId)
  const canAfford = player.classResource >= 1

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-stone-900 border border-amber-800 rounded-xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(180,83,9,0.4)]">
        <div className="text-4xl mb-3">⚯</div>
        <h2 className="text-amber-400 text-xl font-bold mb-2">Soul Bind</h2>
        <p className="text-stone-300 text-sm mb-1">
          <span className="font-bold text-stone-100">{def.name}</span> is dying.
        </p>
        <p className="text-stone-400 text-sm mb-6">
          Spend 1 {player.heroClass === 'WARLOCK' ? 'Soul Shard' : 'Holy Power'} to permanently keep its passive:
        </p>
        <div className="bg-stone-800 rounded-lg p-3 mb-6 border border-stone-700">
          <p className="text-amber-300 text-sm italic">"{def.passive?.description}"</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={acceptSoulBind}
            disabled={!canAfford}
            className={`px-6 py-2 rounded-lg font-bold transition-all cursor-pointer
              ${canAfford ? 'bg-amber-700 hover:bg-amber-600 text-stone-950' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
          >
            Bind Soul (1 {player.heroClass === 'WARLOCK' ? '●' : '◆'})
          </button>
          <button
            onClick={declineSoulBind}
            className="px-6 py-2 rounded-lg font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all cursor-pointer"
          >
            Release
          </button>
        </div>
      </div>
    </div>
  )
}
