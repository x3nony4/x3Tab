## Problem Statement

x3Tab 测试方案依赖两个独立来源提供测试基础设施：

- `wxt/testing/vitest-plugin` — WxtVitest 插件（vitest 集成）
- `@webext-core/fake-browser` — fakeBrowser 实例（测试中 mock browser API）

官方 WXT 示例（[vitest-unit-testing](https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing)）统一从 `wxt/testing` 导出两者，无需额外安装 `@webext-core/fake-browser`。当前分散的方案增加了依赖数量和 import 路径的认知负担，且未启用 vitest 全局 `mockReset`/`restoreMocks` 配置。

## Solution

统一使用 `wxt/testing` 作为唯一测试基础设施来源：`WxtVitest` 插件和 `fakeBrowser` 实例均从此路径导入。移除 `@webext-core/fake-browser` 外部依赖。全局启用 `mockReset` 和 `restoreMocks`，消除各测试文件中手动 `vi.clearAllMocks()` 的重复代码。

## User Stories

1. As a developer, I want all test infrastructure to come from a single `wxt/testing` import, so that I don't need to know about two separate packages to write tests.
2. As a developer, I want vitest to automatically reset mocks before each test, so that I don't need to write `vi.clearAllMocks()` in every `beforeEach`.
3. As a developer, I want vitest to automatically restore mock implementations before each test, so that test isolation is guaranteed without manual cleanup.
4. As a maintainer, I want to remove the `@webext-core/fake-browser` dependency, so that the dependency graph is simpler and aligned with WXT's official recommendation.
5. As a developer, I want the vitest config to follow WXT's official example, so that upgrading WXT versions is less likely to break test infrastructure.

## Implementation Decisions

### 统一测试基础设施入口

`WxtVitest` 和 `fakeBrowser` 均从 `wxt/testing` 导入。WXT 0.20.x 的 `wxt/testing` 同时 export 两者，无需保留 `@webext-core/fake-browser`。

### 全局 mock 重置策略

在 `vitest.config.ts` 中启用 `mockReset: true` 和 `restoreMocks: true`：

- `mockReset: true` — 每次测试前自动重置所有 `vi.fn()` / `vi.spyOn()` 的调用记录、mock 返回值、mock 实现
- `restoreMocks: true` — 每次测试前自动恢复被 `vi.spyOn()` 替换的原始实现

两个选项由 vitest 在 `beforeEach` 阶段自动执行，替代各测试文件中手写的 `vi.clearAllMocks()`。

注意：`mockReset` 不重置通过 `vi.mock()` factory 创建的 mock 值，现有使用 `vi.mock('#imports', ...)` 的测试不受影响。

### 测试文件位置约定

不改变现有约定：测试文件与源文件同目录（如 `composables/useStorage.test.ts` 与 `composables/useStorage.ts` 并列）。官方示例的 `entrypoints/__tests__/` 目录结构不采用。

### 测试文件 import 迁移

5 个文件中的 `import { fakeBrowser } from '@webext-core/fake-browser'` 改为 `import { fakeBrowser } from 'wxt/testing'`。fakeBrowser 的 API（`.reset()`、`.storage.local.get()` 等）不变，无需修改测试逻辑。

`useIconStore.test.ts` 不使用 fakeBrowser（通过 `vi.hoisted` + 手动 IndexedDB mock），无需修改 import。

### postinstall 脚本

`package.json` 中 `postinstall: "wxt prepare"` 已存在，无需添加。

## Testing Decisions

### 什么构成好的测试

测试只验证外部行为，不验证实现细节。本 PRD 是测试基础设施迁移，测试逻辑本身不变——只换 import 来源和移除冗余的 mock 清理代码。

### 受影响的模块

- `vitest.config.ts` — 全局配置
- `composables/useStorage.test.ts` — fakeBrowser import
- `composables/useDock.test.ts` — fakeBrowser import
- `composables/useTheme.test.ts` — fakeBrowser import
- `composables/useIconStore.test.ts` — 移除 vi.clearAllMocks()
- `entrypoints/newtab/components/EnginePanel.test.ts` — fakeBrowser import
- `entrypoints/newtab/components/SearchBar.test.ts` — fakeBrowser import
- `entrypoints/newtab/components/DockItem.test.ts` — 移除 vi.clearAllMocks()
- `entrypoints/newtab/components/ContextMenu.test.ts` — 移除 vi.clearAllMocks()
- `entrypoints/newtab/components/DockBar.test.ts` — 移除 vi.clearAllMocks()

### 先例

现有 150 个测试全部使用 `WxtVitest()` + `fakeBrowser` + `flush()` helper 模式。本轮变更不引入新的测试模式，仅调整 import 来源。

### 验收标准

1. `pnpm test:run` — 全部 150 测试通过
2. `pnpm lint` — 零错误
3. `grep -r "fake-browser" --include="*.ts"` — 零匹配
4. `grep -r "vi.clearAllMocks()" --include="*.test.ts"` — 零匹配
5. `package.json` 中不再有 `@webext-core/fake-browser`

## Out of Scope

- 不改变测试文件位置约定（保持与源文件同目录）
- 不修改测试逻辑本身
- 不添加新的测试
- 不迁移至官方示例的 `entrypoints/__tests__/` 目录结构
- `useIconStore.test.ts` 的 IndexedDB mock 策略不变（已用 vi.hoisted，不依赖 fakeBrowser）

## Further Notes

- WXT 官方示例参考：https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing
- 上轮重构（手写 mock → WxtVitest + fakeBrowser）已完成，150 测试全通过。本轮是上轮的收尾工作，对齐官方示例的最终配置。
