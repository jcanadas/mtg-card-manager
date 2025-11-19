import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WishlistCard, CardWithPrices, CardPrice, PriceHistoryEntry } from '@/types/card'
import { priceApi } from '@/services/priceApi'
import { dataApi } from '@/services/dataApi'

export const useWishlistStore = defineStore('wishlist', () => {
  const cards = ref<WishlistCard[]>([])
  const priceCache = ref<Map<string, CardPrice[]>>(new Map())
  const priceHistory = ref<Map<string, PriceHistoryEntry[]>>(new Map())
  const lastUpdate = ref<string | null>(null)
  const loading = ref(false)

  // Load from localStorage (for price cache and history only)
  const loadPriceCacheFromStorage = () => {
    const stored = localStorage.getItem('mtg-wishlist-prices')
    if (stored) {
      const data = JSON.parse(stored)
      priceCache.value = new Map(Object.entries(data.priceCache || {}))
      priceHistory.value = new Map(Object.entries(data.priceHistory || {}))
      lastUpdate.value = data.lastUpdate || null
    }
  }

  // Save price cache to localStorage
  const savePriceCacheToStorage = () => {
    const data = {
      priceCache: Object.fromEntries(priceCache.value),
      priceHistory: Object.fromEntries(priceHistory.value),
      lastUpdate: lastUpdate.value
    }
    localStorage.setItem('mtg-wishlist-prices', JSON.stringify(data))
  }

  // Load wishlist from API
  const loadWishlist = async () => {
    loading.value = true
    try {
      cards.value = await dataApi.getWishlist()
      loadPriceCacheFromStorage()
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      loading.value = false
    }
  }

  // Add card to wishlist
  const addCard = async (card: WishlistCard) => {
    if (!cards.value.find(c => c.scryfallId === card.scryfallId)) {
      try {
        cards.value = await dataApi.addToWishlist(card)
      } catch (error) {
        console.error('Error adding card:', error)
        throw error
      }
    }
  }

  // Remove card from wishlist
  const removeCard = async (scryfallId: string) => {
    try {
      cards.value = await dataApi.removeFromWishlist(scryfallId)
      priceCache.value.delete(scryfallId)
      priceHistory.value.delete(scryfallId)
      savePriceCacheToStorage()
    } catch (error) {
      console.error('Error removing card:', error)
      throw error
    }
  }

  // Update card details
  const updateCard = async (scryfallId: string, updates: Partial<WishlistCard>) => {
    try {
      cards.value = await dataApi.updateWishlistCard(scryfallId, updates)
    } catch (error) {
      console.error('Error updating card:', error)
      throw error
    }
  }

  // Fetch prices for a specific card
  const fetchCardPrices = async (cardId: string) => {
    const card = cards.value.find(c => c.id === cardId)
    if (!card || !card.scryfallId) return

    const prices = await priceApi.fetchPrices(card.scryfallId, card.name, card.isFoil || false)
    priceCache.value.set(cardId, prices)

    // Update price history
    const today = new Date().toISOString().split('T')[0] as string
    const history = priceHistory.value.get(cardId) || []

    const tcgPrice = prices.find(p => p.source === 'tcgplayer')
    const ckPrice = prices.find(p => p.source === 'cardkingdom')
    const csiPrice = prices.find(p => p.source === 'coolstuffinc')

    const todayEntry: PriceHistoryEntry = {
      date: today,
      tcgplayer: tcgPrice?.price,
      cardkingdom: ckPrice?.price,
      coolstuffinc: csiPrice?.price
    }

    // Check if we already have an entry for today
    const existingIndex = history.findIndex(h => h.date === today)
    if (existingIndex >= 0) {
      history[existingIndex] = todayEntry
    } else {
      history.push(todayEntry)
    }

    // Keep only last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const filteredHistory = history.filter(h => new Date(h.date) >= thirtyDaysAgo)

    priceHistory.value.set(cardId, filteredHistory)
    lastUpdate.value = new Date().toISOString()
    savePriceCacheToStorage()
  }

  // Fetch prices for all cards
  const fetchAllPrices = async () => {
    for (const card of cards.value) {
      await fetchCardPrices(card.id)
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Get cards with their current prices
  const cardsWithPrices = computed((): CardWithPrices[] => {
    return cards.value.map(card => ({
      ...card,
      prices: priceCache.value.get(card.id) || [],
      priceHistory: priceHistory.value.get(card.id) || []
    }))
  })

  // Get cheapest price for a card
  const getCheapestPrice = (cardId: string): CardPrice | null => {
    const prices = priceCache.value.get(cardId)
    return prices ? priceApi.findCheapestPrice(prices) : null
  }

  // Get price trend (up, down, stable)
  const getPriceTrend = (cardId: string): 'up' | 'down' | 'stable' | 'unknown' => {
    const history = priceHistory.value.get(cardId)
    if (!history || history.length < 2) return 'unknown'

    // Compare average of last 3 days vs previous 3 days
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date))
    const recentAvg = sortedHistory.slice(0, 3).reduce((sum, entry) => {
      const avg = ((entry.tcgplayer || 0) + (entry.cardkingdom || 0) + (entry.coolstuffinc || 0)) / 3
      return sum + avg
    }, 0) / Math.min(3, sortedHistory.length)

    const olderAvg = sortedHistory.slice(3, 6).reduce((sum, entry) => {
      const avg = ((entry.tcgplayer || 0) + (entry.cardkingdom || 0) + (entry.coolstuffinc || 0)) / 3
      return sum + avg
    }, 0) / Math.min(3, sortedHistory.slice(3, 6).length)

    if (olderAvg === 0) return 'unknown'

    const change = ((recentAvg - olderAvg) / olderAvg) * 100

    if (change > 5) return 'up'
    if (change < -5) return 'down'
    return 'stable'
  }

  const markAsOrdered = async (scryfallId: string, source: 'tcgplayer' | 'cardkingdom' | 'coolstuffinc' | 'ebay' | 'other') => {
    const card = cards.value.find(c => c.scryfallId === scryfallId)
    if (card) {
      const updates = {
        ordered: {
          isOrdered: true,
          source,
          orderedDate: new Date().toISOString()
        }
      }
      await updateCard(scryfallId, updates)
    }
  }

  const unmarkAsOrdered = async (scryfallId: string) => {
    const card = cards.value.find(c => c.scryfallId === scryfallId)
    if (card) {
      await updateCard(scryfallId, { ordered: undefined })
    }
  }

  const getCardWithHistory = (cardId: string) => {
    const card = cards.value.find(c => c.id === cardId)
    const history = priceHistory.value.get(cardId) || []
    return { card, history }
  }

  // Initialize store
  loadPriceCacheFromStorage()

  return {
    cards,
    cardsWithPrices,
    lastUpdate,
    loading,
    loadWishlist,
    addCard,
    removeCard,
    updateCard,
    fetchCardPrices,
    fetchAllPrices,
    getCheapestPrice,
    getPriceTrend,
    markAsOrdered,
    unmarkAsOrdered,
    getCardWithHistory
  }
})
