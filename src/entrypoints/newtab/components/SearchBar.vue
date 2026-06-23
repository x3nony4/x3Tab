<script lang="ts" setup>
import type { SearchEngine } from '../engines'
import { PopoverAnchor, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { useStorage } from '../../../composables/useStorage'
import { DEFAULT_ENGINES } from '../engines'
import EnginePanel from './EnginePanel.vue'

const { value: engines } = useStorage<SearchEngine[]>('engines', DEFAULT_ENGINES)

const engineList = computed(() => Array.isArray(engines.value) ? engines.value : DEFAULT_ENGINES)

const activeIndex = ref(0)
const query = ref('')
const isFocused = ref(false)
const showPanel = ref(false)

const currentEngine = computed(() => engineList.value[activeIndex.value] ?? engineList.value[0])

function go() {
    const q = encodeURIComponent(query.value.trim())
    const url = currentEngine.value.urlTemplate.replace('%s', q)
    window.location.href = url
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % engineList.value.length
    }
    else if (e.key === 'Enter') {
        go()
    }
}

function onSelectEngine(engine: SearchEngine) {
    const idx = engineList.value.findIndex(e => e.id === engine.id)
    if (idx !== -1) {
        activeIndex.value = idx
    }
    showPanel.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="showPanel">
    <PopoverAnchor class="relative w-[var(--search-width)]">
      <div :class="[$style.bar, isFocused && $style.focused, showPanel && $style.barOpen]">
        <PopoverTrigger as-child>
          <span :class="$style.trigger">
            <div :class="$style.icon">
              {{ currentEngine.name[0] }}
            </div>
            <span :class="[$style.arrow, showPanel && $style.arrowOpen]">&#9660;</span>
          </span>
        </PopoverTrigger>
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
    </PopoverAnchor>
    <EnginePanel @select="onSelectEngine" />
  </PopoverRoot>
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
  transition:
    border-color 0.2s ease,
    border-radius 0.2s ease;
}

.barOpen {
  border-radius: 12px 12px 0 0;
}

.focused {
  border-color: var(--c-search-border-focus);
}

.trigger {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
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
  padding: 4px 2px;
  transition:
    color 0.15s,
    transform 0.2s;
}

.trigger:hover .arrow {
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
