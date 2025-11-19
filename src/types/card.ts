export interface MTGCard {
  id: string
  name: string
  set: string
  setName: string
  imageUrl?: string
  scryfallId?: string
  addedDate: string
  collectorNumber?: string
  rarity?: string
  releasedAt?: string
  finishes?: string[]
  frameEffects?: string[]
  borderColor?: string
  tcgplayerUrl?: string
}

export interface CardPrice {
  source: 'tcgplayer' | 'cardkingdom' | 'coolstuffinc'
  price: number
  url: string
  timestamp: string
  condition?: string
}

export interface CardWithPrices extends WishlistCard {
  prices: CardPrice[]
  priceHistory: PriceHistoryEntry[]
}

export interface PriceHistoryEntry {
  date: string
  tcgplayer?: number
  cardkingdom?: number
  coolstuffinc?: number
}

export interface WishlistCard extends MTGCard {
  notes?: string
  priority?: 'low' | 'medium' | 'high'
  isFoil?: boolean
  deckId?: string
  manualPrices?: {
    cardkingdom?: number
    coolstuffinc?: number
  }
  printing?: {
    set: string
    setName: string
    collectorNumber: string
    imageUrl?: string
  }
  ordered?: {
    isOrdered: boolean
    source?: 'tcgplayer' | 'cardkingdom' | 'coolstuffinc' | 'ebay' | 'other'
    orderedDate?: string
  }
  orderedFrom?: string
  orderedAt?: Date | string
  receivedAt?: Date | string
  purchasePrice?: number
}

export interface PurchasedCard extends WishlistCard {
  purchaseInfo: {
    source: 'tcgplayer' | 'cardkingdom' | 'coolstuffinc' | 'ebay' | 'other'
    orderedDate: string
    receivedDate: string
    priceAtPurchase?: number
  }
  priceHistory: PriceHistoryEntry[]
}

export interface Deck {
  id: string
  name: string
  description?: string
  moxfieldUrl?: string
  colorIdentity?: string[]
  createdAt: string
}
