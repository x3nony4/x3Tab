<script lang="ts" setup>
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { PopoverContent } from 'reka-ui'
import { computed, inject, ref } from 'vue'

import type { SearchEngine } from '@/entrypoints/newtab/engines'

import { useStorage } from '@/composables/useStorage'
import { DEFAULT_ENGINES, generateEngineId, randomEngineColor } from '@/entrypoints/newtab/engines'

import FormDialog from './FormDialog.vue'

const emit = defineEmits<{
    select: [engine: SearchEngine]
}>()

const showToast = inject<(msg: string) => void>('showToast', () => {})

const { value: engines, item: enginesItem } = useStorage<SearchEngine[]>('engines', DEFAULT_ENGINES)

const engineList = computed(() => Array.isArray(engines.value) ? engines.value : DEFAULT_ENGINES)

// ── Add form ──
const showAddForm = ref(false)
const newName = ref('')
const newUrl = ref('')
const addError = ref('')

function openAddForm() {
    newName.value = ''
    newUrl.value = ''
    addError.value = ''
    showAddForm.value = true
}

function cancelAdd() {
    showAddForm.value = false
}

async function confirmAdd() {
    const name = newName.value.trim()
    const url = newUrl.value.trim()

    if (!name) {
        addError.value = '名称不能为空'
        return
    }
    if (!url) {
        addError.value = 'URL 模板不能为空'
        return
    }
    if (!url.includes('%s')) {
        addError.value = 'URL 模板必须包含 %s 占位符'
        return
    }

    const fresh: SearchEngine = {
        id: generateEngineId(name),
        name,
        urlTemplate: url,
        color: randomEngineColor()
    }

    engines.value = [...engineList.value, fresh]
    await enginesItem.setValue(engines.value)
    showAddForm.value = false
}

// ── Delete ──
async function deleteEngine(id: string) {
    if (engineList.value.length <= 1) {
        showToast('至少保留一个搜索引擎')
        return
    }
    engines.value = engineList.value.filter(e => e.id !== id)
    await enginesItem.setValue(engines.value)
}

// ── Select ──
function selectEngine(engine: SearchEngine) {
    emit('select', engine)
}
</script>

<template>
  <PopoverContent
    side="bottom"
    align="start"
    :side-offset="4"
    class="engine-panel w-140 rounded-xl border border-surface-border bg-surface-elevated p-4 backdrop-blur-lg z-50 overflow-hidden"
  >
    <!-- Engine grid -->
    <div class="engine-grid flex gap-3 flex-wrap">
      <div
        v-for="engine in engineList"
        :key="engine.id"
        class="engine-item group relative flex flex-col items-center gap-1.5 cursor-pointer select-none p-1 rounded-lg transition-colors hover:bg-white/6"
        @click="selectEngine(engine)"
      >
        <div
          class="engine-icon w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-semibold shrink-0"
          :style="{ background: engine.color }"
        >
          {{ engine.name[0].toUpperCase() }}
        </div>
        <span class="engine-name text-[11px] text-text-secondary max-w-16 overflow-hidden text-ellipsis whitespace-nowrap">
          {{ engine.name }}
        </span>
        <button
          v-if="engineList.length > 1"
          class="del-btn absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-none bg-text-tertiary text-bg text-[13px] leading-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="删除引擎"
          @click.stop="deleteEngine(engine.id)"
        >
          <XMarkIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        class="add-btn-item group relative flex flex-col items-center gap-1.5 cursor-pointer select-none p-1 rounded-lg transition-colors hover:bg-white/6"
        @click="openAddForm"
      >
        <div class="add-icon w-10 h-10 rounded-full bg-border text-text-secondary flex items-center justify-center shrink-0 transition-colors group-hover:bg-border-hover">
          <PlusIcon class="w-5 h-5" />
        </div>
        <span class="engine-name text-[11px] text-text-secondary max-w-16 overflow-hidden text-ellipsis whitespace-nowrap">添加</span>
      </div>
    </div>
  </PopoverContent>

  <!-- Add form dialog -->
  <FormDialog
    v-model:open="showAddForm"
    title="添加搜索引擎"
    :width="360"
    confirm-label="添加"
    @confirm="confirmAdd"
    @cancel="cancelAdd"
  >
    <label class="mb-3.5 block">
      <span class="mb-1.5 block text-xs text-text-secondary">名称</span>
      <input
        v-model="newName"
        class="h-10 w-full rounded-lg border border-surface-border bg-surface-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-surface-border-focus"
        type="text"
        placeholder="例如：GitHub"
        @keydown.enter="confirmAdd"
      >
    </label>

    <label class="mb-3.5 block">
      <span class="mb-1.5 block text-xs text-text-secondary">URL 模板</span>
      <input
        v-model="newUrl"
        class="h-10 w-full rounded-lg border border-surface-border bg-surface-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-surface-border-focus"
        type="text"
        placeholder="例如：https://github.com/search?q=%s"
        @keydown.enter="confirmAdd"
      >
    </label>

    <div v-if="addError" class="mb-3 text-xs text-danger">
      {{ addError }}
    </div>
  </FormDialog>
</template>

<style>
/* ── Popover transition ── */
.engine-panel[data-state='open'] {
  animation: engine-panel-in 0.2s ease;
}

.engine-panel[data-state='closed'] {
  animation: engine-panel-out 0.15s ease;
}

@keyframes engine-panel-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes engine-panel-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}

/* ── Delete button hover color ── */
.del-btn:hover {
  background: var(--color-danger) !important;
  color: #fff !important;
}
</style>
