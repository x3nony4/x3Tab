import { readonly, ref, watch } from 'vue'

import { defineLocalStorage } from '@/utils/localStorage'

type Theme = 'dark' | 'light'

export function useTheme() {
    const store = defineLocalStorage<Theme>('theme', 'dark')
    const theme = ref<Theme>('dark')
    let ready = false

    /**
     * Resolve initial theme: stored value > system preference > dark fallback.
     * Must be called once, before any toggle.
     */
    async function init(): Promise<void> {
        await store.init(getSystemPreference)
        theme.value = await store.get()
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
        await store.set(t)
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
