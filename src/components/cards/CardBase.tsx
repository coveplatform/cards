import type { CardDefinition } from '../../types/card'
import type { CardInstance } from '../../types'
import { getCard } from '../../data/registry'
import { getArt } from '../../data/cardArt'

interface Props {
  instance: CardInstance
  isSelected?: boolean
  isHovered?: boolean
  hoverX?: number
  hoverY?: number
  onClick?: () => void
}

function getCardText(def: CardDefinition): string {
  if (def.cardType === 'MINION' && def.passive?.description) return def.passive.description
  if (def.spellEffect) {
    const p = def.spellEffect.params
    switch (def.spellEffect.effectKey) {
      case 'DEAL_FACE_DAMAGE': return `Deal ${p.amount} damage to the enemy hero.`
      case 'HEAL_HERO': return `Restore ${p.amount} Health.`
      case 'HEAL_HERO_DRAW': return `Restore ${p.amount} Health. Draw ${p.draw} cards.`
      case 'DEAL_DAMAGE_ALL_MINIONS': return `Deal ${p.amount} damage to ALL minions.`
      case 'DEAL_DAMAGE_ALL_ENEMY_MINIONS': return `Deal ${p.amount} damage to all enemy minions.`
      case 'DEAL_DAMAGE_ALL': return `Deal ${p.amount} damage to all characters.`
      case 'CURSE_MINION': return `Deal 3 damage to an enemy minion.`
      case 'DESTROY_DAMAGED_MINION_HEAL': return `Destroy a damaged enemy minion. Restore ${p.healAmount} Health.`
      case 'SACRIFICE_FRIENDLY_MINION_HEAL': return `Sacrifice a friendly minion. Restore ${p.healAmount} Health.`
      case 'GRANT_WARD_AND_BUFF': return `Give a friendly minion Ward and +${p.health} Health.`
      case 'DEAL_MINION_DAMAGE': return `Deal ${p.amount} damage to an enemy minion.`
      case 'BUFF_MINION_ATTACK': return `Give a friendly minion +${p.amount} Attack.`
      case 'DRAW_SELF_DAMAGE': return `Draw ${p.draw} cards. Take ${p.selfDamage} damage.`
    }
  }
  return def.flavorText ?? ''
}

// Calibrated to card.png template rendered at 170×238px
// Gem circles in the PNG are inset from the corners — push all numbers diagonally inward
const W = 170
const H = 238
const POS = {
  mana:   { left: 14, top: 20,  size: 32 },
  art:    { top: 16,  left: 16, right: 16, height: 100 },
  name:   { top: 108, left: 18, right: 18, height: 22 },
  text:   { top: 148, left: 28, right: 28, bottom: 52 },
  attack: { left: 12, bottom: 26, size: 32 },
  health: { right: 10, bottom: 26, size: 32 },
  cr:     { right: 14, top: 20,  size: 26 },
}

const glowColors: Record<string, string> = {
  WARLOCK: 'rgba(139,92,246,0.9)',
  PALADIN: 'rgba(217,119,6,0.9)',
  NEUTRAL: 'rgba(120,113,108,0.7)',
}

