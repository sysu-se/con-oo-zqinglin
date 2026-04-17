# con-oo-zqinglin - Review

## Review 结论

代码已经完成了基本的领域对象接入，Svelte 界面确实在真实消费 `Game`/`Sudoku` 适配出来的 store；但当前设计仍把“题面约束”和“完整游戏状态”拆散在领域层之外，导致 OOP/OOD 和数独业务建模上还有几个关键缺口，尤其是固定格规则、Undo/Redo 边界和 `Game` 聚合边界。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. 题面与固定格规则没有进入领域模型

- 严重程度：core
- 位置：src/domain/sudoku.js:77-85; src/domain/game.js:47-48; src/node_modules/@sudoku/stores/game.js:50-60,76-80
- 原因：`Sudoku` 只保存“当前 grid”，`Game` 也只包裹当前 `Sudoku`；原始题面 `puzzleGrid` 反而保存在 Svelte store 适配层，并由 `gameModel.guess` 在 UI 侧拦截固定格输入。这意味着“给定数字不可修改”这一核心业务约束并不由领域对象保证，任何直接使用 domain API 的调用者都可以改写 givens，`Game` 的序列化/克隆也无法独立恢复完整可玩的业务语义。

### 2. Undo/Redo 只回滚盘面，没有回滚完整可见游戏状态

- 严重程度：core
- 位置：src/domain/game.js:17-36; src/node_modules/@sudoku/stores/game.js:84-103; src/components/Controls/Keyboard.svelte:12-25; src/node_modules/@sudoku/stores/hints.js:28-42; src/node_modules/@sudoku/stores/candidates.js:9-27
- 原因：`Game` 的历史只记录 `Sudoku` grid 快照。实际 UI 中，提示次数、候选数以及提示触发时的候选数清理都在 domain 之外单独修改；因此用户执行 hint、notes 相关操作后再 undo/redo，盘面会回退，但 hints/candidates 不会同步回退，游戏呈现状态不一致。这会直接影响撤销/重做作为业务操作的正确性。

### 3. Game 暴露了可变的内部 Sudoku，破坏聚合边界

- 严重程度：major
- 位置：src/domain/game.js:47-48
- 原因：`getSudoku()` 直接返回内部 `currentSudoku` 对象，而这个对象本身带有 `guess()` 等可变方法。这样任何调用者都可以绕过 `Game.guess()` 直接改盘面，从而跳过历史记录、redo 清空等聚合规则。当前 store 主要把它当只读对象用，但 API 设计本身已经泄漏了内部可变状态。

### 4. 领域对象把无效格表示成 UI 风格的字符串坐标

- 严重程度：major
- 位置：src/domain/sudoku.js:63-74,91-93
- 原因：`getInvalidCells()` 返回的是 `"x,y"` 形式的字符串数组，这明显是为了让 Svelte 组件做 `includes` 判断而设计的表示法。它把视图层的消费习惯反向渗透进 domain API，削弱了模型语义，也让后续扩展到更强类型的位置对象、错误明细或规则解释时变得别扭。

### 5. Hint 逻辑依赖当前玩家盘面求解，而不是领域中的稳定题目解

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/game.js:84-95
- 原因：`hint()` 通过 `solveSudoku(currentGrid)` 对当前盘面求解，再把结果写回。若用户当前盘面已包含冲突或错误输入，这个求解过程就可能失败、返回不稳定结果，或者至少把“提示基于原题唯一解”这一业务规则放在了 UI 适配层而非 domain。根因仍然是 `Game`/`Sudoku` 没有持有题面和解的业务边界。

## 优点

### 1. 使用了比较正确的 Store Adapter 接法

- 位置：src/node_modules/@sudoku/stores/game.js:23-37,53-55,65-117
- 原因：Svelte 层没有直接消费闭包里的领域对象内部字段，而是通过 custom store 持有 `game`，再用 `sync()` 产出新的 plain state，并进一步导出 `derived` stores。这符合 Svelte 3 的 store 消费方式，也解释了为什么领域对象变化后界面能够刷新。

### 2. Sudoku 至少具备了基本封装、校验和外表化能力

- 位置：src/domain/sudoku.js:7-41,77-115
- 原因：`Sudoku` 没有把二维数组裸露给外部随意改写，而是封装了 grid，提供了 move 校验、冲突检测、求解完成判断、`toJSON()`、`toString()` 和 `clone()` 等能力，已经比“把数组直接当领域对象”前进了一步。

### 3. 历史模型简单直接，撤销重做的主路径清晰

- 位置：src/domain/game.js:17-35
- 原因：`Game.guess()` 在写入前保存快照并清空 redo，`undo()`/`redo()` 也都围绕快照恢复展开。虽然目前快照范围偏窄，但主干行为本身是可理解且确定性的。

### 4. 真实游戏流程已经接到领域对象链路上

- 位置：src/components/Modal/Types/Welcome.svelte:16-24; src/node_modules/@sudoku/game.js:12-33; src/components/Controls/Keyboard.svelte:10-25; src/components/Controls/ActionBar/Actions.svelte:27-39; src/components/Board/index.svelte:40-51
- 原因：开始游戏、键盘输入、提示、撤销重做、棋盘渲染都已经通过 `gameModel` 或其派生 store 走向 `Game`/`Sudoku`，没有停留在“domain 只在测试里存在”的状态。这一点满足了作业最核心的“真正接入 Svelte 真实流程”的要求。

## 补充说明

- 本次结论仅基于静态阅读 `src/domain/*`、`src/node_modules/@sudoku/stores/game.js`、`src/node_modules/@sudoku/stores/grid.js` 及直接消费这些 store 的 Svelte 组件；没有运行测试，也没有做运行时交互验证。
- 关于“Hint 在错误/冲突盘面下可能失效”和“Undo/Redo 不会回滚 hints/candidates”等结论，来自对 `solveSudoku(currentGrid)`、`hints.useHint()`、`candidates` store 与 `game.undo()/redo()` 调用链的静态推断。
- 审查范围按要求限制在 `src/domain/*` 及其 Svelte 接入点，没有扩展评价无关目录；外部依赖库本身的正确性不在本次结论范围内。
