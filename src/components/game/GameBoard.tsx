import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { HeroZone, classColors } from './HeroZone'
import { BoardZone } from './BoardZone'
import { HandZone } from './HandZone'
import { BoundPassives } from './BoundPassives'
import { SoulBindModal } from './SoulBindModal'
import { TargetArrow } from './TargetArrow'
import type { PlayerId } from '../../types'

// Opponent card back dimensions — slightly narrower than player cards to match visual weight
const CARD_W = 140
const CARD_H = 196
const PEEK_H = 90  // px visible at top edge

function CardBack() {
  return (
    <div style={{
      width: `${CARD_W}px`, height: `${CARD_H}px`, borderRadius: '10px',
      background: 'linear-gradient(155deg, #0e0820 0%, #06101a 45%, #0e0820 100%)',
      border: '2px solid rgba(190,145,45,0.75)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.5)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Inner border */}
      <div style={{ position: 'absolute', inset: '6px', border: '1px solid rgba(190,145,45,0.25)', borderRadius: '6px' }} />
      {/* Subtle diagonal lines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(190,145,45,0.035) 14px, rgba(190,145,45,0.035) 15px)`,
        borderRadius: 'inherit',
      }} />
      {/* Centered emblem */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '42px', filter: 'drop-shadow(0 0 12px rgba(190,145,45,0.9))', lineHeight: 1 }}>⚔️</div>
        <div style={{ width: '48px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(190,145,45,0.7), transparent)' }} />
        <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(190,145,45,0.65)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Realm's Edge
        </div>
      </div>
      {/* Corner diamonds */}
      {([['top','left'],['top','right'],['bottom','left'],['bottom','right']] as const).map(([v,h], i) => (
        <div key={i} style={{
          position: 'absolute', [v]: '10px', [h]: '10px',
          width: '7px', height: '7px',
          background: 'rgba(190,145,45,0.55)', transform: 'rotate(45deg)',
        }} />
      ))}
    </div>
  )
}

// Deck pill
function DeckPill({ playerId }: { playerId: PlayerId }) {
  const gameState = useGameStore(s => s.gameState)
  const player = gameState?.players[playerId]
  if (!player) return null
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center justify-center font-black text-stone-200 rounded-lg"
        style={{
          width: '42px', height: '54px',
          background: 'linear-gradient(135deg, rgba(28,25,23,0.95), rgba(41,37,36,0.95))',
          border: '1px solid rgba(80,70,60,0.7)',
          fontSize: '20px',
        }}
      >
        {player.deck.length}
      </div>
      <div className="text-[10px] font-black tracking-wider text-stone-500 uppercase">Deck</div>
    </div>
  )
}


// HUD row — deck left, portrait+resource center (auto width), nothing forced right
function HudRow({ playerId, isOpponent }: { playerId: PlayerId; isOpponent?: boolean }) {
  return (
    <div className="flex items-center justify-center py-1 px-4 gap-3">
      {/* Deck */}
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: 'rgba(8,6,3,0.82)',
          border: '1px solid rgba(80,60,30,0.3)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
        }}
      >
        <DeckPill playerId={playerId} />
      </div>

      {/* Center HUD: portrait + class resource + hero power — auto width only */}
      <div
        className="rounded-2xl"
        style={{
          background: 'rgba(8,6,3,0.82)',
          border: '1px solid rgba(80,60,30,0.35)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        <HeroZone playerId={playerId} isOpponent={isOpponent} />
        <BoundPassives playerId={playerId} />
      </div>
    </div>
  )
}

