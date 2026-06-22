import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchBar from './SearchBar.vue'

const { mockWxtStorage } = vi.hoisted(() => {
  const store = new Map<string, any>()

  // Seed default engines into store so SearchBar has data on mount
  const defaults = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
    { id: 'bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q=%s', color: '#008373' },
    { id: 'duckduckgo', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q=%s', color: '#de5833' },
  ]
  store.set('local:engines', defaults)

  function mockDefineItem<T>(key: string, opts?: { fallback?: T; defaultValue?: T }): any {
    const fallback = opts?.fallback ?? opts?.defaultValue ?? (null as unknown as T)
    const watchList: Array<(newVal: T, oldVal: T) => void> = []

    return {
      key,
      fallback,
      getValue: vi.fn(async () => (store.has(key) ? store.get(key) : fallback) as T),
      setValue: vi.fn(async (value: T) => {
        store.set(key, value)
        for (const cb of watchList) cb(value, undefined as any)
      }),
      watch: vi.fn((cb: (newVal: T, oldVal: T) => void) => {
        watchList.push(cb)
        return () => { const i = watchList.indexOf(cb); if (i >= 0) watchList.splice(i, 1) }
      }),
      removeValue: vi.fn(async () => { store.delete(key) }),
      getMeta: vi.fn(async () => ({})),
      setMeta: vi.fn(async () => {}),
      removeMeta: vi.fn(async () => {}),
      migrate: vi.fn(async () => {}),
    }
  }

  return {
    mockWxtStorage: {
      getItem: vi.fn(async (key: string) => (store.has(key) ? store.get(key) : null)),
      setItem: vi.fn(async (key: string, value: any) => { store.set(key, value) }),
      getItems: vi.fn(),
      setItems: vi.fn(),
      getMeta: vi.fn(),
      setMeta: vi.fn(),
      setMetas: vi.fn(),
      removeItem: vi.fn(),
      removeItems: vi.fn(),
      removeMeta: vi.fn(),
      snapshot: vi.fn(),
      restoreSnapshot: vi.fn(),
      clear: vi.fn(),
      watch: vi.fn(),
      unwatch: vi.fn(),
      defineItem: vi.fn(mockDefineItem),
      _store: store,
    },
  }
})

vi.mock('#imports', () => ({
  storage: mockWxtStorage,
}))

let locHref: string
let _originalLocation: Location

function mountBar(): VueWrapper<InstanceType<typeof SearchBar>> {
  return mount(SearchBar)
}

beforeEach(() => {
  vi.clearAllMocks()
  locHref = 'about:blank'
  _originalLocation = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    get() {
      return {
        get href() { return locHref },
        set href(v: string) { locHref = v },
      }
    },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    enumerable: true,
    value: _originalLocation,
  })
})

describe('SearchBar', () => {
  it('renders current engine initial letter in icon', async () => {
    const wrapper = mountBar()
    await nextTick()
    await nextTick()
    expect(wrapper.find('[class*="icon"]').text()).toBe('B')
  })

  it('renders dropdown arrow', () => {
    const wrapper = mountBar()
    expect(wrapper.find('[class*="arrow"]').exists()).toBe(true)
  })

  it('cycles engine on Tab (Baidu → Google → Bing → DuckDuckGo → Baidu)', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    const icon = wrapper.find('[class*="icon"]')

    await nextTick()
    await nextTick()
    expect(icon.text()).toBe('B') // Baidu
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('G') // Google
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('B') // Bing
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('D') // DuckDuckGo
    await input.trigger('keydown', { key: 'Tab' })
    expect(icon.text()).toBe('B') // back to Baidu
  })

  it('does not clear input text on Tab', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await input.setValue('hello world')
    await input.trigger('keydown', { key: 'Tab' })
    expect((input.element as HTMLInputElement).value).toBe('hello world')
  })

  it('navigates to Baidu search URL on Enter', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await nextTick()
    await nextTick()
    await input.setValue('vitest')
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.baidu.com/s?wd=vitest')
  })

  it('navigates to Google search after Tab switch', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await nextTick()
    await nextTick()
    await input.setValue('vue')
    await input.trigger('keydown', { key: 'Tab' }) // → Google
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.google.com/search?q=vue')
  })

  it('URL-encodes search query', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input')
    await nextTick()
    await nextTick()
    await input.setValue('hello world & more')
    await input.trigger('keydown', { key: 'Enter' })
    expect(locHref).toBe('https://www.baidu.com/s?wd=hello%20world%20%26%20more')
  })

  it('adds focused class on input focus', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[class*="bar"]')

    expect(bar.classes().some(c => c.includes('focused'))).toBe(false)

    await wrapper.find('input').trigger('focus')
    await wrapper.vm.$nextTick()
    expect(bar.classes().some(c => c.includes('focused'))).toBe(true)

    await wrapper.find('input').trigger('blur')
    await wrapper.vm.$nextTick()
    expect(bar.classes().some(c => c.includes('focused'))).toBe(false)
  })

  it('toggles engine panel on arrow click', async () => {
    const wrapper = mountBar()
    const arrow = wrapper.find('[class*="arrow"]')

    expect(wrapper.findComponent({ name: 'EnginePanel' }).props('visible')).toBe(false)

    await arrow.trigger('click')
    expect(wrapper.findComponent({ name: 'EnginePanel' }).props('visible')).toBe(true)

    await arrow.trigger('click')
    expect(wrapper.findComponent({ name: 'EnginePanel' }).props('visible')).toBe(false)
  })

  it('closes panel when clicking outside', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const wrapper = mount(SearchBar, { attachTo: container })
    await nextTick()
    await nextTick()

    // Open the panel
    await wrapper.find('[class*="arrow"]').trigger('click')
    expect(wrapper.findComponent({ name: 'EnginePanel' }).props('visible')).toBe(true)

    // Click outside the wrapper (on body)
    document.body.click()
    await nextTick()

    expect(wrapper.findComponent({ name: 'EnginePanel' }).props('visible')).toBe(false)

    document.body.removeChild(container)
  })
})
