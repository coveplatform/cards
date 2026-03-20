import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { HeroClass } from '../../types'

const classes: { id: HeroClass; name: string; description: string; icon: string }[] = [
  { id: 'WARLOCK', name: 'Warlock', description: 'Soul Shards, demons, and dark fire.', icon: '💀' },
  { id: 'PALADIN', name: 'Paladin', description: 'Holy Power, shields, and righteous strikes.', icon: '⚔️' },
]

export function Lobby() {
  const appStatus = useGameStore(s => s.appStatus)
  const roomCode = useGameStore(s => s.roomCode)
  const errorMessage = useGameStore(s => s.errorMessage)
  const createRoom = useGameStore(s => s.createRoom)
  const joinRoom = useGameStore(s => s.joinRoom)
  const reset = useGameStore(s => s.reset)

  const availableRooms = useGameStore(s => s.availableRooms)
  const listRooms = useGameStore(s => s.listRooms)

  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null)
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick')

  useEffect(() => {
    if (mode === 'join') {
      listRooms()
      const interval = setInterval(listRooms, 3000)
      return () => clearInterval(interval)
    }
  }, [mode])

  // Waiting for opponent after creating room
  if (appStatus === 'LOBBY_WAITING' && roomCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 gap-8">
        <div className="text-center">
          <h2 className="text-stone-400 text-lg mb-4 tracking-widest uppercase">Waiting for opponent</h2>
          <div className="bg-stone-900 border border-amber-800 rounded-xl px-12 py-8">
            <div className="text-stone-500 text-sm mb-2 uppercase tracking-widest">Room Code</div>
            <div className="text-amber-400 text-6xl font-bold tracking-widest" style={{ textShadow: '0 0 30px rgba(251,191,36,0.5)' }}>
              {roomCode}
            </div>
            <div className="text-stone-500 text-sm mt-3">Share this code with your opponent</div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-stone-600">
            <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span className="text-sm">Waiting...</span>
          </div>
        </div>
        <button onClick={reset} className="text-stone-600 hover:text-stone-400 text-sm cursor-pointer transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  // Class selection → create
  if (mode === 'create') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 p-8 gap-8">
        <h2 className="text-stone-300 text-2xl font-bold tracking-wider">Choose Your Class</h2>

        <div className="flex gap-6">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`
                w-48 h-56 rounded-xl border-2 transition-all duration-200 cursor-pointer p-5 text-left
                bg-gradient-to-b ${cls.id === 'WARLOCK' ? 'from-purple-900 to-violet-950' : 'from-yellow-800 to-amber-950'}
                ${selectedClass === cls.id ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-stone-700 hover:border-stone-500'}
              `}
            >
              <div className="text-4xl mb-3">{cls.icon}</div>
              <div className="text-stone-100 font-bold text-lg">{cls.name}</div>
              <div className="text-stone-400 text-xs mt-2">{cls.description}</div>
              {selectedClass === cls.id && <div className="text-amber-400 mt-3 text-sm font-bold">Selected ✓</div>}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => { setMode('pick'); setSelectedClass(null) }}
            className="px-6 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold cursor-pointer transition-colors"
          >
            Back
          </button>
          <button
            disabled={!selectedClass}
            onClick={() => { if (selectedClass) createRoom(selectedClass) }}
            className={`
              px-8 py-2 rounded-lg font-bold transition-all cursor-pointer
              ${selectedClass ? 'bg-amber-700 hover:bg-amber-600 text-stone-950' : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
            `}
          >
            Create Room
          </button>
        </div>
      </div>
    )
  }

  // Join — pick class then pick a room
  if (mode === 'join') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 p-8 gap-8">
        <h2 className="text-stone-300 text-2xl font-bold tracking-wider">Join a Game</h2>

        {/* Class pick */}
        <div className="flex gap-6">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`
                w-40 h-48 rounded-xl border-2 transition-all duration-200 cursor-pointer p-4 text-left
                bg-gradient-to-b ${cls.id === 'WARLOCK' ? 'from-purple-900 to-violet-950' : 'from-yellow-800 to-amber-950'}
                ${selectedClass === cls.id ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-stone-700 hover:border-stone-500'}
              `}
            >
              <div className="text-3xl mb-2">{cls.icon}</div>
              <div className="text-stone-100 font-bold">{cls.name}</div>
              <div className="text-stone-400 text-xs mt-1">{cls.description}</div>
              {selectedClass === cls.id && <div className="text-amber-400 mt-2 text-xs font-bold">Selected ✓</div>}
            </button>
          ))}
        </div>

        {/* Available rooms */}
        <div className="w-full max-w-sm">
          <div className="text-stone-500 text-xs uppercase tracking-widest mb-3 text-center">Available Games</div>
          {availableRooms.length === 0 ? (
            <div className="text-center text-stone-600 text-sm py-6 border border-stone-800 rounded-xl">
              No games waiting... <span className="animate-pulse">checking</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableRooms.map(room => {
                const cls = classes.find(c => c.id === room.heroClass)
                return (
                  <button
                    key={room.code}
                    disabled={!selectedClass}
                    onClick={() => { if (selectedClass) joinRoom(room.code, selectedClass) }}
                    className={`
                      flex items-center justify-between px-5 py-3 rounded-xl border transition-all
                      ${selectedClass
                        ? 'border-stone-700 hover:border-amber-700 bg-stone-900 hover:bg-stone-800 cursor-pointer'
                        : 'border-stone-800 bg-stone-900/50 cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    <span className="text-stone-300 font-bold">{cls?.icon} {cls?.name}</span>
                    <span className="text-amber-500 font-mono text-sm">{room.code}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
            {errorMessage}
          </div>
        )}

        <button
          onClick={() => { setMode('pick'); setSelectedClass(null) }}
          className="text-stone-600 hover:text-stone-400 text-sm cursor-pointer transition-colors"
        >
          Back
        </button>
      </div>
    )
  }

  // Initial pick screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 p-8">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold tracking-widest text-amber-400 mb-2" style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
          REALM'S EDGE
        </h1>
        <p className="text-stone-500 text-sm tracking-widest uppercase">1v1 Online</p>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => setMode('create')}
          className="w-52 h-40 rounded-xl border-2 border-stone-700 hover:border-amber-700 bg-stone-900 hover:bg-stone-800 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="text-4xl">🏰</div>
          <div className="text-stone-100 font-bold text-lg">Create Game</div>
          <div className="text-stone-500 text-xs">Get a room code to share</div>
        </button>

        <button
          onClick={() => setMode('join')}
          className="w-52 h-40 rounded-xl border-2 border-stone-700 hover:border-amber-700 bg-stone-900 hover:bg-stone-800 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="text-4xl">⚔️</div>
          <div className="text-stone-100 font-bold text-lg">Join Game</div>
          <div className="text-stone-500 text-xs">Enter a room code</div>
        </button>

        <button
          onClick={() => useGameStore.getState().openDeckBuilder()}
          className="w-52 h-40 rounded-xl border-2 border-stone-700 hover:border-purple-700 bg-stone-900 hover:bg-stone-800 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="text-4xl">🃏</div>
          <div className="text-stone-100 font-bold text-lg">Build Deck</div>
          <div className="text-stone-500 text-xs">Customize your cards</div>
        </button>
      </div>
    </div>
  )
}
