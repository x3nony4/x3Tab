<script lang="ts" setup>
import { ReorderItem } from 'motion-v'

import type { Shortcut } from '@/composables/useDock'

import { useLongPressDrag } from '@/composables/useLongPressDrag'

import DockItem from './DockItem.vue'
import DockTile from './DockTile.vue'

defineProps<{
    shortcut: Shortcut
    tooltip: string
    showMenu?: boolean
    getIcon: (id: string) => Promise<string | null>
}>()

const { onPointerDown, onPointerMove, onPointerUp, dragControls } = useLongPressDrag()
</script>

<template>
  <ReorderItem
    v-slot="{ isDragging }"
    :value="shortcut.id"
    :drag-controls="dragControls"
    :drag-listener="false"
    :while-drag="{ scale: 1.12, boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }"
    as="div"
    class="shrink-0"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div :class="{ 'pointer-events-none': isDragging }">
      <DockTile :tooltip="tooltip" :show-menu="showMenu">
        <DockItem
          :shortcut="shortcut"
          :get-icon="getIcon"
        />
        <template #menu>
          <slot name="menu" />
        </template>
      </DockTile>
    </div>
  </ReorderItem>
</template>
