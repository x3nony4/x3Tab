export function defineStore<T extends { id: string }>(config: {
    dbName: string
    storeName: string
}) {
    const { dbName, storeName } = config

    async function openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' })
                }
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    let dbPromise: Promise<IDBDatabase> | null = null

    async function getDB(): Promise<IDBDatabase> {
        if (!dbPromise) {
            dbPromise = openDB()
        }
        return dbPromise
    }

    async function get(id: string): Promise<T | undefined> {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly')
            const req = tx.objectStore(storeName).get(id)
            req.onsuccess = () => resolve(req.result as T | undefined)
            req.onerror = () => reject(req.error)
        })
    }

    async function put(value: T): Promise<void> {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite')
            tx.objectStore(storeName).put(value)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    }

    async function _delete(id: string): Promise<void> {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite')
            tx.objectStore(storeName).delete(id)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    }

    async function keys(): Promise<string[]> {
        const db = await getDB()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly')
            const req = tx.objectStore(storeName).getAllKeys()
            req.onsuccess = () => resolve(req.result as string[])
            req.onerror = () => reject(req.error)
        })
    }

    return { get, put, delete: _delete, keys }
}
