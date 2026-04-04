import type { DragPayload } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'

export function useDragDrop(row: number, col: number) {
  const store = useGameStore()

  function onDragOver(e: DragEvent) {
    const size = store.dragState?.size
    if (size && store.canDrop(row, col, size)) {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'move'
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer?.getData('application/json')
    if (!raw) return
    const payload: DragPayload = JSON.parse(raw)
    store.placePiece({
      pieceId: payload.pieceId,
      targetRow: row,
      targetCol: col,
      targetSize: payload.size,
    })
  }

  return { onDragOver, onDrop }
}
