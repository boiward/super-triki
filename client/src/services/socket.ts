import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let _socket: AppSocket | null = null

export function getSocket(): AppSocket {
  if (!_socket) {
    _socket = io(import.meta.env.VITE_SERVER_URL as string, {
      autoConnect: false,
      transports: ['websocket'],
    })
  }
  return _socket
}

export function connectSocket(): void {
  getSocket().connect()
}

export function disconnectSocket(): void {
  _socket?.disconnect()
  _socket = null
}
