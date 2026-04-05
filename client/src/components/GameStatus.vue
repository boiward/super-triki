<template>
  <Transition name="overlay">
    <div v-if="store.isGameOver" class="overlay">
      <div class="overlay__card">

        <div v-if="store.winResult" class="overlay__winner">
          <div class="overlay__ring-preview" :style="{ '--wc': winnerColor }" />
          <div class="overlay__badge" :style="{ background: winnerColor }">
            {{ winnerName }}
          </div>
          <h2 class="overlay__title">¡Gana!</h2>
          <p class="overlay__condition">{{ conditionLabel }}</p>
        </div>

        <div v-else class="overlay__draw">
          <h2 class="overlay__title">Empate</h2>
          <p class="overlay__condition">No quedan movimientos posibles</p>
        </div>

        <button class="overlay__btn" @click="emit('rematch')">Jugar de nuevo</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'

const store     = useGameStore()
const roomStore = useRoomStore()
const emit = defineEmits<{ rematch: [] }>()

const winnerColor = computed(() => {
  if (!store.winResult) return ''
  return store.playerMeta[store.winResult.winner]?.color ?? '#fff'
})

const winnerName = computed(() => {
  if (!store.winResult) return ''
  const slot = store.winResult.winner
  // Use actual username in multiplayer
  if (roomStore.roomId) {
    return roomStore.players.find(p => p.slot === slot)?.username
      ?? store.playerMeta[slot]?.label
  }
  return store.playerMeta[slot]?.label ?? `Jugador ${slot}`
})

const conditionLabel = computed(() => {
  const labels = {
    'same-size':        'Tres piezas del mismo tamaño en línea',
    'ordered-sequence': 'Secuencia ordenada en línea',
    'complete-cell':    '¡Casilla completa!',
  }
  return store.winResult ? labels[store.winResult.condition] : ''
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
}

.overlay__card {
  background: var(--cell-bg);
  border: 2px solid var(--cell-border);
  border-radius: 24px;
  padding: 40px 52px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 280px;
}

/* Decorative ring that matches winner color */
.overlay__ring-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 10px solid var(--wc);
  box-shadow: 0 0 24px var(--wc);
  margin-bottom: 4px;
}

.overlay__badge {
  display: inline-block;
  padding: 5px 18px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  letter-spacing: 0.5px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overlay__title {
  margin: 0;
  font-size: 38px;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
}

.overlay__condition {
  margin: 0;
  font-size: 13px;
  color: #777;
}

.overlay__draw h2 {
  font-size: 38px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
}

.overlay__btn {
  margin-top: 8px;
  padding: 13px 36px;
  border: none;
  border-radius: 30px;
  background: linear-gradient(135deg, #457b9d, #e63946);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.overlay__btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.25s ease; }
.overlay-enter-from,  .overlay-leave-to      { opacity: 0; }
</style>
