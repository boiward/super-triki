import type { Line } from '@/types/game'

export function getAllLines(size = 3): Line[] {
  const lines: Line[] = []

  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c): [number, number] => [r, c]))
  }

  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r): [number, number] => [r, c]))
  }

  lines.push(Array.from({ length: size }, (_, i): [number, number] => [i, i]))
  lines.push(Array.from({ length: size }, (_, i): [number, number] => [i, size - 1 - i]))

  return lines
}

export function emptyCell() {
  return { large: null, medium: null, small: null }
}

export function emptyBoard(size = 3) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => emptyCell())
  )
}
