<template>
    <div class="wishlist">
        <div class="nav-tabs">
            <router-link to="/" class="nav-tab">My Wishlist</router-link>
            <router-link to="/purchased" class="nav-tab">Purchase History</router-link>
            <div class="user-menu">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user.displayName"
                    class="user-avatar" />
                <span class="user-name">{{ authStore.user?.displayName }}</span>
                <button @click="handleLogout" class="logout-button">Logout</button>
            </div>
        </div>
        <div class="header">
            <div class="actions">
                <button @click="showCardSearch = true" class="add-card-button">
                    ➕ Add Card
                </button>
                <div class="view-toggle">
                    <button @click="viewMode = 'grid'" :class="['view-button', { active: viewMode === 'grid' }]">
                        🔲 Grid
                    </button>
                    <button @click="viewMode = 'list'" :class="['view-button', { active: viewMode === 'list' }]">
                        📋 List
                    </button>
                    <button @click="viewMode = 'deck'" :class="['view-button', { active: viewMode === 'deck' }]">
                        🎴 By Deck
                    </button>
                </div>
                <div class="deck-filter">
                    <label>Filter by Deck:</label>
                    <select v-model="selectedDeckFilter" class="deck-filter-select">
                        <option :value="null">All Cards</option>
                        <option :value="'no-deck'">No Deck</option>
                        <option v-for="deck in deckStore.sortedDecks" :key="deck._id" :value="deck._id">
                            {{ deck.name }}
                        </option>
                    </select>
                </div>
                <button @click="showDeckManager = true" class="manage-decks-button">
                    Manage Decks
                </button>
                <button @click="refreshPrices" :disabled="updating" class="refresh-button">
                    {{ updating ? 'Updating...' : 'Update All Prices' }}
                </button>
                <span v-if="wishlistStore.lastUpdate" class="last-update">
                    Last updated: {{ formatDate(wishlistStore.lastUpdate) }}
                </span>
            </div>
        </div>

        <div v-if="wishlistStore.cards.length === 0" class="empty-state">
            <p>Your wishlist is empty. Search for cards to add them!</p>
        </div>

        <div v-else-if="viewMode === 'grid'" class="wishlist-container grid">
            <div v-for="card in filteredCards" :key="card.id" class="wishlist-card grid">
                <div class="card-header">
                    <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="card-thumbnail" />
                    <div class="card-title-section">
                        <div class="title-row">
                            <h3>{{ card.name }}</h3>
                            <span v-if="card.isFoil" class="foil-badge">✨ Foil</span>
                            <span v-if="card.frameEffects && card.frameEffects.length > 0 && card.frameEffects[0]"
                                class="special-badge">
                                {{ formatFrameEffect(card.frameEffects[0]) }}
                            </span>
                        </div>
                        <p class="set-info">
                            {{ card.setName }} ({{ card.set.toUpperCase() }})
                            <span v-if="card.collectorNumber"> #{{ card.collectorNumber }}</span>
                        </p>
                        <div class="card-details">
                            <span v-if="card.rarity" class="rarity" :class="`rarity-${card.rarity}`">
                                {{ formatRarity(card.rarity) }}
                            </span>
                            <span v-if="card.releasedAt" class="release-date">
                                {{ formatCardDate(card.releasedAt) }}
                            </span>
                        </div>
                        <div class="controls-row">
                            <div class="priority-section">
                                <label>Priority:</label>
                                <select :value="card.priority" @change="updatePriority(card.id, $event)"
                                    class="priority-select">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="price-section">
                    <div v-if="card.prices.length === 0" class="no-prices">
                        <button @click="fetchPrices(card.id)" class="fetch-button">
                            Fetch Prices
                        </button>
                    </div>
                    <div v-else class="prices">
                        <div v-for="price in card.prices" :key="price.source" class="price-item"
                            :class="{ cheapest: isCheapest(card.id, price) }">
                            <div class="price-source">
                                <strong>{{ formatSource(price.source) }}</strong>
                                <span v-if="isCheapest(card.id, price)" class="badge">Cheapest</span>
                            </div>
                            <div class="price-value">${{ price.price.toFixed(2) }}</div>
                            <a :href="price.url" target="_blank" class="buy-link">View →</a>
                        </div>
                    </div>

                    <div v-if="card.priceHistory.length > 1" class="trend-section">
                        <span class="trend-label">Trend:</span>
                        <span class="trend-indicator" :class="getTrendClass(card.id)">
                            {{ getTrendText(card.id) }}
                        </span>
                    </div>
                </div>

                <div class="card-actions">
                    <div v-if="card.ordered?.isOrdered" class="ordered-section">
                        <span class="ordered-badge">Ordered from {{ formatOrderSource(card.ordered.source) }}</span>
                        <div class="ordered-actions">
                            <label class="received-checkbox">
                                <input type="checkbox" @change="markAsReceived(card.id)" />
                                <span>✓ Received</span>
                            </label>
                            <button @click="unmarkOrdered(card.id)" class="cancel-order-button"
                                title="Cancel order">Cancel Order</button>
                        </div>
                    </div>
                    <div v-else class="order-section">
                        <label>Order Status:</label>
                        <select @change="markOrdered(card.id, $event)" class="order-source-select">
                            <option value="">Not ordered</option>
                            <option value="tcgplayer">TCGPlayer</option>
                            <option value="cardkingdom">Card Kingdom</option>
                            <option value="coolstuffinc">CoolStuffInc</option>
                            <option value="ebay">eBay</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <button @click="viewChart(card)" class="chart-button">
                        📊 Price History
                    </button>
                    <button @click="removeCard(card.id)" class="remove-button">
                        Remove
                    </button>
                </div>
            </div>
        </div>

        <table v-else-if="viewMode === 'list'" class="wishlist-table">
            <thead>
                <tr>
                    <th>Card Name</th>
                    <th>Set</th>
                    <th>Deck</th>
                    <th>TCGPlayer</th>
                    <th>Target Price</th>
                    <th>Card Kingdom</th>
                    <th>CoolStuffInc</th>
                    <th>Trend</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="card in filteredCards" :key="card.id" class="table-row">
                    <td class="card-name-cell">
                        <div class="name-badges">
                            <strong>{{ card.name }}</strong>
                            <span v-if="card.isFoil" class="foil-badge-small">FOIL</span>
                            <span v-if="card.frameEffects && card.frameEffects.length > 0 && card.frameEffects[0]"
                                class="special-badge-small">
                                {{ formatFrameEffect(card.frameEffects[0]) }}
                            </span>
                        </div>
                    </td>
                    <td>{{ card.setName }} ({{ card.set.toUpperCase() }})<br /><span class="collector-num">#{{
                        card.collectorNumber }}</span></td>
                    <td>
                        <select :value="card.deckId" @change="updateDeck(card.id, $event)" class="deck-select-small">
                            <option :value="undefined">No deck</option>
                            <option v-for="deck in deckStore.sortedDecks" :key="deck._id" :value="deck._id">
                                {{ deck.name }}
                            </option>
                        </select>
                    </td>
                    <td class="price-cell">{{ formatPriceCell(card, 'tcgplayer') }}</td>
                    <td class="price-cell target-price">{{ formatTargetPrice(card, 'tcgplayer') }}</td>
                    <td class="price-cell">
                        <div class="price-cell-with-scrape">
                            <input type="number" step="0.01" min="0" :value="card.manualPrices?.cardkingdom || ''"
                                @change="updateManualPrice(card.id, 'cardkingdom', $event)" placeholder="$"
                                class="price-input" />
                            <button @click="scrapePrice(card.id, 'cardkingdom')"
                                :disabled="scrapingCards.has(card.id + '-cardkingdom')" class="scrape-button"
                                title="Scrape price from Card Kingdom">
                                {{ scrapingCards.has(card.id + '-cardkingdom') ? '...' : '🔄' }}
                            </button>
                        </div>
                    </td>
                    <td class="price-cell">
                        <div class="price-cell-with-scrape">
                            <input type="number" step="0.01" min="0" :value="card.manualPrices?.coolstuffinc || ''"
                                @change="updateManualPrice(card.id, 'coolstuffinc', $event)" placeholder="$"
                                class="price-input" />
                            <button @click="scrapePrice(card.id, 'coolstuffinc')"
                                :disabled="scrapingCards.has(card.id + '-coolstuffinc')" class="scrape-button"
                                title="Scrape price from CoolStuffInc">
                                {{ scrapingCards.has(card.id + '-coolstuffinc') ? '...' : '🔄' }}
                            </button>
                        </div>
                    </td>
                    <td class="trend-cell">
                        <span v-if="card.priceHistory.length > 1"
                            :class="['trend-indicator-small', getTrendClass(card.id)]">
                            {{ getTrendText(card.id) }}
                        </span>
                    </td>
                    <td class="order-status-cell">
                        <div v-if="card.ordered?.isOrdered" class="ordered-status-container">
                            <div class="ordered-badge-small">
                                {{ formatOrderSource(card.ordered.source) }}
                            </div>
                            <label class="received-checkbox-small">
                                <input type="checkbox" @change="markAsReceived(card.id)" />
                                <span>✓</span>
                            </label>
                            <button @click="unmarkOrdered(card.id)" class="cancel-order-button-small"
                                title="Cancel order">✕</button>
                        </div>
                        <div v-else class="order-controls">
                            <select @change="markOrdered(card.id, $event)" class="order-source-select-small">
                                <option value="">--</option>
                                <option value="tcgplayer">TCG</option>
                                <option value="cardkingdom">CK</option>
                                <option value="coolstuffinc">CSI</option>
                                <option value="ebay">eBay</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </td>
                    <td class="actions-cell">
                        <button @click="viewChart(card)" class="icon-button" title="Price History">📊</button>
                        <button @click="removeCard(card.id)" class="icon-button remove" title="Remove">🗑️</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Deck View -->
        <div v-else-if="viewMode === 'deck'" class="deck-view">
            <div v-if="deckStore.decks.length === 0" class="no-decks-message">
                <p>No decks created yet. Click "Manage Decks" to create one!</p>
            </div>
            <div v-else>
                <!-- Cards with no deck -->
                <div v-if="cardsWithoutDeck.length > 0" class="deck-section">
                    <div class="deck-section-header">
                        <h3>📋 No Deck Assigned</h3>
                        <span class="deck-card-count">{{ cardsWithoutDeck.length }} cards</span>
                    </div>
                    <table class="deck-table">
                        <thead>
                            <tr>
                                <th>Card Name</th>
                                <th>Set</th>
                                <th>TCGPlayer</th>
                                <th>Target Price</th>
                                <th>Card Kingdom</th>
                                <th>CoolStuffInc</th>
                                <th>Trend</th>
                                <th>Order Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="card in cardsWithoutDeck" :key="card.id">
                                <td class="card-name-cell">
                                    <div class="name-badges">
                                        <strong>{{ card.name }}</strong>
                                        <span v-if="card.isFoil" class="foil-badge-small">FOIL</span>
                                        <span
                                            v-if="card.frameEffects && card.frameEffects.length > 0 && card.frameEffects[0]"
                                            class="special-badge-small">
                                            {{ formatFrameEffect(card.frameEffects[0]) }}
                                        </span>
                                    </div>
                                </td>
                                <td>{{ card.setName }} ({{ card.set.toUpperCase() }})<br /><span
                                        class="collector-num">#{{ card.collectorNumber }}</span></td>
                                <td class="price-cell">{{ formatPriceCell(card, 'tcgplayer') }}</td>
                                <td class="price-cell target-price">{{ formatTargetPrice(card, 'tcgplayer') }}</td>
                                <td class="price-cell">
                                    <div class="price-cell-with-scrape">
                                        <input type="number" step="0.01" min="0"
                                            :value="card.manualPrices?.cardkingdom || ''"
                                            @change="updateManualPrice(card.id, 'cardkingdom', $event)" placeholder="$"
                                            class="price-input" />
                                        <button @click="scrapePrice(card.id, 'cardkingdom')"
                                            :disabled="scrapingCards.has(card.id + '-cardkingdom')"
                                            class="scrape-button" title="Scrape price from Card Kingdom">
                                            {{ scrapingCards.has(card.id + '-cardkingdom') ? '...' : '🔄' }}
                                        </button>
                                    </div>
                                </td>
                                <td class="price-cell">
                                    <div class="price-cell-with-scrape">
                                        <input type="number" step="0.01" min="0"
                                            :value="card.manualPrices?.coolstuffinc || ''"
                                            @change="updateManualPrice(card.id, 'coolstuffinc', $event)" placeholder="$"
                                            class="price-input" />
                                        <button @click="scrapePrice(card.id, 'coolstuffinc')"
                                            :disabled="scrapingCards.has(card.id + '-coolstuffinc')"
                                            class="scrape-button" title="Scrape price from CoolStuffInc">
                                            {{ scrapingCards.has(card.id + '-coolstuffinc') ? '...' : '🔄' }}
                                        </button>
                                    </div>
                                </td>
                                <td class="trend-cell">
                                    <span v-if="card.priceHistory.length > 1"
                                        :class="['trend-indicator-small', getTrendClass(card.id)]">
                                        {{ getTrendText(card.id) }}
                                    </span>
                                </td>
                                <td class="order-status-cell">
                                    <div v-if="card.ordered?.isOrdered" class="ordered-status-container">
                                        <div class="ordered-badge-small">
                                            {{ formatOrderSource(card.ordered.source) }}
                                        </div>
                                        <label class="received-checkbox-small">
                                            <input type="checkbox" @change="markAsReceived(card.id)" />
                                            <span>✓</span>
                                        </label>
                                        <button @click="unmarkOrdered(card.id)" class="cancel-order-button-small"
                                            title="Cancel order">✕</button>
                                    </div>
                                    <div v-else class="order-controls">
                                        <select @change="markOrdered(card.id, $event)"
                                            class="order-source-select-small">
                                            <option value="">--</option>
                                            <option value="tcgplayer">TCG</option>
                                            <option value="cardkingdom">CK</option>
                                            <option value="coolstuffinc">CSI</option>
                                            <option value="ebay">eBay</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </td>
                                <td class="actions-cell">
                                    <button @click="viewChart(card)" class="icon-button"
                                        title="Price History">📊</button>
                                    <button @click="removeCard(card.id)" class="icon-button remove"
                                        title="Remove">🗑️</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Cards grouped by deck -->
                <div v-for="deck in deckStore.sortedDecks" :key="deck._id" class="deck-section">
                    <div class="deck-section-header">
                        <div class="deck-header-left">
                            <div class="deck-title-section">
                                <h3>{{ deck.name }}</h3>
                                <div class="deck-subtitle">
                                    <ManaSymbols :colors="deck.colorIdentity" class="deck-mana-symbols" />
                                </div>
                            </div>
                            <span class="deck-card-count">{{ getCardsForDeck(deck._id).length }} cards</span>
                            <a v-if="deck.url" :href="deck.url" target="_blank" class="moxfield-link"
                                title="View on Moxfield">🔗 Moxfield</a>
                        </div>
                        <button @click="editDeckFromHeader(deck)" class="edit-deck-button" title="Edit Deck">✏️</button>
                    </div>
                    <div v-if="getCardsForDeck(deck._id).length === 0" class="no-cards-in-deck">
                        No cards assigned to this deck yet.
                    </div>
                    <table v-else class="deck-table">
                        <thead>
                            <tr>
                                <th>Card Name</th>
                                <th>Set</th>
                                <th>TCGPlayer</th>
                                <th>Target Price</th>
                                <th>Card Kingdom</th>
                                <th>CoolStuffInc</th>
                                <th>Trend</th>
                                <th>Order Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="card in getCardsForDeck(deck._id)" :key="card.id">
                                <td class="card-name-cell">
                                    <div class="name-badges">
                                        <strong>{{ card.name }}</strong>
                                        <span v-if="card.isFoil" class="foil-badge-small">FOIL</span>
                                        <span
                                            v-if="card.frameEffects && card.frameEffects.length > 0 && card.frameEffects[0]"
                                            class="special-badge-small">
                                            {{ formatFrameEffect(card.frameEffects[0]) }}
                                        </span>
                                    </div>
                                </td>
                                <td>{{ card.setName }} ({{ card.set.toUpperCase() }})<br /><span
                                        class="collector-num">#{{ card.collectorNumber }}</span></td>
                                <td class="price-cell">{{ formatPriceCell(card, 'tcgplayer') }}</td>
                                <td class="price-cell target-price">{{ formatTargetPrice(card, 'tcgplayer') }}</td>
                                <td class="price-cell">
                                    <div class="price-cell-with-scrape">
                                        <input type="number" step="0.01" min="0"
                                            :value="card.manualPrices?.cardkingdom || ''"
                                            @change="updateManualPrice(card.id, 'cardkingdom', $event)" placeholder="$"
                                            class="price-input" />
                                        <button @click="scrapePrice(card.id, 'cardkingdom')"
                                            :disabled="scrapingCards.has(card.id + '-cardkingdom')"
                                            class="scrape-button" title="Scrape price from Card Kingdom">
                                            {{ scrapingCards.has(card.id + '-cardkingdom') ? '...' : '🔄' }}
                                        </button>
                                    </div>
                                </td>
                                <td class="price-cell">
                                    <div class="price-cell-with-scrape">
                                        <input type="number" step="0.01" min="0"
                                            :value="card.manualPrices?.coolstuffinc || ''"
                                            @change="updateManualPrice(card.id, 'coolstuffinc', $event)" placeholder="$"
                                            class="price-input" />
                                        <button @click="scrapePrice(card.id, 'coolstuffinc')"
                                            :disabled="scrapingCards.has(card.id + '-coolstuffinc')"
                                            class="scrape-button" title="Scrape price from CoolStuffInc">
                                            {{ scrapingCards.has(card.id + '-coolstuffinc') ? '...' : '🔄' }}
                                        </button>
                                    </div>
                                </td>
                                <td class="trend-cell">
                                    <span v-if="card.priceHistory.length > 1"
                                        :class="['trend-indicator-small', getTrendClass(card.id)]">
                                        {{ getTrendText(card.id) }}
                                    </span>
                                </td>
                                <td class="order-status-cell">
                                    <div v-if="card.ordered?.isOrdered" class="ordered-status-container">
                                        <div class="ordered-badge-small">
                                            {{ formatOrderSource(card.ordered.source) }}
                                        </div>
                                        <label class="received-checkbox-small">
                                            <input type="checkbox" @change="markAsReceived(card.id)" />
                                            <span>✓</span>
                                        </label>
                                        <button @click="unmarkOrdered(card.id)" class="cancel-order-button-small"
                                            title="Cancel order">✕</button>
                                    </div>
                                    <div v-else class="order-controls">
                                        <select @change="markOrdered(card.id, $event)"
                                            class="order-source-select-small">
                                            <option value="">--</option>
                                            <option value="tcgplayer">TCG</option>
                                            <option value="cardkingdom">CK</option>
                                            <option value="coolstuffinc">CSI</option>
                                            <option value="ebay">eBay</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </td>
                                <td class="actions-cell">
                                    <button @click="viewChart(card)" class="icon-button"
                                        title="Price History">📊</button>
                                    <button @click="removeCard(card.id)" class="icon-button remove"
                                        title="Remove">🗑️</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Price Chart Modal -->
        <div v-if="selectedCard" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>{{ selectedCard.name }} - Price History</h3>
                    <button @click="closeModal" class="close-button">×</button>
                </div>
                <PriceChart :card="selectedCard" />
            </div>
        </div>

        <!-- Deck Manager Modal -->
        <div v-if="showDeckManager" class="modal-overlay" @click="showDeckManager = false">
            <div class="modal-content deck-manager" @click.stop>
                <div class="modal-header">
                    <h3>Manage Decks</h3>
                    <button @click="showDeckManager = false" class="close-button">×</button>
                </div>
                <div class="deck-manager-body">
                    <div class="add-deck-section">
                        <h4>Add New Deck</h4>
                        <div class="deck-form">
                            <input v-model="newDeckName" type="text" placeholder="Deck name" class="deck-input"
                                @keyup.enter="addNewDeck" />
                            <input v-model="newDeckDescription" type="text" placeholder="Description (optional)"
                                class="deck-input" />
                            <input v-model="newDeckMoxfieldUrl" type="url" placeholder="Moxfield URL (optional)"
                                class="deck-input" />
                            <button @click="addNewDeck" class="add-deck-button">Add Deck</button>
                        </div>
                    </div>
                    <div class="decks-list">
                        <h4>Your Decks</h4>
                        <div v-if="deckStore.decks.length === 0" class="no-decks">
                            No decks yet. Add one above!
                        </div>
                        <div v-for="deck in deckStore.sortedDecks" :key="deck._id" class="deck-item">
                            <div class="deck-view-mode">
                                <div class="deck-info">
                                    <ManaSymbols :colors="deck.colorIdentity" />
                                    <strong>{{ deck.name }}</strong>
                                    <a v-if="deck.url" :href="deck.url" target="_blank" class="moxfield-link-small"
                                        title="View on Moxfield">🔗 Moxfield</a>
                                    <span class="card-count">{{ getCardCountForDeck(deck._id) }} cards</span>
                                </div>
                                <div class="deck-actions">
                                    <button @click="openEditDeckModal(deck)" class="edit-button">✏️ Edit</button>
                                    <button @click="deleteDeck(deck._id)" class="delete-button">🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Deck Modal -->
        <div v-if="editingDeckId" class="modal-overlay" @click="cancelEditDeck">
            <div class="modal-content edit-deck-modal" @click.stop>
                <div class="modal-header">
                    <h3>Edit Deck</h3>
                    <button @click="cancelEditDeck" class="close-button">×</button>
                </div>
                <div class="edit-deck-body">
                    <div class="deck-form">
                        <label>Deck Name</label>
                        <input v-model="editDeckName" type="text" class="deck-input" placeholder="Deck name" />
                        <label>Description (optional)</label>
                        <input v-model="editDeckDescription" type="text" class="deck-input" placeholder="Description" />
                        <label>Moxfield URL (optional)</label>
                        <input v-model="editDeckMoxfieldUrl" type="url" class="deck-input" placeholder="Moxfield URL" />
                        <div class="modal-actions">
                            <button @click="saveEditDeck" class="save-button">Save Changes</button>
                            <button @click="cancelEditDeck" class="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card Search Modal -->
        <div v-if="showCardSearch" class="modal-overlay" @click="showCardSearch = false">
            <div class="modal-content card-search-modal" @click.stop>
                <div class="modal-header">
                    <h3>Add Card to Wishlist</h3>
                    <button @click="showCardSearch = false" class="close-button">×</button>
                </div>
                <CardSearch @card-added="showCardSearch = false" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import { useDeckStore } from '@/stores/deck'
