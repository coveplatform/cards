import type { PlayerId } from '../../types'
import { useGameStore } from '../../store/gameStore'

interface Props {
  playerId: PlayerId
  isOpponent?: boolean
}

const heroPowerInfo = {
  WARLOCK: { name: 'Life Tap', desc: 'Pay 2 health, draw a card, gain 1 Shard.', icon: '🩸' },
  PALADIN: { name: 'Inspire',  desc: 'Gain 1 Holy Power.',                        icon: '✦'  },
}

const classEmoji: Record<string, string> = {
  WARLOCK: '💀',
  PALADIN: '⚔️',
}

export const classColors = {
  WARLOCK: {
    portraitBg: 'radial-gradient(ellipse at 35% 30%, #4c1d95, #1e0a3c)',
    portraitBorder: 'rgba(139,92,246,0.8)',
    portraitGlow: 'rgba(139,92,246,0.5)',
    resourceFilled: 'radial-gradient(ellipse at 35% 30%, #a855f7, #6d28d9)',
    resourceBorder: 'rgba(196,132,252,0.7)',
    resourceEmpty: 'rgba(30,10,60,0.6)',
    resourceEmptyBorder: 'rgba(109,40,217,0.3)',
    label: '#c084fc',
    resourceName: 'Soul Shards',
  },
  PALADIN: {
    portraitBg: 'radial-gradient(ellipse at 35% 30%, #92400e, #3d1a00)',
    portraitBorder: 'rgba(217,119,6,0.8)',
    portraitGlow: 'rgba(217,119,6,0.5)',
    resourceFilled: 'radial-gradient(ellipse at 35% 30%, #fbbf24, #b45309)',
    resourceBorder: 'rgba(253,224,71,0.7)',
    resourceEmpty: 'rgba(40,25,0,0.6)',
    resourceEmptyBorder: 'rgba(180,83,9,0.3)',
    label: '#fcd34d',
    resourceName: 'Holy Power',
  },
}

export function HeroZone({ playerId, isOpponent }: Props) {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const useHeroPower = useGameStore(s => s.useHeroPower)
  const selectedAttackerInstanceId = useGameStore(s => s.selectedAttackerInstanceId)
  const attackHero = useGameStore(s => s.attackHero)
  const player = gameState?.players[playerId]
  if (!player) return null

  const isMyTurn = gameState?.activePlayerId === myPlayerId
  const isMe = playerId === myPlayerId
  const colors = classColors[player.heroClass]
  const hp = heroPowerInfo[player.heroClass]
  const canUseHeroPower = isMe && isMyTurn && !player.heroPowerUsedThisTurn && player.manaPool >= 2
  const canAttackFace = isOpponent && !!selectedAttackerInstanceId && player.board.filter(m => m.isWard).length === 0

  const handleFaceAttack = canAttackFace ? () => {
    const attackerId = selectedAttackerInstanceId!
    const attackerEl = document.querySelector(`[data-instanceid="${attackerId}"]`)
    const heroEl = document.querySelector('[data-heroportrait="opponent"]')
    if (attackerEl && heroEl) {
      const ar = attackerEl.getBoundingClientRect()
      const hr = heroEl.getBoundingClientRect()
      const dx = (hr.left + hr.width / 2) - (ar.left + ar.width / 2)
      const dy = (hr.top + hr.height / 2) - (ar.top + ar.height / 2)
      const el = attackerEl as HTMLElement
      el.style.transition = 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
      el.style.transform = `translate(${dx * 0.75}px, ${dy * 0.75}px) scale(1.15)`
      el.style.zIndex = '50'
      setTimeout(() => {
        el.style.transform = ''
        el.style.zIndex = ''
        setTimeout(() => { el.style.transition = ''; attackHero(attackerId) }, 100)
      }, 280)
    } else {
      attackHero(attackerId)
    }
  } : undefined

  const resourceDots = Array.from({ length: player.classResourceMax })

  return (
    <div className="flex items-center gap-4 px-5 py-3">

      {/* Portrait + HP */}
      <div className="relative flex-shrink-0">
        <div
          onClick={handleFaceAttack}
          data-heroportrait={isOpponent ? 'opponent' : 'player'}
          className={`flex items-center justify-center transition-all duration-150 ${canAttackFace ? 'cursor-pointer scale-110' : ''}`}
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: canAttackFace ? 'radial-gradient(ellipse at 35% 30%, #ef4444, #7f1d1d)' : colors.portraitBg,
            border: canAttackFace ? '3px solid rgba(239,68,68,1)' : `3px solid ${colors.portraitBorder}`,
            boxShadow: canAttackFace
              ? '0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)'
              : `0 0 24px ${colors.portraitGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            fontSize: '38px',
          }}
        >
          {canAttackFace ? '💢' : classEmoji[player.heroClass]}
        </div>
        {/* HP badge */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: 'rgba(12,4,4,0.97)',
            border: '2px solid rgba(220,38,38,0.8)',
            boxShadow: '0 0 12px rgba(220,38,38,0.5)',
          }}
        >
          <span className="text-red-400 text-[10px]">❤</span>
          <span className="text-red-300 font-black text-sm tabular-nums">{player.heroHealth}</span>
        </div>
      </div>

      {/* Class resource */}
      <div className="flex flex-col gap-1.5 ml-1">
        <div className="text-[10px] font-black tracking-wider uppercase" style={{ color: colors.label }}>
          {colors.resourceName}
        </div>
        <div className="flex gap-1.5">
          {resourceDots.map((_, i) => (
            <div key={i} style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: i < player.classResource ? colors.resourceFilled : colors.resourceEmpty,
              border: `2px solid ${i < player.classResource ? colors.resourceBorder : colors.resourceEmptyBorder}`,
              boxShadow: i < player.classResource ? `0 0 8px ${colors.resourceBorder}` : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
        <div className="text-[10px] font-black" style={{ color: colors.label }}>
          {player.classResource} / {player.classResourceMax}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '56px', background: 'rgba(80,60,30,0.35)', flexShrink: 0 }} />

      {/* Hero power (player) or hand count (opponent) */}
      {!isOpponent ? (
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={canUseHeroPower ? useHeroPower : undefined}
            disabled={!canUseHeroPower}
            title={`${hp.name} (2 mana): ${hp.desc}`}
            className="hero-power-btn flex flex-col items-center justify-center"
            style={{ width: '54px', height: '54px', borderRadius: '50%' }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{hp.icon}</span>
            <span className="text-[9px] text-amber-400 font-black mt-0.5">2</span>
          </button>
          <div className="text-[9px] text-stone-500 text-center font-bold max-w-[58px] leading-tight">
            {player.heroPowerUsedThisTurn ? 'Used' : hp.name}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-col items-center justify-center gap-1" style={{ width: '54px', height: '54px' }}>
            <span className="text-xl">✋</span>
            <span className="text-stone-300 font-black">{player.hand.length}</span>
          </div>
          <div className="text-[9px] text-stone-500 font-bold">Hand</div>
        </div>
      )}
    </div>
  )
}
