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
                return () => {
                    const i = watchList.indexOf(cb); if (i >= 0) watchList.splice(i, 1)
                }
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

import { useDock, type Shortcut, MAX_SHORTCUTS } from './useDock'

let uuidCounter = 0
beforeEach(() => {
    vi.clearAllMocks()
    mockWxtStorage._store.clear()
    uuidCounter = 0
    vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => `test-uuid-${uuidCounter++}`),
    })
})

function makeShortcut(overrides?: Partial<Omit<Shortcut, 'id'>>): Omit<Shortcut, 'id'> {
    return { name: 'GitHub', url: 'https://github.com', iconType: 'online', ...overrides }
}

describe('useDock', () => {
    describe('shortcuts', () => {
        it('initializes as empty array', () => {
            const { shortcuts } = useDock()
            expect(shortcuts.value).toEqual([])
        })

        it('loads stored shortcuts on init', async () => {
            const stored: Shortcut[] = [{ id: 'a', name: 'GH', url: 'https://github.com', iconType: 'online' }]
            mockWxtStorage._store.set('local:shortcuts', stored)

            const { shortcuts } = useDock()
            await nextTick()
            await nextTick()

            expect(shortcuts.value).toEqual(stored)
        })
    })

    describe('add', () => {
        it('adds shortcut with generated id', () => {
            const { shortcuts, add } = useDock()
            const created = add(makeShortcut())

            expect(created).not.toBeNull()
            expect(shortcuts.value).toHaveLength(1)
            expect(shortcuts.value[0].id).toBe('test-uuid-0')
            expect(shortcuts.value[0].name).toBe('GitHub')
        })

        it('persists to storage', () => {
            const { add } = useDock()
            add(makeShortcut())

            const stored = mockWxtStorage._store.get('local:shortcuts') as Shortcut[]
            expect(stored).toHaveLength(1)
            expect(stored[0].name).toBe('GitHub')
        })

        it('returns null when at MAX_SHORTCUTS', () => {
            const { add } = useDock()
            for (let i = 0; i < MAX_SHORTCUTS; i++) {
                add(makeShortcut({ name: `S${i}`, url: `https://x.com/${i}` }))
            }
            const created = add(makeShortcut({ name: 'Extra', url: 'https://extra.com' }))

            expect(created).toBeNull()
        })
    })

    describe('update', () => {
        it('patches matching shortcut by id', () => {
            const { shortcuts, add, update } = useDock()
            add(makeShortcut({ name: 'Old' }))

            update('test-uuid-0', { name: 'New', solidColor: '#ff0' })

            expect(shortcuts.value[0].name).toBe('New')
            expect(shortcuts.value[0].solidColor).toBe('#ff0')
            expect(shortcuts.value[0].url).toBe('https://github.com')
        })

        it('does nothing when id not found', () => {
            const { shortcuts, add, update } = useDock()
            add(makeShortcut())

            update('nonexistent', { name: 'Nope' })

            expect(shortcuts.value[0].name).toBe('GitHub')
        })
    })

    describe('remove', () => {
        it('removes shortcut by id', () => {
            const { shortcuts, add, remove } = useDock()
            add(makeShortcut({ name: 'A' }))
            add(makeShortcut({ name: 'B' }))

            remove('test-uuid-0')

            expect(shortcuts.value).toHaveLength(1)
            expect(shortcuts.value[0].name).toBe('B')
        })

        it('persists removal', () => {
            const { add, remove } = useDock()
            add(makeShortcut())
            remove('test-uuid-0')

            const stored = mockWxtStorage._store.get('local:shortcuts') as Shortcut[]
            expect(stored).toHaveLength(0)
        })
    })

    describe('reorder', () => {
        it('moves item from one index to another', () => {
            const { shortcuts, add, reorder } = useDock()
            add(makeShortcut({ name: 'A' }))
            add(makeShortcut({ name: 'B' }))
            add(makeShortcut({ name: 'C' }))

            reorder(0, 2)

            expect(shortcuts.value.map(s => s.name)).toEqual(['B', 'C', 'A'])
        })

        it('persists reorder', () => {
            const { add, reorder } = useDock()
            add(makeShortcut({ name: 'A' }))
            add(makeShortcut({ name: 'B' }))

            reorder(0, 1)

            const stored = mockWxtStorage._store.get('local:shortcuts') as Shortcut[]
            expect(stored.map((s: Shortcut) => s.name)).toEqual(['B', 'A'])
        })
    })

    describe('editMode', () => {
        it('starts false', () => {
            const { editMode } = useDock()
            expect(editMode.value).toBe(false)
        })

        it('enterEditMode sets true', () => {
            const { editMode, enterEditMode } = useDock()
            enterEditMode()
            expect(editMode.value).toBe(true)
        })

        it('exitEditMode sets false', () => {
            const { editMode, enterEditMode, exitEditMode } = useDock()
            enterEditMode()
            exitEditMode()
            expect(editMode.value).toBe(false)
        })
    })

    describe('external changes', () => {
        it('reacts to shortcuts updated externally', async () => {
            const { shortcuts } = useDock()
            await nextTick()
            await nextTick()

            const defResult = mockWxtStorage.defineItem.mock.results[0]?.value
            const updated: Shortcut[] = [{ id: 'ext', name: 'External', url: 'https://ext.com', iconType: 'online' }]
            await defResult.setValue(updated)
            await nextTick()

            expect(shortcuts.value).toEqual(updated)
        })
    })
})