import { usePurchasedStore } from '@/stores/purchased'
import { useAuthStore } from '@/stores/auth'
import type { CardWithPrices, CardPrice, PurchasedCard } from '@/types/card'
import { format } from 'date-fns'
import PriceChart from './PriceChart.vue'
import CardSearch from './CardSearch.vue'
import ManaSymbols from './ManaSymbols.vue'
import { scraperApi } from '@/services/scraperApi'

const router = useRouter()
const wishlistStore = useWishlistStore()
const deckStore = useDeckStore()
const purchasedStore = usePurchasedStore()
const authStore = useAuthStore()
const updating = ref(false)
const selectedCard = ref<CardWithPrices | null>(null)
const viewMode = ref<'grid' | 'list' | 'deck'>('deck')
const selectedDeckFilter = ref<string | null>(null)
const showDeckManager = ref(false)
const showCardSearch = ref(false)
const scrapingCards = ref(new Set<string>())

const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
}

const formatSource = (source: string) => {
    const sourceMap: Record<string, string> = {
        tcgplayer: 'TCGPlayer',
        cardkingdom: 'Card Kingdom',
        coolstuffinc: 'CoolStuffInc'
    }
    return sourceMap[source] || source
}

const formatOrderSource = (source?: string) => {
    if (!source) return 'Unknown'
    const sourceMap: Record<string, string> = {
        tcgplayer: 'TCGPlayer',
        cardkingdom: 'Card Kingdom',
        coolstuffinc: 'CoolStuffInc',
        ebay: 'eBay',
        other: 'Other'
    }
    return sourceMap[source] || source
}

