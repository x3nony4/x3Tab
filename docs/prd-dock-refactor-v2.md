# PRD: Docker 栏 V2 重构

## Problem Statement

当前 Docker 栏使用全局编辑模式（右键 → "编辑 Docker 栏" → 全局抖动 + 遮罩 → 逐个操作），交互不直观：

- 进入编辑模式才能看到删除/编辑入口，发现性差
- 抖动动画干扰视觉，遮罩层需要 hover 才出现
- 拖拽只在编辑模式下可用，日常使用中无法排序
- HTML5 原生 drag API 无动画反馈
- DockItem 和 AddButton 缺少统一外壳（Tooltip、圆角方形、hover 动效）

## Solution

1. **交互模型改为单 item 右键操作**：右键 DockItem 弹出"编辑""删除"菜单，去掉全局编辑模式
2. **长按触发拖拽排序**：motion-v `<Reorder.Group>` + `useDragControls` + 500ms 长按计时
3. **统一动效系统**：motion-v 处理拖拽动画、删除退出动画、hover 上浮效果
4. **抽离 DockTile 外壳**：reka-ui Tooltip + 圆角方形容器 + motion hover + 可选 ContextMenu

## User Stories

1. 作为用户，我希望右键单个快捷方式时弹出"编辑"和"删除"菜单
2. 作为用户，我希望点击"删除"后快捷方式以动画消失
3. 作为用户，我希望点击"编辑"后弹出 EditCard，预填当前数据
4. 作为用户，我希望长按快捷方式 500ms 后进入拖拽状态，以便排序
5. 作为用户，我希望拖拽时当前 item 放大+阴影，其他 item 自动让位
6. 作为用户，我希望松手后 item 以弹性动画滑入最终位置
7. 作为用户，我希望拖拽被限制在水平方向
8. 作为用户，我希望长按计时中移动超过 5px 则取消拖拽，防止误触
9. 作为用户，我希望所有 dock 项目（快捷方式 + 添加按钮）有统一的圆角方形容器和 hover 上浮效果
10. 作为用户，我希望鼠标悬停时每个项目上方显示名称 tooltip

## Implementation Decisions

### 1. 移除全局编辑模式

`useDock()` composable 接口变更：

- **移除**: `editMode`, `enterEditMode()`, `exitEditMode()`
- **保留**: `shortcuts`, `add()`, `update()`, `remove()`, `reorder()`, `getIcon()`

### 2. 移除的组件和逻辑

- **ContextMenu.vue** — 删除，功能并入 DockTile
- **DockBar.vue** — 移除: `onToggleEdit`, `onKeydown` Escape 处理, `editMode` prop 传递, drag 相关 handler（`onDragStart`/`onDragOver`/`onDrop`）
- **DockItem.vue** — 移除: `editMode` prop, `index` prop, shakeDelay, wiggle keyframe, 删除徽章, 编辑遮罩, drag handler

### 3. 新增组件和 Composable

#### DockTile.vue

统一外壳组件。使用 reka-ui `TooltipRoot/Trigger/Content` + 可选 reka-ui `ContextMenuRoot/Trigger/Content`。

Props:

- `label: string` — Tooltip 文字
- `showMenu?: boolean` — 默认 false，true 时启用右键菜单

Slots:

- `default` — 主体内容
- `menu` — 右键菜单项（仅 showMenu 时生效）

运动效果由外层 motion 组件提供（DockBar 中的 `Reorder.Item`）。

#### useLongPressDrag

长按触发拖拽 composable，封装 motion-v 的 `useDragControls`。

```
状态机:
idle → pointerdown → pressing (500ms timer)
                        ├── < 500ms + move < 5px → idle (触发 click 导航)
                        ├── < 500ms + move > 5px → idle (取消)
                        └── >= 500ms → dragging → pointerup → releasing → idle
```

返回 `{ onPointerDown, onPointerMove, onPointerUp }` handlers，由 DockBar 绑定。

### 4. motion-v 集成

