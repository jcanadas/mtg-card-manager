import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Deck as ApiDeck } from '@/services/dataApi'
import { getColorIdentityFromUrl } from '@/services/moxfieldApi'
import { useWishlistStore } from './wishlist'
import { dataApi } from '@/services/dataApi'

export const useDeckStore = defineStore('deck', () => {
  const decks = ref<ApiDeck[]>([])
  const loading = ref(false)

  // Load decks from API
  const loadDecks = async () => {
    loading.value = true
    try {
      decks.value = await dataApi.getDecks()
    } catch (error) {
      console.error('Failed to load decks:', error)
    } finally {
      loading.value = false
    }
  }

  const addDeck = async (name: string, url: string) => {
    try {
      // Fetch color identity from Moxfield
      const colorIdentity = await getColorIdentityFromUrl(url)

      const newDeck = await dataApi.createDeck({
        name,
        url,
        colorIdentity: colorIdentity || [],
        cards: []
      })

      decks.value.push(newDeck)
      return newDeck
    } catch (error) {
      console.error('Failed to add deck:', error)
      throw error
    }
  }

  const removeDeck = async (id: string) => {
    try {
      await dataApi.deleteDeck(id)
      decks.value = decks.value.filter((d) => d._id !== id)
    } catch (error) {
      console.error('Failed to remove deck:', error)
      throw error
    }
  }

  const getDeckById = (id: string) => {
    return decks.value.find((d) => d._id === id)
  }

  const sortedDecks = computed(() => {
    const wishlistStore = useWishlistStore()

    return [...decks.value].sort((a, b) => {
      const aCardCount = wishlistStore.cards.filter(card => card.deckId === a._id).length
      const bCardCount = wishlistStore.cards.filter(card => card.deckId === b._id).length

      // Empty decks (0 cards) go to the bottom
      if (aCardCount === 0 && bCardCount > 0) return 1
      if (bCardCount === 0 && aCardCount > 0) return -1

      // Otherwise sort alphabetically by name
      return a.name.localeCompare(b.name)
    })
  })

  return {
    decks,
    sortedDecks,
    loading,
    loadDecks,
    addDeck,
    removeDeck,
    getDeckById
  }
})