const formatRarity = (rarity?: string) => {
    if (!rarity) return ''
    return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const formatCardDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
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

const formatTargetPrice = (card: CardWithPrices, source: 'tcgplayer') => {
    const price = card.prices.find(p => p.source === source)
    if (price) {
        const targetPrice = price.price * 0.85
        return `$${targetPrice.toFixed(2)}`
    }
    return '-'
}

const updateManualPrice = (cardId: string, source: 'cardkingdom' | 'coolstuffinc', event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value ? parseFloat(target.value) : undefined

    const card = wishlistStore.cards.find(c => c.id === cardId)
    if (card) {
        const manualPrices = { ...card.manualPrices }
        if (value !== undefined && value > 0) {
            manualPrices[source] = value
        } else {
            delete manualPrices[source]
        }
        wishlistStore.updateCard(cardId, { manualPrices })
    }
}

const scrapePrice = async (cardId: string, source: 'cardkingdom' | 'coolstuffinc') => {
    const card = wishlistStore.cards.find(c => c.id === cardId)
    if (!card) return

    const scrapingKey = `${cardId}-${source}`
    scrapingCards.value.add(scrapingKey)

    try {
        const result = await scraperApi.scrapeSinglePrice(
            card.name,
            card.set,
            source,
            card.isFoil || false
        )

        if (result.success && result.price) {
            const manualPrices = { ...card.manualPrices, [source]: result.price }
            wishlistStore.updateCard(cardId, { manualPrices })
        } else {
            console.error(`Failed to scrape ${source} price for ${card.name}:`, result.error)
            alert(`Failed to scrape price from ${source}. ${result.error || 'Please try again.'}`)
        }
    } catch (error) {
        console.error(`Error scraping ${source} price:`, error)
        alert(`Error scraping price from ${source}. Please make sure the scraper server is running.`)
    } finally {
        scrapingCards.value.delete(scrapingKey)
    }
}

const refreshPrices = async () => {
    updating.value = true
    try {
        await wishlistStore.fetchAllPrices()
    } finally {
        updating.value = false
    }
}

const fetchPrices = async (cardId: string) => {
    await wishlistStore.fetchCardPrices(cardId)
}

const updatePriority = (cardId: string, event: Event) => {
    const target = event.target as HTMLSelectElement
    wishlistStore.updateCard(cardId, { priority: target.value as 'low' | 'medium' | 'high' })
}

const updateDeck = (cardId: string, event: Event) => {
    const target = event.target as HTMLSelectElement
    const deckId = target.value || undefined
    wishlistStore.updateCard(cardId, { deckId })
}

const filteredCards = computed(() => {
    let cards = []
    if (selectedDeckFilter.value === null) {
        cards = wishlistStore.cardsWithPrices
    } else if (selectedDeckFilter.value === 'no-deck') {
        cards = wishlistStore.cardsWithPrices.filter(card => !card.deckId)
    } else {
        cards = wishlistStore.cardsWithPrices.filter(card => card.deckId === selectedDeckFilter.value)
    }

    // Sort alphabetically by card name for list view
    return [...cards].sort((a, b) => a.name.localeCompare(b.name))
})

// Deck management
const newDeckName = ref('')
const newDeckDescription = ref('')
const newDeckMoxfieldUrl = ref('')
const editingDeckId = ref<string | null>(null)
const editDeckName = ref('')
const editDeckDescription = ref('')
const editDeckMoxfieldUrl = ref('')

const addNewDeck = async () => {
    if (newDeckName.value.trim() && newDeckMoxfieldUrl.value.trim()) {
        await deckStore.addDeck(
            newDeckName.value.trim(),
            newDeckMoxfieldUrl.value.trim()
        )
        newDeckName.value = ''
        newDeckDescription.value = ''
        newDeckMoxfieldUrl.value = ''
    }
}

const openEditDeckModal = (deck: { _id: string; name: string; url: string }) => {
    editingDeckId.value = deck._id
    editDeckName.value = deck.name
    editDeckDescription.value = ''
    editDeckMoxfieldUrl.value = deck.url || ''
}

const saveEditDeck = async () => {
    // Deck editing not supported in current API
    cancelEditDeck()
}

const cancelEditDeck = () => {
    editingDeckId.value = null
    editDeckName.value = ''
    editDeckDescription.value = ''
    editDeckMoxfieldUrl.value = ''
}

const deleteDeck = (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck? Cards will not be removed, just unassigned.')) {
        // Unassign cards from this deck
        wishlistStore.cards.forEach(card => {
            if (card.deckId === deckId) {
                wishlistStore.updateCard(card.id, { deckId: undefined })
            }
        })
        deckStore.removeDeck(deckId)
    }
}

