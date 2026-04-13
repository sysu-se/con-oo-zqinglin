# DESIGN

## A. 领域对象如何被 View 消费

1. View 层直接消费的是 `store adapter`，核心入口是 [stores/game.js](src/node_modules/@sudoku/stores/game.js) 中的 `gameModel`。
2. 领域对象 `Game/Sudoku` 在 adapter 内部持有，组件不直接操作二维数组。
3. View 层拿到的数据主要有：
   - `grid`（题面固定格）
   - `userGrid`（当前可编辑局面）
   - `invalidCells`
   - `gameWon`
   - `canUndo/canRedo`
4. 用户操作进入领域对象的路径：
   - 数字输入：`Keyboard.svelte -> gameModel.guess(...) -> Game.guess(...) -> Sudoku.guess(...)`
   - Undo/Redo：`Actions.svelte -> gameModel.undo/redo -> Game.undo/redo`
   - Hint：`Actions.svelte -> gameModel.hint(...) -> Game.guess(...)`
5. 领域对象变化后，adapter 会 `sync()` 并 `state.set(...)`，Svelte 组件通过 `$store` 自动重渲染。

## B. 响应式机制说明

1. 依赖机制：基于 Svelte 3 的 `store + derived + $store`。
2. 对 UI 暴露为响应式的数据：
   - `gameModel` 的完整状态对象
   - 从 `gameModel` 派生的 `grid/userGrid/invalidCells/gameWon/canUndo/canRedo`
3. 留在领域对象内部的数据：
   - `Game` 的 undo/redo 栈
   - `Sudoku` 的内部 grid（通过 `getGrid()` 防御性复制暴露）
4. 如果直接 mutate 内部对象（例如改 `Sudoku` 私有 grid 但不触发 `state.set`）：
   - Svelte 不会收到新引用和通知
   - 结果是“数据变了但界面不刷新”
   - undo/redo 和 UI 状态也可能脱节

## C. 相比 HW1 的改进与权衡

1. 改进点：
   - 不再让组件直接改 `userGrid` 数组，统一走 `Game/Sudoku` 接口。
   - 新增 `gameModel` adapter，建立清晰响应式边界。
   - Undo/Redo 在真实 UI 流程中可用，不再停留在测试层。
2. 为什么 HW1 做法不足：
   - 领域对象存在但未接入真实界面，UI 与领域层分裂。
   - 组件中分散业务逻辑，难以复用和验证。
3. trade-off：
   - 增加了一层 adapter，代码量更多。
   - 但换来更清晰职责边界和稳定的响应式更新路径。

## D. 迁移稳定性（课堂讨论准备）

1. 最稳定层：`src/domain/*`（纯业务模型，与 Svelte API 耦合最小）。
2. 最可能改动层：`stores/game.js` 适配层（依赖当前 Svelte store 机制）。
