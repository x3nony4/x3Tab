<script lang="ts" setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    open: boolean
    title: string
    width?: number
    confirmLabel?: string
    cancelLabel?: string
}>(), {
    confirmLabel: '保存',
    cancelLabel: '取消'
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    'confirm': []
    'cancel': []
}>()

const isOpen = computed({
    get: () => props.open,
    set: val => emit('update:open', val)
})

const widthClass = computed(() => {
    if (props.width === undefined)
        return 'w-full'
    return `w-[${props.width}px]`
})

function onConfirm() {
    emit('confirm')
}

function onCancel() {
    emit('cancel')
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-200 bg-black/40" />
      <DialogContent
        :class="widthClass"
        class="fixed left-1/2 top-1/2 z-200 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg p-6 text-text-primary"
      >
        <DialogTitle class="mb-5 text-lg font-semibold">
          {{ title }}
        </DialogTitle>

        <slot />

        <div class="mt-5 flex justify-end gap-2">
          <slot name="actions" :on-cancel="onCancel" :on-confirm="onConfirm">
            <button
              type="button"
              class="cursor-pointer rounded-lg border-none bg-white/10 px-5 py-2 text-sm text-text-primary transition-opacity hover:opacity-85"
              @click="onCancel"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-lg border-none bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-85"
              @click="onConfirm"
            >
              {{ confirmLabel }}
            </button>
          </slot>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
