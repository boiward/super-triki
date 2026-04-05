<template>
  <div class="home">

    <!-- ── Username bar ── -->
    <div class="home__username-bar">
      <label class="home__username-label" for="username">Tu nombre</label>
      <input
        id="username"
        v-model="usernameInput"
        class="home__username-input"
        type="text"
        placeholder="¿Cómo te llamas?"
        maxlength="20"
        autocomplete="off"
      />
    </div>

    <div class="home__body">

      <!-- ── Left: public room list ── -->
      <section class="home__section">
        <div class="home__section-header">
          <h2 class="home__section-title">Salas disponibles</h2>
          <span class="home__section-count">{{ publicRooms.length }} sala{{ publicRooms.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="home__rooms">
          <TransitionGroup name="room-list" tag="div" class="home__rooms-inner">
            <div
              v-for="room in publicRooms"
              :key="room.roomId"
              class="room-card"
              :class="{ 'room-card--playing': room.phase === 'playing' }"
            >
              <div class="room-card__info">
                <span class="room-card__name">{{ room.name }}</span>
                <span class="room-card__meta">
                  <span class="room-card__dots">
                    <span
                      v-for="i in 4"
                      :key="i"
                      class="room-card__dot"
                      :class="{ 'room-card__dot--filled': i <= room.playerCount }"
                    />
                  </span>
                  {{ room.playerCount }}/4
                  <span class="room-card__phase">{{ room.phase === 'playing' ? '· En juego' : '· Esperando' }}</span>
                </span>
              </div>
              <button
                class="room-card__btn"
                :disabled="!canProceed || room.phase === 'playing' || loading"
                @click="handleJoinPublic(room.roomId)"
              >
                {{ loadingRoomId === room.roomId ? '...' : 'Unirse' }}
              </button>
            </div>
          </TransitionGroup>

          <div v-if="publicRooms.length === 0" class="home__empty">
            <span class="home__empty-icon">◎</span>
            <p>No hay salas públicas activas</p>
            <p class="home__empty-sub">Crea una para empezar</p>
          </div>
        </div>
      </section>

      <!-- ── Right: create + join private ── -->
      <section class="home__section home__section--actions">

        <!-- Create room -->
        <div class="home__card">
          <h3 class="home__card-title">Nueva sala</h3>

          <div class="home__field">
            <label class="home__label">Nombre</label>
            <input
              v-model="roomNameInput"
              class="home__input"
              type="text"
              :placeholder="`Sala de ${usernameInput || 'jugador'}`"
              maxlength="30"
              autocomplete="off"
            />
          </div>

          <div class="home__toggle-row">
            <button
              class="home__toggle-btn"
              :class="{ 'home__toggle-btn--active': !createIsPrivate }"
              @click="createIsPrivate = false"
            >
              Pública
            </button>
            <button
              class="home__toggle-btn"
              :class="{ 'home__toggle-btn--active': createIsPrivate }"
              @click="createIsPrivate = true"
            >
              Privada
            </button>
          </div>

          <Transition name="slide">
            <div v-if="createIsPrivate" class="home__field">
              <label class="home__label">Contraseña</label>
              <input
                v-model="createPasswordInput"
                class="home__input"
                type="text"
                placeholder="Contraseña de la sala..."
                maxlength="20"
                autocomplete="off"
              />
            </div>
          </Transition>

          <button
            class="home__btn home__btn--primary"
            :disabled="!canProceed || loading"
            @click="handleCreate"
          >
            {{ loading && action === 'create' ? 'Creando...' : 'Crear sala' }}
          </button>
        </div>

        <!-- Join private room -->
        <div class="home__card home__card--secondary">
          <h3 class="home__card-title">Sala privada</h3>
          <p class="home__card-sub">Únete con un código</p>

          <div class="home__field">
            <label class="home__label">Código</label>
            <input
              v-model="roomCodeInput"
              class="home__input home__input--code"
              type="text"
              placeholder="XK7F2A"
              maxlength="6"
              autocomplete="off"
              @input="roomCodeInput = roomCodeInput.toUpperCase()"
              @keydown.enter="handleJoinPrivate"
            />
          </div>

          <div class="home__field">
            <label class="home__label">Contraseña <span class="home__label-opt">(si aplica)</span></label>
            <input
              v-model="joinPasswordInput"
              class="home__input"
              type="text"
              placeholder="Opcional..."
              maxlength="20"
              autocomplete="off"
              @keydown.enter="handleJoinPrivate"
            />
          </div>

          <button
            class="home__btn home__btn--secondary"
            :disabled="!canJoin || loading"
            @click="handleJoinPrivate"
          >
            {{ loading && action === 'join' ? 'Uniéndose...' : 'Unirse' }}
          </button>
        </div>

        <p v-if="!canProceed" class="home__hint">Escribe tu nombre para continuar</p>
        <p v-if="errorMsg" class="home__error">{{ errorMsg }}</p>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useRoomStore } from '@/stores/roomStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { connectSocket, getSocket } from '@/services/socket'

const router     = useRouter()
const route      = useRoute()
const userStore  = useUserStore()
const roomStore  = useRoomStore()
const lobbyStore = useLobbyStore()

const usernameInput       = ref(userStore.username ?? '')
const roomNameInput       = ref('')
const roomCodeInput       = ref((route.query.code as string) ?? '')
const createPasswordInput = ref('')
const joinPasswordInput   = ref('')
const createIsPrivate     = ref(false)
const loading             = ref(false)
const loadingRoomId       = ref<string | null>(null)
const action              = ref<'create' | 'join' | null>(null)
const errorMsg            = ref<string | null>(null)

const publicRooms = computed(() => lobbyStore.publicRooms)
const canProceed  = computed(() => usernameInput.value.trim().length >= 2)
const canJoin     = computed(() => canProceed.value && roomCodeInput.value.trim().length === 6)

onMounted(() => {
  connectSocket()
  const socket = getSocket()
  socket.on('rooms:list', rooms => lobbyStore.setRooms(rooms))

  const next = route.query.next as string | undefined
  if (next) {
    const match = next.match(/\/room\/([A-Z0-9]+)/)
    if (match) roomCodeInput.value = match[1]
  }
})

onUnmounted(() => {
  getSocket().off('rooms:list')
})

async function waitForSocket() {
  const socket = getSocket()
  if (socket.connected) return
  await new Promise<void>(resolve => socket.once('connect', resolve))
}

async function handleCreate() {
  if (!canProceed.value) return
  userStore.setUsername(usernameInput.value)
  loading.value  = true
  action.value   = 'create'
  errorMsg.value = null

  await waitForSocket()
  const socket = getSocket()
  const name = roomNameInput.value.trim() || `Sala de ${usernameInput.value.trim()}`

  socket.emit('room:create', {
    username:  usernameInput.value.trim(),
    name,
    isPrivate: createIsPrivate.value,
    password:  createIsPrivate.value ? createPasswordInput.value || undefined : undefined,
  }, res => {
    loading.value = false
    if (!res.ok || !res.roomId || !res.playerSlot) {
      errorMsg.value = res.error ?? 'Error al crear sala'
      return
    }
    roomStore.setFromAck(res.roomId, res.playerSlot)
    router.push(`/room/${res.roomId}`)
  })
}

async function handleJoinPublic(roomId: string) {
  if (!canProceed.value) return
  userStore.setUsername(usernameInput.value)
  loading.value       = true
  loadingRoomId.value = roomId
  action.value        = 'join'
  errorMsg.value      = null

  await waitForSocket()
  const socket = getSocket()

  socket.emit('room:join', { roomId, username: usernameInput.value.trim() }, res => {
    loading.value       = false
    loadingRoomId.value = null
    if (!res.ok || !res.roomId || !res.playerSlot) {
      errorMsg.value = res.error ?? 'No se pudo unir'
      return
    }
    roomStore.setFromAck(res.roomId, res.playerSlot)
    if (res.roomState) roomStore.setRoomState(res.roomState)
    router.push(`/room/${res.roomId}`)
  })
}

async function handleJoinPrivate() {
  if (!canJoin.value) return
  userStore.setUsername(usernameInput.value)
  loading.value  = true
  action.value   = 'join'
  errorMsg.value = null

  await waitForSocket()
  const socket = getSocket()
  const code = roomCodeInput.value.trim().toUpperCase()

  socket.emit('room:join', {
    roomId:   code,
    username: usernameInput.value.trim(),
    password: joinPasswordInput.value || undefined,
  }, res => {
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
  padding: 24px 24px 40px;
  gap: 24px;
  max-width: 960px;
  margin: 0 auto;
}

/* ── Username bar ── */
.home__username-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--cell-bg);
  border: 1.5px solid var(--cell-border);
  border-radius: 12px;
  padding: 10px 16px;
}

.home__username-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.home__username-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
}

