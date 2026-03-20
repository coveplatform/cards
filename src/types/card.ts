export type CardType = 'MINION' | 'SPELL'
export type ClassTag = 'NEUTRAL' | 'WARLOCK' | 'PALADIN'
export type SpellTargetType = 'ENEMY_MINION' | 'DAMAGED_ENEMY_MINION' | 'FRIENDLY_MINION' | null
export type PassiveTrigger =
  | 'ON_CARD_PLAYED'
  | 'ON_ANY_MINION_DEATH'
  | 'ON_TURN_START'
  | 'ON_FRIENDLY_MINION_DEATH'
  | 'ON_CLASS_RESOURCE_SPENT'
  | 'ON_MINION_SURVIVES_COMBAT'
  | 'ON_HEAL'
  | 'CONSTANT'

export interface PassiveAbility {
  id: string
  description: string
  trigger: PassiveTrigger
  effectKey: string
  effectParams?: Record<string, number | string>
}

export interface SpellEffect {
  effectKey: string
  params: Record<string, number | string>
  targetType?: SpellTargetType  // undefined/null = auto-target (AoE or face)
}

export interface CardDefinition {
  id: string
  name: string
  classTag: ClassTag
  cardType: CardType
  manaCost: number
  classResourceCost?: number
  flavorText: string
  spellEffect?: SpellEffect
  attack?: number
  health?: number
  hasWard?: boolean
  passive?: PassiveAbility
}

export interface CardInstance {
  instanceId: string
  definitionId: string
  currentAttack: number
  currentHealth: number
  maxHealth: number
  hasAttackedThisTurn: boolean
  isSummonSick: boolean
  isWard: boolean
}
