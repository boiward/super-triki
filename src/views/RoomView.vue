<template>
  <div class="room">

    <!-- ── Lobby: waiting for second player ── -->
    <div v-if="roomStore.phase === 'waiting'" class="lobby">
      <h2 class="lobby__title">Sala creada</h2>
      <p class="lobby__hint">Comparte el código con tu oponente</p>

      <div class="lobby__code">{{ roomId }}</div>

      <button class="lobby__copy-btn" @click="copyLink">
        {{ copied ? 'Enlace copiado!' : 'Copiar enlace' }}
      </button>

      <div class="lobby__waiting">
        <span class="lobby__dot" />
        Esperando oponente...
      </div>
    </div>

    <!-- ── Game ── -->
    <template v-else-if="roomStore.phase === 'playing' || roomStore.phase === 'finished'">
      <header class="room__header">
        <span class="room__code">Sala: {{ roomId }}</span>
        <span class="room__turn" v-if="!gameStore.isGameOver">
          Turno: <strong :style="{ color: turnColor }">{{ turnLabel }}</strong>
        </span>
      </header>

      <main class="room__main">
        <PlayerPanel :player="1" :my-slot="roomStore.mySlot" />
        <Board />
        <PlayerPanel :player="2" :my-slot="roomStore.mySlot" />
      </main>

      <GameStatus @rematch="handleRematch" />
    </template>

    <!-- ── Opponent disconnected overlay ── -->
    <Transition name="overlay">
      <div v-if="roomStore.opponentLeft" class="disconnect-overlay">
        <div class="disconnect-card">
          <p class="disconnect-icon">⚠</p>
          <h2>Oponente desconectado</h2>
          <p class="disconnect-sub">Tu oponente abandonó la partida</p>
          <button class="disconnect-btn" @click="goHome">Volver al inicio</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/roomStore'
import { useGameStore } from '@/stores/gameStore'
import { useUserStore } from '@/stores/userStore'
import { useSocket } from '@/composables/useSocket'
import { connectSocket, disconnectSocket } from '@/services/socket'
import Board from '@/components/Board.vue'
import PlayerPanel from '@/components/PlayerPanel.vue'
import GameStatus from '@/components/GameStatus.vue'

const route     = useRoute()
const router    = useRouter()
const roomStore = useRoomStore()
const gameStore = useGameStore()
const userStore = useUserStore()
const { emitJoinRoom, emitRematch } = useSocket()

const roomId = computed(() => route.params.id as string)
const copied = ref(false)

const turnColor = computed(() => {
  const meta = gameStore.playerMeta[gameStore.currentPlayer]
  return meta?.color ?? '#fff'
})

const turnLabel = computed(() => {
  if (!roomStore.mySlot) return ''
  return gameStore.currentPlayer === roomStore.mySlot ? 'Tu turno' :
    roomStore.players.find(p => p.slot !== roomStore.mySlot)?.username ?? 'Oponente'
})

onMounted(async () => {
  connectSocket()

  // If we navigated here directly (shared link or page refresh) and have no slot yet
  if (!roomStore.mySlot) {
    if (!userStore.username) {
      router.replace({ name: 'home', query: { next: route.fullPath } })
      return
    }
    const res = await emitJoinRoom(roomId.value, userStore.username)
    if (!res.ok) {
      router.replace({ name: 'home', query: { code: roomId.value } })
      return
    }
    roomStore.setFromAck(res.roomId!, res.playerSlot!)
    if (res.roomState) roomStore.setRoomState(res.roomState)
  }
})

onUnmounted(() => {
  roomStore.reset()
  gameStore.initGame(2)
  disconnectSocket()
})

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function handleRematch() {
  if (roomStore.roomId) emitRematch(roomStore.roomId)
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 20px;
}

/* ── Lobby ── */
.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 80px;
}

.lobby__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.lobby__hint {
  color: #777;
  font-size: 14px;
}

.lobby__code {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 10px;
  background: linear-gradient(135deg, var(--player-1-color), var(--player-2-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 8px 16px;
  border: 2px solid var(--cell-border);
  border-radius: 16px;
  background-color: var(--cell-bg);
}

.lobby__copy-btn {
  padding: 10px 24px;
  border: 1.5px solid var(--cell-border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.lobby__copy-btn:hover {
  border-color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.05);
}

.lobby__waiting {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #888;
  font-size: 14px;
  margin-top: 8px;
}

.lobby__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--player-2-color);
  animation: blink 1s ease-in-out infinite alternate;
}

@keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }

/* ── Game ── */
.room__header {
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.room__code { font-weight: 600; letter-spacing: 1px; }

.room__main {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Disconnect overlay ── */
.disconnect-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.disconnect-card {
  background: var(--cell-bg);
  border: 2px solid var(--cell-border);
  border-radius: 20px;
  padding: 40px 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.disconnect-icon { font-size: 40px; }

.disconnect-card h2 {
  font-size: 24px;
  color: var(--text-primary);
}

.disconnect-sub { color: #777; font-size: 14px; }

.disconnect-btn {
  margin-top: 8px;
  padding: 12px 32px;
  border: none;
  border-radius: 30px;
  background: var(--player-1-color);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}
.disconnect-btn:hover { transform: scale(1.04); }

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.3s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>
