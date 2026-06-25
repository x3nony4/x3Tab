<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'

import type { Shortcut } from '@/composables/useDock'

import FormDialog from './FormDialog.vue'

const props = defineProps<{
    shortcut: Shortcut | null
    open: boolean
}>()

const emit = defineEmits<{
    'save': [Omit<Shortcut, 'id'> & { uploadDataUrl?: string }]
    'cancel': []
    'update:open': [boolean]
}>()

const isOpen = computed({
    get: () => props.open,
    set: val => emit('update:open', val)
})

const isEdit = computed(() => props.shortcut !== null)
const title = computed(() => isEdit.value ? '编辑快捷方式' : '添加快捷方式')

function randomColor(): string {
    const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    return `#${hex}`
}

const name = ref(props.shortcut?.name ?? '')
const url = ref(props.shortcut?.url ?? '')
const iconType = ref<Shortcut['iconType']>(props.shortcut?.iconType ?? 'online')
const solidColor = ref(props.shortcut?.solidColor ?? randomColor())
const uploadDataUrl = ref<string | null>(null)
const uploadPreview = ref<string | null>(null)

const errors = reactive<{ name?: string, url?: string }>({})

watch(() => props.shortcut, (s) => {
    name.value = s?.name ?? ''
    url.value = s?.url ?? ''
    iconType.value = s?.iconType ?? 'online'
    solidColor.value = s?.solidColor ?? randomColor()
    uploadDataUrl.value = null
    uploadPreview.value = null
    errors.name = undefined
    errors.url = undefined
})

function validate(): boolean {
    errors.name = undefined
    errors.url = undefined

    if (!name.value.trim()) {
        errors.name = '名称不能为空'
    }
    if (!url.value.trim()) {
        errors.url = 'URL 不能为空'
    }
    else {
        try {
            // eslint-disable-next-line no-new
            new URL(url.value)
        }
        catch {
            errors.url = 'URL 格式不正确'
        }
    }
    return !errors.name && !errors.url
}

async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file)
        return

    const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
    })
    uploadDataUrl.value = dataUrl
    uploadPreview.value = dataUrl
}

function handleSave() {
    if (!validate())
        return

    emit('save', {
        name: name.value.trim(),
        url: url.value.trim(),
        iconType: iconType.value,
        solidColor: iconType.value === 'solid' ? solidColor.value : undefined,
        uploadDataUrl: iconType.value === 'upload' ? uploadDataUrl.value ?? undefined : undefined
    })
}

function handleCancel() {
    emit('cancel')
}
</script>

<template>
  <FormDialog
    v-model:open="isOpen"
    :title="title"
    :width="400"
    @confirm="handleSave"
    @cancel="handleCancel"
  >
    <!-- Name -->
    <label class="mb-4 block">
      <span class="mb-1.5 block text-[13px] font-medium text-text-secondary">名称</span>
      <input
        v-model="name"
        class="w-full rounded-lg border bg-white/8 px-3 py-2 text-sm text-text-primary outline-none transition-colors" :class="[
          errors.name ? 'border-danger' : 'border-border focus:border-accent',
        ]"
        type="text"
        placeholder="例如：GitHub"
      >
      <span v-if="errors.name" class="mt-1 block text-xs text-danger">{{ errors.name }}</span>
    </label>

    <!-- URL -->
    <label class="mb-4 block">
      <span class="mb-1.5 block text-[13px] font-medium text-text-secondary">URL</span>
      <input
        v-model="url"
        class="w-full rounded-lg border bg-white/8 px-3 py-2 text-sm text-text-primary outline-none transition-colors" :class="[
          errors.url ? 'border-danger' : 'border-border focus:border-accent',
        ]"
        type="text"
        placeholder="https://example.com"
      >
      <span v-if="errors.url" class="mt-1 block text-xs text-danger">{{ errors.url }}</span>
    </label>

    <!-- Icon type -->
    <fieldset class="mb-4 block border-none p-0">
      <legend class="mb-1.5 block text-[13px] font-medium text-text-secondary">
        图标类型
      </legend>
      <div class="flex gap-4">
        <label class="flex cursor-pointer items-center gap-1 text-sm">
          <input v-model="iconType" type="radio" value="online">
          <span>在线</span>
        </label>
        <label class="flex cursor-pointer items-center gap-1 text-sm">
          <input v-model="iconType" type="radio" value="solid">
          <span>纯色</span>
        </label>
        <label class="flex cursor-pointer items-center gap-1 text-sm">
          <input v-model="iconType" type="radio" value="upload">
          <span>上传</span>
        </label>
      </div>
    </fieldset>

    <!-- Conditional: solid color picker -->
    <div v-if="iconType === 'solid'" class="mb-4 block">
      <span class="mb-1.5 block text-[13px] font-medium text-text-secondary">颜色</span>
      <input v-model="solidColor" type="color" class="h-8 w-11 cursor-pointer rounded-md border border-border bg-transparent p-0.5">
    </div>

    <!-- Conditional: upload file input + preview -->
    <div v-if="iconType === 'upload'" class="mb-4 block">
      <span class="mb-1.5 block text-[13px] font-medium text-text-secondary">图标文件</span>
      <input type="file" accept="image/*" @change="handleFileChange">
      <div v-if="uploadPreview" class="mt-2">
        <img :src="uploadPreview" class="h-11 w-11 rounded-[10px] bg-border object-contain" alt="预览">
      </div>
    </div>

    <!-- Conditional: online helper -->
    <p v-if="iconType === 'online'" class="-mt-2 mb-4 text-xs text-text-secondary">
      将自动从网站获取 favicon 图标
    </p>
  </FormDialog>
</template>
