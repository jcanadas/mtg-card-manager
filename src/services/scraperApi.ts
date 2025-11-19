import axios from 'axios'

const SCRAPER_API = 'http://localhost:3001/api'

export interface ScrapeResult {
  success: boolean
  price: number | null
  source: 'cardkingdom' | 'coolstuffinc'
  cardName: string
  timestamp: string
  error?: string
}

export const scraperApi = {
  async scrapeSinglePrice(
    cardName: string,
    setCode: string,
    source: 'cardkingdom' | 'coolstuffinc',
    isFoil: boolean = false
  ): Promise<ScrapeResult> {
    try {
      const response = await axios.post(`${SCRAPER_API}/scrape-price`, {
        cardName,
        setCode,
        source,
        isFoil
      })
      return response.data
    } catch (error) {
      console.error('Error scraping price:', error)
      return {
        success: false,
        price: null,
        source,
        cardName,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async scrapeBulkPrices(
    cards: Array<{
      cardId: string
      cardName: string
      setCode: string
      source: 'cardkingdom' | 'coolstuffinc'
      isFoil?: boolean
    }>
  ): Promise<Array<ScrapeResult & { cardId: string }>> {
    try {
      const response = await axios.post(`${SCRAPER_API}/scrape-prices-bulk`, {
        cards
      })
      return response.data.results
    } catch (error) {
      console.error('Error scraping bulk prices:', error)
      return cards.map(card => ({
        cardId: card.cardId,
        success: false,
        price: null,
        source: card.source,
        cardName: card.cardName,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }
}
