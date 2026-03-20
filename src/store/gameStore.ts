import { create } from 'zustand'
import type { GameState, PlayerId, HeroClass } from '../types'
import type { SpellTargetType } from '../types/card'
import { socket } from '../socket'

type AppStatus = 'MENU' | 'LOBBY_WAITING' | 'IN_GAME' | 'GAME_OVER' | 'DISCONNECTED' | 'DECK_BUILDER'

export interface AvailableRoom { code: string; heroClass: HeroClass }

export interface TargetingState {
  cardInstanceId: string
  targetType: SpellTargetType
}

interface GameStore {
  appStatus: AppStatus
  roomCode: string | null
  myPlayerId: PlayerId | null
  errorMessage: string | null
  gameState: GameState | null
  selectedCardInstanceId: string | null
  selectedAttackerInstanceId: string | null
  targeting: TargetingState | null
  savedDecks: Partial<Record<HeroClass, string[]>>

  availableRooms: AvailableRoom[]
  listRooms: () => void
  createRoom: (heroClass: HeroClass) => void
  joinRoom: (roomCode: string, heroClass: HeroClass) => void
  selectCard: (instanceId: string | null) => void
  playCard: (instanceId: string) => void           // auto-target (AoE / face)
  enterTargeting: (cardInstanceId: string, targetType: SpellTargetType) => void
  playCardWithTarget: (targetMinionId: string) => void
  cancelTargeting: () => void
  endTurn: () => void
  selectAttacker: (instanceId: string | null) => void
  attackMinion: (attackerId: string, defenderId: string) => void
  attackHero: (attackerId: string) => void
  acceptSoulBind: () => void
  declineSoulBind: () => void
  useHeroPower: () => void
  reset: () => void
  openDeckBuilder: () => void
  saveDeck: (heroClass: HeroClass, cards: string[]) => void
}

export const useGameStore = create<GameStore>((set, get) => {
  socket.on('room_created', ({ roomCode, myPlayerId }: { roomCode: string; myPlayerId: PlayerId }) => {
    set({ appStatus: 'LOBBY_WAITING', roomCode, myPlayerId })
  })

  socket.on('game_started', ({ myPlayerId }: { myPlayerId: PlayerId }) => {
    set({ myPlayerId })
  })

  socket.on('game_update', ({ state }: { state: GameState }) => {
    set({
      gameState: state,
      appStatus: state.status === 'GAME_OVER' ? 'GAME_OVER' : 'IN_GAME',
      targeting: null,
      selectedCardInstanceId: null,
      selectedAttackerInstanceId: null,
    })
  })

  socket.on('rooms_list', ({ rooms }: { rooms: AvailableRoom[] }) => set({ availableRooms: rooms }))
  socket.on('opponent_disconnected', () => set({ appStatus: 'DISCONNECTED' }))
  socket.on('error', ({ message }: { message: string }) => set({ errorMessage: message }))

  return {
    appStatus: 'MENU',
    availableRooms: [],
    roomCode: null,
    myPlayerId: null,
    errorMessage: null,
    gameState: null,
    selectedCardInstanceId: null,
    selectedAttackerInstanceId: null,
    targeting: null,
    savedDecks: JSON.parse(localStorage.getItem('realms_edge_decks') ?? '{}'),

    listRooms: () => {
      socket.connect()
      socket.emit('list_rooms')
    },

    createRoom: (heroClass) => {
      const { savedDecks } = get()
      const deckList = savedDecks[heroClass]
      set({ errorMessage: null })
      socket.connect()
      socket.emit('create_room', { heroClass, deckList })
    },

    joinRoom: (roomCode, heroClass) => {
      const { savedDecks } = get()
      const deckList = savedDecks[heroClass]
      set({ errorMessage: null })
      socket.connect()
      socket.emit('join_room', { roomCode: roomCode.toUpperCase(), heroClass, deckList })
    },

    selectCard: (instanceId) => {
      set({ selectedCardInstanceId: instanceId, selectedAttackerInstanceId: null, targeting: null })
    },

    playCard: (instanceId) => {
      socket.emit('play_card', { instanceId })
      set({ selectedCardInstanceId: null, targeting: null })
    },

    enterTargeting: (cardInstanceId, targetType) => {
      set({ targeting: { cardInstanceId, targetType }, selectedCardInstanceId: cardInstanceId })
    },

    playCardWithTarget: (targetMinionId) => {
      const { targeting } = get()
      if (!targeting) return
      socket.emit('play_card', { instanceId: targeting.cardInstanceId, targetMinionId })
      set({ targeting: null, selectedCardInstanceId: null })
    },

    cancelTargeting: () => {
      set({ targeting: null, selectedCardInstanceId: null })
    },

    endTurn: () => {
      socket.emit('end_turn')
      set({ selectedCardInstanceId: null, selectedAttackerInstanceId: null, targeting: null })
    },

    selectAttacker: (instanceId) => {
      set({ selectedAttackerInstanceId: instanceId, selectedCardInstanceId: null, targeting: null })
    },

    attackMinion: (attackerId, defenderId) => {
      socket.emit('attack', { attackerId, defenderId })
      set({ selectedAttackerInstanceId: null })
    },

    attackHero: (attackerId) => {
      socket.emit('attack', { attackerId, defenderId: 'HERO' })
      set({ selectedAttackerInstanceId: null })
    },

    acceptSoulBind: () => socket.emit('soul_bind', { accept: true }),
    declineSoulBind: () => socket.emit('soul_bind', { accept: false }),
    useHeroPower: () => socket.emit('hero_power'),

    reset: () => {
      socket.disconnect()
      set({
        appStatus: 'MENU', roomCode: null, myPlayerId: null,
        errorMessage: null, gameState: null,
        selectedCardInstanceId: null, selectedAttackerInstanceId: null, targeting: null,
      })
    },

    openDeckBuilder: () => {
      set({ appStatus: 'DECK_BUILDER' })
    },

    saveDeck: (heroClass, cards) => {
      const { savedDecks } = get()
      const updated = { ...savedDecks, [heroClass]: cards }
      localStorage.setItem('realms_edge_decks', JSON.stringify(updated))
      set({ savedDecks: updated, appStatus: 'MENU' })
    },
  }
})
