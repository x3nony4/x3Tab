import { describe, it, expect, vi, afterEach } from 'vitest'
import { DOMWrapper, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { Shortcut } from '@/composables/useDock'
import EditCard from '../EditCard.vue'

let wrapper: VueWrapper<unknown>

afterEach(() => {
  if (wrapper) wrapper.unmount()
})

function makeShortcut(overrides?: Partial<Shortcut>): Shortcut {
  return {
    id: 'test-1',
    name: 'GitHub',
    url: 'https://github.com',
    iconType: 'online',
    ...overrides,
  }
}

/** Get all buttons rendered in document body (portal). */
function bodyButtons(): NodeListOf<HTMLButtonElement> {
  return document.body.querySelectorAll('button')
}

/** Save button is the last button in the dialog. */
function saveBtnEl() {
  const btns = bodyButtons()
  return btns[btns.length - 1]
}

/** Cancel button is the first button in the dialog. */
function cancelBtnEl() {
  return bodyButtons()[0]
}

function mountCard(props?: Partial<{ shortcut: Shortcut | null, open: boolean }>) {
  wrapper = mount(EditCard, {
    props: { shortcut: null, open: true, ...props },
    attachTo: document.body,
  })
  return wrapper
}

function textInputs(): NodeListOf<HTMLInputElement> {
  return document.body.querySelectorAll('input[type="text"]')
}

function textInput(n: number): HTMLInputElement {
  return textInputs()[n]
}

describe('EditCard', () => {
  describe('render modes', () => {
    it('renders create mode title and empty fields', async () => {
      mountCard()
      await nextTick()
      expect(document.body.textContent).toContain('添加快捷方式')
      expect(textInput(0).value).toBe('')
      expect(textInput(1).value).toBe('')
    })

    it('renders edit mode title and pre-filled fields', async () => {
      mountCard({ shortcut: makeShortcut({ name: 'MyApp', url: 'https://myapp.com' }) })
      await nextTick()
      expect(document.body.textContent).toContain('编辑快捷方式')
      expect(textInput(0).value).toBe('MyApp')
      expect(textInput(1).value).toBe('https://myapp.com')
    })

    it('defaults to online icon type in create mode', async () => {
      mountCard()
      await nextTick()
      const onlineRadio = document.body.querySelector<HTMLInputElement>('input[value="online"]')
      expect(onlineRadio?.checked).toBe(true)
    })
  })

  describe('icon type conditional UI', () => {
    it('shows color picker when solid is selected', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'solid' }) })
      await nextTick()
      expect(document.body.querySelector('input[type="color"]')).toBeTruthy()
    })

    it('shows file input when upload is selected', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'upload' }) })
      await nextTick()
      expect(document.body.querySelector('input[type="file"]')).toBeTruthy()
    })

    it('shows helper text when online is selected', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'online' }) })
      await nextTick()
      expect(document.body.textContent).toContain('将自动从网站获取 favicon 图标')
    })

    it('hides color picker and file input for online type', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'online' }) })
      await nextTick()
      expect(document.body.querySelector('input[type="color"]')).toBeNull()
      expect(document.body.querySelector('input[type="file"]')).toBeNull()
    })
  })

  describe('validation', () => {
    it('shows name error when empty', async () => {
      mountCard()
      await nextTick()
      textInput(1).value = 'https://example.com'
      textInput(1).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()
      expect(document.body.textContent).toContain('名称不能为空')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('shows url error when empty', async () => {
      mountCard()
      await nextTick()
      textInput(0).value = 'MyApp'
      textInput(0).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()
      expect(document.body.textContent).toContain('URL 不能为空')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('shows url format error for invalid URL', async () => {
      mountCard()
      await nextTick()
      textInput(0).value = 'MyApp'
      textInput(0).dispatchEvent(new Event('input'))
      textInput(1).value = 'not-a-valid-url'
      textInput(1).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()
      expect(document.body.textContent).toContain('URL 格式不正确')
      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('clears errors on subsequent valid save', async () => {
      mountCard()
      await nextTick()

      saveBtnEl()?.click()
      await nextTick()
      expect(document.body.textContent).toContain('名称不能为空')

      textInput(0).value = 'MyApp'
      textInput(0).dispatchEvent(new Event('input'))
      textInput(1).value = 'https://example.com'
      textInput(1).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()
      expect(document.body.textContent).not.toContain('名称不能为空')
      expect(wrapper.emitted('save')).toHaveLength(1)
    })
  })

  describe('save emit', () => {
    it('emits save with form data for online type', async () => {
      mountCard()
      await nextTick()
      textInput(0).value = 'My Site'
      textInput(0).dispatchEvent(new Event('input'))
      textInput(1).value = 'https://mysite.com'
      textInput(1).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()

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
      mountCard()
      await nextTick()
      textInput(0).value = 'Red App'
      textInput(0).dispatchEvent(new Event('input'))
      textInput(1).value = 'https://red.app'
      textInput(1).dispatchEvent(new Event('input'))

      const solidRadio = document.body.querySelector<HTMLInputElement>('input[value="solid"]')
      solidRadio!.checked = true
      solidRadio!.dispatchEvent(new Event('change'))
      await nextTick()

      const colorInput = document.body.querySelector<HTMLInputElement>('input[type="color"]')
      colorInput!.value = '#ff0000'
      colorInput!.dispatchEvent(new Event('input'))

      saveBtnEl()?.click()
      await nextTick()

      const payload = wrapper.emitted('save')![0][0] as Record<string, unknown>
      expect(payload.name).toBe('Red App')
      expect(payload.iconType).toBe('solid')
      expect(payload.solidColor).toBe('#ff0000')
    })

    it('does not include solidColor for non-solid types', async () => {
      mountCard()
      await nextTick()
      textInput(0).value = 'Online App'
      textInput(0).dispatchEvent(new Event('input'))
      textInput(1).value = 'https://online.app'
      textInput(1).dispatchEvent(new Event('input'))
      saveBtnEl()?.click()
      await nextTick()

      const payload = wrapper.emitted('save')![0][0] as Record<string, unknown>
      expect(payload.solidColor).toBeUndefined()
    })
  })

  describe('cancel emit', () => {
    it('emits cancel on cancel button click', async () => {
      mountCard()
      await nextTick()
      cancelBtnEl()?.click()
      await nextTick()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('file upload', () => {
    it('reads file and shows preview for upload type', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'upload' }) })
      await nextTick()

      const file = new File(['dummy'], 'icon.png', { type: 'image/png' })
      const fileInputEl = document.body.querySelector<HTMLInputElement>('input[type="file"]')
      expect(fileInputEl).toBeTruthy()
      const mockFiles = { 0: file, length: 1, item: (i: number) => i === 0 ? file : null } as unknown as FileList
      Object.defineProperty(fileInputEl!, 'files', { value: mockFiles, configurable: true })

      // Mock FileReader to fire onload synchronously
      const orig = FileReader.prototype.readAsDataURL
      FileReader.prototype.readAsDataURL = vi.fn(function (this: FileReader, _blob: Blob) {
        Object.defineProperty(this, 'result', { value: 'data:image/png;base64,abc123', configurable: true })
        this.onload?.({} as ProgressEvent<FileReader>)
      })

      await new DOMWrapper(fileInputEl!).trigger('change')
      await nextTick()

      FileReader.prototype.readAsDataURL = orig

      const preview = document.body.querySelector<HTMLImageElement>('img[alt="预览"]')
      expect(preview).toBeTruthy()
      expect(preview?.getAttribute('src')).toBe('data:image/png;base64,abc123')
    })
  })

  describe('solid color', () => {
    it('initializes with random hex color in create mode', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'solid' }) })
      await nextTick()
      const val = (document.body.querySelector<HTMLInputElement>('input[type="color"]')!).value
      expect(val).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('uses provided solidColor in edit mode', async () => {
      mountCard({ shortcut: makeShortcut({ iconType: 'solid', solidColor: '#00ff00' }) })
      await nextTick()
      expect((document.body.querySelector<HTMLInputElement>('input[type="color"]')!).value).toBe('#00ff00')
    })
  })
})
