import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { nanoid } from 'nanoid'
import type { GameState, HeroClass, PlayerId } from '../src/types/index.js'
import {
  createInitialGameState,
  applyPlayCard,
  applyEndTurn,
  applyAttack,
  applySoulBind,
  applyHeroPower,
} from '../src/engine/gameLogic.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

// ─── Room state ───────────────────────────────────────────────────────────────

interface Room {
  code: string
  players: { socketId: string; playerId: PlayerId; heroClass: HeroClass; deckList?: string[] }[]
  state: GameState | null
}

const rooms = new Map<string, Room>()
const socketToRoom = new Map<string, string>() // socketId → roomCode

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function broadcast(room: Room) {
  if (!room.state) return
  for (const p of room.players) {
    // Send full state — client knows its own playerId to orient the board
    io.to(p.socketId).emit('game_update', { state: room.state })
  }
}

// ─── Socket handlers ───────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('list_rooms', () => {
    const waiting = [...rooms.values()]
      .filter(r => r.players.length === 1 && !r.state)
      .map(r => ({ code: r.code, heroClass: r.players[0].heroClass }))
    socket.emit('rooms_list', { rooms: waiting })
  })

  socket.on('create_room', ({ heroClass, deckList }: { heroClass: HeroClass; deckList?: string[] }) => {
    let code = generateCode()
    while (rooms.has(code)) code = generateCode()

    const room: Room = {
      code,
      players: [{ socketId: socket.id, playerId: 'PLAYER_1', heroClass, deckList }],
      state: null,
    }
    rooms.set(code, room)
    socketToRoom.set(socket.id, code)

    socket.join(code)
    socket.emit('room_created', { roomCode: code, myPlayerId: 'PLAYER_1' })
    console.log(`Room ${code} created by ${socket.id}`)
  })

  socket.on('join_room', ({ roomCode, heroClass, deckList }: { roomCode: string; heroClass: HeroClass; deckList?: string[] }) => {
    const room = rooms.get(roomCode.toUpperCase())
    if (!room) {
      socket.emit('error', { message: 'Room not found.' })
      return
    }
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full.' })
      return
    }

    room.players.push({ socketId: socket.id, playerId: 'PLAYER_2', heroClass, deckList })
    socketToRoom.set(socket.id, roomCode.toUpperCase())
    socket.join(roomCode.toUpperCase())

    // Start the game
    const p1 = room.players[0]
    const p2 = room.players[1]
    room.state = createInitialGameState(p1.heroClass, p2.heroClass, p1.deckList, p2.deckList)

    console.log(`Room ${roomCode} — game started: P1=${p1.heroClass} P2=${p2.heroClass}`)

    // Tell each player who they are, then broadcast state
    io.to(p1.socketId).emit('game_started', { myPlayerId: 'PLAYER_1' })
    io.to(p2.socketId).emit('game_started', { myPlayerId: 'PLAYER_2' })
    broadcast(room)
  })

  socket.on('play_card', ({ instanceId, targetMinionId }: { instanceId: string; targetMinionId?: string }) => {
    const room = getRoomForSocket(socket.id)
    if (!room?.state) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    room.state = applyPlayCard(room.state, player.playerId, instanceId, targetMinionId)
    broadcast(room)
  })

  socket.on('hero_power', () => {
    const room = getRoomForSocket(socket.id)
    if (!room?.state) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    room.state = applyHeroPower(room.state, player.playerId)
    broadcast(room)
  })

  socket.on('end_turn', () => {
    const room = getRoomForSocket(socket.id)
    if (!room?.state) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || room.state.activePlayerId !== player.playerId) return
    room.state = applyEndTurn(room.state)
    broadcast(room)
  })

  socket.on('attack', ({ attackerId, defenderId }: { attackerId: string; defenderId: string }) => {
    const room = getRoomForSocket(socket.id)
    if (!room?.state) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    room.state = applyAttack(room.state, player.playerId, attackerId, defenderId)
    broadcast(room)
  })

  socket.on('soul_bind', ({ accept }: { accept: boolean }) => {
    const room = getRoomForSocket(socket.id)
    if (!room?.state) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    if (room.state.soulBindPrompt?.playerId !== player.playerId) return
    room.state = applySoulBind(room.state, accept)
    broadcast(room)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    const code = socketToRoom.get(socket.id)
    if (code) {
      const room = rooms.get(code)
      if (room) {
        // Notify other player
        for (const p of room.players) {
          if (p.socketId !== socket.id) {
            io.to(p.socketId).emit('opponent_disconnected')
          }
        }
        rooms.delete(code)
      }
      socketToRoom.delete(socket.id)
    }
  })
})

function getRoomForSocket(socketId: string): Room | undefined {
  const code = socketToRoom.get(socketId)
  return code ? rooms.get(code) : undefined
}

const PORT = 3001
httpServer.listen(PORT, () => {
  console.log(`Realm's Edge server running on port ${PORT}`)
})
