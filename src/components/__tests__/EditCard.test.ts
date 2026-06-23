import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '@/composables/useDock'
import EditCard from '../EditCard.vue'

function makeShortcut(overrides?: Partial<Shortcut>): Shortcut {
  return {
    id: 'test-1',
    name: 'GitHub',
    url: 'https://github.com',
    iconType: 'online',
    ...overrides,
  }
}

/** Get save button (last button in component). */
function saveBtn(wrapper: ReturnType<typeof mount>) {
  const btns = wrapper.findAll('button')
  return btns[btns.length - 1]
}

/** Get cancel button (first button in component). */
function cancelBtn(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button')[0]
}

function mountCard(props?: Partial<{ shortcut: Shortcut | null, open: boolean }>) {
  return mount(EditCard, {
    props: { shortcut: null, open: true, ...props },
  })
}

describe('EditCard', () => {
  describe('render modes', () => {
    it('renders create mode title and empty fields', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('添加快捷方式')
      const inputs = wrapper.findAll('input[type="text"]')
      expect((inputs[0].element as HTMLInputElement).value).toBe('')
      expect((inputs[1].element as HTMLInputElement).value).toBe('')
    })

    it('renders edit mode title and pre-filled fields', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ name: 'MyApp', url: 'https://myapp.com' }) })
      expect(wrapper.text()).toContain('编辑快捷方式')
      const inputs = wrapper.findAll('input[type="text"]')
      expect((inputs[0].element as HTMLInputElement).value).toBe('MyApp')
      expect((inputs[1].element as HTMLInputElement).value).toBe('https://myapp.com')
    })

    it('defaults to online icon type in create mode', () => {
      const wrapper = mountCard()
      const onlineRadio = wrapper.find('input[value="online"]')
      expect((onlineRadio.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('icon type conditional UI', () => {
    it('shows color picker when solid is selected', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'solid' }) })
      expect(wrapper.find('input[type="color"]').exists()).toBe(true)
    })

    it('shows file input when upload is selected', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'upload' }) })
      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    })

    it('shows helper text when online is selected', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'online' }) })
      expect(wrapper.text()).toContain('将自动从网站获取 favicon 图标')
    })

    it('hides color picker and file input for online type', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'online' }) })
      expect(wrapper.find('input[type="color"]').exists()).toBe(false)
      expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    })
  })

  describe('validation', () => {
    it('shows name error when empty', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[1].setValue('https://example.com')
      await saveBtn(wrapper).trigger('click')
      expect(wrapper.text()).toContain('名称不能为空')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('shows url error when empty', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('MyApp')
      await saveBtn(wrapper).trigger('click')
      expect(wrapper.text()).toContain('URL 不能为空')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('shows url format error for invalid URL', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('MyApp')
      await inputs[1].setValue('not-a-valid-url')
      await saveBtn(wrapper).trigger('click')
      expect(wrapper.text()).toContain('URL 格式不正确')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('clears errors on subsequent valid save', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')

      await saveBtn(wrapper).trigger('click')
      expect(wrapper.text()).toContain('名称不能为空')

      await inputs[0].setValue('MyApp')
      await inputs[1].setValue('https://example.com')
      await saveBtn(wrapper).trigger('click')
      expect(wrapper.text()).not.toContain('名称不能为空')
      expect(wrapper.emitted('save')).toHaveLength(1)
    })
  })

  describe('save emit', () => {
    it('emits save with form data for online type', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('My Site')
      await inputs[1].setValue('https://mysite.com')
      await saveBtn(wrapper).trigger('click')

      expect(wrapper.emitted('save')).toHaveLength(1)
      expect(wrapper.emitted('save')![0]).toEqual([{
        name: 'My Site',
        url: 'https://mysite.com',
        iconType: 'online',
        solidColor: undefined,
        uploadDataUrl: undefined,
      }])
    })

    it('emits save with solidColor for solid type', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('Red App')
      await inputs[1].setValue('https://red.app')

      const solidRadio = wrapper.find('input[value="solid"]')
      await solidRadio.setValue(true)
      const colorInput = wrapper.find('input[type="color"]')
      await colorInput.setValue('#ff0000')

      await saveBtn(wrapper).trigger('click')

      const payload = wrapper.emitted('save')![0][0] as Record<string, unknown>
      expect(payload.name).toBe('Red App')
      expect(payload.iconType).toBe('solid')
      expect(payload.solidColor).toBe('#ff0000')
    })

    it('does not include solidColor for non-solid types', async () => {
      const wrapper = mountCard()
      const inputs = wrapper.findAll('input[type="text"]')
      await inputs[0].setValue('Online App')
      await inputs[1].setValue('https://online.app')
      await saveBtn(wrapper).trigger('click')

      const payload = wrapper.emitted('save')![0][0] as Record<string, unknown>
      expect(payload.solidColor).toBeUndefined()
    })
  })

  describe('cancel emit', () => {
    it('emits cancel on cancel button click', async () => {
      const wrapper = mountCard()
      await cancelBtn(wrapper).trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    // Note: overlay click → close is handled by Reka DialogOverlay internals.
    // Reka requires the overlay to be inside document.body for its pointerdown
    // capture handler to work, which doesn't apply in jsdom detached mounts.
    // Trust Reka's built-in behavior for Escape/overlay dismissal.
  })

  describe('file upload', () => {
    it('reads file and shows preview for upload type', async () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'upload' }) })

      const file = new File(['dummy'], 'icon.png', { type: 'image/png' })
      const fileInput = wrapper.find('input[type="file"]')
      const mockFiles = { 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList
      Object.defineProperty(fileInput.element, 'files', { value: mockFiles, configurable: true })

      // Mock FileReader to fire onload synchronously
      const orig = FileReader.prototype.readAsDataURL
      FileReader.prototype.readAsDataURL = vi.fn(function (this: FileReader, _blob: Blob) {
        Object.defineProperty(this, 'result', { value: 'data:image/png;base64,abc123', configurable: true })
        this.onload?.({} as ProgressEvent<FileReader>)
      })

      await fileInput.trigger('change')
      await nextTick()

      FileReader.prototype.readAsDataURL = orig

      const preview = wrapper.find('img[alt="预览"]')
      expect(preview.exists()).toBe(true)
      expect(preview.attributes('src')).toBe('data:image/png;base64,abc123')
    })
  })

  describe('solid color', () => {
    it('initializes with random hex color in create mode', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'solid' }) })
      const val = (wrapper.find('input[type="color"]').element as HTMLInputElement).value
      expect(val).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('uses provided solidColor in edit mode', () => {
      const wrapper = mountCard({ shortcut: makeShortcut({ iconType: 'solid', solidColor: '#00ff00' }) })
      expect((wrapper.find('input[type="color"]').element as HTMLInputElement).value).toBe('#00ff00')
    })
  })
})
