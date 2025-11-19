import axios from 'axios'
import type { MTGCard } from '@/types/card'

const SCRYFALL_API = 'https://api.scryfall.com'

export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  collector_number: string
  rarity: string
  released_at: string
  finishes: string[]
  frame_effects?: string[]
  border_color: string
  purchase_uris?: {
    tcgplayer?: string
    cardmarket?: string
    cardhoarder?: string
  }
  image_uris?: {
    small: string
    normal: string
    large: string
  }
  card_faces?: Array<{
    image_uris?: {
      small: string
      normal: string
      large: string
    }
  }>
}

export const scryfallApi = {
  async searchCards(query: string): Promise<MTGCard[]> {
    try {
      const response = await axios.get(`${SCRYFALL_API}/cards/search`, {
        params: {
          q: query,
          order: 'name'
        }
      })

      return response.data.data.map((card: ScryfallCard) => ({
        id: card.id,
        name: card.name,
        set: card.set,
        setName: card.set_name,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
        scryfallId: card.id,
        addedDate: new Date().toISOString(),
        collectorNumber: card.collector_number,
        rarity: card.rarity,
        releasedAt: card.released_at,
        finishes: card.finishes,
        frameEffects: card.frame_effects?.filter(effect => ['showcase', 'extendedart'].includes(effect)),
        borderColor: card.border_color
      }))
    } catch (error) {
      console.error('Error searching cards:', error)
      return []
    }
  },

  async getCard(id: string): Promise<MTGCard | null> {
    try {
      const response = await axios.get(`${SCRYFALL_API}/cards/${id}`)
      const card: ScryfallCard = response.data

      return {
        id: card.id,
        name: card.name,
        set: card.set,
        setName: card.set_name,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
        scryfallId: card.id,
        addedDate: new Date().toISOString(),
        collectorNumber: card.collector_number,
        rarity: card.rarity,
        releasedAt: card.released_at,
        finishes: card.finishes,
        frameEffects: card.frame_effects?.filter(effect => ['showcase', 'extendedart'].includes(effect)),
        borderColor: card.border_color,
        tcgplayerUrl: card.purchase_uris?.tcgplayer
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      return null
    }
  },

  async searchPrintings(cardName: string): Promise<MTGCard[]> {
    try {
      const response = await axios.get(`${SCRYFALL_API}/cards/search`, {
        params: {
          q: `!"${cardName}"`,
          unique: 'prints',
          order: 'released'
        }
      })

      return response.data.data.map((card: ScryfallCard) => ({
        id: card.id,
        name: card.name,
        set: card.set,
        setName: card.set_name,
        imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
        scryfallId: card.id,
        addedDate: new Date().toISOString(),
        collectorNumber: card.collector_number,
        rarity: card.rarity,
        releasedAt: card.released_at,
        finishes: card.finishes,
        frameEffects: card.frame_effects?.filter(effect => ['showcase', 'extendedart'].includes(effect)),
        borderColor: card.border_color,
        tcgplayerUrl: card.purchase_uris?.tcgplayer
      }))
    } catch (error) {
      console.error('Error searching printings:', error)
      return []
    }
  }
}
