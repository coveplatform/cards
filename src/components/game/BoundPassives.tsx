import type { PlayerId } from '../../types'
import { useGameStore } from '../../store/gameStore'

export function BoundPassives({ playerId }: { playerId: PlayerId }) {
  const player = useGameStore(s => s.gameState?.players[playerId])
  if (!player || player.boundPassives.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-1">
      {player.boundPassives.map((bp, i) => (
        <div
          key={i}
          title={bp.passive.description}
          className="passive-gem flex items-center gap-1 px-2 py-0.5 rounded-full cursor-help"
          style={{ fontSize: '10px', fontWeight: 700, color: '#fcd34d' }}
        >
          <span style={{ fontSize: '9px' }}>⚯</span>
          <span>{bp.sourceName}</span>
        </div>
      ))}
    </div>
  )
}
