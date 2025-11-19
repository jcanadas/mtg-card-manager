import axios from 'axios'
import type { CardPrice } from '@/types/card'

// Note: These are mock implementations as most card sites don't have public APIs
// In production, you'd need to:
// 1. Use official APIs if available (TCGPlayer has a partner API)
// 2. Set up a backend proxy for web scraping
// 3. Use third-party services like Scryfall's price data

const SCRYFALL_API = 'https://api.scryfall.com'

export const priceApi = {
  async fetchPrices(scryfallId: string, cardName: string, isFoil: boolean = false): Promise<CardPrice[]> {
    const prices: CardPrice[] = []
    const timestamp = new Date().toISOString()

    try {
      // Fetch from Scryfall (which aggregates some price data)
      const response = await axios.get(`${SCRYFALL_API}/cards/${scryfallId}`)
      const card = response.data

      // Select price field based on foil/non-foil
      const priceField = isFoil ? 'usd_foil' : 'usd'

      // TCGPlayer prices from Scryfall
      if (card.prices?.[priceField]) {
        prices.push({
          source: 'tcgplayer',
          price: parseFloat(card.prices[priceField]),
          url: card.purchase_uris?.tcgplayer || `https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(cardName)}`,
          timestamp,
          condition: 'Near Mint'
        })
      }

      // Note: Card Kingdom and CoolStuffInc don't have public APIs
      // Scryfall only provides TCGPlayer and Cardmarket prices in their API
      // To get real prices from these stores, you would need to:
      // 1. Set up a backend web scraper
      // 2. Use a third-party aggregation service
      // 3. Manually check the stores

      // For now, these sources are not included to avoid showing inaccurate data
    } catch (error) {
      console.error('Error fetching prices:', error)
    }

    return prices
  },

  async fetchBulkPrices(cards: Array<{ scryfallId: string; cardName: string }>): Promise<Map<string, CardPrice[]>> {
    const priceMap = new Map<string, CardPrice[]>()

    // Fetch prices for each card (with rate limiting)
    for (const card of cards) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Rate limit: 10 req/sec
      const prices = await this.fetchPrices(card.scryfallId, card.cardName)
      priceMap.set(card.scryfallId, prices)
    }

    return priceMap
  },

  findCheapestPrice(prices: CardPrice[]): CardPrice | null {
    if (prices.length === 0) return null
    return prices.reduce((min, price) => price.price < min.price ? price : min)
  }
}
