import type { Ref } from 'vue'
import { ref } from 'vue'

/**
 * Reactive wrapper around a WXT storage item.
 *
 * Returns a Vue ref that auto-initializes from storage and reacts to
 * external changes. The underlying WxtStorageItem is also exposed for
 * direct read/write/remove operations.
 */
export function useStorage<T>(key: string, fallback: T): {
    value: Ref<T>
    item: WxtStorageItem<T, Record<string, unknown>>
} {
    const item = storage.defineItem<T>(`local:${key}`, { fallback })
    const value = ref<T>(fallback) as Ref<T>

    item.getValue().then((v) => {
        if (v !== null && v !== undefined) {
            value.value = v
        }
    }).catch((err) => {
        console.error(err)
    })

    item.watch((v) => {
        value.value = v
    })

    return { value, item }
}
