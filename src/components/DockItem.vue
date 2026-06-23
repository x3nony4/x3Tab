<script lang="ts" setup>
import type { Shortcut } from '@/composables/useDock'
import { MinusIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
    shortcut: Shortcut
    editMode: boolean
    index: number
    getIcon: (id: string) => Promise<string | null>
}>()

const emit = defineEmits<{
    click: [id: string]
    delete: [id: string]
    edit: [id: string]
    dragstart: [index: number]
}>()

const uploadSrc = ref<string | null>(null)
const onlineError = ref(false)

const solidColor = computedSolidColor()
const firstLetter = props.shortcut.name.charAt(0).toUpperCase()

const shakeDelay = computed(() => `${props.index * 0.05}s`)

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
    if (props.editMode)
        return
    window.location.href = props.shortcut.url
}

function handleDelete() {
    emit('delete', props.shortcut.id)
}

function handleEdit() {
    emit('edit', props.shortcut.id)
}

function handleDragStart(e: DragEvent) {
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
    }
    emit('dragstart', props.index)
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
    :class="{ 'animate-[wiggle_0.3s_ease-in-out_infinite]': editMode }"
    :style="editMode ? { animationDelay: shakeDelay } : {}"
    :title="shortcut.name"
    :draggable="editMode"
    data-testid="dock-item"
    @click="handleClick"
    @dragstart="handleDragStart"
  >
    <!-- Delete badge -->
    <button
      v-if="editMode"
      class="absolute top-0 right-0 w-4 h-4 rounded-full bg-danger text-white border-none text-xs font-bold leading-none flex items-center justify-center cursor-pointer z-2 p-0"
      title="删除"
      data-testid="delete-badge"
      @click.stop="handleDelete"
    >
      <MinusIcon class="w-3 h-3" />
    </button>

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

      <!-- Hover mask (edit mode only) -->
      <div
        v-if="editMode"
        class="absolute inset-0 rounded-[10px] bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        data-testid="hover-mask"
        @click.stop="handleEdit"
      >
        <PencilIcon class="w-5 h-5 text-white" />
      </div>
    </div>

    <span class="text-[11px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-center">{{ shortcut.name }}</span>
  </div>
</template>

<style scoped>
@keyframes wiggle {
  0%,
  100% {
    rotate: 0;
  }
  25% {
    rotate: -1.5deg;
  }
  75% {
    rotate: 1.5deg;
  }
}
</style>