.home__username-input::placeholder { color: #444; }

/* ── Body columns ── */
.home__body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
  flex: 1;
}

@media (max-width: 700px) {
  .home__body { grid-template-columns: 1fr; }
}

/* ── Section ── */
.home__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home__section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.home__section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.home__section-count {
  font-size: 12px;
  color: #555;
}

/* ── Room list ── */
.home__rooms {
  display: flex;
  flex-direction: column;
}

.home__rooms-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--cell-bg);
  border: 1.5px solid var(--cell-border);
  border-radius: 12px;
  transition: border-color 0.2s;
}

.room-card:not(.room-card--playing):hover {
  border-color: rgba(255,255,255,0.15);
}

.room-card--playing { opacity: 0.5; }

.room-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.room-card__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.room-card__dots { display: flex; gap: 3px; }

.room-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cell-border);
  transition: background 0.2s;
}

.room-card__dot--filled { background: #457b9d; }
.room-card__phase { color: #555; }

.room-card__btn {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--player-2-color), #1d3557);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 0.15s, opacity 0.15s;
}

.room-card__btn:disabled { opacity: 0.35; cursor: not-allowed; }
.room-card__btn:not(:disabled):hover { transform: scale(1.04); }

/* Empty state */
.home__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 200px;
  color: #444;
  font-size: 14px;
  text-align: center;
  border: 1.5px dashed var(--cell-border);
  border-radius: 12px;
}

