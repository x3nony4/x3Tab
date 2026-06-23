import { defineStore } from '@/utils/storage'

const iconStore = defineStore<{ id: string, data: string }>({
    dbName: 'x3tab-data',
    storeName: 'icons'
})

interface IconStore {
    get: (id: string) => Promise<string | null>
    set: (id: string, dataUrl: string) => Promise<void>
    remove: (id: string) => Promise<void>
}

export function useIconStore(): IconStore {
    async function get(id: string): Promise<string | null> {
        const record = await iconStore.get(id)
        return record?.data ?? null
    }

    async function set(id: string, dataUrl: string): Promise<void> {
        await iconStore.put({ id, data: dataUrl })
    }

    async function remove(id: string): Promise<void> {
        await iconStore.delete(id)
    }

    return { get, set, remove }
}
