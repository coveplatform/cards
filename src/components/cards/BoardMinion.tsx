import { useState } from 'react'
import type { CardInstance } from '../../types'
import { getCard } from '../../data/registry'
import { getArt } from '../../data/cardArt'

interface Props {
  instance: CardInstance
  isAttacker?: boolean
  isValidTargetEnemy?: boolean
  isValidTargetFriendly?: boolean
  canAttack?: boolean
  animOffset?: { dx: number; dy: number } | null
  onClick?: () => void
}

// Calibrated to board-card.png at 120×165px
const W = 120
const H = 165

export function BoardMinion({
  instance,
  isAttacker,
  isValidTargetEnemy,
  isValidTargetFriendly,
  canAttack,
  animOffset,
  onClick,
}: Props) {
  const def = getCard(instance.definitionId)
  const art = getArt(instance.definitionId)
  const [isHovered, setIsHovered] = useState(false)

  const isExhausted = instance.hasAttackedThisTurn && !instance.isSummonSick
  const shouldFloat = canAttack && !instance.isSummonSick && !isAttacker && !isHovered

  let glowFilter: string | undefined
  if (isAttacker)             glowFilter = 'drop-shadow(0 0 10px rgba(239,68,68,1)) drop-shadow(0 0 22px rgba(239,68,68,0.5))'
  else if (isValidTargetEnemy)    glowFilter = 'drop-shadow(0 0 10px rgba(239,68,68,0.9))'
  else if (isValidTargetFriendly) glowFilter = 'drop-shadow(0 0 10px rgba(34,197,94,0.9))'
  else if (canAttack)         glowFilter = 'drop-shadow(0 0 9px rgba(251,191,36,0.95))'

  const scaleVal = isHovered ? 1.1 : 1

  return (
    <div
      data-instanceid={instance.instanceId}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: `${W}px`,
        height: `${H}px`,
        position: 'relative',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        filter: glowFilter,
        opacity: isExhausted ? 0.72 : 1,
        transform: animOffset
          ? `translate(${animOffset.dx}px, ${animOffset.dy}px) scale(${scaleVal})`
          : `scale(${scaleVal})`,
        transition: animOffset
          ? 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
          : 'transform 0.15s ease-out, opacity 0.3s',
        zIndex: animOffset ? 50 : isHovered ? 10 : undefined,
        animation: shouldFloat ? 'float-up 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Card frame */}
      <img
        src="/board-card.png"
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none' }}
      />

      {/* Art — centered in the parchment interior */}
      <div style={{
        position: 'absolute',
        top: '18%', left: '10%', right: '10%', bottom: '22%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '4px',
      }}>
        {/* Name */}
        <span style={{
          fontSize: '8px', fontWeight: 900, color: '#1a0e00',
          textAlign: 'center', lineHeight: 1.1,
          maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {def.name}
        </span>
      </div>

      {/* Attack badge — bottom left */}
      <div style={{
        position: 'absolute', bottom: '4px', left: '4px',
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'radial-gradient(ellipse at 35% 30%, #fb923c, #c2410c)',
        border: '2px solid rgba(253,186,116,0.9)',
        boxShadow: '0 0 8px rgba(234,88,12,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,1)' }}>
          {instance.currentAttack}
        </span>
      </div>

      {/* Health badge — bottom right */}
      <div style={{
        position: 'absolute', bottom: '4px', right: '4px',
        width: '28px', height: '28px', borderRadius: '50%',
        background: instance.currentHealth < instance.maxHealth
          ? 'radial-gradient(ellipse at 35% 30%, #f87171, #b91c1c)'
          : 'radial-gradient(ellipse at 35% 30%, #4ade80, #15803d)',
        border: instance.currentHealth < instance.maxHealth
          ? '2px solid rgba(252,165,165,0.9)'
          : '2px solid rgba(134,239,172,0.9)',
        boxShadow: instance.currentHealth < instance.maxHealth
          ? '0 0 8px rgba(220,38,38,0.9)'
          : '0 0 8px rgba(22,163,74,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,1)' }}>
          {instance.currentHealth}
        </span>
      </div>

      {/* Ward banner */}
      {instance.isWard && (
        <div style={{
          position: 'absolute', top: '14%', left: '10%', right: '10%',
          background: 'linear-gradient(90deg, rgba(120,95,0,0.9), rgba(234,179,8,0.95), rgba(120,95,0,0.9))',
          borderBottom: '1px solid rgba(253,224,71,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2px 0', zIndex: 3,
        }}>
          <span style={{ fontSize: '7px', fontWeight: 900, color: '#1c1917' }}>🛡 WARD</span>
        </div>
      )}

      {/* Summoning sick */}
      {instance.isSummonSick && (
        <div style={{ position: 'absolute', bottom: '34px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 900, color: '#78716c', animation: 'zzz-fade 1.5s ease-in-out infinite', whiteSpace: 'nowrap', zIndex: 3 }}>
          ZZZ
        </div>
      )}

      {/* Exhausted marker */}
      {isExhausted && !instance.isSummonSick && (
        <div style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '9px', color: '#78716c', fontWeight: 700, transform: 'rotate(12deg)', zIndex: 3 }}>
          ✓
        </div>
      )}
    </div>
  )
}
