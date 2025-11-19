import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService, type User } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  async function checkAuth() {
    loading.value = true
    try {
      user.value = await authService.getCurrentUser()
    } finally {
      loading.value = false
    }
  }

  function login() {
    authService.loginWithGoogle()
  }

  async function logout() {
    await authService.logout()
    user.value = null
  }

  return {
    user,
    loading,
    checkAuth,
    login,
    logout
  }
})
