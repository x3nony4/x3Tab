<script lang="ts" setup>
import { ContextMenuItem } from 'reka-ui'
import { ref } from 'vue'

import type { Shortcut } from '@/composables/useDock'

import { MAX_SHORTCUTS, useDock } from '@/composables/useDock'

import AddButton from './AddButton.vue'
import DockItem from './DockItem.vue'
import DockTile from './DockTile.vue'
import EditCard from './EditCard.vue'

const {
    shortcuts,
    add,
    update,
    remove,
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

function onEdit(id: string) {
    editingShortcut.value = shortcuts.value.find(s => s.id === id) ?? null
    showEditCard.value = true
}

function onDelete(id: string) {
    remove(id)
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
      <DockTile
        v-for="shortcut in shortcuts"
        :key="shortcut.id"
        :tooltip="shortcut.name"
        show-menu
      >
        <DockItem
          :shortcut="shortcut"
          :get-icon="getIcon"
        />
        <template #menu>
          <ContextMenuItem
            class="block w-full cursor-pointer select-none whitespace-nowrap rounded-md bg-transparent px-3 py-2 text-left text-[13px] text-text-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated"
            data-testid="menu-edit"
            @select="onEdit(shortcut.id)"
          >
            编辑
          </ContextMenuItem>
          <ContextMenuItem
            class="block w-full cursor-pointer select-none whitespace-nowrap rounded-md bg-transparent px-3 py-2 text-left text-[13px] text-text-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated"
            data-testid="menu-delete"
            @select="onDelete(shortcut.id)"
          >
            删除
          </ContextMenuItem>
        </template>
      </DockTile>
      <DockTile tooltip="添加快捷方式">
        <AddButton
          :disabled="atLimit()"
          @click="onAddClick"
        />
      </DockTile>
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
