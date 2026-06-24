<script lang="ts" setup>
import { onMounted, ref } from 'vue'

import type { Shortcut } from '@/composables/useDock'

const props = defineProps<{
    shortcut: Shortcut
    getIcon: (id: string) => Promise<string | null>
}>()

const _emit = defineEmits<{
    click: [id: string]
    delete: [id: string]
    edit: [id: string]
}>()

const uploadSrc = ref<string | null>(null)
const onlineError = ref(false)

const solidColor = computedSolidColor()
const firstLetter = props.shortcut.name.charAt(0).toUpperCase()

function computedSolidColor(): string {
    if (props.shortcut.iconType === 'solid' && props.shortcut.solidColor) {
        return props.shortcut.solidColor
    }
    return '#555'
}

function getFaviconUrl(url: string): string {
    try {
        const host = new URL(url).hostname
        return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
    }
    catch {
        return ''
    }
}

function handleClick() {
    window.location.href = props.shortcut.url
}

onMounted(async () => {
    if (props.shortcut.iconType === 'upload') {
        const dataUrl = await props.getIcon(props.shortcut.id)
        if (dataUrl) {
            uploadSrc.value = dataUrl
        }
    }
})
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 cursor-pointer shrink-0 min-w-0 max-w-18 relative"
    :title="shortcut.name"
    data-testid="dock-item"
    @click="handleClick"
  >
    <!-- Icon wrapper -->
    <div class="relative group">
      <!-- Online favicon -->
      <img
        v-if="shortcut.iconType === 'online' && !onlineError"
        class="w-11 h-11 rounded-[10px] bg-border object-contain"
        :src="getFaviconUrl(shortcut.url)"
        :alt="shortcut.name"
        @error="onlineError = true"
      >

      <!-- Upload custom icon -->
      <img
        v-else-if="shortcut.iconType === 'upload' && uploadSrc"
        class="w-11 h-11 rounded-[10px] bg-border object-contain"
        :src="uploadSrc"
        :alt="shortcut.name"
      >

      <!-- Solid / fallback -->
      <div
        v-else
        class="w-11 h-11 rounded-[10px] bg-border flex items-center justify-center"
        :style="{ backgroundColor: solidColor }"
      >
        <span class="text-[22px] font-semibold text-white leading-none">{{ firstLetter }}</span>
      </div>
    </div>

    <span class="text-[11px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-center">{{ shortcut.name }}</span>
  </div>
</template>
