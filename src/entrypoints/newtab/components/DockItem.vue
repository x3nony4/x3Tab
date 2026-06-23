<script lang="ts" setup>
import type { Shortcut } from '../../../composables/useDock'
import { computed, onMounted, ref } from 'vue'
import { useIconStore } from '../../../composables/useIconStore'

const props = defineProps<{
    shortcut: Shortcut
    editMode: boolean
    index: number
}>()

const emit = defineEmits<{
    click: [id: string]
    delete: [id: string]
    edit: [id: string]
    dragstart: [index: number]
}>()

const iconStore = useIconStore()
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
        const dataUrl = await iconStore.get(props.shortcut.id)
        if (dataUrl) {
            uploadSrc.value = dataUrl
        }
    }
})
</script>

<template>
  <div
    :class="[$style.item, editMode && $style.shaking]"
    :style="editMode ? { animationDelay: shakeDelay } : {}"
    :title="shortcut.name"
    :draggable="editMode"
    @click="handleClick"
    @dragstart="handleDragStart"
  >
    <!-- Delete badge -->
    <button
      v-if="editMode"
      :class="$style.deleteBadge"
      title="删除"
      @click.stop="handleDelete"
    >
      &minus;
    </button>

    <!-- Icon wrapper -->
    <div :class="$style.iconWrap">
      <!-- Online favicon -->
      <img
        v-if="shortcut.iconType === 'online' && !onlineError"
        :class="$style.icon"
        :src="getFaviconUrl(shortcut.url)"
        :alt="shortcut.name"
        @error="onlineError = true"
      >

      <!-- Upload custom icon -->
      <img
        v-else-if="shortcut.iconType === 'upload' && uploadSrc"
        :class="$style.icon"
        :src="uploadSrc"
        :alt="shortcut.name"
      >

      <!-- Solid / fallback -->
      <div
        v-else
        :class="$style.icon"
        :style="{ backgroundColor: solidColor }"
      >
        <span :class="$style.letter">{{ firstLetter }}</span>
      </div>

      <!-- Hover mask (edit mode only) -->
      <div
        v-if="editMode"
        :class="$style.hoverMask"
        @click.stop="handleEdit"
      >
        <span :class="$style.editIcon">&#9998;</span>
      </div>
    </div>

    <span :class="$style.name">{{ shortcut.name }}</span>
  </div>
</template>

<style module>
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  flex-shrink: 0;
  min-width: 0;
  max-width: 72px;
  position: relative;
}

.iconWrap {
  position: relative;
}

.icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: contain;
}

.letter {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
}

.name {
  font-size: 11px;
  color: var(--c-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  text-align: center;
}

/* Shaking */
.shaking {
  animation: wiggle 0.3s ease-in-out infinite;
}

/* Delete badge */
.deleteBadge {
  position: absolute;
  top: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e74c3c;
  color: #fff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  padding: 0;
}

/* Hover mask */
.hoverMask {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.iconWrap:hover .hoverMask {
  opacity: 1;
}

.editIcon {
  font-size: 18px;
  color: #fff;
}

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