新增依赖: `motion-v`

| 功能           | motion-v API                                                                               |
| -------------- | ------------------------------------------------------------------------------------------ |
| 水平拖拽排序   | `<Reorder.Group axis="x" v-model:values="shortcutIds">`                                    |
| 拖拽视觉反馈   | `whileDrag="{ scale: 1.1, boxShadow: '...' }"`                                             |
| 松手惯性       | `dragMomentum`                                                                             |
| 删除退出动画   | `<AnimatePresence mode="popLayout">` + `<Reorder.Item :exit="{ opacity: 0, scale: 0.8 }">` |
| 其他 item 让位 | `Reorder.Item` 内置 layout animation                                                       |
| 长按触发       | `dragListener={false}` + `useDragControls` + `useLongPressDrag`                            |

### 5. DockBar 重构

DockBar 从编排器变为容器组件：

```
<Reorder.Group axis="x" v-model:values="shortcutIds">
  <AnimatePresence mode="popLayout">
    <Reorder.Item v-for="shortcut in shortcuts" :key="shortcut.id" :value="shortcut.id"
                  :dragListener="false" :dragControls="longPressDrag.controls"
                  @pointerdown="longPressDrag.onPointerDown"
                  @pointermove="longPressDrag.onPointerMove"
                  @pointerup="longPressDrag.onPointerUp">
      <DockTile :label="shortcut.name" :show-menu="true">
        <DockItem :shortcut="shortcut" :get-icon="getIcon"
                  @click="navigate" @edit="onEdit" />
        <template #menu>
          <ContextMenuItem @select="onEdit(shortcut.id)">编辑</ContextMenuItem>
          <ContextMenuItem @select="onDelete(shortcut.id)">删除</ContextMenuItem>
        </template>
      </DockTile>
    </Reorder.Item>
  </AnimatePresence>
</Reorder.Group>

<!-- AddButton 不参与排序 -->
<DockTile label="添加快捷方式">
  <AddButton :disabled="atLimit()" @click="onAddClick" />
</DockTile>
```

### 6. DockItem 精简

- 移除: `editMode`, `index` props; shake 动画 CSS; delete badge; edit mask; drag handler
- 新增: 显式 `edit` emit
- 保留: 图标三种渲染（online/solid/upload）、favicon @error 回退、导航 click

### 7. 依赖变更

新增: `motion-v`

## Testing Decisions

### 测试 seam

最高 seam: `useDock()` composable（纯逻辑，无 DOM）

| 层               | 测试内容                                                | 工具                 |
| ---------------- | ------------------------------------------------------- | -------------------- |
| useDock          | add/update/remove/reorder；验证 editMode 相关已移除     | vitest + fakeBrowser |
| useLongPressDrag | 计时器触发/取消/阈值                                    | vitest + fake timers |
| DockTile         | Tooltip 渲染、ContextMenu show/hide、menu slot          | @vue/test-utils      |
| DockItem         | 图标渲染（online/solid/upload）、点击导航、favicon 回退 | @vue/test-utils      |
| DockBar          | Reorder.Group 集成、DockTile 包装、删除流程             | @vue/test-utils      |

### motion-v 测试策略

motion-v 组件在 jsdom 中无意义，测试中 stub 为普通 div。需在 vitest 配置或各测试文件中处理。

### 参考现有测试

- `useDock.test.ts` — composable 测试模式
- `DockItem.test.ts` — 组件测试模式（@vue/test-utils + vi.mock）
- `DockBar.test.ts` — 集成测试模式

### 验证

1. `pnpm typecheck` — 零错误
2. `pnpm test:run` — 所有测试通过
3. `pnpm dev` — 手动验证：右键菜单、长按拖拽、删除动画、hover 上浮

## Out of Scope

- Modal 组件抽离和 EditCard/EnginePanel 重构
- ThemeToggle 组件
- 测试层 mock 重复消除
- 拖拽在触屏设备上的完整适配
- 删除动画细节调优（先上简单 exit 动画）
