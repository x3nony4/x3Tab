# PRD: x3Tab 新标签页插件

## Problem Statement

浏览器默认新标签页要么空无一物，要么塞满广告和推荐内容。用户需要一个极简、可控、专注于"快速启动"的新标签页：看一眼时间 → 搜东西 → 打开常用网站，三步完成，无干扰。

## Solution

一个浏览器新标签页插件。极简主题，垂直居中布局，三个核心模块：**数字时钟**（偏上）、**多引擎搜索框**（中）、**快捷方式 Docker 栏**（底部固定）。深色/浅色主题可切换。

用户在新标签页打开后，可以直接搜索（Tab 键切搜索引擎），或点击 Docker 栏中的快捷方式立即跳转常用网站。

## User Stories

### 时钟

1. As a user, I want to see the current time (hours:minutes:seconds) on my new tab page, so that I can check the time at a glance.
2. As a user, I want to see today's date in `YYYY年mm月dd日 星期X` format below the clock, so that I can quickly confirm the date and weekday.

### 搜索

3. As a user, I want to type a search query and press Enter to search on the currently selected engine, so that I can start searching immediately.
4. As a user, I want to press Tab to cycle through available search engines, so that I can switch engines without using the mouse.
5. As a user, I want the engine icon displayed on the left side of the search bar, so that I know which engine is currently selected.
6. As a user, I want switching engines to preserve my already-typed search text, so that I can change my mind about which engine to use mid-typing.
7. As a user, I want search results to open in the current tab by default, so that I don't accumulate unnecessary tabs.
8. As a user, I want a dropdown arrow next to the engine icon, so that I can open the engine management panel.
9. As a user, I want the engine management panel to display all engines horizontally with their icons as the primary visual and names as secondary, so that I can quickly identify and select engines.
10. As a user, I want to add a custom search engine by clicking the `+` button in the engine management panel, so that I can use engines not included by default.
11. As a user, I want to delete any engine (default or custom), so that I can keep only the engines I use.
12. As a user, I want at least one engine to remain in the system at all times, so that the search functionality never breaks.
13. As a user, I want the engine management panel to animate smoothly when opening/closing (top-to-bottom expansion), so that the transition feels polished.
14. As a user, I want the engine management panel width to match the search bar width, so that it looks visually coherent.

### Docker 栏快捷方式

15. As a user, I want to see my frequently used websites as icons in a dock at the bottom of the page, so that I can launch them with one click.
16. As a user, I want to click a shortcut to open the website in the current tab, so that I navigate quickly.
17. As a user, I want to add a new shortcut by clicking the `+` button at the end of the dock, so that I can expand my collection.
18. As a user, I want the `+` button always visible (not only in edit mode), so that I can add shortcuts at any time.
19. As a user, I want the dock to hold up to 15 shortcuts, so that I have enough room for my daily sites.
20. As a user, I want to right-click the dock and select "编辑 Docker 栏" to enter edit mode, so that I can manage my shortcuts.
21. As a user, I want shortcuts to shake in edit mode (like iOS home screen editing), so that I get a clear visual cue that editing is active.
22. As a user, I want a delete icon (`-`) to appear on the top-right corner of each shortcut in edit mode, so that I can remove shortcuts easily.
23. As a user, I want to long-press and drag shortcuts to reorder them in edit mode, so that I can arrange them as I prefer.
24. As a user, I want to hover over a shortcut in edit mode to see a mask overlay with an edit icon, so that I can access the edit card.
25. As a user, I want to click the edit icon on a shortcut to open an edit card, so that I can modify its properties.
26. As a user, I want the edit card to include fields for name (required), URL (required), and icon (online/solid color/upload), so that I can fully customize a shortcut.
27. As a user, I want the edit card to be the same component for both adding new shortcuts and editing existing ones, so that the experience is consistent.

### 图标

28. As a user, I want shortcut icons to be automatically fetched from the website's favicon via online APIs, so that I don't have to manually set them.
29. As a user, I want a fallback solid-color icon (background color + first letter of site name) when online favicon fetching fails, so that every shortcut has a recognizable icon.
30. As a user, I want to manually upload a custom image as a shortcut icon, so that I can use icons not available online.
31. As a user, I want to customize the background color of solid-color icons, so that I can differentiate shortcuts visually.

### 主题

32. As a user, I want the new tab page to initialize with the system's dark/light preference, so that it matches my OS theme on first launch.
33. As a user, I want the new tab page to default to dark theme when the system preference is unavailable, so that I get a comfortable dark experience.
34. As a user, I want a theme toggle icon in the top-right corner of the page, so that I can switch between dark and light themes manually.
35. As a user, I want clicking the theme toggle to cycle dark → light → dark, so that switching is simple and predictable.
36. As a user, I want system theme to only affect initialization and not the manual toggle cycle, so that my manual choice sticks.

### 全局

37. As a user, I want the new tab page to be fast to load, so that I'm not waiting for a blank page to render.

## Implementation Decisions

### 架构

- **新标签页入口**: WXT `entrypoints/newtab/` 作为唯一页面入口，无 popup、无 options_ui 路由。
- **框架**: Vue 3 Composition API + `<script setup>` + TypeScript。
- **无路由**: 所有交互通过组件内状态和 overlay 面板完成，不引入 vue-router。

