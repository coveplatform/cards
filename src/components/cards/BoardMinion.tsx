import { useState } from 'react'
import type { CardInstance } from '../../types'
import { CardBase } from './CardBase'

interface Props {
  instance: CardInstance
  isAttacker?: boolean
  isValidTargetEnemy?: boolean
  isValidTargetFriendly?: boolean
  canAttack?: boolean
  animOffset?: { dx: number; dy: number } | null
  onClick?: () => void
}

// Board cards are CardBase scaled down
const SCALE = 0.85
const CW = Math.round(170 * SCALE)  // 145
const CH = Math.round(238 * SCALE)  // 202

export function BoardMinion({
  instance,
  isAttacker,
  isValidTargetEnemy,
  isValidTargetFriendly,
  canAttack,
  animOffset,
  onClick,
}: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const isExhausted = instance.hasAttackedThisTurn && !instance.isSummonSick
  const shouldFloat = canAttack && !instance.isSummonSick && !isAttacker && !isHovered

  let glowFilter: string | undefined
  if (isAttacker)           glowFilter = 'drop-shadow(0 0 10px rgba(239,68,68,1)) drop-shadow(0 0 22px rgba(239,68,68,0.5))'
  else if (isValidTargetEnemy)   glowFilter = 'drop-shadow(0 0 10px rgba(239,68,68,0.9))'
  else if (isValidTargetFriendly) glowFilter = 'drop-shadow(0 0 10px rgba(34,197,94,0.9))'
  else if (canAttack)        glowFilter = 'drop-shadow(0 0 8px rgba(251,191,36,0.9))'

  return (
    <div
      data-instanceid={instance.instanceId}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: `${CW}px`,
        height: `${CH}px`,
        position: 'relative',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        filter: glowFilter,
        opacity: isExhausted ? 0.75 : 1,
        transform: animOffset
          ? `translate(${animOffset.dx}px, ${animOffset.dy}px) scale(${isHovered ? 1.1 : 1})`
          : isHovered ? 'scale(1.1)' : undefined,
        transition: animOffset
          ? 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
          : 'transform 0.15s ease-out, opacity 0.3s',
        zIndex: animOffset ? 50 : isHovered ? 10 : undefined,
        animation: shouldFloat ? 'float-up 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Scale CardBase down to fit board */}
      <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <CardBase instance={instance} isSelected={isAttacker} />
      </div>

      {/* Summoning sick indicator */}
      {instance.isSummonSick && (
        <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 900, color: '#78716c', animation: 'zzz-fade 1.5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
          ZZZ
        </div>
      )}

      {/* Exhausted marker */}
      {isExhausted && !instance.isSummonSick && (
        <div style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '8px', color: '#78716c', fontWeight: 700, transform: 'rotate(12deg)' }}>
          ✓
        </div>
      )}
    </div>
  )
}
