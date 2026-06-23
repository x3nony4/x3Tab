<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
    show: boolean
    x: number
    y: number
    editMode: boolean
}>()

const emit = defineEmits<{
    toggleEdit: []
    close: []
}>()

const menuRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
    if (!props.show)
        return
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        emit('close')
    }
}

function onDocKeydown(e: KeyboardEvent) {
    if (!props.show)
        return
    if (e.key === 'Escape') {
        emit('close')
    }
}

onMounted(() => {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onDocKeydown)
})

onUnmounted(() => {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <div
    v-if="show"
    ref="menuRef"
    :class="$style.menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <button :class="$style.item" @click="emit('toggleEdit')">
      {{ editMode ? '退出编辑' : '编辑 Docker 栏' }}
    </button>
  </div>
</template>

<style module>
.menu {
  position: fixed;
  z-index: 300;
  min-width: 140px;
  padding: 4px;
  background: var(--c-bg, #1e1e2e);
  border: 1px solid var(--c-border, #444);
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-text-primary, #e0e0e0);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.item:hover {
  background: var(--c-btn-secondary-bg, #3a3a4c);
}
</style>
