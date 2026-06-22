<script lang="ts" setup>
import type { SearchEngine } from '../engines'
import { ref } from 'vue'
import { useStorage } from '../../../composables/useStorage'
import { DEFAULT_ENGINES, generateEngineId, randomEngineColor } from '../engines'

defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    close: []
    select: [engine: SearchEngine]
}>()

const { value: engines, item: enginesItem } = useStorage<SearchEngine[]>('engines', DEFAULT_ENGINES)

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

    engines.value = [...engines.value, fresh]
    await enginesItem.setValue(engines.value)
    showAddForm.value = false
}

// ── Toast ──
const toast = ref('')
function showToast(msg: string) {
    toast.value = msg
    setTimeout(() => {
        toast.value = ''
    }, 2000)
}

// ── Delete ──
async function deleteEngine(id: string) {
    if (engines.value.length <= 1) {
        showToast('至少保留一个搜索引擎')
        return
    }
    engines.value = engines.value.filter(e => e.id !== id)
    await enginesItem.setValue(engines.value)
}

// ── Select ──
function selectEngine(engine: SearchEngine) {
    emit('select', engine)
    emit('close')
}
</script>

<template>
  <Transition name="panel">
    <div v-if="visible" :class="$style.panel">
      <div :class="$style.grid">
        <div
          v-for="engine in engines"
          :key="engine.id"
          :class="$style.item"
          @click="selectEngine(engine)"
        >
          <div :class="$style.icon" :style="{ background: engine.color }">
            {{ engine.name[0].toUpperCase() }}
          </div>
          <span :class="$style.name">{{ engine.name }}</span>
          <button
            v-if="engines.length > 1"
            :class="$style.del"
            title="删除引擎"
            @click.stop="deleteEngine(engine.id)"
          >
            &times;
          </button>
        </div>

        <div :class="$style.item" @click="openAddForm">
          <div :class="[$style.icon, $style.addIcon]">
            +
          </div>
          <span :class="$style.name">添加</span>
        </div>
      </div>

      <Transition name="toast">
        <div v-if="toast" :class="$style.toast">
          {{ toast }}
        </div>
      </Transition>

      <!-- Add form overlay (teleported to body to escape panel overflow/backdrop-filter) -->
      <Teleport to="body">
        <div v-if="showAddForm" :class="$style.overlay" @click.self="cancelAdd">
          <div :class="$style.form">
            <div :class="$style.formTitle">
              添加搜索引擎
            </div>

            <label :class="$style.label">
              <span>名称</span>
              <input v-model="newName" :class="$style.input" type="text" placeholder="例如：GitHub" @keydown.enter="confirmAdd">
            </label>

            <label :class="$style.label">
              <span>URL 模板</span>
              <input v-model="newUrl" :class="$style.input" type="text" placeholder="例如：https://github.com/search?q=%s" @keydown.enter="confirmAdd">
            </label>

            <div v-if="addError" :class="$style.error">
              {{ addError }}
            </div>

            <div :class="$style.formActions">
              <button :class="$style.btnCancel" @click="cancelAdd">
                取消
              </button>
              <button :class="$style.btnConfirm" @click="confirmAdd">
                添加
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </Transition>
</template>

<style module>
.panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  padding: 16px;
  background: var(--c-card-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--c-search-border);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 50;
  overflow: hidden;
}

/* ── Grid ── */
.grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Engine item ── */
.item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  padding: 4px;
  border-radius: 8px;
  transition: background 0.15s;
}

.item:hover {
  background: var(--c-hover-bg, rgba(255, 255, 255, 0.06));
}

.icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.addIcon {
  background: var(--c-border) !important;
  color: var(--c-text-secondary);
  font-size: 20px;
  font-weight: 400;
  transition: background 0.15s;
}

.item:hover .addIcon {
  background: var(--c-border-hover) !important;
}

.name {
  font-size: 11px;
  color: var(--c-text-secondary);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Delete button ── */
.del {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--c-text-tertiary);
  color: var(--c-bg);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item:hover .del {
  opacity: 1;
}

.del:hover {
  background: #e74c3c;
  color: #fff;
}

/* ── Form overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.form {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
}

.formTitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 20px;
}

.label {
  display: block;
  margin-bottom: 14px;
}

.label span {
  display: block;
  font-size: 12px;
  color: var(--c-text-secondary);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--c-search-bg);
  border: 1px solid var(--c-search-border);
  border-radius: 8px;
  color: var(--c-text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.input:focus {
  border-color: var(--c-search-border-focus);
}

.error {
  color: #e74c3c;
  font-size: 12px;
  margin-bottom: 12px;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btnCancel,
.btnConfirm {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btnCancel {
  background: var(--c-search-bg);
  color: var(--c-text-secondary);
}

.btnConfirm {
  background: #4285f4;
  color: #fff;
}

.btnCancel:hover,
.btnConfirm:hover {
  opacity: 0.85;
}

/* ── Toast ── */
.toast {
  position: absolute;
  top: -48px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: var(--c-text-primary);
  color: var(--c-bg);
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 60;
  pointer-events: none;
}
</style>

<!-- Transition classes (scoped to this component via panel- prefix) -->
<style>
.panel-enter-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 300px;
}

.panel-leave-active {
  transition:
    max-height 0.2s ease,
    opacity 0.15s ease;
  max-height: 300px;
}

.panel-enter-from,
.panel-leave-to {
  max-height: 0;
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
