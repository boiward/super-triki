import type { Directive } from 'vue'
import type { DragPayload } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'
import { useRoomStore } from '@/stores/roomStore'

function isDragAllowed(payload: DragPayload): boolean {
  const store     = useGameStore()
  const roomStore = useRoomStore()
  if (store.isGameOver) return false
  // In multiplayer: piece must be mine AND it must be my turn
  if (roomStore.roomId) {
    return roomStore.mySlot === payload.player && store.currentPlayer === payload.player
  }
  // Solo: only current player can drag their own pieces
  return store.currentPlayer === payload.player
}

export const vDraggable: Directive<HTMLElement, DragPayload> = {
  mounted(el, binding) {
    el.draggable = true

    el.addEventListener('dragstart', (e: DragEvent) => {
      if (!isDragAllowed(binding.value)) {
        e.preventDefault()
        return
      }
      e.dataTransfer!.setData('application/json', JSON.stringify(binding.value))
      e.dataTransfer!.effectAllowed = 'move'
      requestAnimationFrame(() => el.classList.add('dragging'))
      useGameStore().setDragState(binding.value)
    })

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging')
      useGameStore().setDragState(null)
    })
  },

  updated(el, binding) {
    el.addEventListener('dragstart', (e: DragEvent) => {
      if (!isDragAllowed(binding.value)) { e.preventDefault(); return }
      e.dataTransfer!.setData('application/json', JSON.stringify(binding.value))
    })
  },
}
