<template>
  <div class="search-view">
    <CardSearch />
  </div>
</template>

<script setup lang="ts">
import CardSearch from '@/components/CardSearch.vue'
</script>

<style scoped>
.search-view {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
