import type {
  GameState, PlayerState, PlayerId, HeroClass,
  CardInstance, BoundPassive, SoulBindPrompt,
} from '../types/index.js'
import { getCard } from '../data/registry.js'
import { warlockDeck, paladinDeck } from '../data/decks.js'
import { buildDeck } from './deckEngine.js'
import { resolveSpellDamage, resolveCombat } from './damageEngine.js'
import { evaluatePassive, getConstantPassiveSummary } from './passiveEngine.js'

export const MAX_BOARD = 7
export const MAX_HAND = 10
export const STARTING_HEALTH = 30
export const STARTING_HAND = 4

// ─── Player factory ────────────────────────────────────────────────────────────

export function makePlayer(id: PlayerId, heroClass: HeroClass, customDeck?: string[]): PlayerState {
  const deckIds = customDeck ?? (heroClass === 'WARLOCK' ? warlockDeck : paladinDeck)
  const deck = buildDeck(deckIds)
  const hand = deck.slice(0, STARTING_HAND)
  const remaining = deck.slice(STARTING_HAND)
  return {
    id,
    heroClass,
    heroHealth: STARTING_HEALTH,
    manaPool: 0,
    manaCapacity: 0,
    classResource: 0,
    classResourceMax: heroClass === 'WARLOCK' ? 3 : 5,
    hand,
    deck: remaining,
    board: [],
    graveyard: [],
    boundPassives: [],
    cardsPlayedThisTurn: 0,
    heroPowerUsedThisTurn: false,
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function drawCard(player: PlayerState): PlayerState {
  if (player.deck.length === 0) return player
  if (player.hand.length >= MAX_HAND) {
    const [, ...rest] = player.deck
    return { ...player, deck: rest }
  }
  const [drawn, ...rest] = player.deck
  return { ...player, hand: [...player.hand, drawn], deck: rest }
}

export function clampClassResource(player: PlayerState): PlayerState {
  return { ...player, classResource: Math.min(player.classResource, player.classResourceMax) }
}

export function gainClassResource(player: PlayerState, amount: number): PlayerState {
  return clampClassResource({ ...player, classResource: player.classResource + amount })
}

export function opponentOf(id: PlayerId): PlayerId {
  return id === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1'
}

// ─── Initial state ─────────────────────────────────────────────────────────────

export function createInitialGameState(p1Class: HeroClass, p2Class: HeroClass, p1Deck?: string[], p2Deck?: string[]): GameState {
  const p1 = makePlayer('PLAYER_1', p1Class, p1Deck)
  const p2 = makePlayer('PLAYER_2', p2Class, p2Deck)
  return {
    status: 'IN_GAME',
    winner: null,
    turnNumber: 1,
    activePlayerId: 'PLAYER_1',
    phase: 'MAIN',
    players: {
      PLAYER_1: { ...p1, manaPool: 1, manaCapacity: 1 },
      PLAYER_2: p2,
    },
    selectedCardInstanceId: null,
    selectedAttackerInstanceId: null,
    soulBindPrompt: null,
    message: "Player 1's turn!",
  }
}

// ─── Action: End Turn ──────────────────────────────────────────────────────────

export function applyEndTurn(state: GameState): GameState {
  if (state.soulBindPrompt) return state
  const currentId = state.activePlayerId
  const nextId = opponentOf(currentId)
  const nextPlayer = state.players[nextId]

  const newCapacity = Math.min(nextPlayer.manaCapacity + 1, 10)
  let updated: PlayerState = {
    ...nextPlayer,
    manaPool: newCapacity,
    manaCapacity: newCapacity,
    cardsPlayedThisTurn: 0,
    board: nextPlayer.board.map(m => ({ ...m, hasAttackedThisTurn: false, isSummonSick: false })),
    heroPowerUsedThisTurn: false,
  }

  updated = drawCard(updated)

  const { owner: afterPassives, enemy: enemyAfterPassives } =
    applyTurnStartPassives(updated, state.players[currentId])
  updated = afterPassives
  let enemy = enemyAfterPassives

  if (enemy.heroHealth <= 0) {
    return {
      ...state,
      players: { ...state.players, [currentId]: enemy, [nextId]: updated },
      status: 'GAME_OVER',
      winner: currentId,
      message: `${currentId === 'PLAYER_1' ? 'Player 1' : 'Player 2'} wins!`,
    }
  }

  const newTurnNumber = nextId === 'PLAYER_1' ? state.turnNumber + 1 : state.turnNumber
  return {
    ...state,
    players: { ...state.players, [nextId]: updated, [currentId]: enemy },
    activePlayerId: nextId,
    turnNumber: newTurnNumber,
    selectedCardInstanceId: null,
    selectedAttackerInstanceId: null,
    phase: 'MAIN',
    message: `${nextId === 'PLAYER_1' ? 'Player 1' : 'Player 2'}'s turn!`,
  }
}

// ─── Action: Play Card ─────────────────────────────────────────────────────────

export function applyHeroPower(state: GameState, playerId: PlayerId): GameState {
  const player = state.players[playerId]
  if (player.heroPowerUsedThisTurn) return state
  if (player.manaPool < 2) return state

  let updated: PlayerState = { ...player, manaPool: player.manaPool - 2, heroPowerUsedThisTurn: true }

  if (player.heroClass === 'WARLOCK') {
    updated = { ...updated, heroHealth: Math.max(1, updated.heroHealth - 2) }
    updated = gainClassResource(updated, 1)
    updated = drawCard(updated)
    return { ...state, players: { ...state.players, [playerId]: updated }, message: 'Life Tap: Drew a card, gained 1 Shard.' }
  } else {
    updated = gainClassResource(updated, 1)
    return { ...state, players: { ...state.players, [playerId]: updated }, message: 'Inspire: Gained 1 Holy Power.' }
  }
}

export function applyPlayCard(state: GameState, playerId: PlayerId, instanceId: string, targetMinionId?: string): GameState {
  if (state.soulBindPrompt) return state
  if (state.activePlayerId !== playerId) return state

  const player = state.players[playerId]
  const cardInst = player.hand.find(c => c.instanceId === instanceId)
  if (!cardInst) return state

  const def = getCard(cardInst.definitionId)
  const enemyId = opponentOf(playerId)
  const constants = getConstantPassiveSummary(player)

  let manaCost = def.manaCost
  const classResourceCost = def.classResourceCost ?? 0

  if (def.cardType === 'SPELL') {
    manaCost = Math.max(0, manaCost - constants.spellCostReduction)
    if (player.cardsPlayedThisTurn === 0) {
      manaCost = Math.max(0, manaCost - constants.firstCardCostReduction)
    }
  }

  if (player.manaPool < manaCost) return state
  if (player.classResource < classResourceCost) return state

  let updatedPlayer: PlayerState = {
    ...player,
    manaPool: player.manaPool - manaCost,
    classResource: player.classResource - classResourceCost,
    hand: player.hand.filter(c => c.instanceId !== instanceId),
    cardsPlayedThisTurn: player.cardsPlayedThisTurn + 1,
  }
  let updatedEnemy = state.players[enemyId]

  if (def.cardType === 'MINION') {
    if (updatedPlayer.board.length >= MAX_BOARD) return state
    const boardMinion: CardInstance = { ...cardInst, isSummonSick: true, hasAttackedThisTurn: false }
    updatedPlayer = { ...updatedPlayer, board: [...updatedPlayer.board, boardMinion] }

    if (def.passive?.effectKey === 'DEAL_FACE_DAMAGE_ON_PLAY') {
      const amount = Number(def.passive.effectParams?.amount ?? 0)
      updatedEnemy = { ...updatedEnemy, heroHealth: updatedEnemy.heroHealth - amount }
    }

    if (def.passive?.effectKey === 'DEAL_SELF_DAMAGE_ON_PLAY') {
      const amount = Number(def.passive.effectParams?.amount ?? 0)
      updatedPlayer = { ...updatedPlayer, heroHealth: Math.max(1, updatedPlayer.heroHealth - amount) }
    }

    const onPlay = processOnCardPlayedPassives(updatedPlayer, updatedEnemy)
    updatedPlayer = onPlay.owner
    updatedEnemy = onPlay.enemy

  } else if (def.cardType === 'SPELL') {
    const spellResult = processSpell(def.spellEffect?.effectKey ?? '', def.spellEffect?.params ?? {}, updatedPlayer, updatedEnemy, targetMinionId)
    updatedPlayer = spellResult.caster
    updatedEnemy = spellResult.target

    // Handle heal for ON_HEAL passives
    if (def.spellEffect?.effectKey === 'HEAL_HERO' || def.spellEffect?.effectKey === 'HEAL_HERO_DRAW') {
      const onHealResult = processOnHealPassives(updatedPlayer, updatedEnemy)
      updatedPlayer = onHealResult.owner
    }

    // Dead minions from spell
    const deadFromSpell = updatedEnemy.board.filter(m => m.currentHealth <= 0)
    updatedEnemy = { ...updatedEnemy, board: updatedEnemy.board.filter(m => m.currentHealth > 0) }
    const friendlyDeadFromSpell = updatedPlayer.board.filter(m => m.currentHealth <= 0)
    updatedPlayer = { ...updatedPlayer, board: updatedPlayer.board.filter(m => m.currentHealth > 0) }

    // Trigger death passives
    const allDead = [...deadFromSpell, ...friendlyDeadFromSpell]
    if (allDead.length > 0) {
      const deathResult = processOnAnyMinionDeathPassives(allDead, updatedPlayer, updatedEnemy)
      updatedPlayer = deathResult.owner
      updatedEnemy = deathResult.enemy
    }

    // ON_CARD_PLAYED
    const onPlay = processOnCardPlayedPassives(updatedPlayer, updatedEnemy)
    updatedPlayer = onPlay.owner
    updatedEnemy = onPlay.enemy
  }

  // Class resource spent passives
  if (classResourceCost > 0) {
    const spentResult = processOnClassResourceSpentPassives(updatedPlayer, updatedEnemy)
    updatedPlayer = spentResult.owner
    updatedEnemy = spentResult.enemy
  }

  // Check win
  if (updatedEnemy.heroHealth <= 0) {
    return {
      ...state,
      players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
      status: 'GAME_OVER',
      winner: playerId,
      message: `${playerId === 'PLAYER_1' ? 'Player 1' : 'Player 2'} wins!`,
      selectedCardInstanceId: null,
    }
  }

  return {
    ...state,
    players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
    selectedCardInstanceId: null,
    message: `${def.name} played.`,
  }
}

// ─── Action: Attack ────────────────────────────────────────────────────────────

export function applyAttack(
  state: GameState,
  playerId: PlayerId,
  attackerId: string,
  defenderId: string,
): GameState {
  if (state.activePlayerId !== playerId) return state

  const enemyId = opponentOf(playerId)
  const player = state.players[playerId]
  const enemy = state.players[enemyId]

  const attacker = player.board.find(m => m.instanceId === attackerId)
  if (!attacker) return state
  if (attacker.hasAttackedThisTurn || attacker.isSummonSick) return state

  // ── Face attack ────────────────────────────────────────────────────────────
  if (defenderId === 'HERO') {
    const wardMinions = enemy.board.filter(m => m.isWard)
    if (wardMinions.length > 0) return state  // must kill wards first

    const updatedAttacker = { ...attacker, hasAttackedThisTurn: true }
    let updatedPlayer: PlayerState = {
      ...player,
      board: player.board.map(m => m.instanceId === attackerId ? updatedAttacker : m),
    }
    let updatedEnemy = { ...enemy, heroHealth: enemy.heroHealth - attacker.currentAttack }

    // Survives-combat passives (attacker doesn't take damage from hero)
    const attackerDef = getCard(attacker.definitionId)
    if (attackerDef.passive?.trigger === 'ON_MINION_SURVIVES_COMBAT') {
      updatedPlayer = gainClassResource(updatedPlayer, Number(attackerDef.passive.effectParams?.amount ?? 1))
    }
    for (const bp of updatedPlayer.boundPassives) {
      if (bp.passive.trigger === 'ON_MINION_SURVIVES_COMBAT') {
        updatedPlayer = gainClassResource(updatedPlayer, Number(bp.passive.effectParams?.amount ?? 1))
      }
    }

    if (updatedEnemy.heroHealth <= 0) {
      return {
        ...state,
        players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
        status: 'GAME_OVER',
        winner: playerId,
        message: `${playerId === 'PLAYER_1' ? 'Player 1' : 'Player 2'} wins!`,
        selectedAttackerInstanceId: null,
      }
    }

    return {
      ...state,
      players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
      selectedAttackerInstanceId: null,
      message: `${attackerDef.name} struck the enemy hero for ${attacker.currentAttack}!`,
    }
  }

  // ── Minion vs minion ───────────────────────────────────────────────────────
  const defender = enemy.board.find(m => m.instanceId === defenderId)
  if (!defender) return state

  const wardMinions = enemy.board.filter(m => m.isWard)
  if (wardMinions.length > 0 && !defender.isWard) return state

  const constants = getConstantPassiveSummary(player)
  const result = resolveCombat(attacker, defender, constants.minionBonusDamage)

  let updatedPlayer: PlayerState = {
    ...player,
    board: player.board.map(m => m.instanceId === attackerId ? result.attacker : m),
  }
  let updatedEnemy: PlayerState = {
    ...enemy,
    board: enemy.board.map(m => m.instanceId === defenderId ? result.defender : m),
  }

  // Collect dead
  const playerDead = result.attackerDied ? [result.attacker] : []
  const enemyDead = result.defenderDied ? [result.defender] : []
  updatedPlayer = { ...updatedPlayer, board: updatedPlayer.board.filter(m => m.currentHealth > 0) }
  updatedEnemy = { ...updatedEnemy, board: updatedEnemy.board.filter(m => m.currentHealth > 0) }

  // Survives combat passive
  if (!result.attackerDied) {
    const attackerDef = getCard(attacker.definitionId)
    if (attackerDef.passive?.trigger === 'ON_MINION_SURVIVES_COMBAT') {
      const r = evaluatePassive(attackerDef.passive, 'ON_MINION_SURVIVES_COMBAT')
      if (r?.classResourceGain) updatedPlayer = gainClassResource(updatedPlayer, r.classResourceGain)
      if (r?.heroHeal) updatedPlayer = { ...updatedPlayer, heroHealth: Math.min(updatedPlayer.heroHealth + r.heroHeal, STARTING_HEALTH) }
    }
    for (const bp of updatedPlayer.boundPassives) {
      const r = evaluatePassive(bp.passive, 'ON_MINION_SURVIVES_COMBAT')
      if (r?.classResourceGain) updatedPlayer = gainClassResource(updatedPlayer, r.classResourceGain ?? 0)
      if (r?.heroHeal) updatedPlayer = { ...updatedPlayer, heroHealth: Math.min(updatedPlayer.heroHealth + r.heroHeal, STARTING_HEALTH) }
    }
  }

  // Death passives
  const allDead = [...playerDead, ...enemyDead]
  if (allDead.length > 0) {
    const anyDeathResult = processOnAnyMinionDeathPassives(allDead, updatedPlayer, updatedEnemy)
    updatedPlayer = anyDeathResult.owner
    updatedEnemy = anyDeathResult.enemy
  }

  if (playerDead.length > 0) {
    const fdResult = processOnFriendlyMinionDeathPassives(playerDead, updatedPlayer, updatedEnemy)
    updatedPlayer = fdResult.owner
  }
  if (enemyDead.length > 0) {
    const fdResult = processOnFriendlyMinionDeathPassives(enemyDead, updatedEnemy, updatedPlayer)
    updatedEnemy = fdResult.owner
  }

  // Soul bind prompt for player's dead minion
  if (playerDead.length > 0) {
    const dying = playerDead[0]
    const dyingDef = getCard(dying.definitionId)
    if (dyingDef.passive && player.classResource >= 1) {
      const prompt: SoulBindPrompt = { playerId, dyingMinion: dying }
      return {
        ...state,
        players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
        soulBindPrompt: prompt,
        selectedAttackerInstanceId: null,
        message: `${dyingDef.name} is dying — Bind its soul?`,
      }
    }
  }

  const attackerName = getCard(attacker.definitionId).name
  const defenderName = getCard(defender.definitionId).name

  return {
    ...state,
    players: { ...state.players, [playerId]: updatedPlayer, [enemyId]: updatedEnemy },
    selectedAttackerInstanceId: null,
    message: `${attackerName} attacked ${defenderName}.`,
  }
}

// ─── Action: Soul Bind ─────────────────────────────────────────────────────────

export function applySoulBind(state: GameState, accept: boolean): GameState {
  const prompt = state.soulBindPrompt
  if (!prompt) return state

  const player = state.players[prompt.playerId]
  const def = getCard(prompt.dyingMinion.definitionId)

  if (accept) {
    if (!def.passive || player.classResource < 1) return state
    const bound: BoundPassive = {
      sourceCardId: prompt.dyingMinion.definitionId,
      sourceName: def.name,
      passive: def.passive,
      boundOnTurn: state.turnNumber,
    }
    const updated: PlayerState = {
      ...player,
      classResource: player.classResource - 1,
      boundPassives: [...player.boundPassives, bound],
      graveyard: [...player.graveyard, prompt.dyingMinion],
    }
    return {
      ...state,
      players: { ...state.players, [prompt.playerId]: updated },
      soulBindPrompt: null,
      message: `Soul of ${def.name} bound permanently!`,
    }
  } else {
    const updated: PlayerState = {
      ...player,
      graveyard: [...player.graveyard, prompt.dyingMinion],
    }
    return {
      ...state,
      players: { ...state.players, [prompt.playerId]: updated },
      soulBindPrompt: null,
      message: '',
    }
  }
}

// ─── Passive processors ────────────────────────────────────────────────────────

export function processSpell(
  effectKey: string,
  params: Record<string, number | string>,
  caster: PlayerState,
  target: PlayerState,
  targetMinionId?: string,
): { caster: PlayerState; target: PlayerState } {
  const constants = getConstantPassiveSummary(target)

  switch (effectKey) {
    case 'DEAL_FACE_DAMAGE': {
      const result = resolveSpellDamage(Number(params.amount ?? 0), target, constants.spellDamageReduction)
      return { caster, target: { ...target, board: result.updatedBoard, heroHealth: result.updatedHeroHealth } }
    }
    case 'HEAL_HERO': {
      const healed = Math.min(caster.heroHealth + Number(params.amount ?? 0), STARTING_HEALTH)
      return { caster: { ...caster, heroHealth: healed }, target }
    }
    case 'HEAL_HERO_DRAW': {
      const healed = Math.min(caster.heroHealth + Number(params.amount ?? 0), STARTING_HEALTH)
      let updated = { ...caster, heroHealth: healed }
      const draws = Number(params.draw ?? 0)
      for (let i = 0; i < draws; i++) updated = drawCard(updated)
      return { caster: updated, target }
    }
    case 'DEAL_DAMAGE_ALL_MINIONS': {
      const amount = Number(params.amount ?? 0)
      return {
        caster: { ...caster, board: caster.board.map(m => ({ ...m, currentHealth: m.currentHealth - amount })) },
        target: { ...target, board: target.board.map(m => ({ ...m, currentHealth: m.currentHealth - amount })) },
      }
    }
    case 'DEAL_DAMAGE_ALL_ENEMY_MINIONS': {
      const amount = Number(params.amount ?? 0)
      return { caster, target: { ...target, board: target.board.map(m => ({ ...m, currentHealth: m.currentHealth - amount })) } }
    }
    case 'DEAL_DAMAGE_ALL': {
      const amount = Number(params.amount ?? 0)
      return {
        caster: { ...caster, heroHealth: caster.heroHealth - amount, board: caster.board.map(m => ({ ...m, currentHealth: m.currentHealth - amount })) },
        target: { ...target, heroHealth: target.heroHealth - amount, board: target.board.map(m => ({ ...m, currentHealth: m.currentHealth - amount })) },
      }
    }
    case 'CURSE_MINION': {
      if (target.board.length === 0) return { caster, target }
      const victimId = targetMinionId ?? target.board[Math.floor(Math.random() * target.board.length)].instanceId
      return { caster, target: { ...target, board: target.board.map(m => m.instanceId === victimId ? { ...m, currentHealth: m.currentHealth - 3 } : m) } }
    }
    case 'DESTROY_DAMAGED_MINION_HEAL': {
      const damaged = target.board.filter(m => m.currentHealth < m.maxHealth)
      if (damaged.length === 0) return { caster, target }
      const victimId = targetMinionId ?? damaged[Math.floor(Math.random() * damaged.length)].instanceId
      const healed = Math.min(caster.heroHealth + Number(params.healAmount ?? 4), STARTING_HEALTH)
      return { caster: { ...caster, heroHealth: healed }, target: { ...target, board: target.board.filter(m => m.instanceId !== victimId) } }
    }
    case 'SACRIFICE_FRIENDLY_MINION_HEAL': {
      if (caster.board.length === 0) return { caster, target }
      const sacrifice = targetMinionId
        ? caster.board.find(m => m.instanceId === targetMinionId) ?? caster.board[0]
        : caster.board[0]
      const healed = Math.min(caster.heroHealth + Number(params.healAmount ?? 8), STARTING_HEALTH)
      return {
        caster: { ...caster, heroHealth: healed, board: caster.board.filter(m => m.instanceId !== sacrifice.instanceId), graveyard: [...caster.graveyard, sacrifice] },
        target,
      }
    }
    case 'GRANT_WARD_AND_BUFF': {
      if (caster.board.length === 0) return { caster, target }
      const buffTarget = targetMinionId
        ? caster.board.find(m => m.instanceId === targetMinionId) ?? caster.board[0]
        : caster.board[0]
      const healthBuff = Number(params.health ?? 3)
      return {
        caster: { ...caster, board: caster.board.map(m => m.instanceId === buffTarget.instanceId ? { ...m, isWard: true, currentHealth: m.currentHealth + healthBuff, maxHealth: m.maxHealth + healthBuff } : m) },
        target,
      }
    }
    case 'DEAL_MINION_DAMAGE': {
      if (!targetMinionId) return { caster, target }
      const amount = Number(params.amount ?? 0)
      return {
        caster,
        target: {
          ...target,
          board: target.board.map(m =>
            m.instanceId === targetMinionId ? { ...m, currentHealth: m.currentHealth - amount } : m
          ),
        },
      }
    }
    case 'BUFF_MINION_ATTACK': {
      if (!targetMinionId) return { caster, target }
      const amount = Number(params.amount ?? 0)
      return {
        caster: {
          ...caster,
          board: caster.board.map(m =>
            m.instanceId === targetMinionId ? { ...m, currentAttack: m.currentAttack + amount } : m
          ),
        },
        target,
      }
    }
    case 'DRAW_SELF_DAMAGE': {
      const drawCount = Number(params.draw ?? 0)
      const selfDmg = Number(params.selfDamage ?? 0)
      let updated = { ...caster, heroHealth: Math.max(1, caster.heroHealth - selfDmg) }
      for (let i = 0; i < drawCount; i++) updated = drawCard(updated)
      return { caster: updated, target }
    }
    case 'DRAW_CARDS': {
      const count = Number(params.draw ?? 1)
      let updated = { ...caster }
      for (let i = 0; i < count; i++) updated = drawCard(updated)
      return { caster: updated, target }
    }
    case 'DEAL_DAMAGE_ALL_ENEMIES': {
      const amount = Number(params.amount ?? 0)
      const reduced = Math.max(0, amount - constants.spellDamageReduction)
      return {
        caster,
        target: {
          ...target,
          board: target.board.map(m => ({ ...m, currentHealth: m.currentHealth - reduced })),
          heroHealth: target.heroHealth - reduced,
        },
      }
    }
    case 'BUFF_MINION_STATS': {
      if (!targetMinionId) return { caster, target }
      const atk = Number(params.attack ?? 0)
      const hp = Number(params.health ?? 0)
      return {
        caster: {
          ...caster,
          board: caster.board.map(m =>
            m.instanceId === targetMinionId
              ? { ...m, currentAttack: m.currentAttack + atk, currentHealth: m.currentHealth + hp, maxHealth: m.maxHealth + hp }
              : m
          ),
        },
        target,
      }
    }
    case 'DESTROY_MINION': {
      if (!targetMinionId) return { caster, target }
      return {
        caster,
        target: {
          ...target,
          board: target.board.map(m =>
            m.instanceId === targetMinionId ? { ...m, currentHealth: 0 } : m
          ),
        },
      }
    }
    case 'GAIN_CLASS_RESOURCES': {
      return { caster: gainClassResource(caster, Number(params.amount ?? 0)), target }
    }
    default:
      return { caster, target }
  }
}

export function processOnCardPlayedPassives(owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  let updatedEnemy = { ...enemy }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_CARD_PLAYED')
    if (result?.heroDamage) updatedEnemy = { ...updatedEnemy, heroHealth: updatedEnemy.heroHealth - result.heroDamage }
  }
  for (const bp of owner.boundPassives) {
    const result = evaluatePassive(bp.passive, 'ON_CARD_PLAYED')
    if (result?.heroDamage) updatedEnemy = { ...updatedEnemy, heroHealth: updatedEnemy.heroHealth - result.heroDamage }
  }
  return { owner, enemy: updatedEnemy }
}

export function processOnAnyMinionDeathPassives(deadMinions: CardInstance[], owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  if (deadMinions.length === 0) return { owner, enemy }
  let o = { ...owner }
  let e = { ...enemy }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_ANY_MINION_DEATH')
    if (result?.heroDamage) e = { ...e, heroHealth: e.heroHealth - result.heroDamage }
  }
  for (const minion of enemy.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_ANY_MINION_DEATH')
    if (result?.heroDamage) o = { ...o, heroHealth: o.heroHealth - result.heroDamage }
  }
  return { owner: o, enemy: e }
}

