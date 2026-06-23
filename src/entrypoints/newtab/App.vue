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
    <div :class="$style.page">
      <button
        :class="$style.themeToggle"
        :title="theme === 'dark' ? '切换浅色主题' : '切换深色主题'"
        @click="toggle"
      >
        {{ theme === 'dark' ? '◐' : '◑' }}
      </button>

      <div :class="$style.clockArea">
        <Clock />
      </div>

      <div :class="$style.searchArea">
        <SearchBar />
      </div>

      <div :class="$style.dockArea">
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

<style module>
.page {
  --search-width: 560px;

  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 18vh;
  overflow: hidden;
  font-family:
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Theme toggle */
.themeToggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: none;
  border: 1px solid var(--c-border);
  color: var(--c-text-secondary);
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
  z-index: 100;
}
.themeToggle:hover {
  color: var(--c-text-primary);
  border-color: var(--c-border-hover);
}

/* Clock */
.clockArea {
  text-align: center;
  margin-bottom: 48px;
  user-select: none;
}

/* Search */
.searchArea {
  width: var(--search-width);
}

/* Dock */
.dockArea {
  user-select: none;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}
</style>

<style>
/* ── Theme: CSS custom properties ── */
:root {
  /* dark theme (default) */
  --c-bg: #1c1c1e;
  --c-text-primary: #e4e4e4;
  --c-text-secondary: #888;
  --c-text-tertiary: #666;
  --c-border: rgba(255, 255, 255, 0.08);
  --c-border-hover: rgba(255, 255, 255, 0.2);
  --c-search-bg: rgba(255, 255, 255, 0.04);
  --c-search-border: rgba(255, 255, 255, 0.06);
  --c-search-border-focus: rgba(255, 255, 255, 0.15);
  --c-dock-bg: rgba(28, 28, 30, 0.6);
  --c-dock-blur: blur(24px);
  --c-dock-border: rgba(255, 255, 255, 0.05);
}

[data-theme='light'] {
  /* light theme */
  --c-bg: #f5f5f7;
  --c-text-primary: #1c1c1e;
  --c-text-secondary: #666;
  --c-text-tertiary: #999;
  --c-border: rgba(0, 0, 0, 0.08);
  --c-border-hover: rgba(0, 0, 0, 0.2);
  --c-search-bg: rgba(0, 0, 0, 0.04);
  --c-search-border: rgba(0, 0, 0, 0.08);
  --c-search-border-focus: rgba(0, 0, 0, 0.2);
  --c-dock-bg: rgba(245, 245, 247, 0.6);
  --c-dock-blur: blur(24px);
  --c-dock-border: rgba(0, 0, 0, 0.05);
}

/* ── Global reset ── */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--c-bg);
  color: var(--c-text-primary);
  user-select: none;
}

input,
textarea {
  user-select: text;
}
</style>
