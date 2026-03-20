import { useState, useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getCardsByClass } from '../../data/registry'
import { getArt } from '../../data/cardArt'
import { getCard } from '../../data/registry'
import type { HeroClass } from '../../types'
import type { CardDefinition } from '../../types/card'

// Re-use the card text helper
function getCardText(def: CardDefinition): string {
  if (def.cardType === 'MINION' && def.passive?.description) return def.passive.description
  if (def.spellEffect) {
    const p = def.spellEffect.params
    switch (def.spellEffect.effectKey) {
      case 'DEAL_FACE_DAMAGE': return `Deal ${p.amount} damage to the enemy hero.`
      case 'HEAL_HERO': return `Restore ${p.amount} Health.`
      case 'HEAL_HERO_DRAW': return `Restore ${p.amount} Health. Draw ${p.draw} cards.`
      case 'DEAL_DAMAGE_ALL_MINIONS': return `Deal ${p.amount} damage to all minions.`
      case 'DEAL_DAMAGE_ALL_ENEMY_MINIONS': return `Deal ${p.amount} damage to all enemy minions.`
      case 'DEAL_DAMAGE_ALL': return `Deal ${p.amount} damage to all characters.`
      case 'DEAL_MINION_DAMAGE': return `Deal ${p.amount} damage to an enemy minion.`
      case 'DEAL_DAMAGE_ALL_ENEMIES': return `Deal ${p.amount} damage to all enemies.`
      case 'DESTROY_MINION': return `Destroy an enemy minion.`
      case 'BUFF_MINION_ATTACK': return `Give a friendly minion +${p.amount} Attack.`
      case 'BUFF_MINION_STATS': return `Give a friendly minion +${p.attack}/+${p.health}.`
      case 'GRANT_WARD_AND_BUFF': return `Give a friendly minion Ward and +${p.health} Health.`
      case 'DRAW_CARDS': return `Draw ${p.draw} cards.`
      case 'DRAW_SELF_DAMAGE': return `Draw ${p.draw} cards. Take ${p.selfDamage} damage.`
      case 'SACRIFICE_FRIENDLY_MINION_HEAL': return `Sacrifice a friendly minion. Restore ${p.healAmount} Health.`
      case 'DESTROY_DAMAGED_MINION_HEAL': return `Destroy a damaged enemy minion. Restore ${p.healAmount} Health.`
      case 'GAIN_CLASS_RESOURCES': return `Gain ${p.amount} Soul Shards.`
      default: return def.flavorText ?? ''
    }
  }
  return def.flavorText ?? ''
}

const CLASS_COLORS = {
  WARLOCK: {
    bg: 'from-purple-950 to-violet-950',
    accent: '#7c3aed',
    border: 'rgba(139,92,246,0.5)',
    gem: 'radial-gradient(ellipse at 35% 30%, #a855f7, #6d28d9)',
    gemBorder: 'rgba(196,132,252,0.7)',
    name: 'Warlock',
    icon: '💀',
    resourceName: 'Soul Shards',
    resourceSymbol: '●',
  },
  PALADIN: {
    bg: 'from-amber-950 to-yellow-950',
    accent: '#d97706',
    border: 'rgba(217,119,6,0.5)',
    gem: 'radial-gradient(ellipse at 35% 30%, #fbbf24, #b45309)',
    gemBorder: 'rgba(253,224,71,0.7)',
    name: 'Paladin',
    icon: '⚔️',
    resourceName: 'Holy Power',
    resourceSymbol: '◆',
  },
}

interface MiniCardProps {
  def: CardDefinition
  copies: number
  maxCopies: number
  onAdd: () => void
}