export function processOnFriendlyMinionDeathPassives(deadMinions: CardInstance[], owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  if (deadMinions.length === 0) return { owner, enemy }
  let o = { ...owner }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_FRIENDLY_MINION_DEATH')
    if (result?.classResourceGain) o = gainClassResource(o, result.classResourceGain)
    if (result?.heroHeal) o = { ...o, heroHealth: Math.min(o.heroHealth + result.heroHeal, STARTING_HEALTH) }
  }
  for (const bp of owner.boundPassives) {
    const result = evaluatePassive(bp.passive, 'ON_FRIENDLY_MINION_DEATH')
    if (result?.classResourceGain) o = gainClassResource(o, result.classResourceGain)
    if (result?.heroHeal) o = { ...o, heroHealth: Math.min(o.heroHealth + result.heroHeal, STARTING_HEALTH) }
  }
  return { owner: o, enemy }
}

export function processOnClassResourceSpentPassives(owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  let o = { ...owner }
  let e = { ...enemy }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_CLASS_RESOURCE_SPENT')
    if (result?.summonMinion && o.board.length < MAX_BOARD) o = { ...o, board: [...o.board, result.summonMinion] }
    if (result?.heroDamage) e = { ...e, heroHealth: e.heroHealth - result.heroDamage }
  }
  for (const bp of owner.boundPassives) {
    const result = evaluatePassive(bp.passive, 'ON_CLASS_RESOURCE_SPENT')
    if (result?.summonMinion && o.board.length < MAX_BOARD) o = { ...o, board: [...o.board, result.summonMinion] }
    if (result?.heroDamage) e = { ...e, heroHealth: e.heroHealth - result.heroDamage }
  }
  return { owner: o, enemy: e }
}

