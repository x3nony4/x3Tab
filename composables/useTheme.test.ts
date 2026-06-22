import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { useTheme } from './useTheme'

const { mockWxtStorage } = vi.hoisted(() => {
    const store = new Map<string, any>()

    function mockDefineItem<T>(key: string, opts?: { fallback?: T, defaultValue?: T }): any {
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
                return () => {
                    const i = watchList.indexOf(cb); if (i >= 0)
                        watchList.splice(i, 1)
                }
            }),
            removeValue: vi.fn(async () => { store.delete(key) }),
            getMeta: vi.fn(async () => ({})),
            setMeta: vi.fn(async () => {}),
            removeMeta: vi.fn(async () => {}),
            migrate: vi.fn(async () => {})
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
            _store: store
        }
    }
})

vi.mock('#imports', () => ({
    storage: mockWxtStorage
}))

function mockMatchMedia(matchesDark: boolean) {
    return vi.fn((query: string) => ({
        matches: query.includes('dark') ? matchesDark : !matchesDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
}

beforeEach(() => {
    vi.clearAllMocks()
    mockWxtStorage._store.clear()
    vi.stubGlobal('document', {
        documentElement: {
            setAttribute: vi.fn(),
            getAttribute: vi.fn()
        }
    })
})

describe('useTheme', () => {
    it('defaults to dark theme before init', () => {
        const { theme } = useTheme()
        expect(theme.value).toBe('dark')
    })

    it('uses stored theme when available', async () => {
        mockWxtStorage._store.set('local:theme', 'light')

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('light')
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('falls back to system preference when no stored theme', async () => {
        vi.stubGlobal('window', { matchMedia: mockMatchMedia(true) })

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
    })

    it('defaults to dark when matchMedia unavailable', async () => {
        vi.stubGlobal('window', undefined)

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
    })

    it('toggle switches dark↔light', async () => {
        const { theme, toggle, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
        toggle()
        expect(theme.value).toBe('light')
        toggle()
        expect(theme.value).toBe('dark')
    })

    it('persists theme to storage on change', async () => {
        const { toggle, init } = useTheme()
        await init()
        toggle()
        await nextTick()
        await nextTick()

        expect(mockWxtStorage._store.get('local:theme')).toBe('light')
    })

    it('applies theme attribute to document element', async () => {
        mockWxtStorage._store.set('local:theme', 'dark')

        const { init } = useTheme()
        await init()

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('does not persist before init', async () => {
        const { theme } = useTheme()
    ;(theme as any).value = 'light'
        await nextTick()
        await nextTick()

        expect(mockWxtStorage._store.has('local:theme')).toBe(false)
    })

    it('reacts to external storage changes after init', async () => {
        const { theme, init } = useTheme()
        await init()

        // Grab the watch callback registered by useTheme → useStorage → defineItem.watch
        const defResult = mockWxtStorage.defineItem.mock.results.at(-1)?.value
        const watchCalls = defResult?.watch?.mock?.calls ?? []
        expect(watchCalls.length).toBeGreaterThan(0)
        // Call the watch callback to simulate external change
        watchCalls[0][0]('light')

        await nextTick()
        expect(theme.value).toBe('light')
    })
})
