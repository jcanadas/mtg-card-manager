import axios from 'axios'
import type { WishlistCard } from '@/types/card'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

export interface Deck {
  _id: string
  name: string
  url: string
  colorIdentity: string[]
  cards: WishlistCard[]
  createdAt: string
  updatedAt: string
}

export const dataApi = {
  // Wishlist endpoints
  async getWishlist(): Promise<WishlistCard[]> {
    const response = await api.get('/api/wishlist')
    return response.data
  },

  async addToWishlist(card: WishlistCard): Promise<WishlistCard[]> {
    const response = await api.post('/api/wishlist', { card })
    return response.data
  },

  async updateWishlistCard(scryfallId: string, updates: Partial<WishlistCard>): Promise<WishlistCard[]> {
    const response = await api.put(`/api/wishlist/${scryfallId}`, updates)
    return response.data
  },

  async removeFromWishlist(scryfallId: string): Promise<WishlistCard[]> {
    const response = await api.delete(`/api/wishlist/${scryfallId}`)
    return response.data
  },

  // Deck endpoints
  async getDecks(): Promise<Deck[]> {
    const response = await api.get('/api/decks')
    return response.data
  },

  async createDeck(deck: { name: string; url: string; colorIdentity: string[]; cards: WishlistCard[] }): Promise<Deck> {
    const response = await api.post('/api/decks', deck)
    return response.data
  },

  async getDeck(id: string): Promise<Deck> {
    const response = await api.get(`/api/decks/${id}`)
    return response.data
  },

  async updateDeckCard(deckId: string, scryfallId: string, updates: Partial<WishlistCard>): Promise<Deck> {
    const response = await api.put(`/api/decks/${deckId}/cards/${scryfallId}`, updates)
    return response.data
  },

  async deleteDeck(id: string): Promise<void> {
    await api.delete(`/api/decks/${id}`)
  },

  // Purchase endpoints
  async getPurchases(): Promise<WishlistCard[]> {
    const response = await api.get('/api/purchases')
    return response.data
  },

  async addPurchase(card: WishlistCard): Promise<WishlistCard[]> {
    const response = await api.post('/api/purchases', { card })
    return response.data
  },

  async removePurchase(scryfallId: string): Promise<WishlistCard[]> {
    const response = await api.delete(`/api/purchases/${scryfallId}`)
    return response.data
  }
}