export function processOnHealPassives(owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  let o = { ...owner }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (!def.passive) continue
    const result = evaluatePassive(def.passive, 'ON_HEAL')
    if (result?.classResourceGain) o = gainClassResource(o, result.classResourceGain)
  }
  for (const bp of owner.boundPassives) {
    const result = evaluatePassive(bp.passive, 'ON_HEAL')
    if (result?.classResourceGain) o = gainClassResource(o, result.classResourceGain)
  }
  return { owner: o, enemy }
}

export function applyTurnStartPassives(owner: PlayerState, enemy: PlayerState): { owner: PlayerState; enemy: PlayerState } {
  let o = { ...owner }
  let e = { ...enemy }
  const process = (passive: ReturnType<typeof evaluatePassive>) => {
    if (!passive) return
    if (passive.classResourceGain) o = gainClassResource(o, passive.classResourceGain)
    if (passive.heroHeal) o = { ...o, heroHealth: Math.min(o.heroHealth + passive.heroHeal, STARTING_HEALTH) }
    if (passive.heroDamage) e = { ...e, heroHealth: e.heroHealth - passive.heroDamage }
    if (passive.drawCard) o = drawCard(o)
  }
  for (const minion of owner.board) {
    const def = getCard(minion.definitionId)
    if (def.passive) process(evaluatePassive(def.passive, 'ON_TURN_START'))
  }
  for (const bp of owner.boundPassives) {
    process(evaluatePassive(bp.passive, 'ON_TURN_START'))
  }
  return { owner: o, enemy: e }
}
