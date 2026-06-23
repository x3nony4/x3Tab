import { readonly, watch } from 'vue'

import { useStorage } from './useStorage'

type Theme = 'dark' | 'light'

export function useTheme() {
    const { value: theme, item } = useStorage<Theme>('theme', 'dark')
    let ready = false

    /**
     * Resolve initial theme: stored value > system preference > dark fallback.
     * Must be called once, before any toggle.
     */
    async function init(): Promise<void> {
        const stored = await storage.getItem<Theme>('local:theme')
        if (stored) {
            theme.value = stored
        }
        else {
            theme.value = getSystemPreference()
        }
        apply(theme.value)
        ready = true
    }

    function toggle(): void {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    function apply(t: Theme): void {
        document.documentElement.setAttribute('data-theme', t)
    }

    // Persist and apply on change
    watch(theme, async (t) => {
        if (!ready)
            return
        apply(t)
        await item.setValue(t)
    })

    // React to external storage changes
    item.watch((newVal: Theme) => {
        if (!ready)
            return
        if (newVal && newVal !== theme.value) {
            theme.value = newVal
        }
    })

    return { theme: readonly(theme), toggle, init }
}

function getSystemPreference(): Theme {
    if (typeof window === 'undefined')
        return 'dark'
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    catch {
        return 'dark'
    }
}
