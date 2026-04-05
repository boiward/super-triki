import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PlayerInfo, PlayerSlot, RoomStateSnapshot } from '@/types/socket'

export const useRoomStore = defineStore('room', () => {
  const roomId       = ref<string | null>(null)
  const name         = ref('')
  const isPrivate    = ref(false)
  const phase        = ref<'idle' | 'waiting' | 'playing' | 'finished'>('idle')
  const mySlot       = ref<PlayerSlot | null>(null)
  const players      = ref<PlayerInfo[]>([])
  const playerCount  = ref(0)
  const scores       = ref<Record<number, number>>({})
  const roundNumber  = ref(0)
  const opponentLeft = ref(false)
  const error        = ref<string | null>(null)

  function setFromAck(ackRoomId: string, slot: PlayerSlot) {
    roomId.value = ackRoomId
    mySlot.value = slot
    error.value  = null
  }

  function setRoomState(snapshot: RoomStateSnapshot) {
    roomId.value      = snapshot.roomId
    name.value        = snapshot.name
    isPrivate.value   = snapshot.isPrivate
    phase.value       = snapshot.phase
    players.value     = snapshot.players
    playerCount.value = snapshot.playerCount
    scores.value      = snapshot.scores
    roundNumber.value = snapshot.roundNumber
  }

  function setPhase(p: typeof phase.value) {
    phase.value = p
  }

  function addPlayer(info: PlayerInfo) {
    if (!players.value.find(p => p.slot === info.slot)) {
      players.value.push(info)
    }
  }

  function setOpponentLeft() {
    opponentLeft.value = true
    phase.value = 'finished'
  }

  function setError(msg: string | null) {
    error.value = msg
  }

  function reset() {
    roomId.value       = null
    name.value         = ''
    isPrivate.value    = false
    phase.value        = 'idle'
    mySlot.value       = null
    players.value      = []
    playerCount.value  = 0
    scores.value       = {}
    roundNumber.value  = 0
    opponentLeft.value = false
    error.value        = null
  }

  return {
    roomId, name, isPrivate, phase, mySlot, players, playerCount,
    scores, roundNumber, opponentLeft, error,
    setFromAck, setRoomState, setPhase, addPlayer, setOpponentLeft, setError, reset,
  }
})