const getCardCountForDeck = (deckId: string) => {
    return wishlistStore.cards.filter(card => card.deckId === deckId).length
}

const cardsWithoutDeck = computed(() => {
    return wishlistStore.cardsWithPrices.filter(card => !card.deckId)
})

const getCardsForDeck = (deckId: string) => {
    return wishlistStore.cardsWithPrices.filter(card => card.deckId === deckId)
}

const editDeckFromHeader = (deck: { _id: string; name: string; url: string }) => {
    openEditDeckModal(deck)
}

const isCheapest = (cardId: string, price: CardPrice) => {
    const cheapest = wishlistStore.getCheapestPrice(cardId)
    return cheapest?.source === price.source
}

const getTrendClass = (cardId: string) => {
    const trend = wishlistStore.getPriceTrend(cardId)
    return `trend-${trend}`
}

const getTrendText = (cardId: string) => {
    const trend = wishlistStore.getPriceTrend(cardId)
    const trendMap: Record<string, string> = {
        up: '📈 Increasing',
        down: '📉 Decreasing',
        stable: '➡️ Stable',
        unknown: '❓ Unknown'
    }
    return trendMap[trend]
}

const removeCard = (cardId: string) => {
    if (confirm('Remove this card from your wishlist?')) {
        wishlistStore.removeCard(cardId)
    }
}

