<template>
  <div class="wishlist-view">
    <WishlistView />
  </div>
</template>

<script setup lang="ts">
import WishlistView from '@/components/WishlistView.vue'
</script>

<style scoped>
.wishlist-view {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
