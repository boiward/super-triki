import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.js'
import type { PlayerSlot } from '../types/game.js'
import { RoomManager } from '../rooms/RoomManager.js'
import {
  buildInitialGameState,
  validateMove,
  applyMove,
  toSnapshot,
} from '../engine/GameEngine.js'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

function broadcastRoomList(io: TypedServer) {
  io.to('lobby').emit('rooms:list', RoomManager.getPublicRooms())
}

export function registerGameHandler(io: TypedServer, socket: TypedSocket): void {

  // All new connections join the lobby channel to receive room list updates
  socket.join('lobby')
  socket.emit('rooms:list', RoomManager.getPublicRooms())

  // ── rooms:get ────────────────────────────────────────────────
  socket.on('rooms:get', ack => {
    ack(RoomManager.getPublicRooms())
  })

  // ── room:create ──────────────────────────────────────────────
  socket.on('room:create', ({ username, name, isPrivate, password }, ack) => {
    if (!username?.trim()) {
      ack({ ok: false, error: 'Nombre requerido' })
      return
    }
    const room = RoomManager.createRoom(username.trim(), socket.id, name, isPrivate, password)
    socket.leave('lobby')
    socket.join(room.roomId)
    ack({ ok: true, roomId: room.roomId, playerSlot: 1 })
    socket.emit('room:state', RoomManager.toSnapshot(room))
    broadcastRoomList(io)
  })

  // ── room:join ────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, username, password }, ack) => {
    if (!username?.trim()) {
      ack({ ok: false, error: 'Nombre requerido' })
      return
    }

    const existing = RoomManager.getRoom(roomId)
    if (!existing) {
      ack({ ok: false, error: 'Sala no encontrada' })
      return
    }

    // Allow re-joining own room (e.g. page refresh)
    const alreadyIn = existing.players.find(p => p.socketId === socket.id)
    if (alreadyIn) {
      socket.join(roomId)
      ack({ ok: true, roomId, playerSlot: alreadyIn.slot, roomState: RoomManager.toSnapshot(existing) })
      if (existing.game) socket.emit('game:state', toSnapshot(existing.game))
      return
    }

    const result = RoomManager.joinRoom(roomId, username.trim(), socket.id, password)
    if (!result.ok) {
      ack({ ok: false, error: result.error })
      return
    }

    const room = result.room
    socket.leave('lobby')
    socket.join(roomId)
    const newSlot = room.players[room.players.length - 1].slot
    ack({ ok: true, roomId, playerSlot: newSlot, roomState: RoomManager.toSnapshot(room) })

    socket.to(roomId).emit('player:joined', { username: username.trim(), slot: newSlot })
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
    broadcastRoomList(io)
  })

  // ── game:start ───────────────────────────────────────────────
  socket.on('game:start', ({ roomId }) => {
    const room = RoomManager.getRoom(roomId)
    if (!room || room.phase !== 'waiting') return

    const actingSlot = RoomManager.getSlotBySocket(socket.id)
    if (actingSlot !== 1) return
    if (room.players.length < 2) return

    const slots = room.players.map(p => p.slot)
    RoomManager.initScores(roomId, slots)
    const game = buildInitialGameState(room.players.length)
    RoomManager.setGame(roomId, game)
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
    io.to(roomId).emit('game:state', toSnapshot(game))
    broadcastRoomList(io)
  })

  // ── game:move ────────────────────────────────────────────────
  socket.on('game:move', (payload, ack) => {
    const room = RoomManager.getRoom(payload.roomId)
    if (!room || !room.game) {
      ack({ ok: false, error: 'Sala o partida no encontrada' })
      return
    }

    const actingSlot = RoomManager.getSlotBySocket(socket.id)
    if (!actingSlot) {
      ack({ ok: false, error: 'No eres un jugador de esta sala' })
      return
    }

    const validation = validateMove(room.game, payload, actingSlot)
    if (!validation.valid) {
      ack({ ok: false, error: validation.reason })
      return
    }

    const newState = applyMove(room.game, payload)
    room.game = newState

    ack({ ok: true })
    io.to(payload.roomId).emit('game:state', toSnapshot(newState))

    if (newState.winResult || newState.isDraw) {
      room.phase = 'finished'
      if (newState.winResult) {
        RoomManager.addScore(payload.roomId, newState.winResult.winner as PlayerSlot)
      }
      io.to(payload.roomId).emit('room:state', RoomManager.toSnapshot(room))
      io.to(payload.roomId).emit('game:over', {
        winResult:  newState.winResult,
        finalState: toSnapshot(newState),
      })
    }
  })

  // ── game:rematch ─────────────────────────────────────────────
  socket.on('game:rematch', ({ roomId }) => {
    const room = RoomManager.getRoom(roomId)
    if (!room || room.players.length < 2) return

    const startingPlayer = RoomManager.nextRound(roomId) ?? 1
    const game = buildInitialGameState(room.players.length, startingPlayer)
    RoomManager.setGame(roomId, game)
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
    io.to(roomId).emit('game:state', toSnapshot(game))
  })

  // ── disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    const result = RoomManager.removePlayer(socket.id)
    if (!result) return

    const { room, slot } = result
    const player = room.players.find(p => p.slot === slot) ?? { username: 'Jugador', slot }

    socket.to(room.roomId).emit('player:left', {
      username:  (player as { username: string }).username ?? 'Jugador',
      slot,
      permanent: true,
    })

    broadcastRoomList(io)
  })
}
