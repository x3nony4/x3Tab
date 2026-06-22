import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

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

import { useStorage } from './useStorage'

beforeEach(() => {
  vi.clearAllMocks()
  mockWxtStorage._store.clear()
})

describe('useStorage', () => {
  it('returns fallback value synchronously before init', () => {
    const { value } = useStorage('theme', 'dark')
    expect(value.value).toBe('dark')
  })

  it('reads stored value on init (async)', async () => {
    mockWxtStorage._store.set('local:theme', 'light')

    const { value } = useStorage('theme', 'dark')
    await nextTick()
    await nextTick()

    expect(value.value).toBe('light')
  })

  it('uses fallback when nothing stored', async () => {
    const { value } = useStorage('theme', 'dark')
    await nextTick()
    await nextTick()

    expect(value.value).toBe('dark')
  })

  it('reacts to external changes via watch', async () => {
    const { value } = useStorage('count', 0)
    await nextTick()
    await nextTick()

    const defResult = mockWxtStorage.defineItem.mock.results[0]?.value
    await defResult.setValue(5)
    await nextTick()

    expect(value.value).toBe(5)
  })

  it('exposes item for direct setValue', async () => {
    const { item } = useStorage('theme', 'dark')
    await nextTick()
    await nextTick()

    await item.setValue('light')
    expect(mockWxtStorage._store.get('local:theme')).toBe('light')
  })

  it('prefixes key with local:', () => {
    useStorage('myKey', 'default')
    expect(mockWxtStorage.defineItem).toHaveBeenCalledWith('local:myKey', { fallback: 'default' })
  })
})
