import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { useDock, type Shortcut, MAX_SHORTCUTS } from '../useDock'

const { mockIDB } = vi.hoisted(() => {
    const store = new Map<string, { id: string; data: string }>()

    function makeObjectStore() {
        return {
            get(id: string) {
                const record = store.get(id)
                const req: any = { result: record ?? undefined, onsuccess: null, onerror: null }
                Promise.resolve().then(() => req.onsuccess?.({ target: req }))
                return req
            },
            put(record: { id: string; data: string }) {
                store.set(record.id, record)
                const req: any = { result: record.id, onsuccess: null, onerror: null }
                Promise.resolve().then(() => req.onsuccess?.({ target: req }))
                return req
            },
            delete(id: string) {
                store.delete(id)
                const req: any = { result: undefined, onsuccess: null, onerror: null }
                Promise.resolve().then(() => req.onsuccess?.({ target: req }))
                return req
            },
        }
    }

    const mockIDB = {
        open(_name: string, _version?: number) {
            const req: any = {}
            const db: any = {
                objectStoreNames: { contains: vi.fn(() => true) },
                createObjectStore: vi.fn(),
                transaction: vi.fn((_storeName: string, _mode?: string) => {
                    let txComplete: (() => void) | null = null
                    const tx: any = {
                        objectStore: vi.fn(() => makeObjectStore()),
                        get oncomplete() { return null },
                        set oncomplete(fn: any) { txComplete = fn },
                        get onerror() { return null },
                        set onerror(_fn: any) {},
                        abort: vi.fn(),
                        get error() { return null },
                    }
                    Promise.resolve().then(() => Promise.resolve()).then(() => txComplete?.())
                    return tx
                }),
                close: vi.fn(),
            }
            Promise.resolve().then(() => {
                req.onupgradeneeded?.({ target: req })
                req.onsuccess?.({ target: req })
            })
            Object.defineProperty(req, 'result', { value: db, configurable: true })
            return req
        },
        _store: store,
    }

    return { mockIDB }
})

let uuidCounter = 0
beforeEach(async () => {
    await fakeBrowser.reset()
    uuidCounter = 0
    mockIDB._store.clear()
    vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => `test-uuid-${uuidCounter++}`),
    })
    vi.stubGlobal('indexedDB', mockIDB)
})

const flush = () => new Promise(r => setTimeout(r))

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
            await browser.storage.local.set({ 'shortcuts': stored })

            const { shortcuts } = useDock()
            await flush()

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

        it('persists to storage', async () => {
            const { add } = useDock()
            add(makeShortcut())
            await flush()

            const result = await browser.storage.local.get('shortcuts')
            const stored = result['shortcuts'] as Shortcut[]
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

        it('persists removal', async () => {
            const { add, remove } = useDock()
            add(makeShortcut())
            remove('test-uuid-0')
            await flush()

            const result = await browser.storage.local.get('shortcuts')
            const stored = result['shortcuts'] as Shortcut[]
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

        it('persists reorder', async () => {
            const { add, reorder } = useDock()
            add(makeShortcut({ name: 'A' }))
            add(makeShortcut({ name: 'B' }))

            reorder(0, 1)
            await flush()

            const result = await browser.storage.local.get('shortcuts')
            const stored = result['shortcuts'] as Shortcut[]
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
            await flush()

            const updated: Shortcut[] = [{ id: 'ext', name: 'External', url: 'https://ext.com', iconType: 'online' }]
            await browser.storage.local.set({ 'shortcuts': updated })
            await flush()

            expect(shortcuts.value).toEqual(updated)
        })
    })

    describe('icon persistence', () => {
        describe('add with iconBlob', () => {
            it('stores icon to IndexedDB when iconBlob is provided', async () => {
                const { add, getIcon } = useDock()
                const created = add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,abc')
                await flush()

                const icon = await getIcon(created!.id)
                expect(icon).toBe('data:image/png;base64,abc')
            })

            it('does not touch IndexedDB when no iconBlob', async () => {
                const { add, getIcon } = useDock()
                const created = add(makeShortcut({ iconType: 'solid' }))
                await flush()

                const icon = await getIcon(created!.id)
                expect(icon).toBeNull()
            })

            it('does not rollback WXT on IndexedDB failure', () => {
                const backup = mockIDB.open
                mockIDB.open = () => { throw new Error('IDB crash') }
                const { shortcuts, add } = useDock()
                add(makeShortcut(), 'data:image/png;base64,will-fail')
                // Still added to shortcuts array
                expect(shortcuts.value).toHaveLength(1)
                mockIDB.open = backup
            })
        })

        describe('update with iconBlob', () => {
            it('stores icon to IndexedDB when iconBlob is provided', async () => {
                const { add, update, getIcon } = useDock()
                add(makeShortcut({ name: 'Old', iconType: 'upload' }))
                await flush()

                update('test-uuid-0', { name: 'New' }, 'data:image/png;base64,updated')
                await flush()

                const icon = await getIcon('test-uuid-0')
                expect(icon).toBe('data:image/png;base64,updated')
            })

            it('does not overwrite IndexedDB when no iconBlob', async () => {
                const { add, update, getIcon } = useDock()
                add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,original')
                await flush()

                update('test-uuid-0', { name: 'Renamed' })
                await flush()

                const icon = await getIcon('test-uuid-0')
                expect(icon).toBe('data:image/png;base64,original')
            })
        })

        describe('remove', () => {
            it('deletes icon from IndexedDB', async () => {
                const { add, remove, getIcon } = useDock()
                add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,todelete')
                await flush()

                remove('test-uuid-0')
                await flush()

                const icon = await getIcon('test-uuid-0')
                expect(icon).toBeNull()
            })
        })

        describe('getIcon', () => {
            it('returns icon dataUrl for stored icon', async () => {
                const { add, getIcon } = useDock()
                add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,xyz')
                await flush()

                const icon = await getIcon('test-uuid-0')
                expect(icon).toBe('data:image/png;base64,xyz')
            })

            it('returns null for unknown id', async () => {
                const { getIcon } = useDock()
                const result = await getIcon('nonexistent')
                expect(result).toBeNull()
            })
        })
    })
})