const markOrdered = (cardId: string, event: Event) => {
    const target = event.target as HTMLSelectElement
    const source = target.value
    if (source) {
        wishlistStore.markAsOrdered(cardId, source as 'tcgplayer' | 'cardkingdom' | 'coolstuffinc' | 'ebay' | 'other')
    } else {
        // If "Not ordered" is selected, unmark
        wishlistStore.unmarkAsOrdered(cardId)
    }
}

const unmarkOrdered = (cardId: string) => {
    wishlistStore.unmarkAsOrdered(cardId)
}

const markAsReceived = (cardId: string) => {
    const { card, history } = wishlistStore.getCardWithHistory(cardId)

    if (!card || !card.ordered) {
        alert('Card must be marked as ordered first')
        return
    }

    if (confirm('Mark this card as received? It will be moved to your purchase history.')) {
        // Get the price at time of purchase (most recent price from history)
        const lastEntry = history[history.length - 1]
        const priceAtPurchase = lastEntry
            ? (lastEntry.tcgplayer || lastEntry.cardkingdom || lastEntry.coolstuffinc)
            : undefined

        // Create purchased card with history
        const purchasedCard: PurchasedCard = {
            ...card,
            purchaseInfo: {
                source: card.ordered.source!,
                orderedDate: card.ordered.orderedDate!,
                receivedDate: new Date().toISOString(),
                priceAtPurchase
            },
            priceHistory: history
        }

        // Add to purchased store
        purchasedStore.addPurchasedCard(purchasedCard)

        // Remove from wishlist
        wishlistStore.removeCard(cardId)
    }
}

