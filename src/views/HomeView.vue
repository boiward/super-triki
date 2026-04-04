<template>
  <div class="home">
    <header class="home__header">
      <h1 class="home__title">Super Triki</h1>
      <p class="home__subtitle">Tic Tac Toe Avanzado</p>
    </header>

    <div class="home__card">
      <!-- Username -->
      <div class="home__section">
        <label class="home__label" for="username">Tu nombre</label>
        <input
          id="username"
          v-model="usernameInput"
          class="home__input"
          type="text"
          placeholder="Ingresa tu nombre..."
          maxlength="20"
          autocomplete="off"
          @keydown.enter="focusAction"
        />
      </div>

      <div class="home__divider" />

      <!-- Create room -->
      <div class="home__section">
        <button
          class="home__btn home__btn--primary"
          :disabled="!canProceed || loading"
          @click="handleCreate"
        >
          {{ loading && action === 'create' ? 'Creando...' : 'Crear sala' }}
        </button>
      </div>

      <div class="home__or">— o —</div>

      <!-- Join room -->
      <div class="home__section">
        <label class="home__label" for="roomCode">Código de sala</label>
        <div class="home__join-row">
          <input
            id="roomCode"
            v-model="roomCodeInput"
            class="home__input home__input--code"
            type="text"
            placeholder="Ej: XK7F2A"
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
  // Pre-fill code from ?next= or direct /room/:id redirect
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
  loading.value = true
  action.value  = 'create'
  errorMsg.value = null

  connectSocket()
  const socket = getSocket()

  // Wait for connection
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
    if (res.roomId) router.push(`/room/${res.roomId}`)
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
  gap: 32px;
}

.home__header { text-align: center; }

.home__title {
  font-size: 40px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--player-1-color), var(--player-2-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.home__subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.home__card {
  background: var(--cell-bg);
  border: 2px solid var(--cell-border);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home__section { display: flex; flex-direction: column; gap: 8px; }

.home__label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.home__input {
  background: rgba(255,255,255,0.05);
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

.home__input:focus { border-color: rgba(255,255,255,0.3); }

.home__input--code {
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: 700;
  font-size: 16px;
}

.home__btn {
  padding: 13px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.home__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.home__btn:not(:disabled):hover { transform: scale(1.02); }

.home__btn--primary {
  background: linear-gradient(135deg, var(--player-1-color), #c1121f);
  color: #fff;
  width: 100%;
}

.home__btn--secondary {
  background: linear-gradient(135deg, var(--player-2-color), #1d3557);
  color: #fff;
  white-space: nowrap;
  padding: 13px 20px;
  flex-shrink: 0;
}

.home__join-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.home__divider {
  height: 1px;
  background: var(--cell-border);
}

.home__or {
  text-align: center;
  color: #555;
  font-size: 13px;
  margin: -8px 0;
}

.home__error {
  color: #e63946;
  font-size: 13px;
  text-align: center;
  margin: -8px 0 0;
}
</style>
