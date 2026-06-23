import { describe, it, expect, beforeEach } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { useStorage } from '../useStorage'

beforeEach(async () => {
    await fakeBrowser.reset()
})

// Flush all pending microtasks so async storage ops settle
const flush = () => new Promise(r => setTimeout(r))

describe('useStorage', () => {
    it('returns fallback value synchronously before init', () => {
        const { value } = useStorage('theme', 'dark')
        expect(value.value).toBe('dark')
    })

    it('reads stored value on init (async)', async () => {
        await browser.storage.local.set({ 'theme': 'light' })

        const { value, item } = useStorage('theme', 'dark')
        await item.getValue()

        expect(value.value).toBe('light')
    })

    it('uses fallback when nothing stored', async () => {
        const { value, item } = useStorage('theme', 'dark')
        await item.getValue()

        expect(value.value).toBe('dark')
    })

    it('reacts to external changes via watch', async () => {
        const { value, item } = useStorage('count', 0)
        await item.getValue()

        await browser.storage.local.set({ 'count': 5 })
        await flush()

        expect(value.value).toBe(5)
    })

    it('exposes item for direct setValue', async () => {
        const { item } = useStorage('theme', 'dark')
        await item.getValue()

        await item.setValue('light')
        const result = await browser.storage.local.get('theme')
        expect(result['theme']).toBe('light')
    })

    it('prefixes key with local:', async () => {
        const { item } = useStorage('myKey', 'default')
        await item.getValue()

        const val = await item.getValue()
        expect(val).toBe('default')
    })
})
