<script lang="ts" setup>
import { ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
import { onMounted, provide, ref } from 'vue'
import { useTheme } from '../../composables/useTheme'
import Clock from './components/Clock.vue'
import DockBar from './components/DockBar.vue'
import SearchBar from './components/SearchBar.vue'

const { theme, toggle, init } = useTheme()

onMounted(() => {
    void init()
})

// ── Toast ──
interface Toast {
    id: number
    message: string
}

const toasts = ref<Toast[]>([])
let nextToastId = 0

function showToast(message: string) {
    const id = nextToastId++
    toasts.value = [...toasts.value, { id, message }]
}

function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
}

provide('showToast', showToast)
</script>

<template>
  <ToastProvider>
    <div class="w-screen h-screen flex flex-col items-center justify-start pt-[18vh] overflow-hidden" style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif">
      <button
        class="fixed top-5 right-5 bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] text-lg w-9 h-9 rounded-full cursor-pointer transition-all duration-150 z-[100] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]"
        :title="theme === 'dark' ? '切换浅色主题' : '切换深色主题'"
        @click="toggle"
      >
        {{ theme === 'dark' ? '◐' : '◑' }}
      </button>

      <div class="text-center mb-[48px] select-none">
        <Clock />
      </div>

      <div class="w-[560px]">
        <SearchBar />
      </div>

      <div class="select-none fixed bottom-0 left-1/2 -translate-x-1/2">
        <DockBar />
      </div>
    </div>

    <!-- Toast viewport: centered at top -->
    <ToastViewport class="fixed top-6 left-1/2 z-[200] -translate-x-1/2 flex flex-col gap-2 pointer-events-none" />

    <ToastRoot
      v-for="t in toasts"
      :key="t.id"
      :default-open="true"
      :duration="2000"
      class="rounded-lg bg-[var(--color-text-primary)] px-5 py-2 text-[var(--color-bg)] text-sm whitespace-nowrap shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out"
      @update:open="(val: boolean) => { if (!val) removeToast(t.id) }"
    >
      <ToastTitle>{{ t.message }}</ToastTitle>
    </ToastRoot>
  </ToastProvider>
</template>
