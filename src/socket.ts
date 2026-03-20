import { io } from 'socket.io-client'

// Single shared socket instance — connects to same origin in production
export const socket = io({ autoConnect: false })
