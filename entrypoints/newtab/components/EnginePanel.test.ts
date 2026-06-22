import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import EnginePanel from './EnginePanel.vue'
import type { SearchEngine } from '../engines'

const defaults: SearchEngine[] = [
  { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
  { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
]

const { mockWxtStorage } = vi.hoisted(() => {
  const store = new Map<string, any>()

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

function mountPanel(visible = true): VueWrapper<InstanceType<typeof EnginePanel>> {
  return mount(EnginePanel, {
    props: { visible },
    global: {
      stubs: { Teleport: true }
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockWxtStorage._store.clear()
  mockWxtStorage._store.set('local:engines', [...defaults])
})

describe('EnginePanel', () => {
  // ── Expand / collapse ──
  it('renders when visible is true', async () => {
    const wrapper = mountPanel(true)
    await nextTick()
    await nextTick()
    expect(wrapper.find('[class*="panel"]').exists()).toBe(true)
  })

  it('does not render when visible is false', async () => {
    const wrapper = mountPanel(false)
    await nextTick()
    await nextTick()
    expect(wrapper.find('[class*="panel"]').exists()).toBe(false)
  })

  // ── Engine items ──
  it('renders all engines from storage', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    const items = wrapper.findAll('[class*="item"]')
    // 2 engines + 1 add button = 3 items
    expect(items).toHaveLength(3)
  })

  it('shows engine initial letter in icon', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    const icons = wrapper.findAll('[class*="icon"]')
    expect(icons[0].text()).toBe('B') // Baidu
    expect(icons[1].text()).toBe('G') // Google
  })

  it('shows engine name', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    const names = wrapper.findAll('[class*="name"]')
    expect(names[0].text()).toBe('Baidu')
    expect(names[1].text()).toBe('Google')
  })

  it('add button shows "+" and "添加"', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    const lastIcon = wrapper.findAll('[class*="icon"]').at(-1)
    const lastName = wrapper.findAll('[class*="name"]').at(-1)
    expect(lastIcon?.text()).toBe('+')
    expect(lastName?.text()).toBe('添加')
  })

  // ── Select engine ──
  it('emits select and close when engine clicked', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    await wrapper.findAll('[class*="item"]')[0].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0][0]).toMatchObject({ id: 'baidu', name: 'Baidu' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  // ── Delete engine ──
  it('shows delete button only when engines > 1', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    const delButtons = wrapper.findAll('[class*="del"]')
    expect(delButtons).toHaveLength(2) // both engines deletable
  })

  it('shows toast when attempting to delete last engine', async () => {
    // Mount with 1 engine — no delete buttons rendered
    mockWxtStorage._store.set('local:engines', [defaults[0]])
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    // No delete button when only 1 engine
    expect(wrapper.findAll('[class*="del"]')).toHaveLength(0)
    // Toast element initially absent
    expect(wrapper.find('[class*="toast"]').exists()).toBe(false)
  })

  it('hides delete buttons when only 1 engine', async () => {
    mockWxtStorage._store.set('local:engines', [defaults[0]])
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('[class*="del"]')).toHaveLength(0)
  })

  // ── Add engine form ──
  it('opens add form when + is clicked', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()
    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()
    expect(wrapper.find('[class*="form"]').exists()).toBe(true)
  })

  it('adds engine after valid form submit', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    // Open form
    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    // Fill form (Teleport stubbed inline, so inputs are in wrapper)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('GitHub')
    await inputs[1].setValue('https://github.com/search?q=%s')

    // Submit
    await wrapper.find('[class*="btnConfirm"]').trigger('click')
    await nextTick()
    await nextTick()

    // Engine count increased
    const items = wrapper.findAll('[class*="item"]')
    expect(items).toHaveLength(4) // 3 engines + add button
  })

  it('shows error when name is empty', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    await wrapper.find('[class*="btnConfirm"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[class*="error"]').text()).toBe('名称不能为空')
  })

  it('shows error when url template missing %s', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('GitHub')
    await inputs[1].setValue('https://github.com/search')

    await wrapper.find('[class*="btnConfirm"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[class*="error"]').text()).toBe('URL 模板必须包含 %s 占位符')
  })

  it('cancels add form without adding engine', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    await wrapper.find('[class*="btnCancel"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[class*="form"]').exists()).toBe(false)
    // Still 2 engines + add
    expect(wrapper.findAll('[class*="item"]')).toHaveLength(3)
  })

  // ── Persistence ──
  it('persists engine list to storage after add', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('NPM')
    await inputs[1].setValue('https://www.npmjs.com/search?q=%s')
    await wrapper.find('[class*="btnConfirm"]').trigger('click')
    await nextTick()

    const stored = mockWxtStorage._store.get('local:engines') as SearchEngine[]
    expect(stored).toHaveLength(3)
    expect(stored[2].name).toBe('NPM')
    expect(stored[2].urlTemplate).toBe('https://www.npmjs.com/search?q=%s')
  })

  it('persists engine list to storage after delete', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="del"]')[0].trigger('click')
    await nextTick()

    const stored = mockWxtStorage._store.get('local:engines') as SearchEngine[]
    expect(stored).toHaveLength(1)
  })

  // ── Close overlay on backdrop click ──
  it('closes add form when overlay backdrop clicked', async () => {
    const wrapper = mountPanel()
    await nextTick()
    await nextTick()

    await wrapper.findAll('[class*="item"]').at(-1)!.trigger('click')
    await nextTick()

    await wrapper.find('[class*="overlay"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[class*="form"]').exists()).toBe(false)
  })
})
