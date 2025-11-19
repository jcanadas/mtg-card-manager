<template>
  <div class="price-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import type { CardWithPrices } from '@/types/card'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
)

interface Props {
  card: CardWithPrices
}

const props = defineProps<Props>()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  const history = props.card.priceHistory
  if (history.length === 0) return

  // Sort by date
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date))

  const labels = sortedHistory.map(entry => entry.date)
  const tcgData = sortedHistory.map(entry => entry.tcgplayer || null)
  const ckData = sortedHistory.map(entry => entry.cardkingdom || null)
  const csiData = sortedHistory.map(entry => entry.coolstuffinc || null)

  // Find order date if card was ordered
  const orderedDate = props.card.ordered?.orderedDate
  const orderDateIndex = orderedDate
    ? labels.findIndex(label => label === orderedDate.split('T')[0])
    : -1

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'TCGPlayer',
          data: tcgData,
          borderColor: '#4a90e2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4
        },
        {
          label: 'Card Kingdom',
          data: ckData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4
        },
        {
          label: 'CoolStuffInc',
          data: csiData,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Price History (Last 30 Days)'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              return `${label}: $${value?.toFixed(2) || 'N/A'}`
            },
            afterLabel: (context) => {
              if (orderDateIndex === context.dataIndex && orderedDate) {
                return '📦 Ordered on this date'
              }
              return ''
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `$${value}`
          }
        }
      }
    }
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.card, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.price-chart {
  padding: 20px 0;
}

canvas {
  max-height: 400px;
}
</style>