function MiniCard({ def, copies, maxCopies, onAdd }: MiniCardProps) {
  const colors = CLASS_COLORS[def.classTag as 'WARLOCK' | 'PALADIN']
  const art = getArt(def.id)
  const text = getCardText(def)
  const canAdd = copies < maxCopies

  return (
    <div
      onClick={canAdd ? onAdd : undefined}
      className={`relative flex flex-col rounded-lg overflow-hidden border transition-all duration-150 select-none ${
        canAdd ? 'cursor-pointer hover:scale-105 hover:brightness-110' : 'opacity-60 cursor-not-allowed'
      }`}
      style={{
        width: '100px',
        height: '145px',
        background: `linear-gradient(170deg, ${def.classTag === 'WARLOCK' ? '#1e0f3a 0%, #0d0620 100%' : '#2a1a00 0%, #100800 100%'})`,
        border: `2px solid ${canAdd ? colors.border : 'rgba(80,70,60,0.3)'}`,
        boxShadow: copies > 0 ? `0 0 12px ${colors.border}` : undefined,
      }}
    >
      {/* Copies badge */}
      {copies > 0 && (
        <div
          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-xs"
          style={{ background: colors.accent, boxShadow: `0 0 6px ${colors.accent}` }}
        >
          {copies}
        </div>
      )}

      {/* Mana cost */}
      <div
        className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[10px]"
        style={{
          background: 'radial-gradient(ellipse at 35% 30%, #60a5fa, #1d4ed8)',
          border: '1px solid rgba(147,197,253,0.7)',
          boxShadow: '0 0 6px rgba(59,130,246,0.8)',
        }}
      >
        {def.manaCost}
      </div>

      {/* Class resource cost */}
      {def.classResourceCost != null && (
        <div
          className="absolute top-7 left-1 z-10 w-4 h-4 rounded-full flex items-center justify-center font-black text-white text-[8px]"
          style={{ background: colors.gem, border: `1px solid ${colors.gemBorder}` }}
        >
          {def.classResourceCost}{colors.resourceSymbol}
        </div>
      )}

      {/* Ward */}
      {def.hasWard && (
        <div className="absolute top-1 right-6 z-10 text-yellow-300 text-[11px]">🛡</div>
      )}

      {/* Art */}
      <div
        className="flex items-center justify-center mt-5 flex-shrink-0"
        style={{ height: '44px' }}
      >
        <span style={{ fontSize: '32px' }}>{art}</span>
      </div>

      {/* Name */}
      <div
        className="text-center px-1 py-0.5 flex-shrink-0"
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#f5f5f4',
          lineHeight: 1.2,
        }}
      >
        {def.name}
      </div>

      {/* Text */}
      <div
        className="flex-1 flex items-start justify-center px-1 pt-1"
        style={{ background: 'rgba(0,0,0,0.45)', overflow: 'hidden' }}
      >
        <div style={{ fontSize: '7.5px', lineHeight: 1.35, color: '#d6d3d1', textAlign: 'center' }}>
          {text}
        </div>
      </div>

      {/* ATK/HP */}
      {def.cardType === 'MINION' && (
        <>
          <div
            className="absolute bottom-1 left-0.5 flex items-center justify-center font-black text-white"
            style={{
              width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px',
              background: 'radial-gradient(ellipse at 35% 30%, #fb923c, #c2410c)',
              border: '1px solid rgba(253,186,116,0.8)',
            }}
          >
            {def.attack}
          </div>
          <div
            className="absolute bottom-1 right-0.5 flex items-center justify-center font-black text-white"
            style={{
              width: '18px', height: '18px', borderRadius: '50%', fontSize: '9px',
              background: 'radial-gradient(ellipse at 35% 30%, #4ade80, #15803d)',
              border: '1px solid rgba(134,239,172,0.8)',
            }}
          >
            {def.health}
          </div>
        </>
      )}
    </div>
  )
}

