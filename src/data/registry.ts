import type { CardDefinition } from '../types'
import type { ClassTag } from '../types'
import { neutralCards } from './cards/neutral'
import { warlockCards } from './cards/warlock'
import { paladinCards } from './cards/paladin'

const allCards: CardDefinition[] = [...neutralCards, ...warlockCards, ...paladinCards]

export const cardRegistry = new Map<string, CardDefinition>(
  allCards.map(card => [card.id, card])
)

export function getCard(id: string): CardDefinition {
  const card = cardRegistry.get(id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

export function getCardsByClass(classTag: ClassTag): CardDefinition[] {
  return allCards.filter(c => c.classTag === classTag && !c.id.endsWith('_token'))
}