.home__empty-icon { font-size: 36px; color: #2a2a3e; line-height: 1; }
.home__empty-sub  { font-size: 12px; color: #333; }

/* ── Right side cards ── */
.home__section--actions { gap: 12px; }

.home__card {
  background: var(--cell-bg);
  border: 1.5px solid var(--cell-border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.home__card--secondary {
  background: rgba(255,255,255,0.02);
}

.home__card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.home__card-sub {
  font-size: 12px;
  color: #555;
  margin-top: -6px;
}

/* ── Fields ── */
.home__field { display: flex; flex-direction: column; gap: 5px; }

.home__label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.home__label-opt { text-transform: none; font-size: 10px; color: #444; }

.home__input {
  background: rgba(255,255,255,0.04);
  border: 1.5px solid var(--cell-border);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.home__input:focus { border-color: rgba(255,255,255,0.2); }
.home__input--code { text-transform: uppercase; letter-spacing: 3px; font-weight: 700; }

/* ── Toggle ── */
.home__toggle-row {
  display: flex;
  background: rgba(255,255,255,0.03);
  border: 1.5px solid var(--cell-border);
  border-radius: 8px;
  overflow: hidden;
}

.home__toggle-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.home__toggle-btn--active {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
}

/* ── Buttons ── */
.home__btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.home__btn:disabled { opacity: 0.35; cursor: not-allowed; }
.home__btn:not(:disabled):hover { transform: scale(1.02); }

.home__btn--primary {
  background: linear-gradient(135deg, var(--player-1-color), #c1121f);
  color: #fff;
}

.home__btn--secondary {
  background: linear-gradient(135deg, var(--player-2-color), #1d3557);
  color: #fff;
}

/* ── Hints ── */
.home__hint  { font-size: 12px; color: #555; text-align: center; }
.home__error { font-size: 13px; color: #e63946; text-align: center; }

/* ── Slide transition ── */
.slide-enter-active, .slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
  max-height: 80px;
}
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

/* ── Room list transition ── */
.room-list-enter-active { transition: all 0.25s ease; }
.room-list-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.room-list-enter-from   { opacity: 0; transform: translateY(-6px); }
.room-list-leave-to     { opacity: 0; transform: translateY(4px); }
</style>