export function CardBase({ instance, isSelected, isHovered, hoverX = 0, hoverY = 0, onClick }: Props) {
  const def = getCard(instance.definitionId)
  const art = getArt(instance.definitionId)
  const cardText = getCardText(def)
  const isMinion = def.cardType === 'MINION'
  const glow = glowColors[def.classTag] ?? glowColors.NEUTRAL

  const tiltX = isHovered ? hoverY * -20 : 0
  const tiltY = isHovered ? hoverX * 20 : 0
  const scaleVal = isHovered ? 1.38 : 1
  const liftVal = isHovered ? -30 : 0

  // Outer div: handles transform + drop-shadow glow (works outside overflow:hidden)
  // Inner div: overflow:hidden keeps all content clipped to card bounds
  return (
    <div
      data-instanceid={instance.instanceId}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
      style={{
        width: `${W}px`,
        height: `${H}px`,
        flexShrink: 0,
        transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scaleVal}) translateY(${liftVal}px)`,
        transition: isHovered ? 'transform 0.06s ease-out' : 'transform 0.3s ease-out',
        filter: isSelected
          ? 'drop-shadow(0 0 6px rgba(251,191,36,1)) drop-shadow(0 0 16px rgba(251,191,36,0.8))'
          : isHovered
          ? `drop-shadow(0 0 8px ${glow}) drop-shadow(0 12px 24px rgba(0,0,0,0.7))`
          : undefined,
      }}
    >
      <div style={{ position: 'relative', width: `${W}px`, height: `${H}px`, borderRadius: '11px', overflow: 'hidden' }}>

        {/* Card frame */}
        <img
          src="/card.png"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none', zIndex: 1 }}
        />



        {/* Shimmer on hover */}
        {isHovered && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
            background: `linear-gradient(${108 + hoverX * 70}deg, transparent 20%, rgba(255,255,255,0.06) 38%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 62%, transparent 80%)`,
          }} />
        )}

        {/* Mana cost */}
        <div style={{
          position: 'absolute', left: POS.mana.left, top: POS.mana.top,
          width: POS.mana.size, height: POS.mana.size,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,1)' }}>
            {def.manaCost}
          </span>
        </div>

        {/* Class resource cost */}
        {def.classResourceCost != null && (
          <div style={{
            position: 'absolute', right: POS.cr.right, top: POS.cr.top,
            width: POS.cr.size, height: POS.cr.size,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            borderRadius: '50%',
            background: def.classTag === 'WARLOCK'
              ? 'radial-gradient(ellipse at 35% 30%, #c084fc, #6d28d9)'
              : 'radial-gradient(ellipse at 35% 30%, #fbbf24, #b45309)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            boxShadow: '0 0 6px rgba(0,0,0,0.8)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
              {def.classResourceCost}
            </span>
          </div>
        )}

        {/* Ward */}
        {def.hasWard && (
          <div style={{ position: 'absolute', top: POS.art.top + 1, right: POS.art.right + 1, zIndex: 10, fontSize: '11px' }}>
            🛡
          </div>
        )}

        {/* Name — arc/rainbow curve via SVG textPath */}
        {(() => {
          const nameW = W - POS.name.left - POS.name.right
          const svgH = 28
          const pad = 6
          return (
            <div style={{ position: 'absolute', top: POS.name.top + 1, left: POS.name.left, width: nameW, height: svgH, zIndex: 10 }}>
              <svg width={nameW} height={svgH} viewBox={`0 0 ${nameW} ${svgH}`} overflow="visible">
                <defs>
                  <path id="nameArc" d={`M ${pad},${svgH - 4} Q ${nameW / 2},${4} ${nameW - pad},${svgH - 4}`} />
                </defs>
                <text
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="900"
                  fill="#1a0e00"
                  stroke="#1a0e00"
                  strokeWidth="0.4"
                  paintOrder="stroke fill"
                  style={{ fontFamily: 'inherit' }}
                >
                  <textPath href="#nameArc" startOffset="50%">
                    {def.name}
                  </textPath>
                </text>
              </svg>
            </div>
          )
        })()}

        {/* Description */}
        <div style={{
          position: 'absolute',
          top: POS.text.top, left: POS.text.left, right: POS.text.right, bottom: POS.text.bottom,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, overflow: 'hidden',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0d0700', textAlign: 'center', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' } as React.CSSProperties}>
            {cardText}
          </span>
        </div>

        {/* Attack */}
        {isMinion && (
          <div style={{
            position: 'absolute', left: POS.attack.left, bottom: POS.attack.bottom,
            width: POS.attack.size, height: POS.attack.size,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,1)' }}>
              {instance.currentAttack}
            </span>
          </div>
        )}

        {/* Health */}
        {isMinion && (
          <div style={{
            position: 'absolute', right: POS.health.right, bottom: POS.health.bottom,
            width: POS.health.size, height: POS.health.size,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
          }}>
            <span style={{
              fontSize: '16px', fontWeight: 900,
              color: instance.currentHealth < instance.maxHealth ? '#fca5a5' : '#fff',
              textShadow: '0 1px 6px rgba(0,0,0,1)',
            }}>
              {instance.currentHealth}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
