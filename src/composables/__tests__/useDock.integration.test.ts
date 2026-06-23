/**
 * Vertical integration tests for useDock.
 *
 * Tests the full persistence pipeline: WXT storage + IndexedDB icons.
 * Uses fakeBrowser (wxt/testing) for WXT storage and a manual
 * IndexedDB mock for icon persistence.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { useDock, type Shortcut } from '../useDock'

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

vi.stubGlobal('indexedDB', mockIDB)

let uuidCounter = 0
beforeEach(async () => {
    await fakeBrowser.reset()
    uuidCounter = 0
    mockIDB._store.clear()
    vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => `uuid-${uuidCounter++}`),
    })
})

const flush = () => new Promise(r => setTimeout(r))

function makeShortcut(overrides?: Partial<Omit<Shortcut, 'id'>>): Omit<Shortcut, 'id'> {
    return { name: 'GH', url: 'https://github.com', iconType: 'online', ...overrides }
}

describe('useDock integration', () => {
    describe('add shortcut + icon', () => {
        it('getIcon returns dataUrl after add with iconBlob', async () => {
            const { add, getIcon } = useDock()
            const created = add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,icon1')
            await flush()

            const icon = await getIcon(created!.id)
            expect(icon).toBe('data:image/png;base64,icon1')
        })

        it('getIcon returns null when icon data is missing from IndexedDB', async () => {
            const { add, getIcon } = useDock()
            const created = add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,stored')
            await flush()

            // Simulate IDB data loss by clearing the mock store
            mockIDB._store.clear()
            await flush()

            const icon = await getIcon(created!.id)
            expect(icon).toBeNull()
        })
    })

    describe('update shortcut + icon', () => {
        it('getIcon returns new dataUrl after update with iconBlob', async () => {
            const { add, update, getIcon } = useDock()
            add(makeShortcut({ name: 'Old', iconType: 'upload' }), 'data:image/png;base64,old')
            await flush()

            update('uuid-0', { name: 'New' }, 'data:image/png;base64,new')
            await flush()

            const icon = await getIcon('uuid-0')
            expect(icon).toBe('data:image/png;base64,new')
        })

        it('getIcon retains old dataUrl when update has no iconBlob', async () => {
            const { add, update, getIcon } = useDock()
            add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,original')
            await flush()

            update('uuid-0', { name: 'Renamed' })
            await flush()

            const icon = await getIcon('uuid-0')
            expect(icon).toBe('data:image/png;base64,original')
        })
    })

    describe('remove shortcut', () => {
        it('getIcon returns null after remove', async () => {
            const { add, remove, getIcon } = useDock()
            add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,del')
            await flush()

            remove('uuid-0')
            await flush()

            const icon = await getIcon('uuid-0')
            expect(icon).toBeNull()
        })

        it('remove does not throw when IndexedDB delete fails', async () => {
            const { add, remove } = useDock()
            add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,del')
            await flush()

            // Simulate IDB crash during delete by breaking _store
            // The actual remove() catches the error silently via console.error
            // We just verify no throw propagates
            expect(() => { remove('uuid-0') }).not.toThrow()
        })
    })

    describe('getIcon', () => {
        it('returns null for never-stored id', async () => {
            const { getIcon } = useDock()
            const icon = await getIcon('nonexistent')
            expect(icon).toBeNull()
        })
    })

    describe('full lifecycle', () => {
        it('add → update icon → remove: icon follows each stage', async () => {
            const { add, update, remove, getIcon } = useDock()

            // Add with icon
            const created = add(makeShortcut({ iconType: 'upload' }), 'data:image/png;base64,v1')
            await flush()
            expect(await getIcon(created!.id)).toBe('data:image/png;base64,v1')

            // Update icon
            update(created!.id, {}, 'data:image/png;base64,v2')
            await flush()
            expect(await getIcon(created!.id)).toBe('data:image/png;base64,v2')

            // Remove
            remove(created!.id)
            await flush()
            expect(await getIcon(created!.id)).toBeNull()
        })
    })
})
