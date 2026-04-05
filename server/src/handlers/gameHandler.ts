import type { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.js'
import { RoomManager } from '../rooms/RoomManager.js'
import {
  buildInitialGameState,
  validateMove,
  applyMove,
  toSnapshot,
} from '../engine/GameEngine.js'

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

export function registerGameHandler(io: TypedServer, socket: TypedSocket): void {

  // ── room:create ──────────────────────────────────────────────
  socket.on('room:create', ({ username }, ack) => {
    if (!username?.trim()) {
      ack({ ok: false, error: 'Username required' })
      return
    }
    const room = RoomManager.createRoom(username.trim(), socket.id)
    socket.join(room.roomId)
    ack({ ok: true, roomId: room.roomId, playerSlot: 1 })
    socket.emit('room:state', RoomManager.toSnapshot(room))
  })

  // ── room:join ────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, username }, ack) => {
    if (!username?.trim()) {
      ack({ ok: false, error: 'Username required' })
      return
    }

    const existing = RoomManager.getRoom(roomId)
    if (!existing) {
      ack({ ok: false, error: 'Room not found' })
      return
    }

    // Allow re-joining own room (e.g. page refresh) if already a player
    const alreadyIn = existing.players.find(p => p.socketId === socket.id)
    if (alreadyIn) {
      socket.join(roomId)
      ack({ ok: true, roomId, playerSlot: alreadyIn.slot, roomState: RoomManager.toSnapshot(existing) })
      if (existing.game) socket.emit('game:state', toSnapshot(existing.game))
      return
    }

    if (existing.phase !== 'waiting') {
      ack({ ok: false, error: existing.phase === 'finished' ? 'Room has ended' : 'Room is full' })
      return
    }

    const room = RoomManager.joinRoom(roomId, username.trim(), socket.id)
    if (!room) {
      ack({ ok: false, error: 'Could not join room' })
      return
    }

    socket.join(roomId)
    const newSlot = room.players[room.players.length - 1].slot
    ack({ ok: true, roomId, playerSlot: newSlot, roomState: RoomManager.toSnapshot(room) })

    // Notify existing players that someone joined
    socket.to(roomId).emit('player:joined', { username: username.trim(), slot: newSlot })
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
  })

  // ── game:start ───────────────────────────────────────────────
  socket.on('game:start', ({ roomId }) => {
    const room = RoomManager.getRoom(roomId)
    if (!room || room.phase !== 'waiting') return

    // Only the creator (slot 1) can start
    const actingSlot = RoomManager.getSlotBySocket(socket.id)
    if (actingSlot !== 1) return

    if (room.players.length < 2) return

    const game = buildInitialGameState(room.players.length)
    RoomManager.setGame(roomId, game)
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
    io.to(roomId).emit('game:state', toSnapshot(game))
  })

  // ── game:move ────────────────────────────────────────────────
  socket.on('game:move', (payload, ack) => {
    const room = RoomManager.getRoom(payload.roomId)
    if (!room || !room.game) {
      ack({ ok: false, error: 'Room or game not found' })
      return
    }

    const actingSlot = RoomManager.getSlotBySocket(socket.id)
    if (!actingSlot) {
      ack({ ok: false, error: 'Not a player in this room' })
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

    const game = buildInitialGameState(room.players.length)
    RoomManager.setGame(roomId, game)
    io.to(roomId).emit('room:state', RoomManager.toSnapshot(room))
    io.to(roomId).emit('game:state', toSnapshot(game))
  })

  // ── disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    const result = RoomManager.removePlayer(socket.id)
    if (!result) return

    const { room, slot } = result
    const player = result.room.players.find(p => p.slot === slot) ??
      // already removed — look up from the snapshot before removal
      { username: 'Oponente', slot }

    socket.to(room.roomId).emit('player:left', {
      username:  (player as { username: string }).username ?? 'Oponente',
      slot,
      permanent: true,
    })
  })
}