export function GameBoard() {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const endTurn = useGameStore(s => s.endTurn)
  const cancelTargeting = useGameStore(s => s.cancelTargeting)
  const targeting = useGameStore(s => s.targeting)
  const selectedAttackerInstanceId = useGameStore(s => s.selectedAttackerInstanceId)

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [arrowSourceId, setArrowSourceId] = useState<string | null>(null)

  useEffect(() => {
    if (targeting) setArrowSourceId(targeting.cardInstanceId)
    else if (selectedAttackerInstanceId) setArrowSourceId(selectedAttackerInstanceId)
    else setArrowSourceId(null)
  }, [targeting, selectedAttackerInstanceId])

  if (!gameState || !myPlayerId) return null

  const opponentId: PlayerId = myPlayerId === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1'
  const isMyTurn = gameState.activePlayerId === myPlayerId
  const opponentHand = gameState.players[opponentId]?.hand ?? []

  const isHostile = targeting
    ? (targeting.targetType?.startsWith('ENEMY') ?? false)
    : !!selectedAttackerInstanceId

  // Combat instruction
  let instruction = gameState.message ?? ''
  if (targeting) {
    const t = targeting.targetType
    if (t === 'ENEMY_MINION') instruction = 'Select a target'
    else if (t === 'DAMAGED_ENEMY_MINION') instruction = 'Select a damaged enemy'
    else if (t === 'FRIENDLY_MINION') instruction = 'Select one of your minions'
  } else if (selectedAttackerInstanceId) {
    const enemyHasWard = gameState.players[opponentId]?.board.some(m => m.isWard) ?? false
    const enemyHasMinions = (gameState.players[opponentId]?.board.length ?? 0) > 0
    if (enemyHasWard) instruction = 'Must attack a Ward minion'
    else if (enemyHasMinions) instruction = 'Select an enemy — or click the hero to attack face'
    else instruction = 'Click the enemy hero to attack face'
  }

  const showLog = !!(targeting || selectedAttackerInstanceId || instruction)

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundImage: 'url(/board.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
      onClick={e => { if (e.target === e.currentTarget && targeting) cancelTargeting() }}
    >
      <SoulBindModal />
      {arrowSourceId && <TargetArrow sourceInstanceId={arrowSourceId} mousePos={mousePos} isHostile={isHostile} />}

      {/* ── Opponent hand — peeking from top ── */}
      <div className="flex-none" style={{ height: `${PEEK_H}px`, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {opponentHand.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: `${CARD_H}px` }}>
            {opponentHand.map((_, i) => {
              const count = opponentHand.length
              const pos = count > 1 ? (i - (count - 1) / 2) : 0
              return (
                <div key={i} style={{
                  transform: `rotate(${pos * 4}deg) translateY(-${Math.abs(pos) * 5}px)`,
                  transformOrigin: 'bottom center',
                  marginLeft: i === 0 ? 0 : `-${CARD_W - 28}px`,
                  zIndex: i,
                  position: 'relative',
                }}>
                  <CardBack />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-stone-800 text-xs italic pb-1">No cards</div>
        )}
      </div>

      {/* ── Opponent HUD ── */}
      <HudRow playerId={opponentId} isOpponent />

      {/* ── Battle area ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Opponent board */}
        <div className="flex-1 board-zone flex items-center">
          <div className="w-full"><BoardZone playerId={opponentId} isOpponent /></div>
        </div>

        {/* Center divider — just turn + end turn */}
        <div className="flex-none flex items-center justify-between px-6" style={{ height: '52px', position: 'relative' }}>
          <div className="center-divider absolute inset-x-0" style={{ height: '2px', top: '50%', transform: 'translateY(-50%)' }} />

          <div
            className="relative z-10 px-3 py-1 rounded-full text-xs font-bold text-amber-500 tracking-widest"
            style={{ background: 'rgba(10,8,4,0.9)', border: '1px solid rgba(180,120,30,0.4)', boxShadow: '0 0 10px rgba(0,0,0,0.8)' }}
          >
            TURN {gameState.turnNumber}
          </div>

          <div className="flex-1" />

          <button
            onClick={isMyTurn ? endTurn : undefined}
            disabled={!isMyTurn}
            className={`relative z-10 px-5 py-2 rounded-xl font-black text-sm tracking-widest transition-all duration-200 whitespace-nowrap
              ${isMyTurn ? 'end-turn-active text-green-200 cursor-pointer' : 'end-turn-inactive text-stone-600 cursor-not-allowed'}`}
          >
            {isMyTurn ? 'END TURN' : "OPPONENT'S TURN"}
          </button>
        </div>

        {/* Player board */}
        <div className="flex-1 board-zone-active flex items-center">
          <div className="w-full"><BoardZone playerId={myPlayerId} /></div>
        </div>
      </div>

      {/* ── Player HUD ── */}
      <HudRow playerId={myPlayerId} />

      {/* ── Hand area ── */}
      <div className="flex-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.55) 100%)' }}>
        <HandZone />
      </div>

      {/* ── Player mana — fixed bottom right ── */}
      {(() => {
        const p = gameState.players[myPlayerId]
        return p ? (
          <div className="fixed bottom-4 right-4 z-40 flex items-center gap-3"
            style={{
              background: 'rgba(5,3,2,0.92)',
              border: '1px solid rgba(80,100,180,0.5)',
              borderRadius: '16px',
              padding: '10px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 12px rgba(59,130,246,0.15)',
            }}
          >
            {/* Label + count on same row */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-black tracking-widest uppercase text-blue-300" style={{ fontSize: '13px' }}>MANA</span>
              <span className="font-black tabular-nums text-blue-200" style={{ fontSize: '20px', lineHeight: 1 }}>
                {p.manaPool}<span className="text-blue-500" style={{ fontSize: '15px' }}>/{p.manaCapacity}</span>
              </span>
            </div>
            {/* Crystals */}
            <div className="flex gap-1.5 flex-wrap" style={{ maxWidth: '220px' }}>
              {Array.from({ length: Math.max(p.manaCapacity, 1) }).map((_, i) => (
                <div key={i} style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: i < p.manaPool
                    ? 'radial-gradient(ellipse at 35% 30%, #93c5fd, #2563eb 60%, #1e3a8a)'
                    : 'radial-gradient(ellipse at 35% 30%, #374151, #111827)',
                  border: i < p.manaPool ? '2px solid rgba(147,197,253,0.85)' : '2px solid rgba(75,85,99,0.4)',
                  boxShadow: i < p.manaPool ? '0 0 10px rgba(59,130,246,1), 0 0 4px rgba(147,197,253,0.5)' : 'none',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        ) : null
      })()}

      {/* ── Opponent mana — fixed top right ── */}
      {(() => {
        const p = gameState.players[opponentId]
        return p ? (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2"
            style={{
              background: 'rgba(5,3,2,0.92)',
              border: '1px solid rgba(80,100,180,0.45)',
              borderRadius: '12px',
              padding: '8px 14px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>💧</span>
            <div className="flex flex-col leading-none">
              <span className="font-black tracking-widest uppercase text-blue-400" style={{ fontSize: '9px' }}>Mana</span>
              <span className="font-black tabular-nums text-blue-200" style={{ fontSize: '18px', lineHeight: 1 }}>
                {p.manaPool}<span className="text-blue-500 text-sm">/{p.manaCapacity}</span>
              </span>
            </div>
          </div>
        ) : null
      })()}

      {/* ── Combat log — bottom left ── */}
      {showLog && (
        <div
          className="fixed bottom-4 left-4 z-50 flex flex-col gap-1.5"
          style={{ maxWidth: '280px' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(5,3,2,0.92)',
              border: '1px solid rgba(180,120,30,0.5)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ fontSize: '14px' }}>
              {targeting ? '🎯' : selectedAttackerInstanceId ? '⚔️' : 'ℹ️'}
            </span>
            <span className="text-sm font-bold text-stone-100 leading-snug">{instruction}</span>
          </div>
          {(targeting || selectedAttackerInstanceId) && (
            <button
              onClick={cancelTargeting}
              className="self-start px-3 py-1 rounded-lg text-xs font-bold text-stone-400 hover:text-stone-200 cursor-pointer transition-colors"
              style={{ background: 'rgba(5,3,2,0.85)', border: '1px solid rgba(80,60,30,0.4)' }}
            >
              Cancel (Esc)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
