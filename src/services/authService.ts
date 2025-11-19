import axios from 'axios'

const API_URL = 'http://localhost:3001'

export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
}

// Configure axios to send credentials with requests
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/user')
      return response.data.user
    } catch (error) {
      return null
    }
  },

  loginWithGoogle(): void {
    window.location.href = `${API_URL}/auth/google`
  },

  async logout(): Promise<void> {
    await api.get('/auth/logout')
  }
}