export function DeckBuilder() {
  const saveDeck = useGameStore(s => s.saveDeck)
  const savedDecks = useGameStore(s => s.savedDecks)
  const reset = useGameStore(s => s.reset)

  const [heroClass, setHeroClass] = useState<HeroClass>('WARLOCK')
  const [deck, setDeck] = useState<string[]>(() => savedDecks[heroClass] ?? [])

  const colors = CLASS_COLORS[heroClass]
  const allCards = useMemo(() => {
    const cards = getCardsByClass(heroClass)
    return cards.sort((a, b) => {
      if (a.manaCost !== b.manaCost) return a.manaCost - b.manaCost
      if (a.cardType !== b.cardType) return a.cardType === 'SPELL' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [heroClass])

  const deckCount = deck.length
  const isComplete = deckCount === 30

  // Count copies of each card in deck
  const copiesInDeck = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const id of deck) counts[id] = (counts[id] ?? 0) + 1
    return counts
  }, [deck])

  // Deck list sorted by mana cost
  const deckList = useMemo(() => {
    const unique = Object.keys(copiesInDeck)
    return unique
      .map(id => ({ id, copies: copiesInDeck[id], def: getCard(id) }))
      .sort((a, b) => a.def.manaCost - b.def.manaCost || a.def.name.localeCompare(b.def.name))
  }, [copiesInDeck])

  const switchClass = (cls: HeroClass) => {
    setHeroClass(cls)
    setDeck(savedDecks[cls] ?? [])
  }

  const addCard = (id: string) => {
    if (deckCount >= 30) return
    if ((copiesInDeck[id] ?? 0) >= 2) return
    setDeck(prev => [...prev, id])
  }

  const removeOne = (id: string) => {
    const idx = deck.lastIndexOf(id)
    if (idx === -1) return
    setDeck(prev => prev.filter((_, i) => i !== idx))
  }

  const clearDeck = () => setDeck([])

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d0a18 0%, #050408 100%)' }}
    >
      {/* Header */}
      <div
        className="flex-none flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'rgba(80,60,30,0.3)', background: 'rgba(5,3,10,0.95)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="text-stone-500 hover:text-stone-300 text-sm cursor-pointer transition-colors"
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-black tracking-widest"
            style={{ color: colors.accent, textShadow: `0 0 20px ${colors.accent}` }}
          >
            DECK BUILDER
          </h1>
        </div>

        {/* Class tabs */}
        <div className="flex gap-2">
          {(['WARLOCK', 'PALADIN'] as HeroClass[]).map(cls => (
            <button
              key={cls}
              onClick={() => switchClass(cls)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                heroClass === cls ? 'scale-105' : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                background: heroClass === cls
                  ? (cls === 'WARLOCK' ? 'linear-gradient(135deg,#2e1065,#4c1d95)' : 'linear-gradient(135deg,#78350f,#92400e)')
                  : 'rgba(30,25,20,0.8)',
                border: `2px solid ${CLASS_COLORS[cls].border}`,
                color: heroClass === cls ? '#fff' : '#78716c',
              }}
            >
              {CLASS_COLORS[cls].icon} {CLASS_COLORS[cls].name}
            </button>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={() => isComplete && saveDeck(heroClass, deck)}
          disabled={!isComplete}
          className={`px-6 py-2 rounded-lg font-black text-sm tracking-widest transition-all cursor-pointer ${
            isComplete ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'
          }`}
          style={{
            background: isComplete ? 'linear-gradient(135deg,#14532d,#166534)' : 'rgba(20,20,20,0.8)',
            border: isComplete ? '2px solid rgba(34,197,94,0.7)' : '2px solid rgba(50,50,50,0.5)',
            color: isComplete ? '#bbf7d0' : '#57534e',
            boxShadow: isComplete ? '0 0 16px rgba(22,163,74,0.4)' : 'none',
          }}
        >
          {isComplete ? 'SAVE DECK' : `${deckCount}/30`}
        </button>
      </div>

      {/* Body: card grid + deck list */}
      <div className="flex-1 flex min-h-0">
        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="flex flex-wrap gap-3 justify-start"
          >
            {allCards.map(def => (
              <MiniCard
                key={def.id}
                def={def}
                copies={copiesInDeck[def.id] ?? 0}
                maxCopies={2}
                onAdd={() => addCard(def.id)}
              />
            ))}
          </div>
        </div>

        {/* Deck list sidebar */}
        <div
          className="flex-none flex flex-col border-l"
          style={{
            width: '260px',
            borderColor: 'rgba(80,60,30,0.3)',
            background: 'rgba(8,6,12,0.95)',
          }}
        >
          {/* Deck header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(60,50,40,0.4)' }}
          >
            <div>
              <div className="font-black text-sm" style={{ color: colors.accent }}>
                {colors.icon} {colors.name} Deck
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{deckCount}/30 cards</div>
            </div>
            <button
              onClick={clearDeck}
              className="text-stone-600 hover:text-red-400 text-xs cursor-pointer transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-2 flex-shrink-0">
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(30,25,20,0.9)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(deckCount / 30) * 100}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #15803d, #22c55e)'
                    : `linear-gradient(90deg, ${colors.accent}, ${colors.accent})`,
                  boxShadow: isComplete ? '0 0 8px rgba(22,163,74,0.6)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Card list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {deckList.length === 0 && (
              <div className="text-stone-700 text-xs italic text-center mt-8">
                Click cards to add them
              </div>
            )}
            {deckList.map(({ id, copies, def }) => (
              <div
                key={id}
                className="flex items-center gap-2 mb-1 rounded-lg px-2 py-1.5 group transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Mana cost */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[9px] flex-shrink-0"
                  style={{
                    background: 'radial-gradient(ellipse at 35% 30%, #60a5fa, #1d4ed8)',
                    border: '1px solid rgba(147,197,253,0.6)',
                  }}
                >
                  {def.manaCost}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-stone-200 font-bold text-xs truncate">{def.name}</div>
                  <div className="text-stone-600 text-[9px]">
                    {def.cardType === 'MINION' ? `${def.attack}/${def.health}` : 'Spell'}
                  </div>
                </div>

                {/* Copies badge */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[10px] flex-shrink-0"
                  style={{ background: colors.accent }}
                >
                  {copies}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeOne(id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs cursor-pointer transition-all"
                >
                  −
                </button>
              </div>
            ))}
          </div>

          {/* Complete banner */}
          {isComplete && (
            <div
              className="flex-shrink-0 text-center py-3 font-black text-sm tracking-wider"
              style={{
                background: 'linear-gradient(180deg, rgba(20,83,45,0.8), rgba(21,128,61,0.4))',
                borderTop: '1px solid rgba(34,197,94,0.4)',
                color: '#86efac',
              }}
            >
              ✓ DECK COMPLETE — SAVE TO PLAY
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
