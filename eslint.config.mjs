import antfu from '@antfu/eslint-config'

export default antfu({
    type: 'app',
    typescript: {
        tsconfigPath: 'tsconfig.json'
    },
    vue: true,
    markdown: false,
    formatters: {
        css: true,
        html: true,
        markdown: true
    },
    ignores: [
        '**/.output',
        '**/.wxt',
        '**/dist',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*'
    ],
    rules: {
        'pnpm/yaml-enforce-settings': 'off',
        'style/comma-dangle': ['error', 'never'],
        'style/indent': ['error', 4]
    }
})
