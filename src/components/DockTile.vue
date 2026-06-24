<script lang="ts" setup>
import { ContextMenuContent, ContextMenuRoot, ContextMenuTrigger, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{
    tooltip: string
    showMenu?: boolean
}>()
</script>

<template>
  <TooltipProvider :delay-duration="500">
    <TooltipRoot>
      <ContextMenuRoot v-if="showMenu">
        <ContextMenuTrigger as-child>
          <TooltipTrigger as-child>
            <slot />
          </TooltipTrigger>
        </ContextMenuTrigger>
        <ContextMenuContent
          class="z-300 min-w-35 rounded-[10px] border border-border bg-bg p-1 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
        >
          <slot name="menu" />
        </ContextMenuContent>
      </ContextMenuRoot>
      <TooltipTrigger v-else as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="z-300 rounded-md bg-bg-inverse px-2 py-1 text-xs text-text-inverse shadow-md"
        >
          {{ tooltip }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
