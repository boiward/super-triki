<template>
  <Transition name="overlay">
    <div v-if="store.isGameOver" class="overlay">
      <div class="overlay__card">
        <div v-if="store.winResult" class="overlay__winner">
          <div
            class="overlay__badge"
            :style="{ background: winnerColor }"
          >
            {{ winnerLabel }}
          </div>
          <h2 class="overlay__title">Gana!</h2>
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

const store = useGameStore()
const emit = defineEmits<{ rematch: [] }>()

const winnerLabel = computed(() => {
  if (!store.winResult) return ''
  return store.playerMeta[store.winResult.winner]?.label ?? `Jugador ${store.winResult.winner}`
})

const winnerColor = computed(() => {
  if (!store.winResult) return ''
  return store.playerMeta[store.winResult.winner]?.color ?? '#fff'
})

const conditionLabel = computed(() => {
  const labels = {
    'same-size': 'Tres piezas iguales en linea',
    'ordered-sequence': 'Secuencia ordenada en linea',
    'complete-cell': 'Casilla completa!',
  }
  return store.winResult ? labels[store.winResult.condition] : ''
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay__card {
  background: var(--cell-bg);
  border-radius: 20px;
  padding: 40px 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 280px;
}

.overlay__badge {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  letter-spacing: 0.5px;
}

.overlay__title {
  margin: 0;
  font-size: 36px;
  color: var(--text-primary);
}

.overlay__condition {
  margin: 0;
  font-size: 14px;
  color: #888;
}

.overlay__btn {
  margin-top: 8px;
  padding: 12px 32px;
  border: none;
  border-radius: 30px;
  background: linear-gradient(135deg, #457b9d, #e63946);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.overlay__btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* Transition */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
