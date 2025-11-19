import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WishlistCard } from '@/types/card'
import { dataApi } from '@/services/dataApi'

export const usePurchasedStore = defineStore('purchased', () => {
  const cards = ref<WishlistCard[]>([])
  const loading = ref(false)

  // Load purchases from API
  const loadPurchases = async () => {
    loading.value = true
    try {
      cards.value = await dataApi.getPurchases()
    } catch (error) {
      console.error('Failed to load purchases:', error)
    } finally {
      loading.value = false
    }
  }

  const addPurchasedCard = async (card: WishlistCard) => {
    try {
      cards.value = await dataApi.addPurchase(card)
    } catch (error) {
      console.error('Failed to add purchase:', error)
      throw error
    }
  }

  const removePurchasedCard = async (scryfallId: string) => {
    try {
      cards.value = await dataApi.removePurchase(scryfallId)
    } catch (error) {
      console.error('Failed to remove purchase:', error)
      throw error
    }
  }

  const sortedCards = computed(() => {
    return [...cards.value].sort((a, b) => {
      const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0
      const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0
      return dateB - dateA // Most recent first
    })
  })

  return {
    cards,
    sortedCards,
    loading,
    loadPurchases,
    addPurchasedCard,
    removePurchasedCard
  }
})
