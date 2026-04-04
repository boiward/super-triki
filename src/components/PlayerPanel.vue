<template>
  <div
    class="player-panel"
    :class="{ 'player-panel--active': isActive }"
    :style="{ '--accent': meta.color }"
  >
    <div class="player-panel__header">
      <span class="player-panel__dot" />
      <span class="player-panel__name">{{ displayName }}</span>
      <span v-if="isActive" class="player-panel__turn">{{ isMe ? 'Tu turno' : 'Su turno' }}</span>
    </div>

    <div v-for="size in SIZE_ORDER" :key="size" class="player-panel__group">
      <span class="player-panel__size-label">{{ sizeNames[size] }}</span>
      <div class="player-panel__pieces">
        <Piece
          v-for="piece in piecesOfSize(size)"
          :key="piece.id"
          :piece="piece"
          :in-inventory="true"
        />
        <span v-if="piecesOfSize(size).length === 0" class="player-panel__empty">—</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player, Size } from '@/types/game'
import type { PlayerSlot } from '@/types/socket'
import { SIZE_ORDER } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'
import { useUserStore } from '@/stores/userStore'
import Piece from './Piece.vue'

const props = defineProps<{ player: Player; mySlot?: PlayerSlot | null }>()

const store     = useGameStore()
const roomStore = useRoomStore()
const userStore = useUserStore()

const isActive = computed(() => store.currentPlayer === props.player && !store.isGameOver)
const meta = computed(() => store.playerMeta[props.player])

const isMe = computed(() => props.mySlot === props.player)

const displayName = computed(() => {
  if (!roomStore.roomId) return meta.value.label
  const playerInfo = roomStore.players.find(p => p.slot === props.player)
  if (playerInfo) return playerInfo.username + (isMe.value ? ' (tú)' : '')
  return isMe.value ? (userStore.username ?? meta.value.label) + ' (tú)' : meta.value.label
})
const inventory = computed(() => store.inventories[props.player] ?? [])

const sizeNames: Record<Size, string> = { large: 'Grandes', medium: 'Medianas', small: 'Pequeñas' }

function piecesOfSize(size: Size) {
  return inventory.value.filter(p => p.size === size)
}
</script>

<style scoped>
.player-panel {
  background: var(--cell-bg);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  min-width: 160px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.player-panel--active {
  border-color: var(--accent);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.08), 0 0 0 1px var(--accent);
}

.player-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.player-panel__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--accent);
  flex-shrink: 0;
}

.player-panel__name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
}

.player-panel__turn {
  margin-left: auto;
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: blink 1s ease-in-out infinite alternate;
}

@keyframes blink {
  from { opacity: 0.6; }
  to   { opacity: 1; }
}

.player-panel__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.player-panel__size-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-panel__pieces {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  min-height: 28px;
}

.player-panel__empty {
  color: #444;
  font-size: 14px;
}
</style>
