<script lang="ts" setup>
import type { Shortcut } from '../../../composables/useDock'
import { ref } from 'vue'
import { MAX_SHORTCUTS, useDock } from '../../../composables/useDock'
import { useIconStore } from '../../../composables/useIconStore'
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
    exitEditMode
} = useDock()
const iconStore = useIconStore()

const atLimit = () => shortcuts.value.length >= MAX_SHORTCUTS

// Context menu
const ctxMenu = ref({ show: false, x: 0, y: 0 })

// EditCard
const showEditCard = ref(false)
const editingShortcut = ref<Shortcut | null>(null)

// Drag state
let dragIndex = -1

function onContextMenu(e: MouseEvent) {
    e.preventDefault()
    ctxMenu.value = { show: true, x: e.clientX, y: e.clientY }
}

function closeContextMenu() {
    ctxMenu.value.show = false
}

function onToggleEdit() {
    if (editMode.value) {
        exitEditMode()
    }
    else {
        enterEditMode()
    }
    closeContextMenu()
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
    // Edit existing
        update(editingShortcut.value.id, shortcutData)
        if (uploadDataUrl) {
            iconStore.set(editingShortcut.value.id, uploadDataUrl)
        }
    }
    else {
    // Create new
        const created = add(shortcutData)
        if (created && uploadDataUrl) {
            iconStore.set(created.id, uploadDataUrl)
        }
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
    iconStore.remove(id)
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
    if (e.key === 'Escape') {
        if (ctxMenu.value.show) {
            closeContextMenu()
        }
        else if (editMode.value) {
            exitEditMode()
        }
    }
}
</script>

<template>
  <div
    :class="$style.container"
    @contextmenu.prevent="onContextMenu"
    @keydown="onKeydown"
  >
    <div :class="$style.list">
      <DockItem
        v-for="(shortcut, index) in shortcuts"
        :key="shortcut.id"
        :shortcut="shortcut"
        :edit-mode="editMode"
        :index="index"
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

    <ContextMenu
      :show="ctxMenu.show"
      :x="ctxMenu.x"
      :y="ctxMenu.y"
      :edit-mode="editMode"
      @toggle-edit="onToggleEdit"
      @close="closeContextMenu"
    />

    <EditCard
      v-if="showEditCard"
      :shortcut="editingShortcut"
      @save="onSave"
      @cancel="onCancel"
    />
  </div>
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
