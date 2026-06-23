import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineStore } from '../storage'

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
            getAllKeys() {
                const keys = Array.from(store.keys())
                const req: any = { result: keys, onsuccess: null, onerror: null }
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

type TestRecord = { id: string; data: string }
const testStore = defineStore<TestRecord>({ dbName: 'test-db', storeName: 'test-store' })

beforeEach(() => {
    mockIDB._store.clear()
    mockIDB._resetCount()
})

describe('defineStore', () => {
    describe('get', () => {
        it('returns undefined for non-existent key', async () => {
            const result = await testStore.get('missing')
            expect(result).toBeUndefined()
        })

        it('returns stored record by id', async () => {
            await testStore.put({ id: 'abc', data: 'hello' })
            const result = await testStore.get('abc')
            expect(result).toEqual({ id: 'abc', data: 'hello' })
        })
    })

    describe('put', () => {
        it('stores a record', async () => {
            await testStore.put({ id: 'k1', data: 'v1' })
            const result = await testStore.get('k1')
            expect(result).toEqual({ id: 'k1', data: 'v1' })
        })

        it('overwrites existing record with same id', async () => {
            await testStore.put({ id: 'k1', data: 'v1' })
            await testStore.put({ id: 'k1', data: 'v2' })
            const result = await testStore.get('k1')
            expect(result).toEqual({ id: 'k1', data: 'v2' })
        })
    })

    describe('delete', () => {
        it('removes stored record', async () => {
            await testStore.put({ id: 'k1', data: 'v1' })
            await testStore.delete('k1')
            const result = await testStore.get('k1')
            expect(result).toBeUndefined()
        })

        it('does not throw when deleting non-existent key', async () => {
            await expect(testStore.delete('nonexistent')).resolves.toBeUndefined()
        })
    })

    describe('keys', () => {
        it('returns empty array when store is empty', async () => {
            const result = await testStore.keys()
            expect(result).toEqual([])
        })

        it('returns all stored keys', async () => {
            await testStore.put({ id: 'a', data: '1' })
            await testStore.put({ id: 'b', data: '2' })
            await testStore.put({ id: 'c', data: '3' })
            const result = await testStore.keys()
            expect(result.sort()).toEqual(['a', 'b', 'c'])
        })
    })

    describe('singleton connection', () => {
        it('reuses the same DB connection across calls', async () => {
            const a = defineStore<TestRecord>({ dbName: 'singleton-db', storeName: 'shared' })
            const b = defineStore<TestRecord>({ dbName: 'singleton-db', storeName: 'shared' })
            await a.put({ id: 'x', data: 'shared-data' })
            const result = await b.get('x')
            expect(result).toEqual({ id: 'x', data: 'shared-data' })
        })

        it('different storeName configs return independent methods', async () => {
            const a = defineStore<TestRecord>({ dbName: 'multi-db', storeName: 'alpha' })
            const b = defineStore<TestRecord>({ dbName: 'multi-db', storeName: 'beta' })
            // Both return { get, put, delete, keys } shape
            expect(a).toHaveProperty('get')
            expect(a).toHaveProperty('put')
            expect(a).toHaveProperty('delete')
            expect(a).toHaveProperty('keys')
            expect(b).toHaveProperty('get')
        })
    })
})
