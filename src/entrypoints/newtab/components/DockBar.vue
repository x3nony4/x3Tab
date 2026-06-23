<script lang="ts" setup>
import type { Shortcut } from '../../../composables/useDock'
import { ref } from 'vue'
import { MAX_SHORTCUTS, useDock } from '../../../composables/useDock'
import AddButton from './AddButton.vue'
import ContextMenu from './ContextMenu.vue'
import DockItem from './DockItem.vue'
import EditCard from './EditCard.vue'

const {
    shortcuts,
    editMode,
    add,
    update,
    remove,
    reorder,
    enterEditMode,
    exitEditMode,
    getIcon
} = useDock()

const atLimit = () => shortcuts.value.length >= MAX_SHORTCUTS

// EditCard
const showEditCard = ref(false)
const editingShortcut = ref<Shortcut | null>(null)

// Drag state
let dragIndex = -1

function onToggleEdit() {
    if (editMode.value) {
        exitEditMode()
    }
    else {
        enterEditMode()
    }
}

function onAddClick() {
    editingShortcut.value = null
    showEditCard.value = true
}

function onEdit(id: string) {
    editingShortcut.value = shortcuts.value.find(s => s.id === id) ?? null
    showEditCard.value = true
}

function onSave(payload: Omit<Shortcut, 'id'> & { uploadDataUrl?: string }) {
    const { uploadDataUrl, ...shortcutData } = payload

    if (editingShortcut.value) {
        update(editingShortcut.value.id, shortcutData, uploadDataUrl)
    }
    else {
        add(shortcutData, uploadDataUrl)
    }
    showEditCard.value = false
    editingShortcut.value = null
}

function onCancel() {
    showEditCard.value = false
    editingShortcut.value = null
}

function onDelete(id: string) {
    remove(id)
}

function onDragStart(index: number) {
    dragIndex = index
}

function onDragOver(index: number) {
    if (dragIndex === -1 || dragIndex === index)
        return
    reorder(dragIndex, index)
    dragIndex = index
}

function onDrop() {
    dragIndex = -1
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && editMode.value) {
        exitEditMode()
    }
}

function onEditCardOpenChange(open: boolean) {
    if (!open)
        editingShortcut.value = null
}
</script>

<template>
  <ContextMenu
    :edit-mode="editMode"
    @toggle-edit="onToggleEdit"
  >
    <div
      :class="$style.container"
      @keydown="onKeydown"
    >
      <div :class="$style.list">
        <DockItem
          v-for="(shortcut, index) in shortcuts"
          :key="shortcut.id"
          :shortcut="shortcut"
          :edit-mode="editMode"
          :index="index"
          :get-icon="getIcon"
          @edit="onEdit"
          @delete="onDelete"
          @dragstart="onDragStart"
          @dragover.prevent="onDragOver(index)"
          @drop="onDrop"
        />
        <AddButton
          :disabled="atLimit()"
          @click="onAddClick"
        />
      </div>
    </div>
  </ContextMenu>

  <EditCard
    v-model:open="showEditCard"
    :shortcut="editingShortcut"
    @save="onSave"
    @cancel="onCancel"
    @update:open="onEditCardOpenChange"
  />
</template>

<style module>
.container {
  padding: 8px 12px;
  background: var(--c-dock-bg);
  backdrop-filter: var(--c-dock-blur);
  -webkit-backdrop-filter: var(--c-dock-blur);
  border-radius: 16px 16px 0 0;
  border: 1px solid var(--c-dock-border);
  border-bottom: none;
}

.list {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.list::-webkit-scrollbar {
  display: none;
}
</style>
