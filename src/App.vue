<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWishlistStore } from '@/stores/wishlist'
import { useDeckStore } from '@/stores/deck'
import { usePurchasedStore } from '@/stores/purchased'

const authStore = useAuthStore()
const wishlistStore = useWishlistStore()
const deckStore = useDeckStore()
const purchasedStore = usePurchasedStore()

onMounted(async () => {
  await authStore.checkAuth()
  
  // Load user data if authenticated
  if (authStore.user) {
    await Promise.all([
      wishlistStore.loadWishlist(),
      deckStore.loadDecks(),
      purchasedStore.loadPurchases()
    ])
  }
})
</script>

<template>
  <div id="app">
    <main>
      <RouterView v-if="!authStore.loading" />
      <div v-else class="loading-screen">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </main>
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  background: #f5f5f5;
}

main {
  width: 100%;
  padding: 0;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-screen p {
  color: #666;
  font-size: 16px;
}
</style>
