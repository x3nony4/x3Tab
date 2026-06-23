<script lang="ts" setup>
import { PlusIcon } from '@heroicons/vue/24/outline'

defineProps<{
    disabled: boolean
}>()

const emit = defineEmits<{
    click: []
}>()
</script>

<template>
  <button
    class="flex items-center justify-center w-11 h-11 rounded-[10px] border-[1.5px] border-dashed border-border bg-transparent text-text-secondary cursor-pointer transition-opacity duration-150 shrink-0 hover:border-border-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
    :disabled="disabled"
    :title="disabled ? '已达到 15 个快捷方式上限' : '添加快捷方式'"
    @click="emit('click')"
  >
    <PlusIcon class="w-5 h-5" />
  </button>
</template>
