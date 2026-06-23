# x3Tab

浏览器新标签页插件。WXT + Vue 3 + Tailwind CSS 4 + Vitest。

## Tech stack

- **Framework**: WXT (`wxt`) + Vue 3 (`vue`) + Vite
- **CSS**: Tailwind CSS 4 (`@tailwindcss/vite`)
- **UI primitives**: `reka-ui`
- **Icons**: `@heroicons/vue`
- **Test**: Vitest + `@vue/test-utils` + jsdom
- **Lint**: ESLint (`@antfu/eslint-config`)
- **Type**: TypeScript strict (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`)

## Commands

```bash
pnpm dev              # dev (Chromium)
pnpm dev:firefox      # dev (Firefox)
pnpm build            # production build
pnpm test             # vitest watch
pnpm test:run         # vitest single run
pnpm lint             # eslint check
pnpm lint:fix         # eslint auto-fix
pnpm typecheck        # vue-tsc --noEmit
```

## Directory structure

```
src/
├── entrypoints/newtab/   # WXT entrypoint: App.vue, main.ts, index.html, engines.ts
├── components/           # Vue SFCs + __tests__/
├── composables/          # useDock, useStorage, useTheme, useIconStore + __tests__/
├── utils/                # storage helpers + __tests__/
└── assets/               # theme.css
```

`CONTEXT.md` — 领域词汇表，命名时严格对齐。

## WXT auto-imports & aliases

WXT 自动生成 `.wxt/tsconfig.json` 和 `.wxt/types/imports.d.ts`，提供以下开箱能力：

### Path aliases

| Alias       | Resolves to |
| ----------- | ----------- |
| `@` / `~`   | `src/`      |
| `@@` / `~~` | 项目根目录  |

### Auto-imports (无需手动 import)

| Category            | Symbols                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Vue                 | `ref`, `computed`, `watch`, `onMounted`, `inject`, `provide`, `reactive`, `readonly`, `nextTick` ... |
| WXT                 | `browser`, `storage`, `fakeBrowser`, `defineContentScript`, `defineBackground` ...                   |
| Project composables | `useDock`, `useStorage`, `useTheme`, `useIconStore`                                                  |
| Project types       | `Shortcut`, `Theme`, `IconStore`, `WxtStorageItem`                                                   |
| Project constants   | `MAX_SHORTCUTS`                                                                                      |
| Project utils       | `defineStore`                                                                                        |

### 显式 import `#imports`

需要显式导入时（如非 `.vue` 文件），用 WXT 虚拟模块：

```ts
import { storage } from '#imports'
import type { WxtStorageItem } from '#imports'
```

## Conventions

- **Vue SFC**: `<script lang="ts" setup>` — Composition API only
- **Composables**: `useXxx()` 返回 `{ ref, method }`，状态驱动，避免 class
- **Storage**: `useStorage<T>(key, default)` 封装 `chrome.storage.local`；大文件走 `useIconStore` (IndexedDB)
- **Imports**: `.vue` 文件中显式 import 组件和 composables（不用 auto-import），路径用相对路径
- **Tests**: 组件测试用 `@vue/test-utils` + `fakeBrowser` (wxt/testing)；composables 测试用 `vitest` + fake timers
- **Types**: 接口定义在对应 composable/组件文件中，不集中类型文件

## Agent skills

### Issue tracker

GitHub Issues（`gh` CLI），外部 PR 不作为 triage 来源。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用默认标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

Single-context 布局：根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。
