import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing'
import { useTheme } from '../useTheme'

const flush = () => new Promise(r => setTimeout(r))

function mockMatchMedia(matchesDark: boolean) {
    return vi.fn((query: string) => ({
        matches: query.includes('dark') ? matchesDark : !matchesDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
}

beforeEach(async () => {
    await fakeBrowser.reset()
    vi.stubGlobal('document', {
        documentElement: {
            setAttribute: vi.fn(),
            getAttribute: vi.fn()
        }
    })
})

describe('useTheme', () => {
    it('defaults to dark theme before init', () => {
        const { theme } = useTheme()
        expect(theme.value).toBe('dark')
    })

    it('uses stored theme when available', async () => {
        await browser.storage.local.set({ 'theme': 'light' })

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('light')
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })

    it('falls back to system preference when no stored theme', async () => {
        vi.stubGlobal('window', { matchMedia: mockMatchMedia(true) })

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
    })

    it('defaults to dark when matchMedia unavailable', async () => {
        vi.stubGlobal('window', undefined)

        const { theme, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
    })

    it('toggle switches dark↔light', async () => {
        const { theme, toggle, init } = useTheme()
        await init()

        expect(theme.value).toBe('dark')
        toggle()
        expect(theme.value).toBe('light')
        toggle()
        expect(theme.value).toBe('dark')
    })

    it('persists theme to storage on change', async () => {
        const { toggle, init } = useTheme()
        await init()
        toggle()
        await flush()

        const result = await browser.storage.local.get('theme')
        expect(result['theme']).toBe('light')
    })

    it('applies theme attribute to document element', async () => {
        await browser.storage.local.set({ 'theme': 'dark' })

        const { init } = useTheme()
        await init()

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('does not persist before init', async () => {
        const { theme } = useTheme()
        ;(theme as any).value = 'light'
        await flush()

        const result = await browser.storage.local.get('theme')
        expect(result['theme']).toBeUndefined()
    })
})
