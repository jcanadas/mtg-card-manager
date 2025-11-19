<template>
    <div class="card-search">
        <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Search for Magic cards..." @keyup.enter="search"
                class="search-input" />
            <button @click="search" :disabled="loading" class="search-button">
                {{ loading ? 'Searching...' : 'Search' }}
            </button>
        </div>

        <div v-if="loading" class="loading">Searching for cards...</div>

        <div v-if="results.length > 0" class="results">
            <div v-for="card in results" :key="card.id" class="card-result">
                <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="card-image" />
                <div class="card-info">
                    <div class="card-header">
                        <h3>{{ card.name }}</h3>
                        <a v-if="card.tcgplayerUrl" :href="card.tcgplayerUrl" target="_blank" rel="noopener noreferrer"
                            class="tcgplayer-link-header">
                            🛒 TCGPlayer
                        </a>
                    </div>
                    <p class="set-info">
                        {{ card.setName }} ({{ card.set.toUpperCase() }})
                        <span v-if="card.collectorNumber"> #{{ card.collectorNumber }}</span>
                    </p>
                    <p class="card-meta">
                        <span class="rarity" :class="`rarity-${card.rarity}`">{{ formatRarity(card.rarity) }}</span>
                        <span v-if="card.releasedAt" class="release-date">{{ formatDate(card.releasedAt) }}</span>
                    </p>
                    <div v-if="card.finishes && card.finishes.length > 0" class="finishes">
                        <strong>Available finishes:</strong>
                        <span v-for="finish in card.finishes" :key="finish" class="finish-badge">
                            {{ formatFinish(finish) }}
                        </span>
                    </div>
                    <div v-if="card.frameEffects && card.frameEffects.length > 0" class="frame-effects">
                        <strong>Frame:</strong>
                        <span v-for="effect in card.frameEffects" :key="effect" class="effect-badge">
                            {{ formatFrameEffect(effect) }}
                        </span>
                    </div>
                    <div class="price-display">
                        <div v-if="loadingPrices.has(card.id)" class="price-loading">
                            Loading prices...
                        </div>
                        <div v-else-if="cardPrices.has(card.id)" class="prices-list">
                            <div v-for="price in cardPrices.get(card.id)" :key="price.source" class="price-item-small">
                                <span class="price-source">{{ formatSource(price.source) }}:</span>
                                <span class="price-value"
                                    :class="{ cheapest: getCheapestPrice(card.id)?.source === price.source }">
                                    {{ formatPrice(price.price) }}
                                </span>
                            </div>
                            <div v-if="getCheapestPrice(card.id)" class="best-price">
                                💰 Best: {{ formatPrice(getCheapestPrice(card.id)!.price) }} at {{
                                    formatSource(getCheapestPrice(card.id)!.source) }}
                            </div>
                        </div>
                    </div>
                    <div class="add-options">
                        <div class="foil-toggle" v-if="card.finishes && card.finishes.includes('foil')">
                            <span class="toggle-label">✨ Foil</span>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="foilSelections[card.id]"
                                    @change="onFoilChange(card.id, card.scryfallId, card.name)" />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="deck-selector">
                            <label>Deck:</label>
                            <select v-model="deckSelections[card.id]" class="deck-select">
                                <option :value="undefined">No deck</option>
                                <option v-for="deck in deckStore.sortedDecks" :key="deck._id" :value="deck._id">
                                    {{ deck.name }}
                                </option>
                            </select>
                        </div>
                        <button @click="addToWishlist(card)" class="add-button">
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!loading && searched && results.length === 0" class="no-results">
            No cards found. Try a different search term.
        </div>

        <div v-if="showToast" class="toast-notification">
            {{ toastMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { scryfallApi } from '@/services/scryfallApi'
import { priceApi } from '@/services/priceApi'
import { useWishlistStore } from '@/stores/wishlist'
import { useDeckStore } from '@/stores/deck'
import type { MTGCard, CardPrice } from '@/types/card'
import { format } from 'date-fns'

const wishlistStore = useWishlistStore()
const deckStore = useDeckStore()

const searchQuery = ref('')
const results = ref<MTGCard[]>([])
const loading = ref(false)
const searched = ref(false)
const foilSelections = ref<Record<string, boolean>>({})
const deckSelections = ref<Record<string, string | undefined>>({})
const cardPrices = ref<Map<string, CardPrice[]>>(new Map())
const loadingPrices = ref<Set<string>>(new Set())
const toastMessage = ref('')
const showToast = ref(false)

const displayToast = (message: string) => {
    toastMessage.value = message
    showToast.value = true
    setTimeout(() => {
        showToast.value = false
    }, 3000)
}

const search = async () => {
    if (!searchQuery.value.trim()) return

    loading.value = true
    searched.value = true
    foilSelections.value = {}

    try {
        // Search for unique card names first
        const uniqueResults = await scryfallApi.searchCards(searchQuery.value + ' unique:cards')
        if (uniqueResults.length > 0) {
            // Get all printings for each unique card
            const allPrintings: MTGCard[] = []
            for (const card of uniqueResults) {
                const printings = await scryfallApi.searchPrintings(card.name)
                allPrintings.push(...printings)
                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            results.value = allPrintings
        }

        // Initialize foil selections as false
        results.value.forEach(card => {
            foilSelections.value[card.id] = false
        })

        // Fetch prices for all results
        fetchPricesForResults()
    } finally {
        loading.value = false
    }
}

const fetchPricesForResults = async () => {
    for (const card of results.value) {
        if (card.scryfallId) {
            fetchPricesForCard(card.id, card.scryfallId, card.name)
        }
    }
}

const fetchPricesForCard = async (cardId: string, scryfallId: string, cardName: string) => {
    loadingPrices.value.add(cardId)
    try {
        // Determine if foil is selected
        const isFoil = foilSelections.value[cardId] || false
        const prices = await priceApi.fetchPrices(scryfallId, cardName, isFoil)
        cardPrices.value.set(cardId, prices)
    } finally {
        loadingPrices.value.delete(cardId)
    }
}

const getCheapestPrice = (cardId: string): CardPrice | null => {
    const prices = cardPrices.value.get(cardId)
    return prices ? priceApi.findCheapestPrice(prices) : null
}

const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
}

const formatSource = (source: string) => {
    const sourceMap: Record<string, string> = {
        tcgplayer: 'TCGPlayer',
        cardkingdom: 'Card Kingdom',
        coolstuffinc: 'CoolStuffInc'
    }
    return sourceMap[source] || source
}

const onFoilChange = (cardId: string, scryfallId: string | undefined, cardName: string) => {
    if (scryfallId) {
        fetchPricesForCard(cardId, scryfallId, cardName)
    }
}

const formatRarity = (rarity?: string) => {
    if (!rarity) return ''
    return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
}

const formatFinish = (finish: string) => {
    const finishMap: Record<string, string> = {
        foil: '✨ Foil',
        nonfoil: '📄 Non-foil',
        etched: '🎨 Etched'
    }
    return finishMap[finish] || finish
}

const formatFrameEffect = (effect: string) => {
    const effectMap: Record<string, string> = {
        showcase: '🌟 Showcase',
        extendedart: '🖼️ Extended Art',
        borderless: '🔲 Borderless',
        inverted: '🔄 Inverted',
        fullart: '🎨 Full Art',
        textless: '📝 Textless'
    }
    return effectMap[effect] || effect.replace(/_/g, ' ')
}

const addToWishlist = (card: MTGCard) => {
    const isFoil = foilSelections.value[card.id] || false
    const selectedDeckId = deckSelections.value[card.id]

    wishlistStore.addCard({
        ...card,
        priority: 'medium',
        isFoil,
        deckId: selectedDeckId,
        printing: {
            set: card.set,
            setName: card.setName,
            collectorNumber: card.collectorNumber || '',
            imageUrl: card.imageUrl
        }
    })

    const finishText = isFoil ? ' (✨ Foil)' : ''
    const deck = selectedDeckId ? deckStore.getDeckById(selectedDeckId) : null
    const deckText = deck ? ` for ${deck.name}` : ''
    displayToast(`✓ ${card.name}${finishText}${deckText} added to wishlist!`)
}
</script>

<style scoped>
.card-search {
    padding: 20px;
}

.search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
}

.search-input {
    flex: 1;
    padding: 12px;
    font-size: 16px;
    border: 2px solid #ddd;
    border-radius: 8px;
    outline: none;
}

.search-input:focus {
    border-color: #4a90e2;
}

.search-button {
    padding: 12px 24px;
    font-size: 16px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.search-button:hover:not(:disabled) {
    background-color: #357abd;
}

.search-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 20px;
    color: #666;
}

.results {
    display: grid;
    gap: 20px;
}

.card-result {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    transition: box-shadow 0.2s;
}

.card-result:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-image {
    width: 200px;
    height: auto;
    border-radius: 8px;
    object-fit: contain;
}

.card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.card-info h3 {
    margin: 0;
    color: #333;
    flex: 1;
}

.tcgplayer-link-header {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background-color: #4a90e2;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
    white-space: nowrap;
}

.tcgplayer-link-header:hover {
    background-color: #357abd;
}

.set-info {
    color: #666;
    margin: 0 0 12px 0;
}

.add-button {
    align-self: flex-start;
    padding: 8px 16px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.add-button:hover {
    background-color: #218838;
}

.no-results {
    text-align: center;
    padding: 40px;
    color: #666;
}

.card-meta {
    display: flex;
    gap: 15px;
    margin: 8px 0;
    font-size: 14px;
}

.rarity {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 12px;
}

.rarity-common {
    background: #e0e0e0;
    color: #333;
}

.rarity-uncommon {
    background: #c0d6e4;
    color: #2c5f77;
}

.rarity-rare {
    background: #ffd700;
    color: #856404;
}

.rarity-mythic {
    background: #ff6b35;
    color: white;
}

.release-date {
    color: #666;
}

.add-options {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.foil-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toggle-label {
    font-size: 14px;
    color: #555;
    font-weight: 500;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

.toggle-switch input:checked+.toggle-slider {
    background-color: #4a90e2;
}

.toggle-switch input:checked+.toggle-slider:before {
    transform: translateX(20px);
}

.toggle-switch input:focus+.toggle-slider {
    box-shadow: 0 0 1px #4a90e2;
}

.finishes {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    font-size: 14px;
}

.finishes strong {
    color: #555;
}

.finish-badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.frame-effects {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    font-size: 14px;
}

.frame-effects strong {
    color: #555;
}

.effect-badge {
    background: #fff3e0;
    color: #e65100;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}



.price-display {
    margin: 12px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.price-loading {
    color: #6c757d;
    font-size: 13px;
    font-style: italic;
}

.prices-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.price-item-small {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.price-source {
    color: #495057;
    font-weight: 500;
}

.price-value {
    color: #212529;
    font-weight: 600;
}

.price-value.cheapest {
    color: #28a745;
    font-weight: 700;
}

.best-price {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #dee2e6;
    color: #28a745;
    font-weight: 600;
    font-size: 14px;
}

.printings-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.printings-header h3 {
    margin: 0;
    color: #333;
}

.back-button {
    padding: 8px 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.back-button:hover {
    background-color: #5a6268;
}

.printings-button {
    padding: 8px 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
}

.printings-button:hover {
    background-color: #5a6268;
}

.toast-notification {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: #28a745;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-size: 15px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.deck-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.deck-selector label {
    font-weight: 500;
    font-size: 14px;
    color: #555;
    white-space: nowrap;
}

.deck-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    background: white;
    min-width: 150px;
    transition: border-color 0.2s;
}

.deck-select:hover {
    border-color: #4a90e2;
}

.deck-select:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}
</style>
