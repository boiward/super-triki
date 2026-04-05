import type { Board, Piece, Size, WinResult, PlayerSlot } from './game.js'

// ── Client → Server ──────────────────────────────────────────────

export interface RoomCreatePayload { username: string }
export interface RoomCreateAck {
  ok: boolean
  roomId?: string
  playerSlot?: PlayerSlot
  error?: string
}

export interface RoomJoinPayload { roomId: string; username: string }
export interface RoomJoinAck {
  ok: boolean
  roomId?: string
  playerSlot?: PlayerSlot
  roomState?: RoomStateSnapshot
  error?: string
}

export interface GameMovePayload {
  roomId:     string
  pieceId:    string
  targetRow:  number
  targetCol:  number
  targetSize: Size
}
export interface GameMoveAck { ok: boolean; error?: string }

export interface RematchPayload { roomId: string }
export interface GameStartPayload { roomId: string }

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (res: RoomCreateAck) => void) => void
  'room:join':   (payload: RoomJoinPayload,   ack: (res: RoomJoinAck)   => void) => void
  'game:move':   (payload: GameMovePayload,   ack: (res: GameMoveAck)   => void) => void
  'game:rematch':(payload: RematchPayload) => void
  'game:start':  (payload: GameStartPayload) => void
}

// ── Server → Client ──────────────────────────────────────────────

export interface PlayerInfo {
  slot:     PlayerSlot
  username: string
  socketId: string
}

export interface RoomStateSnapshot {
  roomId:      string
  players:     PlayerInfo[]
  phase:       'waiting' | 'playing' | 'finished'
  playerCount: number
}

export interface GameStateSnapshot {
  board:         Board
  inventories:   Record<PlayerSlot, Piece[]>
  currentPlayer: PlayerSlot
  moveNumber:    number
  players:       PlayerSlot[]
}

export interface GameOverPayload {
  winResult:  WinResult | null
  finalState: GameStateSnapshot
}

export interface ServerToClientEvents {
  'room:state':    (state: RoomStateSnapshot)    => void
  'game:state':    (state: GameStateSnapshot)    => void
  'game:over':     (result: GameOverPayload)     => void
  'player:joined': (payload: { username: string; slot: PlayerSlot }) => void
  'player:left':   (payload: { username: string; slot: PlayerSlot; permanent: boolean }) => void
  'error':         (payload: { code: string; message: string }) => void
}
