<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
}

function formatDate(date: Date): string {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const parts = fmt.formatToParts(date)
    const y = parts.find(p => p.type === 'year')!.value
    const m = parts.find(p => p.type === 'month')!.value
    const d = parts.find(p => p.type === 'day')!.value
    const w = WEEKDAYS[date.getDay()]
    return `${y}年${m}月${d}日 星期${w}`
}

onMounted(() => {
    timer = setInterval(() => {
        now.value = new Date()
    }, 1000)
})

onUnmounted(() => {
    if (timer !== null) {
        clearInterval(timer)
        timer = null
    }
})
</script>

<template>
  <div :class="$style.clock">
    <div :class="$style.time">
      {{ formatTime(now) }}
    </div>
    <div :class="$style.date">
      {{ formatDate(now) }}
    </div>
  </div>
</template>

<style module>
.time {
  font-size: 96px;
  font-weight: 200;
  letter-spacing: -2px;
  color: var(--c-text-primary);
  line-height: 1;
}

.date {
  font-size: 18px;
  font-weight: 400;
  color: var(--c-text-secondary);
  margin-top: 12px;
}
</style>
