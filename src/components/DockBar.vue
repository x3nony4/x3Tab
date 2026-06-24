<script lang="ts" setup>
import { ref } from 'vue'

import type { Shortcut } from '@/composables/useDock'

import { MAX_SHORTCUTS, useDock } from '@/composables/useDock'

import AddButton from './AddButton.vue'
import DockItem from './DockItem.vue'
import EditCard from './EditCard.vue'

const {
    shortcuts,
    add,
    update,
    getIcon
} = useDock()

const atLimit = () => shortcuts.value.length >= MAX_SHORTCUTS

// EditCard
const showEditCard = ref(false)
const editingShortcut = ref<Shortcut | null>(null)

function onAddClick() {
    editingShortcut.value = null
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

function onEditCardOpenChange(open: boolean) {
    if (!open)
        editingShortcut.value = null
}
</script>

<template>
  <div
    data-testid="dock-bar"
    class="px-3 py-2 bg-surface-glass backdrop-blur-xl rounded-t-2xl border border-surface-glass-border border-b-0"
  >
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
      <DockItem
        v-for="shortcut in shortcuts"
        :key="shortcut.id"
        :shortcut="shortcut"
        :get-icon="getIcon"
      />
      <AddButton
        :disabled="atLimit()"
        @click="onAddClick"
      />
    </div>
  </div>

  <EditCard
    v-model:open="showEditCard"
    :shortcut="editingShortcut"
    @save="onSave"
    @cancel="onCancel"
    @update:open="onEditCardOpenChange"
  />
</template>
