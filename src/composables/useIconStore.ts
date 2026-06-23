const DB_NAME = 'x3tab-icons'
const DB_VERSION = 1
const STORE_NAME = 'icons'

let dbPromise: Promise<IDBDatabase> | null = null

async function openDB(): Promise<IDBDatabase> {
    if (dbPromise)
        return dbPromise

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })

    return dbPromise
}

/** Reset the singleton DB connection. For testing only. */
export function resetIconStore(): void {
    dbPromise = null
}

export interface IconStore {
    get: (id: string) => Promise<string | null>
    set: (id: string, dataUrl: string) => Promise<void>
    remove: (id: string) => Promise<void>
}

export function useIconStore(): IconStore {
    async function get(id: string): Promise<string | null> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const req = tx.objectStore(STORE_NAME).get(id)
            req.onsuccess = () => {
                const record = req.result as { id: string, data: string } | undefined
                resolve(record?.data ?? null)
            }
            req.onerror = () => reject(req.error)
        })
    }

    async function set(id: string, dataUrl: string): Promise<void> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            tx.objectStore(STORE_NAME).put({ id, data: dataUrl })
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    }

    async function remove(id: string): Promise<void> {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            tx.objectStore(STORE_NAME).delete(id)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    }

    return { get, set, remove }
}
