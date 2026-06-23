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
    <PopoverAnchor class="relative w-[560px]">
      <div
        data-testid="search-bar"
        class="w-full h-[52px] flex items-center gap-0 px-[14px] bg-[var(--color-surface-elevated)] border rounded-xl transition-[border-color,border-radius] duration-200 ease"
        :class="{
          'rounded-t-xl rounded-b-none': showPanel,
          'border-[var(--color-surface-border-focus)]': isFocused,
          'border-[var(--color-surface-border)]': !isFocused,
        }"
      >
        <PopoverTrigger as-child>
          <span data-testid="engine-trigger" class="group flex items-center shrink-0 cursor-pointer select-none">
            <span data-testid="engine-icon" class="w-8 h-8 rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-semibold flex items-center justify-center shrink-0 select-none">
              {{ currentEngine.name[0] }}
            </span>
            <span
              data-testid="engine-arrow"
              class="text-[9px] text-[var(--color-text-tertiary)] ml-[5px] mr-[10px] shrink-0 select-none leading-none py-[4px] px-[2px] transition duration-150 group-hover:text-[var(--color-text-secondary)]"
              :class="{ 'rotate-180': showPanel }"
            >&#9660;</span>
          </span>
        </PopoverTrigger>
        <input
          v-model="query"
          class="flex-1 h-full bg-transparent border-none outline-none text-[var(--color-text-primary)] text-lg placeholder:text-[var(--color-text-tertiary)]"
          style="font-family: inherit"
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
