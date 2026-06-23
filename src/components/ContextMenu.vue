<script lang="ts" setup>
import { ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'

defineProps<{
    editMode: boolean
}>()

const emit = defineEmits<{
    toggleEdit: []
}>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent
      class="z-300 min-w-35 rounded-[10px] border border-border bg-bg p-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
    >
      <ContextMenuItem
        class="block w-full cursor-pointer select-none whitespace-nowrap rounded-md bg-transparent px-3 py-2 text-left text-[13px] text-text-primary outline-none hover:bg-surface-elevated focus:bg-surface-elevated"
        @select="emit('toggleEdit')"
      >
        {{ editMode ? '退出编辑' : '编辑 Docker 栏' }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenuRoot>
</template>
