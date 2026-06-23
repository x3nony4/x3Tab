import type { Ref } from 'vue'

import { readonly, ref } from 'vue'

import { useIconStore } from './useIconStore'
import { useStorage } from './useStorage'

export interface Shortcut {
    id: string
    name: string
    url: string
    iconType: 'online' | 'solid' | 'upload'
    solidColor?: string
}

export const MAX_SHORTCUTS = 15

export function useDock() {
    const { value: shortcuts, item } = useStorage<Shortcut[]>('shortcuts', [])
    const editMode = ref(false)
    const iconStore = useIconStore()

    function add(shortcut: Omit<Shortcut, 'id'>, iconBlob?: string): Shortcut | null {
        if (shortcuts.value.length >= MAX_SHORTCUTS)
            return null
        const id = crypto.randomUUID()
        const created: Shortcut = { id, ...shortcut }
        shortcuts.value = [...shortcuts.value, created]
        item.setValue(shortcuts.value).catch(err => console.error(err))
        if (iconBlob != null) {
            iconStore.set(id, iconBlob).catch(err => console.error(err))
        }
        return created
    }

    function update(id: string, patch: Partial<Omit<Shortcut, 'id'>>, iconBlob?: string): void {
        shortcuts.value = shortcuts.value.map(s =>
            s.id === id ? { ...s, ...patch } : s
        )
        item.setValue(shortcuts.value).catch(err => console.error(err))
        if (iconBlob != null) {
            iconStore.set(id, iconBlob).catch(err => console.error(err))
        }
    }

    function remove(id: string): void {
        shortcuts.value = shortcuts.value.filter(s => s.id !== id)
        item.setValue(shortcuts.value).catch(err => console.error(err))
        iconStore.remove(id).catch(err => console.error(err))
    }

    function reorder(fromIndex: number, toIndex: number): void {
        const arr = [...shortcuts.value]
        const [moved] = arr.splice(fromIndex, 1)
        arr.splice(toIndex, 0, moved)
        shortcuts.value = arr
        item.setValue(shortcuts.value).catch(err => console.error(err))
    }

    function enterEditMode(): void {
        editMode.value = true
    }

    function exitEditMode(): void {
        editMode.value = false
    }

    async function getIcon(id: string): Promise<string | null> {
        try {
            return await iconStore.get(id)
        }
        catch (err) {
            console.error(err)
            return null
        }
    }

    return {
        shortcuts: readonly(shortcuts) as Readonly<Ref<Shortcut[]>>,
        editMode: readonly(editMode),
        add,
        update,
        remove,
        reorder,
        enterEditMode,
        exitEditMode,
        getIcon
    }
}
