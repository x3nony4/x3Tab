<script lang="ts" setup>
import { MAX_SHORTCUTS, useDock } from '../../../composables/useDock'
import AddButton from './AddButton.vue'
import DockItem from './DockItem.vue'

const { shortcuts, editMode } = useDock()

const atLimit = () => shortcuts.value.length >= MAX_SHORTCUTS

function onAddClick() {
    // Placeholder — EditCard will be wired in #10
}
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.list">
      <DockItem
        v-for="(shortcut, index) in shortcuts"
        :key="shortcut.id"
        :shortcut="shortcut"
        :edit-mode="editMode"
        :data-index="index"
      />
      <AddButton
        :disabled="atLimit()"
        @click="onAddClick"
      />
    </div>
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
