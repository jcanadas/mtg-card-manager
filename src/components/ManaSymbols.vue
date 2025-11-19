<template>
  <div class="mana-symbols" :title="colorTitle">
    <i v-if="!colors || colors.length === 0" class="ms ms-c ms-cost ms-shadow"></i>
    <i v-for="color in colors" :key="color" :class="['ms', manaClass(color), 'ms-cost', 'ms-shadow']"></i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  colors?: string[]
}>()

const manaClass = (color: string) => {
  const colorMap: Record<string, string> = {
    'W': 'ms-w',
    'U': 'ms-u',
    'B': 'ms-b',
    'R': 'ms-r',
    'G': 'ms-g'
  }
  return colorMap[color] || 'ms-c'
}

const colorTitle = computed(() => {
  if (!props.colors || props.colors.length === 0) return 'Colorless'
  const colorNames: Record<string, string> = {
    'W': 'White',
    'U': 'Blue',
    'B': 'Black',
    'R': 'Red',
    'G': 'Green'
  }
  return props.colors.map(c => colorNames[c] || c).join(', ')
})
</script>

<style scoped>
.mana-symbols {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.ms {
  font-size: 20px;
}
</style>
