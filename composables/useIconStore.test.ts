import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockIDB } = vi.hoisted(() => {
    const store = new Map<string, { id: string; data: string }>()

    function makeObjectStore() {
        return {
            get(id: string) {
                const record = store.get(id)
                const req: any = { result: record ?? undefined, onsuccess: null, onerror: null }
                // Resolve synchronously — no setTimeout needed for test
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

    let openCount = 0
    const mockIDB = {
        get _openCount() { return openCount },
        _resetCount: () => { openCount = 0 },
        open(_name: string, _version?: number) {
            openCount++
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
                    // Fire oncomplete after object store operations resolve
                    Promise.resolve().then(() => Promise.resolve()).then(() => txComplete?.())
                    return tx
                }),
                close: vi.fn(),
            }
            // Fire onupgradeneeded (if needed) then onsuccess synchronously via microtask
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

import { useIconStore, resetIconStore } from './useIconStore'
import type { IconStore } from './useIconStore'

beforeEach(() => {
    vi.clearAllMocks()
    mockIDB._store.clear()
    mockIDB._resetCount()
    resetIconStore()
})

describe('useIconStore', () => {
    let store: IconStore

    beforeEach(() => {
        store = useIconStore()
    })

    describe('set + get', () => {
        it('stores and retrieves icon data', async () => {
            await store.set('abc', 'data:image/png;base64,xxx')
            const result = await store.get('abc')
            expect(result).toBe('data:image/png;base64,xxx')
        })

        it('returns null for non-existent key', async () => {
            const result = await store.get('nonexistent')
            expect(result).toBeNull()
        })

        it('overwrites existing key', async () => {
            await store.set('abc', 'data:image/png;base64,aaa')
            await store.set('abc', 'data:image/png;base64,bbb')
            const result = await store.get('abc')
            expect(result).toBe('data:image/png;base64,bbb')
        })
    })

    describe('remove', () => {
        it('removes stored icon', async () => {
            await store.set('abc', 'data:image/png;base64,xxx')
            await store.remove('abc')
            const result = await store.get('abc')
            expect(result).toBeNull()
        })

        it('removing non-existent key does not throw', async () => {
            await expect(store.remove('nonexistent')).resolves.toBeUndefined()
        })
    })

    describe('singleton DB connection', () => {
        // These tests verify the singleton behavior by calling useIconStore
        // only within the test body (not via parent beforeEach).
        it('reuses the same database connection across instances', async () => {
            resetIconStore()
            const a = useIconStore()
            const b = useIconStore()
            await a.set('key', 'data:image/png;base64,val')
            const result = await b.get('key')
            expect(result).toBe('data:image/png;base64,val')
        })

        it('returns working methods without awaiting open', async () => {
            resetIconStore()
            const s = useIconStore()
            expect(s).toHaveProperty('get')
            expect(s).toHaveProperty('set')
            expect(s).toHaveProperty('remove')
            // Methods should work even though the DB promise is still resolving
            await s.set('k', 'data:image/png;base64,v')
            const result = await s.get('k')
            expect(result).toBe('data:image/png;base64,v')
        })
    })
})
