import { onMounted, onUnmounted } from 'vue'
import { getSocket } from '@/services/socket'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore } from '@/stores/gameStore'
import type {
  GameMovePayload,
  RoomCreateAck,
  RoomJoinAck,
} from '@/types/socket'

export function useSocket() {
  const socket    = getSocket()
  const roomStore = useRoomStore()
  const gameStore = useGameStore()

  function registerListeners() {
    socket.on('room:state', snapshot => {
      roomStore.setRoomState(snapshot)
    })

    socket.on('game:state', state => {
      gameStore.applyServerState(state)
      roomStore.setPhase('playing')
    })

    socket.on('game:over', result => {
      gameStore.applyGameOver(result)
      roomStore.setPhase('finished')
    })

    socket.on('player:joined', payload => {
      roomStore.addPlayer({ ...payload, socketId: '' })
    })

    socket.on('player:left', () => {
      roomStore.setOpponentLeft()
    })

    socket.on('error', payload => {
      roomStore.setError(payload.message)
    })
  }

  function removeListeners() {
    socket.off('room:state')
    socket.off('game:state')
    socket.off('game:over')
    socket.off('player:joined')
    socket.off('player:left')
    socket.off('error')
  }

  onMounted(registerListeners)
  onUnmounted(removeListeners)

  // ── Typed emit helpers ───────────────────────────────────────

  function emitCreateRoom(username: string): Promise<RoomCreateAck> {
    return new Promise(resolve => {
      socket.emit('room:create', { username }, resolve)
    })
  }

  function emitJoinRoom(roomId: string, username: string): Promise<RoomJoinAck> {
    return new Promise(resolve => {
      socket.emit('room:join', { roomId, username }, resolve)
    })
  }

  function emitMove(payload: GameMovePayload): void {
    socket.emit('game:move', payload, res => {
      if (!res.ok) roomStore.setError(res.error ?? 'Move rejected')
    })
  }

  function emitRematch(roomId: string): void {
    socket.emit('game:rematch', { roomId })
  }

  return { emitCreateRoom, emitJoinRoom, emitMove, emitRematch }
}
