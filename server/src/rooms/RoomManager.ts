import type { PlayerSlot } from '../types/game.js'
import type { PlayerInfo, PublicRoomInfo, RoomStateSnapshot } from '../types/socket.js'
import type { RoomGameState } from '../engine/GameEngine.js'
import { generateRoomCode } from './roomUtils.js'

export interface RoomState {
  roomId:      string
  name:        string
  isPrivate:   boolean
  password?:   string
  players:     PlayerInfo[]
  phase:       'waiting' | 'playing' | 'finished'
  game:        RoomGameState | null
  createdAt:   number
  scores:      Record<number, number>
  roundNumber: number
}

const rooms = new Map<string, RoomState>()
const socketToRoom = new Map<string, string>()

export const RoomManager = {
  createRoom(
    username: string,
    socketId: string,
    name: string,
    isPrivate: boolean,
    password?: string,
  ): RoomState {
    let roomId: string
    do { roomId = generateRoomCode() } while (rooms.has(roomId))

    const room: RoomState = {
      roomId,
      name:        name.trim() || `Sala de ${username}`,
      isPrivate,
      password:    isPrivate ? password : undefined,
      players:     [{ slot: 1, username, socketId }],
      phase:       'waiting',
      game:        null,
      createdAt:   Date.now(),
      scores:      {},
      roundNumber: 0,
    }
    rooms.set(roomId, room)
    socketToRoom.set(socketId, roomId)
    return room
  },

  joinRoom(
    roomId: string,
    username: string,
    socketId: string,
    password?: string,
  ): { ok: true; room: RoomState } | { ok: false; error: string } {
    const room = rooms.get(roomId)
    if (!room)                         return { ok: false, error: 'Sala no encontrada' }
    if (room.phase !== 'waiting')      return { ok: false, error: room.phase === 'finished' ? 'La sala ha terminado' : 'La partida ya comenzó' }
    if (room.players.length >= 4)      return { ok: false, error: 'Sala llena' }
    if (room.isPrivate && room.password && room.password !== password)
                                       return { ok: false, error: 'Contraseña incorrecta' }

    const slot = (room.players.length + 1) as PlayerSlot
    room.players.push({ slot, username, socketId })
    socketToRoom.set(socketId, roomId)
    return { ok: true, room }
  },

  getRoom(roomId: string): RoomState | undefined {
    return rooms.get(roomId)
  },

  getRoomBySocket(socketId: string): RoomState | undefined {
    const roomId = socketToRoom.get(socketId)
    return roomId ? rooms.get(roomId) : undefined
  },

  getSlotBySocket(socketId: string): PlayerSlot | null {
    const room = this.getRoomBySocket(socketId)
    if (!room) return null
    return room.players.find(p => p.socketId === socketId)?.slot ?? null
  },

  removePlayer(socketId: string): { room: RoomState; slot: PlayerSlot } | null {
    const room = this.getRoomBySocket(socketId)
    if (!room) return null

    const player = room.players.find(p => p.socketId === socketId)
    if (!player) return null

    room.players = room.players.filter(p => p.socketId !== socketId)
    socketToRoom.delete(socketId)

    room.phase = 'finished'
    setTimeout(() => {
      if (rooms.get(room.roomId)?.players.length === 0) {
        rooms.delete(room.roomId)
      }
    }, 60_000)

    return { room, slot: player.slot }
  },

  setGame(roomId: string, game: RoomGameState): void {
    const room = rooms.get(roomId)
    if (room) {
      room.game  = game
      room.phase = 'playing'
    }
  },

  initScores(roomId: string, slots: PlayerSlot[]): void {
    const room = rooms.get(roomId)
    if (!room) return
    slots.forEach(s => { if (room.scores[s] === undefined) room.scores[s] = 0 })
  },

  addScore(roomId: string, slot: PlayerSlot): void {
    const room = rooms.get(roomId)
    if (!room) return
    room.scores[slot] = (room.scores[slot] ?? 0) + 1
  },

  nextRound(roomId: string): PlayerSlot | null {
    const room = rooms.get(roomId)
    if (!room || room.players.length === 0) return null
    room.roundNumber++
    return room.players[room.roundNumber % room.players.length].slot
  },

  getPublicRooms(): PublicRoomInfo[] {
    return Array.from(rooms.values())
      .filter(r => !r.isPrivate && r.phase !== 'finished')
      .map(r => ({
        roomId:      r.roomId,
        name:        r.name,
        playerCount: r.players.length,
        phase:       r.phase as 'waiting' | 'playing',
      }))
  },

  toSnapshot(room: RoomState): RoomStateSnapshot {
    return {
      roomId:      room.roomId,
      name:        room.name,
      isPrivate:   room.isPrivate,
      players:     room.players,
      phase:       room.phase,
      playerCount: room.players.length,
      scores:      room.scores,
      roundNumber: room.roundNumber,
    }
  },
}
