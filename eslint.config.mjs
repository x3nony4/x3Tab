import antfu from '@antfu/eslint-config'

export default antfu({
    type: 'app',
    typescript: {
        tsconfigPath: 'tsconfig.json'
    },
    vue: true,
    formatters: {
        css: true,
        html: true
    },
    ignores: [
        '**/.output',
        '**/.wxt',
        '**/dist'
    ],
    rules: {
        'pnpm/yaml-enforce-settings': 'off',
        'style/comma-dangle': ['error', 'never'],
        'style/indent': ['error', 4]
    }
})
