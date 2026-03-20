import type { CardInstance, PassiveAbility } from './card'

export type PlayerId = 'PLAYER_1' | 'PLAYER_2'
export type HeroClass = 'WARLOCK' | 'PALADIN'
export type GameStatus = 'MENU' | 'CLASS_SELECT' | 'IN_GAME' | 'GAME_OVER'
export type TurnPhase = 'MAIN' | 'ATTACKING'

export interface BoundPassive {
  sourceCardId: string
  sourceName: string
  passive: PassiveAbility
  boundOnTurn: number
}

export interface SoulBindPrompt {
  playerId: PlayerId
  dyingMinion: CardInstance
}

export interface PlayerState {
  id: PlayerId
  heroClass: HeroClass
  heroHealth: number
  manaPool: number
  manaCapacity: number
  classResource: number
  classResourceMax: number
  hand: CardInstance[]
  deck: CardInstance[]
  board: CardInstance[]
  graveyard: CardInstance[]
  boundPassives: BoundPassive[]
  cardsPlayedThisTurn: number
  heroPowerUsedThisTurn: boolean
}

export interface GameState {
  status: GameStatus
  winner: PlayerId | null
  turnNumber: number
  activePlayerId: PlayerId
  phase: TurnPhase
  players: Record<PlayerId, PlayerState>
  selectedCardInstanceId: string | null
  selectedAttackerInstanceId: string | null
  soulBindPrompt: SoulBindPrompt | null
  message: string
}