const viewChart = (card: CardWithPrices) => {
    selectedCard.value = card
}

const closeModal = () => {
    selectedCard.value = null
}

const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
        await authStore.logout()
        router.push('/login')
    }
}

const getCheapestPrice = (cardId: string) => {
    return wishlistStore.getCheapestPrice(cardId)
}

const formatPriceCell = (card: CardWithPrices, source: 'tcgplayer' | 'cardkingdom' | 'coolstuffinc') => {
    const price = card.prices.find(p => p.source === source)
    if (!price) return '-'
    const cheapest = getCheapestPrice(card.id)
    return cheapest?.source === source ? `$${price.price.toFixed(2)} ⭐` : `$${price.price.toFixed(2)}`
}
</script>

<style scoped>
.wishlist {
    padding: 0;
}

.nav-tabs {
    display: flex;
    gap: 0;
    background: white;
    border-bottom: 2px solid #e9ecef;
    padding: 0 20px;
    align-items: center;
    justify-content: space-between;
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.user-name {
    font-size: 14px;
    color: #495057;
    font-weight: 500;
}

.logout-button {
    padding: 6px 16px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    color: #495057;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.logout-button:hover {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
}

.nav-tab {
    padding: 15px 25px;
    text-decoration: none;
    color: #495057;
    font-weight: 500;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
}

.nav-tab:hover {
    color: #667eea;
    background: #f8f9fa;
}

.nav-tab.router-link-active {
    color: #667eea;
    border-bottom-color: #667eea;
}

.header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px 20px 0;
    flex-wrap: wrap;
    gap: 15px;
}

.actions {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
}

.view-toggle {
    display: flex;
    gap: 5px;
    background: #e9ecef;
    padding: 3px;
    border-radius: 6px;
}

.view-button {
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    color: #6c757d;
}

.view-button:hover {
    background: #dee2e6;
}