### 数据

- **`chrome.storage.local`**: 存储轻量数据——主题偏好、快捷方式元数据（不含图标二进制）、搜索引擎配置。
- **IndexedDB**: 存储大体积数据——快捷方式图标（在线获取的缓存、本地上传的图片）、后续壁纸图片。
- **至少保留一个引擎**: 删除逻辑在 storage 层校验——引擎总数 ≤1 时拒绝删除。

### 组件状态归属

- **时钟**: 自管理时间更新（`setInterval` 每秒），日期格式化用 `Intl.DateTimeFormat`。
- **搜索框**: 管理当前选中引擎、输入文本、面板展开/收起。Tab 键切换引擎时从 storage 读取引擎列表循环。回车时构造 URL（`engine.urlTemplate.replace('%s', query)`）并调用 `chrome.tabs.update` 或 `window.location` 跳转。
- **Docker 栏**: 管理快捷方式列表、编辑模式开关、拖拽排序状态。右键菜单用浏览器原生 `contextmenu` 事件。
- **主题**: 全局 composable `useTheme`，初始化读 `window.matchMedia('(prefers-color-scheme: dark)')` + storage 覆盖，切换写 storage。
- **图标获取**: 优先在线获取，失败回退纯色图标，用户可手动覆盖。图标缓存至 IndexedDB。

### 存储 Schema

```ts
// chrome.storage.local
interface Settings {
    theme: 'dark' | 'light'
    shortcuts: ShortcutMeta[] // max 15
    engines: SearchEngine[] // min 1
    activeEngineIndex: number
}

interface ShortcutMeta {
    id: string
    name: string
    url: string
    iconType: 'online' | 'solid' | 'upload'
    solidColor?: string // only when iconType === 'solid'
}

interface SearchEngine {
    id: string
    name: string
    urlTemplate: string // '%s' as query placeholder
    iconUrl?: string // only for default engines
    isDefault: boolean
}
```

### 交互细节

- **抖动动画**: CSS `@keyframes`，类似 iOS 编辑模式抖动，编辑模式时给每个 ShortcutItem 添加 CSS class。
- **拖拽排序**: HTML Drag and Drop API，编辑模式下 `draggable="true"`，`dragstart`/`dragover`/`drop` 事件更新数组顺序。
- **引擎面板过渡**: Vue `<Transition>` 组件，`max-height` + `opacity` 动画，从上到下展开。
- **右键菜单**: 仅在 Docker 栏区域监听 `contextmenu`，阻止默认菜单，显示"编辑 Docker 栏"选项。编辑模式下增加"退出编辑"选项。
- **主题切换**: 在 `<html>` / `:root` 设置 CSS 变量，深色/浅色调色板切换。

## Testing Decisions

### 测试原则

- 只测外部行为，不测实现细节
- Mock `chrome.*` API（`chrome.storage.local`, `chrome.tabs`）
- Mock IndexedDB（可用 `fake-indexeddb`）
- 组件测试用 `@vue/test-utils`
- 不测试 CSS 动画效果（视觉验证）

### 测试模块

| 模块           | 测试内容                                                 |
| -------------- | -------------------------------------------------------- |
| `Clock`        | 渲染时分秒；渲染日期格式；每秒更新                       |
| `SearchBar`    | 回车跳转；Tab 切换引擎不清空输入；面板展开/收起          |
| `EnginePanel`  | 引擎列表渲染；添加引擎；删除引擎（含至少保留一个的校验） |
| `Dock`         | 快捷方式列表渲染；进入/退出编辑模式；右键菜单            |
| `ShortcutItem` | 图标渲染（三种类型）；hover 遮罩；编辑卡片弹窗；删除     |
| `AddShortcut`  | 添加按钮渲染；弹出编辑卡片                               |
| `EditCard`     | 字段校验（名称/URL 必填）；三种图标类型切换              |
| `ThemeToggle`  | 切换循环；系统偏好初始化；storage 持久化                 |
| `useStorage`   | `storage.local` 读写；IndexedDB 读写                     |

### 测试基础设施

- **测试框架**: Vitest（已配置）
- **Vue 组件测试**: `@vue/test-utils` + `jsdom`
- **Chrome API Mock**: 手写 mock 模块，或 `@webext-core/fake-browser`

## Out of Scope

- 壁纸/背景图片（静态上传或每日 Bing/Unsplash）
- 搜索行为配置（新标签页 vs 当前页跳转的切换设置）
- 时钟自定义格式
- 模拟时钟样式
- 文件夹/分组快捷方式
- 浏览器书签同步导入
- 快捷方式访问频率统计/自动排序
- 多语言国际化
- Firefox 兼容（首期仅 Chrome/Edge）
- 跨设备同步（`storage.sync` 方案）

## Further Notes

- 项目技术栈已 scaffold：WXT + Vue 3 + TypeScript + ESLint (@antfu) + Vitest
- `chrome.storage.local` 容量大但不可跨设备同步；IndexedDB 用于二进制数据。后续如需要跨设备同步，可单独评估 `storage.sync` 迁移方案
- 快捷方式与浏览器自带书签系统完全解耦，不读取也不写入浏览器书签
