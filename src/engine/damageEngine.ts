import type { CardInstance, PlayerState } from '../types'

export interface DamageResult {
  updatedBoard: CardInstance[]
  updatedHeroHealth: number
  deadMinions: CardInstance[]
}

// Spell damage overpenetrates: Ward minions absorb first, then others left→right, excess hits hero
export function resolveSpellDamage(
  damage: number,
  target: PlayerState,
  spellDamageReduction: number
): DamageResult {
  const reducedDamage = Math.max(0, damage - spellDamageReduction)
  const board = target.board.map(m => ({ ...m }))
  const deadMinions: CardInstance[] = []
  let remaining = reducedDamage

  // Ward minions absorb first
  const wards = board.filter(m => m.isWard)
  const nonWards = board.filter(m => !m.isWard)
  const ordered = [...wards, ...nonWards]

  for (const minion of ordered) {
    if (remaining <= 0) break
    const boardMinion = board.find(m => m.instanceId === minion.instanceId)!
    const absorbed = Math.min(remaining, boardMinion.currentHealth)
    boardMinion.currentHealth -= absorbed
    remaining -= absorbed
    if (boardMinion.currentHealth <= 0) {
      deadMinions.push({ ...boardMinion })
    }
  }

  const updatedBoard = board.filter(m => m.currentHealth > 0)
  const updatedHeroHealth = target.heroHealth - (remaining > 0 ? remaining : 0)

  return { updatedBoard, updatedHeroHealth, deadMinions }
}

export interface CombatResult {
  attacker: CardInstance
  defender: CardInstance
  attackerDied: boolean
  defenderDied: boolean
}

export function resolveCombat(
  attacker: CardInstance,
  defender: CardInstance,
  attackerBonusDamage: number
): CombatResult {
  const att = { ...attacker }
  const def = { ...defender }

  def.currentHealth -= att.currentAttack + attackerBonusDamage
  att.currentHealth -= def.currentAttack
  att.hasAttackedThisTurn = true

  return {
    attacker: att,
    defender: def,
    attackerDied: att.currentHealth <= 0,
    defenderDied: def.currentHealth <= 0,
  }
}
