import { nanoid } from 'nanoid'
import type { PassiveAbility, PlayerState, CardInstance } from '../types'
import { getCard } from '../data/registry'
import { warlockDeck, paladinDeck } from '../data/decks'

// Returns state mutations for a passive effect
export interface PassiveEffectResult {
  heroDamage?: number          // damage to enemy hero
  heroHeal?: number            // heal own hero
  classResourceGain?: number   // gain class resource for owner
  drawCard?: boolean           // draw extra card
  summonMinion?: CardInstance  // summon a minion
  spellCostReduction?: number  // reduce next spell cost (CONSTANT passives)
  minionBonusDamage?: number   // bonus damage to minion attacks
  spellDamageReduction?: number // reduce incoming spell damage
}

export function evaluatePassive(
  passive: PassiveAbility,
  trigger: string,
): PassiveEffectResult | null {
  if (passive.trigger !== trigger) return null

  const params = passive.effectParams ?? {}

  switch (passive.effectKey) {
    case 'DEAL_1_FACE_DAMAGE':
      return { heroDamage: Number(params.amount ?? 1) }

    case 'GAIN_1_CLASS_RESOURCE':
    case 'GAIN_CLASS_RESOURCE': {
      // selfOnly means only trigger for the minion that died (handled by caller)
      return { classResourceGain: Number(params.amount ?? 1) }
    }

    case 'RESTORE_1_HERO_HEALTH':
      return { heroHeal: Number(params.amount ?? 1) }

    case 'DRAW_EXTRA_CARD':
      return { drawCard: true }

    case 'SUMMON_SKELETON': {
      const skeleton: CardInstance = {
        instanceId: nanoid(),
        definitionId: 'skeleton_token',
        currentAttack: 1,
        currentHealth: 1,
        maxHealth: 1,
        hasAttackedThisTurn: false,
        isSummonSick: true,
        isWard: false,
      }
      return { summonMinion: skeleton }
    }

    case 'DEAL_FACE_DAMAGE_ON_PLAY':
      return { heroDamage: Number(params.amount ?? 0) }

    case 'ADD_RANDOM_CLASS_SPELL': {
      // Handled specially by store — just signal it
      return {}
    }

    case 'SUMMON_IMP_TOKEN': {
      const imp: CardInstance = {
        instanceId: nanoid(),
        definitionId: 'imp_token',
        currentAttack: 1,
        currentHealth: 1,
        maxHealth: 1,
        hasAttackedThisTurn: false,
        isSummonSick: true,
        isWard: false,
      }
      return { summonMinion: imp }
    }

    default:
      return null
  }
}

// Read CONSTANT passives from a player's board + bound passives
export function getConstantPassiveSummary(player: PlayerState): {
  spellDamageReduction: number
  minionBonusDamage: number
  spellCostReduction: number
  firstCardCostReduction: number
} {
  const allPassives = [
    ...player.board
      .map(m => getCard(m.definitionId).passive)
      .filter((p): p is NonNullable<typeof p> => p !== undefined && p.trigger === 'CONSTANT'),
    ...player.boundPassives
      .map(bp => bp.passive)
      .filter(p => p.trigger === 'CONSTANT'),
  ]

  let spellDamageReduction = 0
  let minionBonusDamage = 0
  let spellCostReduction = 0
  let firstCardCostReduction = 0

  for (const p of allPassives) {
    const amount = Number(p.effectParams?.amount ?? 0)
    if (p.effectKey === 'REDUCE_SPELL_DAMAGE_TAKEN') spellDamageReduction += amount
    if (p.effectKey === 'MINIONS_DEAL_BONUS_DAMAGE') minionBonusDamage += amount
    if (p.effectKey === 'SPELLS_COST_LESS') spellCostReduction += amount
    if (p.effectKey === 'FIRST_CARD_COSTS_LESS') firstCardCostReduction += amount
  }

  return { spellDamageReduction, minionBonusDamage, spellCostReduction, firstCardCostReduction }
}

export function getRandomClassSpell(heroClass: 'WARLOCK' | 'PALADIN'): string {
  const deck = heroClass === 'WARLOCK' ? warlockDeck : paladinDeck
  const spellIds = deck.filter(id => {
    try {
      const card = getCard(id)
      return card.cardType === 'SPELL'
    } catch {
      return false
    }
  })
  return spellIds[Math.floor(Math.random() * spellIds.length)] ?? 'holy_light'
}
