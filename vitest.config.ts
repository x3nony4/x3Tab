import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '#imports': resolve(__dirname, 'mocks/imports.ts')
        }
    },
    test: {
        environment: 'jsdom',
        include: ['**/*.test.ts']
    }
})
