import { nanoid } from 'nanoid'
import type { CardInstance } from '../types'
import { getCard } from '../data/registry'

export function buildDeck(cardIds: string[]): CardInstance[] {
  return shuffle(cardIds.map(id => {
    const def = getCard(id)
    return {
      instanceId: nanoid(),
      definitionId: id,
      currentAttack: def.attack ?? 0,
      currentHealth: def.health ?? 0,
      maxHealth: def.health ?? 0,
      hasAttackedThisTurn: false,
      isSummonSick: true,
      isWard: def.hasWard ?? false,
    } satisfies CardInstance
  }))
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
