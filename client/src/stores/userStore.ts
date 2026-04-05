import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'st_username'

export const useUserStore = defineStore('user', () => {
  const username = ref<string | null>(localStorage.getItem(STORAGE_KEY))

  function setUsername(name: string) {
    username.value = name.trim()
    localStorage.setItem(STORAGE_KEY, username.value)
  }

  function clearUsername() {
    username.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { username, setUsername, clearUsername }
})
