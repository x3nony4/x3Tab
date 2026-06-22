<script lang="ts" setup>
import type { SearchEngine } from '../engines'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStorage } from '../../../composables/useStorage'
import { DEFAULT_ENGINES } from '../engines'
import EnginePanel from './EnginePanel.vue'

const { value: engines } = useStorage<SearchEngine[]>('engines', DEFAULT_ENGINES)

const activeIndex = ref(0)
const query = ref('')
const isFocused = ref(false)
const showPanel = ref(false)
const wrapperRef = ref<HTMLElement>()

function onClickOutside(e: MouseEvent) {
    if (showPanel.value && wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        showPanel.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', onClickOutside, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', onClickOutside, true)
})

const currentEngine = computed(() => engines.value[activeIndex.value] ?? engines.value[0])

function go() {
    const q = encodeURIComponent(query.value.trim())
    const url = currentEngine.value.urlTemplate.replace('%s', q)
    window.location.href = url
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % engines.value.length
    }
    else if (e.key === 'Enter') {
        go()
    }
}

function togglePanel() {
    showPanel.value = !showPanel.value
}

function onSelectEngine(engine: SearchEngine) {
    const idx = engines.value.findIndex(e => e.id === engine.id)
    if (idx !== -1) {
        activeIndex.value = idx
    }
    showPanel.value = false
}
</script>

<template>
  <div ref="wrapperRef" :class="[$style.wrapper, showPanel && $style.wrapperOpen]">
    <div :class="[$style.bar, isFocused && $style.focused]">
      <div :class="$style.icon">
        {{ currentEngine.name[0] }}
      </div>
      <span :class="[$style.arrow, showPanel && $style.arrowOpen]" @click="togglePanel">&#9660;</span>
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
    <EnginePanel
      :visible="showPanel"
      @close="showPanel = false"
      @select="onSelectEngine"
    />
  </div>
</template>

<style module>
.wrapper {
  position: relative;
}

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
  transition:
    border-color 0.2s ease,
    border-radius 0.2s ease;
}

.wrapperOpen .bar {
  border-radius: 12px 12px 0 0;
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
  cursor: pointer;
  padding: 4px 2px;
  transition:
    color 0.15s,
    transform 0.2s;
}

.arrow:hover {
  color: var(--c-text-secondary);
}

.arrowOpen {
  transform: rotate(180deg);
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
