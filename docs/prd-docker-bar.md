# PRD: Docker Bar 快捷方式栏 — Issue #5

## Overview

x3Tab 底部固定快捷方式栏。图标+名称展示，点击跳转。支持编辑模式（抖动、拖拽排序、右键菜单）、三种图标类型（在线/纯色/上传）。最多 15 个快捷方式。

## Architecture

### Component tree

```
App.vue (.dockArea — positioning only)
└── DockBar.vue (frosted container, owns useDock + useIconStore)
    ├── DockItem.vue × N (icon + name + shake/delete/mask in edit mode)
    ├── AddButton.vue ("+", always visible, disabled at 15)
    ├── EditCard.vue (modal, v-if, create or edit mode)
    └── ContextMenu.vue (v-if, positioned at click coords)
```

### State flow

- `useDock()` — called once in DockBar, all state passed down as props/emits
- No provide/inject, no global store
- `useDock` wraps `useStorage<Shortcut[]>('shortcuts', [])` (same pattern as useTheme)
- `useIconStore()` — module-level singleton IDB connection, lazy init

### Types

```ts
interface Shortcut {
    id: string            // crypto.randomUUID()
    name: string
    url: string
    iconType: 'online' | 'solid' | 'upload'
    solidColor?: string   // only for solid type
}
const MAX_SHORTCUTS = 15
```

### Composable APIs

```ts
useDock(): {
    shortcuts: Readonly<Ref<Shortcut[]>>
    editMode: Readonly<Ref<boolean>>
    add(shortcut: Omit<Shortcut, 'id'>): boolean  // false if at max
    update(id: string, patch: Partial<Omit<Shortcut, 'id'>>): void
    remove(id: string): void
    reorder(fromIndex: number, toIndex: number): void
    enterEditMode(): void
    exitEditMode(): void
}

useIconStore(): {
    get(id: string): Promise<string | null>    // base64 data URL or null
    set(id: string, dataUrl: string): Promise<void>
    remove(id: string): Promise<void>
}
```

## Storage Schema

### chrome.storage.local

Key: `local:shortcuts` → `Shortcut[]` (max 15)

### IndexedDB

| Property | Value                                            |
| -------- | ------------------------------------------------ |
| DB name  | `x3tab-icons`                                    |
| Version  | 1                                                |
| Store    | `icons` (keyPath: `id`)                          |
| Record   | `{ id: string, data: string }` (base64 data URL) |

## Component Specs

### DockBar.vue

Props: none (self-contained). Internal state: `showEditCard`, `editingShortcut`, `ctxMenu {show,x,y}`, `dragIndex`. Key handlers: `onContextMenu` (prevent default, show custom menu), `onSave` (add or update + close), `onDelete` (remove + iconStore.remove), `onDragStart/Over/Drop` (reorder array).

### DockItem.vue

Props: `{ shortcut: Shortcut, editMode: boolean, index: number }`. Emits: `delete`, `edit`, `dragstart`. Icon rendering: online → `<img>` with Google Favicon API (`google.com/s2/favicons?domain=HOST&sz=64`) + `@error` fallback to solid; solid → colored div with first letter; upload → `<img>` loaded from iconStore. Edit mode: `.shaking` class with staggered `animation-delay`, delete badge (top-right `-`), hover mask with edit icon.

### EditCard.vue

Props: `{ shortcut: Shortcut | null }` (null = create mode). Emits: `save`, `cancel`. Fields: name (required), URL (required, valid URL format), icon type (online/solid/upload). Conditional: color picker (solid), file input (upload → FileReader → base64 preview). Validation on save, errors displayed per field.

### ContextMenu.vue

Props: `{ show: boolean, x: number, y: number, editMode: boolean }`. Emits: `toggle-edit`, `close`. Renders at (x,y) coordinates. Item text: "编辑 Docker 栏" / "退出编辑". Closes on document click or Escape.

### AddButton.vue