.view-button.active {
    background: white;
    color: #333;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.refresh-button {
    padding: 10px 20px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
    background-color: #357abd;
}

.refresh-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.add-card-button {
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: 600;
    font-size: 14px;
}

.add-card-button:hover {
    background-color: #218838;
}

.last-update {
    color: #666;
    font-size: 14px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
    font-size: 18px;
}

.wishlist-container.grid {
    display: grid;
    gap: 20px;
    padding: 0 20px 20px;
}

.wishlist-container.list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 20px 20px;
}

.wishlist-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    margin: 0 20px 20px;
    width: calc(100% - 40px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wishlist-table thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.wishlist-table th {
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
}

.wishlist-table tbody tr {
    border-bottom: 1px solid #e9ecef;
    transition: background-color 0.2s;
}

.wishlist-table tbody tr:hover {
    background-color: #f8f9fa;
}

.wishlist-table td {
    padding: 10px;
    font-size: 13px;
    vertical-align: middle;
}

.card-name-cell {
    min-width: 200px;
    max-width: 250px;
}

.wishlist-table td:nth-child(2),
.deck-table td:nth-child(2) {
    min-width: 180px;
    max-width: 220px;
}

.name-badges {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.foil-badge-small {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.special-badge-small {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: white;
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
}

.collector-num {
    color: #6c757d;
    font-size: 11px;
}

.price-cell {
    text-align: right;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
}

.best-price-cell {
    text-align: right;
    font-weight: 700;
    color: #28a745;
    white-space: nowrap;
}

.best-price-text {
    font-size: 14px;
}

.trend-cell {
    text-align: center;
}

.trend-indicator-small {
    font-size: 11px;
    font-weight: 600;
}

.actions-cell {
    text-align: center;
    white-space: nowrap;
}

.order-status-cell {
    text-align: center;
    min-width: 100px;
}

.order-controls {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
}

.order-source-select-small {
    padding: 2px 4px;
    font-size: 11px;
    border: 1px solid #ddd;
    border-radius: 3px;
    max-width: 60px;
}

.mark-ordered-button-small {
    padding: 2px 6px;
    font-size: 12px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.2s;
}

.mark-ordered-button-small:hover:not(:disabled) {
    background: #218838;
}

.mark-ordered-button-small:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.ordered-status-container {
    display: flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
}

.ordered-badge-small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fff3cd;
    color: #856404;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
}

.received-button-small {
    padding: 2px 8px;
    font-size: 11px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
    white-space: nowrap;
}

.received-button-small:hover {
    background: #218838;
}

.cancel-order-button-small {
    padding: 2px 6px;
    font-size: 11px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.2s;
}

.cancel-order-button-small:hover {
    background: #c82333;
}

.unmark-button-small {
    background: none;
    border: none;
    color: #721c24;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    line-height: 1;
    transition: color 0.2s;
}

.unmark-button-small:hover {
    color: #dc3545;
}

.icon-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 4px 8px;
    transition: transform 0.2s;
}

.icon-button:hover {
    transform: scale(1.2);
}

.icon-button.remove:hover {
    filter: brightness(1.2);
}

.price-cell-with-scrape {
    display: flex;
    align-items: center;
    gap: 4px;
}

.price-input {
    width: 70px;
    padding: 4px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    text-align: right;
}

.price-input:focus {
    outline: none;
    border-color: #4a90e2;
}

.price-input::placeholder {
    color: #999;
}

.scrape-button {
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 32px;
}

.scrape-button:hover:not(:disabled) {
    background: #357abd;
    transform: scale(1.05);
}

.scrape-button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.priority-select-small {
    padding: 4px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
}

.foil-toggle-inline {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
}

.foil-toggle-inline input {
    cursor: pointer;
}

.fetch-button-small {
    padding: 4px 8px;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
}

.fetch-button-small:hover {
    background: #357abd;
}

.target-price {
    color: #28a745;
    font-weight: 600;
}

.wishlist-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    transition: box-shadow 0.2s;
}

.wishlist-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.card-thumbnail {
    width: 100px;
    height: auto;
    border-radius: 6px;
}

