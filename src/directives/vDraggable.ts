import type { Directive } from 'vue'
import type { DragPayload } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'

export const vDraggable: Directive<HTMLElement, DragPayload> = {
  mounted(el, binding) {
    el.draggable = true

    el.addEventListener('dragstart', (e: DragEvent) => {
      e.dataTransfer!.setData('application/json', JSON.stringify(binding.value))
      e.dataTransfer!.effectAllowed = 'move'
      // Brief delay so the drag ghost renders before we add the dragging class
      requestAnimationFrame(() => el.classList.add('dragging'))
      const store = useGameStore()
      store.setDragState(binding.value)
    })

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging')
      const store = useGameStore()
      store.setDragState(null)
    })
  },

  updated(el, binding) {
    // Keep binding.value fresh on reactivity updates
    el.addEventListener('dragstart', (e: DragEvent) => {
      e.dataTransfer!.setData('application/json', JSON.stringify(binding.value))
    })
  },
}
