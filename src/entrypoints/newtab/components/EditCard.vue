<script lang="ts" setup>
import type { Shortcut } from '../../../composables/useDock'
import { computed, reactive, ref } from 'vue'

const props = defineProps<{
    shortcut: Shortcut | null
}>()

const emit = defineEmits<{
    save: [Omit<Shortcut, 'id'> & { uploadDataUrl?: string }]
    cancel: []
}>()

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
</script>

<template>
  <div :class="$style.overlay" data-overlay @click.self="emit('cancel')">
    <div :class="$style.card">
      <h2 :class="$style.title">
        {{ title }}
      </h2>

      <!-- Name -->
      <label :class="$style.field">
        <span :class="$style.label">名称</span>
        <input
          v-model="name"
          :class="[$style.input, errors.name && $style.inputError]"
          type="text"
          placeholder="例如：GitHub"
        >
        <span v-if="errors.name" :class="$style.error">{{ errors.name }}</span>
      </label>

      <!-- URL -->
      <label :class="$style.field">
        <span :class="$style.label">URL</span>
        <input
          v-model="url"
          :class="[$style.input, errors.url && $style.inputError]"
          type="text"
          placeholder="https://example.com"
        >
        <span v-if="errors.url" :class="$style.error">{{ errors.url }}</span>
      </label>

      <!-- Icon type -->
      <fieldset :class="$style.field">
        <legend :class="$style.label">
          图标类型
        </legend>
        <div :class="$style.radioGroup">
          <label :class="$style.radio">
            <input v-model="iconType" type="radio" value="online">
            <span>在线</span>
          </label>
          <label :class="$style.radio">
            <input v-model="iconType" type="radio" value="solid">
            <span>纯色</span>
          </label>
          <label :class="$style.radio">
            <input v-model="iconType" type="radio" value="upload">
            <span>上传</span>
          </label>
        </div>
      </fieldset>

      <!-- Conditional: solid color picker -->
      <div v-if="iconType === 'solid'" :class="$style.field">
        <span :class="$style.label">颜色</span>
        <input v-model="solidColor" type="color" :class="$style.colorPicker">
      </div>

      <!-- Conditional: upload file input + preview -->
      <div v-if="iconType === 'upload'" :class="$style.field">
        <span :class="$style.label">图标文件</span>
        <input type="file" accept="image/*" @change="handleFileChange">
        <div v-if="uploadPreview" :class="$style.previewWrap">
          <img :src="uploadPreview" :class="$style.preview" alt="预览">
        </div>
      </div>

      <!-- Conditional: online helper -->
      <p v-if="iconType === 'online'" :class="$style.helper">
        将自动从网站获取 favicon 图标
      </p>

      <!-- Actions -->
      <div :class="$style.actions">
        <button :class="$style.btnCancel" type="button" @click="emit('cancel')">
          取消
        </button>
        <button :class="$style.btnSave" type="button" @click="handleSave">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 400px;
  border-radius: 16px;
  padding: 24px;
  background: var(--c-bg, #1e1e2e);
  color: var(--c-text-primary, #e0e0e0);
}

.title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
}

.field {
  display: block;
  margin-bottom: 16px;
  border: none;
  padding: 0;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text-secondary, #999);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border, #444);
  background: var(--c-input-bg, #2a2a3c);
  color: var(--c-text-primary, #e0e0e0);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--c-accent, #6c8cff);
}

.inputError {
  border-color: #e74c3c;
}

.error {
  display: block;
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}

.radioGroup {
  display: flex;
  gap: 16px;
}

.radio {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
}

.colorPicker {
  width: 44px;
  height: 32px;
  border: 1px solid var(--c-border, #444);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: transparent;
}

.helper {
  font-size: 12px;
  color: var(--c-text-secondary, #999);
  margin: -8px 0 16px;
}

.previewWrap {
  margin-top: 8px;
}

.preview {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: contain;
  background: var(--c-border, #444);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btnCancel,
.btnSave {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.btnCancel {
  background: var(--c-btn-secondary-bg, #3a3a4c);
  color: var(--c-text-primary, #e0e0e0);
}

.btnSave {
  background: var(--c-accent, #6c8cff);
  color: #fff;
}

.btnCancel:hover,
.btnSave:hover {
  opacity: 0.85;
}
</style>
