<template>
  <div class="purchased-view">
    <div class="nav-tabs">
      <router-link to="/" class="nav-tab">My Wishlist</router-link>
      <router-link to="/purchased" class="nav-tab">Purchase History</router-link>
    </div>
    <div class="header">
      <h2>Purchase History</h2>
      <p class="subtitle">Cards you've ordered and received</p>
    </div>

    <div v-if="purchasedStore.cards.length === 0" class="empty-state">
      <p>No purchased cards yet. Mark cards as received in your wishlist to see them here!</p>
    </div>

    <table v-else class="purchased-table">
      <thead>
        <tr>
          <th>Card Name</th>
          <th>Set</th>
          <th>Source</th>
          <th>Ordered Date</th>
          <th>Received Date</th>
          <th>Price at Purchase</th>
          <th>Current Trend</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="card in purchasedStore.sortedCards" :key="card.id">
          <td class="card-name-cell">
            <div class="name-badges">
              <strong>{{ card.name }}</strong>
              <span v-if="card.isFoil" class="foil-badge-small">FOIL</span>
              <span v-if="card.frameEffects && card.frameEffects.length > 0 && card.frameEffects[0]" class="special-badge-small">
                {{ formatFrameEffect(card.frameEffects[0]) }}
              </span>
            </div>
          </td>
          <td>{{ card.setName }} ({{ card.set.toUpperCase() }})<br/><span class="collector-num">#{{ card.collectorNumber }}</span></td>
          <td>{{ formatOrderSource(card.orderedFrom || 'N/A') }}</td>
          <td>{{ formatDate(card.orderedAt) }}</td>
          <td>{{ formatDate(card.receivedAt) }}</td>
          <td class="price-cell">
            <span v-if="card.purchasePrice">
              ${{ card.purchasePrice.toFixed(2) }}
            </span>
            <span v-else class="no-price">N/A</span>
          </td>
          <td class="trend-cell">
            <span class="no-price">N/A</span>
          </td>
          <td class="actions-cell">
            <button @click="removeFromHistory(card.scryfallId)" class="icon-button remove" title="Remove from history">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script setup lang="ts">
import { usePurchasedStore } from '@/stores/purchased'
import { format } from 'date-fns'

const purchasedStore = usePurchasedStore()

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return 'N/A'
  return format(new Date(dateString), 'MMM d, yyyy')
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

const formatFrameEffect = (effect: string) => {
  const effectMap: Record<string, string> = {
    showcase: '🌟 Showcase',
    extendedart: '🖼️ Extended Art',
    borderless: '∞ Borderless',
    etched: '✨ Etched'
  }
  return effectMap[effect.toLowerCase()] || effect
}



const removeFromHistory = async (scryfallId: string | undefined) => {
  if (!scryfallId) return
  if (confirm('Remove this card from your purchase history?')) {
    await purchasedStore.removePurchasedCard(scryfallId)
  }
}
</script>

<style scoped>
.purchased-view {
  padding: 0;
}

.nav-tabs {
  display: flex;
  gap: 0;
  background: white;
  border-bottom: 2px solid #e9ecef;
  padding: 0 20px;
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
  margin-bottom: 30px;
  padding: 20px 20px 0;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
  margin: 0 20px;
}

.purchased-table {
  width: calc(100% - 40px);
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  margin: 0 20px 20px;
}

.purchased-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.purchased-table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}

.purchased-table tbody tr {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;
}

.purchased-table tbody tr:hover {
  background-color: #f8f9fa;
}

.purchased-table td {
  padding: 12px;
  font-size: 13px;
  vertical-align: middle;
}

.card-name-cell {
  min-width: 200px;
  max-width: 250px;
}

.purchased-table td:nth-child(2) {
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
  background: linear-gradient(135deg, #ffd700, #ffed4e, #ffd700);
  color: #333;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.special-badge-small {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}

.collector-num {
  color: #6c757d;
  font-size: 11px;
}

.price-cell {
  text-align: right;
  font-weight: 600;
  color: #28a745;
}

.no-price {
  color: #6c757d;
  font-style: italic;
}

.trend-cell {
  text-align: center;
}

.trend-indicator-small {
  font-size: 11px;
  font-weight: 600;
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

.actions-cell {
  text-align: center;
  white-space: nowrap;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  color: #6c757d;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #dc3545;
}
</style>