.card-title-section {
    flex: 1;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.card-title-section h3 {
    margin: 0;
}

.foil-badge {
    background: linear-gradient(135deg, #ffd700, #ffed4e, #ffd700);
    color: #333;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

.special-badge {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: white;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.set-info {
    color: #666;
    margin: 0 0 8px 0;
    font-size: 14px;
}

.card-details {
    display: flex;
    gap: 12px;
    margin: 8px 0;
    font-size: 14px;
}

.rarity {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 11px;
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

.controls-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 10px;
}

.priority-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.priority-section label {
    font-size: 14px;
    color: #666;
}

.priority-select {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.foil-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #555;
}

.foil-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
}

.foil-toggle:hover {
    color: #333;
}

.price-section {
    margin-bottom: 15px;
}

.no-prices {
    text-align: center;
    padding: 20px;
}

.fetch-button {
    padding: 8px 16px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.prices {
    display: grid;
    gap: 10px;
}

.price-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 2px solid transparent;
}

.price-item.cheapest {
    background: #d4edda;
    border-color: #28a745;
}

.price-source {
    display: flex;
    align-items: center;
    gap: 8px;
}

.badge {
    background: #28a745;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
}

.price-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.buy-link {
    color: #4a90e2;
    text-decoration: none;
    font-weight: 500;
}

.buy-link:hover {
    text-decoration: underline;
}

.trend-section {
    margin-top: 10px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.trend-label {
    font-weight: 500;
    color: #666;
}

.trend-indicator {
    font-weight: 500;
}

.trend-up {
    color: #dc3545;
}

.trend-down {
    color: #28a745;
}

.trend-stable {
    color: #6c757d;
}

.trend-unknown {
    color: #999;
}

.card-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.card-actions .ordered-section {
    flex-direction: row;
}

.order-section {
    display: flex;
    gap: 8px;
    align-items: center;
}

.order-source-select {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
}

.mark-ordered-button {
    padding: 6px 12px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    white-space: nowrap;
}

.mark-ordered-button:hover:not(:disabled) {
    background: #218838;
}

.mark-ordered-button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.ordered-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ordered-badge {
    background: #fff3cd;
    color: #856404;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    white-space: nowrap;
}

.ordered-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.received-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #28a745;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    user-select: none;
    transition: background 0.2s;
}

.received-checkbox input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
    margin: 0;
}

.received-checkbox:hover {
    background: #218838;
}

.cancel-order-button {
    padding: 8px 12px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
}

.cancel-order-button:hover {
    background: #c82333;
}

.received-checkbox-small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 8px;
    background: #28a745;
    color: white;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    transition: background 0.2s;
}

.received-checkbox-small:hover {
    background: #218838;
}

.received-checkbox-small input[type="checkbox"] {
    display: none;
}

.received-checkbox-small span {
    font-size: 13px;
    line-height: 1;
    user-select: none;
}

.unmark-button {
    background: none;
    border: none;
    color: #721c24;
    cursor: pointer;
    padding: 0 4px;
    font-size: 16px;
    line-height: 1;
    transition: color 0.2s;
}

.unmark-button:hover {
    color: #dc3545;
}

.chart-button {
    flex: 1;
    padding: 8px 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.chart-button:hover {
    background-color: #5a6268;
}

.remove-button {
    padding: 8px 16px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.remove-button:hover {
    background-color: #c82333;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
}

.card-search-modal {
    max-width: 1200px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
}

.close-button {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
}

.close-button:hover {
    color: #333;
}

/* Deck Filter & Manager */
.deck-filter {
    display: flex;
    align-items: center;
    gap: 8px;
}

.deck-filter label {
    font-weight: 500;
    font-size: 14px;
}

.deck-filter-select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
}

.manage-decks-button {
    padding: 8px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
}

.manage-decks-button:hover {
    opacity: 0.9;
}

.deck-select-small {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    width: 150px;
}

.deck-manager {
    max-width: 600px;
}

.edit-deck-modal {
    max-width: 500px;
}

.edit-deck-body {
    padding: 20px 0;
}

.edit-deck-body label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.deck-manager-body {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.add-deck-section h4,
.decks-list h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
}

.deck-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.deck-input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.add-deck-button {
    padding: 10px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.add-deck-button:hover {
    opacity: 0.9;
}

.no-decks {
    color: #999;
    font-style: italic;
    padding: 20px;
    text-align: center;
    background: #f8f9fa;
    border-radius: 4px;
}

.deck-item {
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    margin-bottom: 8px;
}

.deck-view-mode {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.deck-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.deck-info strong {
    font-size: 15px;
    color: #333;
}

.deck-description {
    font-size: 13px;
    color: #666;
}

.card-count {
    font-size: 12px;
    color: #999;
}

.deck-actions {
    display: flex;
    gap: 8px;
}

.edit-button,
.delete-button,
.save-button,
.cancel-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
}

.edit-button {
    background: #007bff;
    color: white;
}

.edit-button:hover {
    background: #0056b3;
}

.delete-button {
    background: #dc3545;
    color: white;
}

.delete-button:hover {
    background: #c82333;
}

.deck-edit-mode {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.save-button {
    background: #28a745;
    color: white;
}

.save-button:hover {
    background: #218838;
}

.cancel-button {
    background: #6c757d;
    color: white;
}

.cancel-button:hover {
    background: #5a6268;
}

/* Deck View */
.deck-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0 20px 20px;
}

.no-decks-message {
    padding: 40px;
    text-align: center;
    background: #f8f9fa;
    border-radius: 8px;
    color: #666;
    font-size: 16px;
}

.deck-section {
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 0;
    background: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.deck-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 0;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 6px 6px 0 0;
}

.deck-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.deck-section-header h3 {
    margin: 0;
    font-size: 22px;
    color: white;
    font-weight: 700;
}

.deck-card-count {
    background: rgba(255, 255, 255, 0.3);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.deck-title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.deck-title-section h3 {
    margin: 0;
}

.deck-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
}

.deck-mana-symbols {
    font-size: 14px;
}

.deck-mana-symbols .ms {
    font-size: 14px;
}

.deck-description-subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-style: italic;
    font-weight: 400;
}

.moxfield-link {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
    white-space: nowrap;
}

.moxfield-link:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
}

.moxfield-link-small {
    color: #4a90e2;
    text-decoration: none;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 3px;
    background: #f0f8ff;
    border: 1px solid #d0e8ff;
    transition: all 0.2s;
    white-space: nowrap;
}

.moxfield-link-small:hover {
    background: #e0f0ff;
    border-color: #4a90e2;
}

.edit-deck-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
}

.edit-deck-button:hover {
    background: rgba(255, 255, 255, 0.3);
}

.no-cards-in-deck {
    color: #999;
    font-style: italic;
    padding: 20px;
    margin: 20px;
    text-align: center;
    background: #f8f9fa;
    border-radius: 4px;
}

.deck-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    margin: 0;
}

.deck-table thead {
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
}

.deck-table th {
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
}

.deck-table tbody tr {
    border-bottom: 1px solid #e9ecef;
    transition: background-color 0.2s;
}

.deck-table tbody tr:hover {
    background-color: #f8f9fa;
}

.deck-table td {
    padding: 10px;
    font-size: 13px;
    vertical-align: middle;
}
</style>
