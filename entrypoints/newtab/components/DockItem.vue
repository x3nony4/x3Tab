<script lang="ts" setup>
import type { Shortcut } from '../../../composables/useDock'
import { onMounted, ref } from 'vue'
import { useIconStore } from '../../../composables/useIconStore'

const props = defineProps<{
    shortcut: Shortcut
    editMode: boolean
}>()

defineEmits<{
    click: [id: string]
}>()

const iconStore = useIconStore()
const uploadSrc = ref<string | null>(null)
const onlineError = ref(false)

const solidColor = computedSolidColor()
const firstLetter = props.shortcut.name.charAt(0).toUpperCase()

function computedSolidColor(): string {
    if (props.shortcut.iconType === 'solid' && props.shortcut.solidColor) {
        return props.shortcut.solidColor
    }
    // Default fallback color for online-error and unspecified solid
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
    if (!props.editMode) {
        window.location.href = props.shortcut.url
    }
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
    :class="$style.item"
    :title="shortcut.name"
    @click="handleClick"
  >
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

    <!-- Solid / fallback: colored letter -->
    <div
      v-else
      :class="$style.icon"
      :style="{ backgroundColor: solidColor }"
    >
      <span :class="$style.letter">{{ firstLetter }}</span>
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
</style>
