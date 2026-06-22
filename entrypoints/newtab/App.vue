<script lang="ts" setup>
import { onMounted } from 'vue'
import { useTheme } from '../../composables/useTheme'

const { theme, toggle, init } = useTheme()

onMounted(() => {
    void init()
})
</script>

<template>
  <div :class="$style.page">
    <button
      :class="$style.themeToggle"
      :title="theme === 'dark' ? '切换浅色主题' : '切换深色主题'"
      @click="toggle"
    >
      {{ theme === 'dark' ? '◐' : '◑' }}
    </button>

    <div :class="$style.clockArea">
      <!-- TODO: Clock component (#3) -->
      <div :class="$style.placeholder">
        00:00:00
      </div>
    </div>

    <div :class="$style.searchArea">
      <!-- TODO: Search Bar component (#4) -->
      <div :class="$style.placeholder">
        搜索
      </div>
    </div>

    <div :class="$style.dockArea">
      <!-- TODO: Docker Bar component (#5) -->
      <div :class="$style.placeholder">
        Dock
      </div>
    </div>
  </div>
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

/* Placeholder */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-tertiary);
}
.clockArea .placeholder {
  font-size: 96px;
  font-weight: 200;
  letter-spacing: -2px;
  color: var(--c-text-primary);
  line-height: 1;
}
.searchArea .placeholder {
  height: 52px;
  background: var(--c-search-bg);
  border: 1px solid var(--c-search-border);
  border-radius: 12px;
  font-size: 18px;
}
.dockArea .placeholder {
  padding: 12px 20px;
  background: var(--c-dock-bg);
  backdrop-filter: var(--c-dock-blur);
  -webkit-backdrop-filter: var(--c-dock-blur);
  border-radius: 16px 16px 0 0;
  border: 1px solid var(--c-dock-border);
  border-bottom: none;
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
