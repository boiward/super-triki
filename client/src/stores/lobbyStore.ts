import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PublicRoomInfo } from '@/types/socket'

export const useLobbyStore = defineStore('lobby', () => {
  const publicRooms = ref<PublicRoomInfo[]>([])

  function setRooms(rooms: PublicRoomInfo[]) {
    publicRooms.value = rooms
  }

  return { publicRooms, setRooms }
})