Props: `{ disabled: boolean }`. Emits: `click`. "+" button, dashed border, disabled at 15 with tooltip.

## CSS Design

| Element          | Key styles                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dock container   | `backdrop-filter: blur(24px)`, `border-radius: 16px 16px 0 0`, `border: 1px solid var(--c-dock-border)`, `border-bottom: none`, `padding: 8px 12px` |
| Shortcut icon    | 44×44, `border-radius: 10px`, `background: var(--c-border)`                                                                                         |
| Shortcut name    | `font-size: 11px`, `color: var(--c-text-secondary)`, ellipsis overflow                                                                              |
| Shake animation  | `@keyframes wiggle { 0%,100% { rotate:0 }, 25% { rotate:-1.5deg }, 75% { rotate:1.5deg } }`, `0.3s ease-in-out infinite`                            |
| EditCard overlay | `position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200`                                                                              |
| EditCard modal   | `width: 400px`, `border-radius: 16px`, `padding: 24px`, centered                                                                                    |
| ContextMenu      | `position: fixed; z-index: 300`, `border-radius: 10px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.3)`                                                    |
| Delete badge     | 16×16 circle, `background: #e74c3c`, top-right corner                                                                                               |
| Add button       | 44×44, dashed border, `opacity: 0.3` when disabled                                                                                                  |

## Key Design Decisions

| Decision      | Choice                                                          | Why                                                  |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| IndexedDB     | Raw browser API                                                 | Single store, simple CRUD; `idb` package unnecessary |
| Drag and drop | HTML5 DnD API                                                   | Native, no lib needed; desktop Chrome only           |
| Favicon       | Google Favicon API + `@error` fallback                          | Free, no CORS for img, no storage for online type    |
| EditCard      | Single component, `shortcut \| null`                            | Avoids duplicate add/edit                            |
| CSS keyframes | `<style module>` scoped                                         | Vite hashes names, no collisions                     |
| Positioning   | App.vue handles `fixed; bottom; center`; DockBar handles visual | Separation of layout vs visual                       |

## File List

### New (14 files)

```
composables/useDock.ts
composables/useDock.test.ts
composables/useIconStore.ts
composables/useIconStore.test.ts
entrypoints/newtab/components/AddButton.vue
entrypoints/newtab/components/AddButton.test.ts
entrypoints/newtab/components/ContextMenu.vue
entrypoints/newtab/components/ContextMenu.test.ts
entrypoints/newtab/components/DockItem.vue
entrypoints/newtab/components/DockItem.test.ts
entrypoints/newtab/components/EditCard.vue
entrypoints/newtab/components/EditCard.test.ts
entrypoints/newtab/components/DockBar.vue
entrypoints/newtab/components/DockBar.test.ts
```

### Modified (1 file)

```
entrypoints/newtab/App.vue  — import DockBar, remove dock placeholder
```

## Implementation Phases

1. **Core composables** — `useDock.ts` + `useIconStore.ts` + tests
2. **Leaf components** — `AddButton.vue` + `ContextMenu.vue` + tests
3. **DockItem** — icon rendering, shake, delete badge, drag, favicon fallback + test
4. **EditCard** — modal form, validation, icon type switching, file upload + test
5. **DockBar** — integration, context menu wiring, drag orchestration, EditCard open/close + test
6. **App.vue** — replace placeholder with `<DockBar />`

## Testing Strategy

- Framework: Vitest + jsdom + @vue/test-utils (same as existing tests)
- Storage mock: `vi.hoisted()` + `vi.mock('#imports', ...)` with in-memory Map (same pattern as useStorage/useTheme tests)
- IndexedDB mock: `vi.stubGlobal('indexedDB', mockIDB)` with hand-rolled in-memory facade
- No new devDependencies needed

## Verification

1. `pnpm typecheck` — zero errors
2. `pnpm test:run` — all tests pass
3. `pnpm dev` — manual smoke: shortcuts render, click navigates, right-click menu, edit mode shake/delete/drag, add/edit card validation, 15 limit
