<script lang="ts" setup>
defineProps<{
    disabled: boolean
}>()

const emit = defineEmits<{
    click: []
}>()
</script>

<template>
  <button
    :class="$style.btn"
    :disabled="disabled"
    :title="disabled ? '已达到 15 个快捷方式上限' : '添加快捷方式'"
    @click="emit('click')"
  >
    <span :class="$style.icon">+</span>
  </button>
</template>

<style module>
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1.5px dashed var(--c-border);
  background: transparent;
  color: var(--c-text-secondary);
  cursor: pointer;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.btn:hover:not(:disabled) {
  border-color: var(--c-border-hover);
  color: var(--c-text-primary);
}
.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.icon {
  font-size: 22px;
  line-height: 1;
}
</style>
