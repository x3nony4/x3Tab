<script lang="ts" setup>
import { computed, ref } from 'vue'

interface SearchEngine {
    id: string
    name: string
    urlTemplate: string
}

const ENGINES: SearchEngine[] = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s' },
    { id: 'bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q=%s' },
    { id: 'duckduckgo', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q=%s' }
]

const activeIndex = ref(0)
const query = ref('')
const isFocused = ref(false)

const currentEngine = computed(() => ENGINES[activeIndex.value])

function go() {
    const q = encodeURIComponent(query.value.trim())
    const url = currentEngine.value.urlTemplate.replace('%s', q)
    window.location.href = url
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % ENGINES.length
    }
    else if (e.key === 'Enter') {
        go()
    }
}
</script>

<template>
  <div :class="[$style.bar, isFocused && $style.focused]">
    <div :class="$style.icon">
      {{ currentEngine.name[0] }}
    </div>
    <span :class="$style.arrow">&#9660;</span>
    <input
      v-model="query"
      :class="$style.input"
      type="text"
      placeholder="搜索或输入网址"
      @keydown="onKeydown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
  </div>
</template>

<style module>
.bar {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 14px;
  background: var(--c-search-bg);
  border: 1px solid var(--c-search-border);
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.focused {
  border-color: var(--c-search-border-focus);
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--c-border);
  color: var(--c-text-secondary);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}

.arrow {
  font-size: 9px;
  color: var(--c-text-tertiary);
  margin-left: 5px;
  margin-right: 10px;
  flex-shrink: 0;
  user-select: none;
  line-height: 1;
}

.input {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--c-text-primary);
  font-size: 18px;
  font-family: inherit;
}

.input::placeholder {
  color: var(--c-text-tertiary);
}
</style>
