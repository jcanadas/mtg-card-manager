import axios from 'axios'

export interface MoxfieldDeckData {
  id: string
  name: string
  format: string
  main?: {
    color_identity?: string[]
    colors?: string[]
    [key: string]: unknown
  }
  mainboard?: Record<string, unknown>
  sideboard?: Record<string, unknown>
  commanders?: Record<string, unknown>
  description?: string
  lastUpdatedAtUtc?: string
  viewCount?: number
  publicUrl?: string
  createdByUser?: {
    userName: string
    displayName: string
  }
}

/**
 * Extract deck ID from Moxfield URL
 * Supports formats like:
 * - https://www.moxfield.com/decks/8JC3iRLYb0yEaUGMEMRN_g
 * - moxfield.com/decks/8JC3iRLYb0yEaUGMEMRN_g
 * - 8JC3iRLYb0yEaUGMEMRN_g (direct ID)
 */
export function extractMoxfieldDeckId(urlOrId: string): string | null {
  if (!urlOrId) return null

  // If it's already just an ID (no slashes or dots), return it
  if (!urlOrId.includes('/') && !urlOrId.includes('.')) {
    return urlOrId.trim()
  }

  // Extract from URL
  const match = urlOrId.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
  return match ? (match[1] || null) : null
}

/**
 * Fetch deck data from Moxfield API via proxy server
 */
export async function fetchMoxfieldDeck(deckId: string): Promise<MoxfieldDeckData | null> {
  try {
    // Use local proxy server to avoid CORS issues
    const response = await axios.get(`http://localhost:3001/api/moxfield/${deckId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching Moxfield deck:', error)
    return null
  }
}

/**
 * Get color identity from Moxfield deck URL
 */
export async function getColorIdentityFromUrl(moxfieldUrl: string): Promise<string[] | null> {
  const deckId = extractMoxfieldDeckId(moxfieldUrl)
  if (!deckId) return null

  const deckData = await fetchMoxfieldDeck(deckId)
  if (!deckData) return null

  // Try multiple locations for color identity in the Moxfield API response
  // 1. Top-level commanders object (for Commander decks)
  if (deckData.commanders) {
    const commanderCards = Object.values(deckData.commanders)
    if (commanderCards.length > 0) {
      const commander = commanderCards[0] as Record<string, unknown>
      const commanderCard = commander.card as Record<string, unknown> | undefined
      if (commanderCard?.colors && Array.isArray(commanderCard.colors)) {
        return commanderCard.colors as string[]
      }
    }
  }

  // 2. Main/mainboard color_identity or colors
  const colors = deckData.main?.color_identity || deckData.main?.colors || []

  // 3. If still no colors, try to get from all cards in mainboard
  if (colors.length === 0 && deckData.mainboard) {
    const allColors = new Set<string>()
    Object.values(deckData.mainboard).forEach((cardEntry) => {
      const entry = cardEntry as Record<string, unknown>
      const card = entry.card as Record<string, unknown> | undefined
      if (card?.colors && Array.isArray(card.colors)) {
        card.colors.forEach((color: unknown) => {
          if (typeof color === 'string') allColors.add(color)
        })
      }
    })
    if (allColors.size > 0) {
      return Array.from(allColors)
    }
  }

  return colors.length > 0 ? colors : null
}
