export function defineLocalStorage<T>(key: string, fallback: T) {
    const storageKey: `local:${string}` = `local:${key}`
    const item = storage.defineItem<T>(storageKey, { fallback })

    let initialized = false

    function ensureInit(): void {
        if (!initialized) {
            throw new Error(
                `defineLocalStorage("${key}"): init() must be called before get/set/remove`
            )
        }
    }

    async function init(fn?: () => T | Promise<T>): Promise<void> {
        const existing = await storage.getItem<T>(storageKey)
        if (existing !== null && existing !== undefined) {
            initialized = true
            return
        }
        const value = fn ? await fn() : fallback
        await item.setValue(value)
        initialized = true
    }

    async function get(): Promise<T> {
        ensureInit()
        return item.getValue()
    }

    async function set(value: T): Promise<void> {
        ensureInit()
        return item.setValue(value)
    }

    async function remove(): Promise<void> {
        ensureInit()
        return item.removeValue()
    }

    return { init, get, set, remove }
}
