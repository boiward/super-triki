import { describe, it, expect } from 'vitest'
import { getAllLines, emptyBoard, emptyCell } from '@/utils/boardUtils'

describe('getAllLines', () => {
  it('returns 8 lines for a 3x3 board', () => {
    expect(getAllLines(3)).toHaveLength(8)
  })

  it('includes 3 rows', () => {
    const lines = getAllLines(3)
    const rows = lines.filter(line => line.every(([r]) => r === line[0][0]))
    expect(rows).toHaveLength(3)
  })

  it('includes 3 columns', () => {
    const lines = getAllLines(3)
    const cols = lines.filter(line => line.every(([, c]) => c === line[0][1]))
    expect(cols).toHaveLength(3)
  })

  it('includes 2 diagonals', () => {
    const lines = getAllLines(3)
    // Diagonals are neither pure rows nor pure cols
    const diags = lines.filter(line => {
      const sameRow = line.every(([r]) => r === line[0][0])
      const sameCol = line.every(([, c]) => c === line[0][1])
      return !sameRow && !sameCol
    })
    expect(diags).toHaveLength(2)
  })
})

describe('emptyBoard', () => {
  it('creates 3x3 board with null slots', () => {
    const board = emptyBoard()
    expect(board).toHaveLength(3)
    board.forEach(row => {
      expect(row).toHaveLength(3)
      row.forEach(cell => {
        expect(cell.large).toBeNull()
        expect(cell.medium).toBeNull()
        expect(cell.small).toBeNull()
      })
    })
  })
})

describe('emptyCell', () => {
  it('returns cell with all null slots', () => {
    const cell = emptyCell()
    expect(cell).toEqual({ large: null, medium: null, small: null })
  })
})
