<template>
  <div class="home">
    <header class="home__header">
      <h1 class="home__title">Super Triki</h1>
      <p class="home__subtitle">Tic Tac Toe con piezas de 3 tamaños • 1–4 jugadores</p>
    </header>

    <!-- Name step -->
    <div class="home__card">
      <p class="home__step-label">¿Cómo te llamas?</p>
      <input
        id="username"
        v-model="usernameInput"
        class="home__input"
        type="text"
        placeholder="Tu nombre..."
        maxlength="20"
        autocomplete="off"
        @keydown.enter="focusAction"
      />

      <div class="home__actions" :class="{ 'home__actions--locked': !canProceed }">

        <!-- Create -->
        <div class="home__action-block home__action-block--create">
          <div class="home__action-info">
            <span class="home__action-title">Nueva sala</span>
            <span class="home__action-desc">Crea una sala y comparte el código</span>
          </div>
          <button
            class="home__btn home__btn--primary"
            :disabled="!canProceed || loading"
            @click="handleCreate"
          >
            {{ loading && action === 'create' ? 'Creando...' : 'Crear' }}
          </button>
        </div>

        <div class="home__sep">
          <span>o</span>
        </div>

        <!-- Join -->
        <div class="home__action-block home__action-block--join">
          <div class="home__action-info">
            <span class="home__action-title">Unirse a sala</span>
            <span class="home__action-desc">Ingresa el código que te compartieron</span>
          </div>
          <div class="home__join-row">
            <input
              v-model="roomCodeInput"
              class="home__input home__input--code"
              type="text"
              placeholder="Código (ej: XK7F2A)"
              maxlength="6"
              autocomplete="off"
              @input="roomCodeInput = roomCodeInput.toUpperCase()"
              @keydown.enter="handleJoin"
            />
            <button
              class="home__btn home__btn--secondary"
              :disabled="!canJoin || loading"
              @click="handleJoin"
            >
              {{ loading && action === 'join' ? 'Uniendo...' : 'Unirse' }}
            </button>
          </div>
        </div>

      </div>

      <p v-if="!canProceed" class="home__hint">Escribe tu nombre para continuar</p>
      <p v-if="errorMsg" class="home__error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useRoomStore } from '@/stores/roomStore'
import { connectSocket, getSocket } from '@/services/socket'

const router    = useRouter()
const route     = useRoute()
const userStore = useUserStore()
const roomStore = useRoomStore()

const usernameInput = ref(userStore.username ?? '')
const roomCodeInput = ref((route.query.code as string) ?? '')
const loading       = ref(false)
const action        = ref<'create' | 'join' | null>(null)
const errorMsg      = ref<string | null>(null)

const canProceed = computed(() => usernameInput.value.trim().length >= 2)
const canJoin    = computed(() => canProceed.value && roomCodeInput.value.trim().length === 6)

onMounted(() => {
  const next = route.query.next as string | undefined
  if (next) {
    const match = next.match(/\/room\/([A-Z0-9]+)/)
    if (match) roomCodeInput.value = match[1]
  }
})

function focusAction() {
  if (canJoin.value) handleJoin()
  else if (canProceed.value) handleCreate()
}

async function handleCreate() {
  if (!canProceed.value) return
  userStore.setUsername(usernameInput.value)
  loading.value  = true
  action.value   = 'create'
  errorMsg.value = null

  connectSocket()
  const socket = getSocket()
  await new Promise<void>(resolve => {
    if (socket.connected) { resolve(); return }
    socket.once('connect', resolve)
  })

  socket.emit('room:create', { username: usernameInput.value.trim() }, res => {
    loading.value = false
    if (!res.ok || !res.roomId || !res.playerSlot) {
      errorMsg.value = res.error ?? 'Error al crear sala'
      return
    }
    roomStore.setFromAck(res.roomId, res.playerSlot)
    router.push(`/room/${res.roomId}`)
  })
}

async function handleJoin() {
  if (!canJoin.value) return
  userStore.setUsername(usernameInput.value)
  loading.value  = true
  action.value   = 'join'
  errorMsg.value = null

  connectSocket()
  const socket = getSocket()
  await new Promise<void>(resolve => {
    if (socket.connected) { resolve(); return }
    socket.once('connect', resolve)
  })

  const code = roomCodeInput.value.trim().toUpperCase()
  socket.emit('room:join', { roomId: code, username: usernameInput.value.trim() }, res => {
    loading.value = false
    if (!res.ok || !res.roomId || !res.playerSlot) {
      errorMsg.value = res.error ?? 'No se pudo unir a la sala'
      return
    }
    roomStore.setFromAck(res.roomId, res.playerSlot)
    if (res.roomState) roomStore.setRoomState(res.roomState)
    router.push(`/room/${res.roomId}`)
  })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 28px;
}

.home__header { text-align: center; }

.home__title {
  font-size: 44px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--player-1-color), var(--player-2-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.home__subtitle {
  font-size: 13px;
  color: #555;
  margin-top: 6px;
}

/* ── Card ── */
.home__card {
  background: var(--cell-bg);
  border: 2px solid var(--cell-border);
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.home__step-label {
  font-size: 13px;
  color: #888;
  margin: 0;
  font-weight: 500;
}

.home__input {
  background: rgba(255,255,255,0.04);
  border: 1.5px solid var(--cell-border);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.home__input:focus { border-color: rgba(255,255,255,0.25); }

.home__input--code {
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: 700;
  font-size: 15px;
}

/* ── Actions area ── */
.home__actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1.5px solid var(--cell-border);
  border-radius: 14px;
  overflow: hidden;
  transition: opacity 0.2s;
}

.home__actions--locked {
  opacity: 0.35;
  pointer-events: none;
}

.home__action-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
}

.home__action-block--create {
  background: rgba(230, 57, 70, 0.06);
}

.home__action-block--join {
  background: rgba(69, 123, 157, 0.06);
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.home__action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.home__action-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.home__action-desc {
  font-size: 12px;
  color: #666;
}

.home__sep {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  background: var(--cell-bg);
  border-top: 1px solid var(--cell-border);
  border-bottom: 1px solid var(--cell-border);
}

.home__sep::before,
.home__sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--cell-border);
}

.home__sep span {
  font-size: 11px;
  color: #444;
  padding: 6px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.home__join-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

/* ── Buttons ── */
.home__btn {
  padding: 11px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 0.15s, opacity 0.15s;
}

.home__btn:disabled  { opacity: 0.4; cursor: not-allowed; }
.home__btn:not(:disabled):hover { transform: scale(1.03); }

.home__btn--primary {
  background: linear-gradient(135deg, var(--player-1-color), #c1121f);
  color: #fff;
}

.home__btn--secondary {
  background: linear-gradient(135deg, var(--player-2-color), #1d3557);
  color: #fff;
}

/* ── Footer hints ── */
.home__hint {
  font-size: 12px;
  color: #555;
  text-align: center;
  margin: -4px 0 0;
}

.home__error {
  font-size: 13px;
  color: #e63946;
  text-align: center;
  margin: -4px 0 0;
}
</style>
