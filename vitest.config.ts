import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'

export default defineConfig({
    plugins: [WxtVitest(), vue()],
    test: {
        environment: 'jsdom',
        mockReset: true,
        restoreMocks: true
    }
})
