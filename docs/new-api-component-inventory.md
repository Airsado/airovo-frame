# new-api → airovo-frame 组件盘点

- 参考仓库：`QuantumNous/new-api`
- 参考 revision：`a0bf6a8a412764bc296a8e27cf8c4aaa3f3f0ed9`
- 盘点分支：`codex/issue-264-component-inventory`
- 状态枚举：`已存在且行为一致`、`已存在但行为不完整`、`只有 primitive，缺少框架组合`、`完全缺失`、`业务组件，不迁移`
- 范围：框架代码、公共组合组件、demo/template 和文档；`apps/airhaven` 永不进入框架提交。

## 第一批重点盘点

| new-api 源文件 | 组件名称 | airovo 落点 | 当前状态 | 缺口 | 优先级 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| `web/src/components/data-table/**`、`toolbar/view-mode-toggle.tsx`、`layout/card-grid.tsx`、`layout/card-row-content.tsx` | DataTable core/layout/toolbar/hooks/view mode/card grid | `packages/core/components/src/data-table` | 已存在但行为不完整 | 已补 ViewModeToggle、DataTableCardGrid、DataTablePage 自动 card fallback、table/card 受控与非受控状态及 storage key；仍需逐项核对列尺寸、固定列、服务端查询、跨页选择和 URL 状态 | P0 | 单测、demo、桌面/移动浏览器矩阵 |
| `web/src/components/json-editor.tsx` | JsonEditor / JsonField | `packages/core/components/src/json-field/JsonField.vue` | 已存在但行为不完整 | 已补对象/数组编辑、模板回填、number 非法值拒绝和 parse-error 保留；仍需更复杂类型推断和表单矩阵 | P0 | 单测、表单 demo、键盘/错误/回填浏览器验证 |
| `web/src/components/json-code-editor.tsx` | JsonCodeEditor | `packages/core/components/src/json-field/JsonCodeEditor.vue` | 已存在但行为不完整 | 已补行号层滚动同步、格式化、光标/草稿保留、剪贴板、错误提示和表单属性；仍需大文本与跨浏览器矩阵 | P0 | 单测、demo、键盘/剪贴板/非法 JSON 浏览器验证 |
| `web/src/components/layout/components/section-page-layout.tsx` | SectionPageLayout | `packages/core/components/src/section-page/SectionPage.vue` | 已存在但行为不完整 | 标题固定、tabs 不重复偏移、footer portal、滚动容器和移动间距需持续对照 | P0 | layout 单测、SectionPage 浏览器矩阵 |
| `web/src/components/drawer-layout.ts` | DrawerLayout | `packages/core/components/src/drawer/DrawerLayout.vue` | 已存在但行为不完整 | 右侧/底部尺寸、header/footer 固定、层级、移动端和焦点恢复需逐项核对 | P0 | overlay 单测、桌面/移动浏览器矩阵 |
| `web/src/components/ui/dialog.tsx`、`web/src/components/confirm-dialog.tsx` | Modal / Dialog | `packages/core/components/src/overlay`、`packages/ui-kit/shadcn-vue` | 已存在但行为不完整 | 组合层 API、焦点、Escape/outside、主题 surface 和业务无关性需继续核对 | P0 | overlay 单测、焦点/Escape/outside 浏览器验证 |
| `web/src/components/date-picker.tsx` | DatePicker | `packages/core/components/src/date-picker/DatePicker.vue` | 已存在但行为不完整 | locale、边界日期、键盘、触发器文案和主题视觉需继续对照 | P1 | 单测、demo、键盘/主题浏览器验证 |
| `web/src/components/datetime-picker.tsx` | DateTimePicker | `packages/core/components/src/date-picker/DateTimePicker.vue` | 已存在但行为不完整 | 秒级输入、清除、日期时间合并、移动布局和 invalid 状态需继续对照 | P1 | 单测、表单 demo、键盘/移动浏览器验证 |
| `web/src/components/status-badge.tsx` | StatusBadge | `packages/core/components/src/status-badge` | 已存在但行为不完整 | 已补颜色映射、dot/pulse、copyable、text/underline 类型、dark token 和 copyable focus-visible ring；仍需跨主题与移动密度矩阵 | P1 | 单测、demo、light/dark/键盘浏览器验证 |
| `web/src/components/empty-state.tsx` | EmptyState | `packages/core/components/src/empty-state/EmptyState.vue` | 已存在但行为不完整 | icon、密度、action slot、无障碍和 new-api 空态尺寸需继续对照 | P1 | 单测、demo、light/dark 浏览器验证 |
| `web/src/components/error-state.tsx` | ErrorState | `packages/core/components/src/empty-state/ErrorState.vue` | 已存在但行为不完整 | retry/action 语义、alert/live 区域和错误视觉需继续对照 | P1 | 单测、错误状态 demo、键盘/读屏属性检查 |
| `web/src/components/loading-state.tsx` | LoadingState | `packages/core/components/src/empty-state/LoadingState.vue` | 已存在但行为不完整 | 已对齐 block/inline 密度、尺寸、aria-busy/live、主题动画和 inline 可选 message；仍需 prefers-reduced-motion/主题验证 | P1 | 单测、loading demo、prefers-reduced-motion/主题验证 |
| `web/src/components/table-action.tsx`、`web/src/components/data-table/core/row-action-menu.tsx` | TableAction / RowAction | `packages/core/components/src/data-table/DataTableRowActions.vue` | 已存在但行为不完整 | 需要确认静态 action 与 dropdown action 的统一 API、分隔线、loading、权限回调和 destructive 语义 | P1 | 单测、DataTable demo、键盘/焦点浏览器验证 |
| `web/src/components/data-table/toolbar/bulk-actions.tsx` | BulkAction | `packages/core/components/src/data-table/DataTableBulkActions.vue` | 已存在但行为不完整 | floating/inline 视觉、Escape/箭头、tooltip 和选择语义需继续对照 | P1 | 单测、DataTable 浏览器矩阵 |
| `web/src/components/ui/chart.tsx`、页面 chart compositions | Chart / ChartCard | `packages/core/components/src/chart/ChartCard.vue`、`packages/ui-kit/shadcn-vue/src/components/ui/chart` | 已存在但行为不完整 | 已补 config 驱动 label/color 图例与 chart token fallback、tooltip、空态、加载/错误；仍需跨浏览器 resize 矩阵 | P1 | 单测、图表 demo、light/dark/resize 浏览器验证 |
| `web/src/components/layout/components/app-sidebar.tsx` | Sidebar | `packages/core/layouts`、`packages/ui-kit/shadcn-vue/src/components/ui/sidebar` | 已存在但行为不完整 | collapsed hover/click、active 父子语义、文字颜色、分组/order、移动抽屉需继续对照 | P0 | layout 单测、真实浏览器鼠标/键盘/移动验证 |
| `web/src/components/layout/components/nav-group.tsx` | NavGroup | `packages/core/layouts` | 已存在但行为不完整 | 分组标题、嵌套菜单、父项不误 active、order 和折叠态 tooltip 需继续对照 | P0 | router/layout 单测、真实浏览器验证 |
| `web/src/components/ui/tooltip.tsx` | Tooltip | `packages/core/components/src/overlay/FrameworkTooltip.vue` | 已存在但行为不完整 | delay、disabled、箭头、焦点触发、移动端行为和主题 surface 需继续对照 | P1 | 单测、键盘/hover/focus 浏览器验证 |
| `web/src/components/ui/popover.tsx` | Popover | `packages/core/components/src/overlay/FrameworkPopover.vue` | 已存在但行为不完整 | controlled/uncontrolled、modal、定位、Escape/outside 和移动端需继续对照 | P1 | 单测、键盘/Escape/outside 浏览器验证 |
| `web/src/components/command-menu.tsx`、`web/src/components/ui/command.tsx` | Command | `packages/core/components/src/command-menu`、ui-kit command | 已存在但行为不完整 | 搜索、分组、空态、快捷键、焦点和 top-third surface 需继续对照 | P1 | 单测、demo、键盘浏览器验证 |
| `web/src/components/ui/combobox.tsx` | Combobox | `packages/core/components/src/select/Combobox.vue` | 已存在但行为不完整 | 父子选项、搜索路径、custom value、焦点恢复和 ARIA 需继续对照 | P1 | 单测、select demo、键盘/移动浏览器验证 |
| `web/src/components/ui/calendar.tsx` | Calendar | `packages/core/components/src/calendar/FrameworkCalendar.vue`、ui-kit Calendar | 已存在但行为不完整 | range/disabled/locale、slot 和主题 token 需继续对照 | P1 | 单测、date picker demo、键盘/主题浏览器验证 |

## 源码范围补充盘点

| new-api 源文件 | 组件名称 | airovo 落点 | 当前状态 | 缺口 | 优先级 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| `web/src/components/truncated-text.tsx` | TruncatedText | `packages/core/components/src/data-table/TruncatedText.vue` | 已存在但行为不完整 | 长文本抽取、tooltip、键盘焦点和空值语义需继续对照 | P1 | 单测、DataTable demo、键盘/hover 验证 |
| `web/src/components/data-table/core/truncated-cell.tsx` | TruncatedCell | `packages/core/components/src/data-table/TruncatedCell.vue` | 已存在但行为不完整 | badge/VNode 文本抽取、列宽和 tooltip 内容需继续对照 | P1 | 单测、DataTable 浏览器验证 |
| `web/src/components/multi-select.tsx` | MultiSelect | `packages/core/components/src/select/MultiSelect.vue` | 已存在但行为不完整 | 已补 chip 多选、搜索、disabled、allowCreate、批量输入、maxVisibleChips、hint/icon、copy chip；远程异步搜索和复杂跨浏览器矩阵另立 Issue | P1 | 单测、demo/template、Chrome 交互验证 |
| `web/src/components/layout/components/page-footer.tsx` | PageFooter | `packages/core/components/src/section-page/PageFooter.vue` | 已存在但行为不完整 | sticky/compact、portal host 和移动间距需继续对照 | P2 | 单测、SectionPage 浏览器验证 |
| `web/src/components/config-drawer.tsx` | ConfigDrawer | `packages/core/layouts` / app preference composition | 业务组件，不迁移 | 依赖 new-api 业务偏好和应用状态；仅迁移通用 Drawer/表单/设置项组合能力 | P2 | 记录边界，不迁移业务实现 |
| `web/src/components/layout/components/authenticated-layout.tsx` | AuthenticatedLayout | `packages/core/layouts` / `packages/core/app` | 业务组件，不迁移 | 依赖 new-api 认证和业务导航；只保持 AppShell/layout 合同 | P2 | 记录边界，不迁移业务实现 |
| `web/src/components/layout/components/chat-presets-item.tsx` | ChatPresetsItem | 无 | 业务组件，不迁移 | 依赖聊天业务数据和交互 | P3 | 记录边界，不迁移业务实现 |
| `web/src/components/model-group-selector.tsx` | ModelGroupSelector | 无 | 业务组件，不迁移 | 依赖模型业务和渠道数据 | P3 | 记录边界，不迁移业务实现 |

## 统一组件验收清单

每个后续组件 Issue/PR 必须逐项报告：

- API：props、emits、slots、默认值和受控/非受控语义
- 状态：disabled、loading、empty、error、active、hover、focus-visible
- 交互：鼠标、键盘、Escape、outside click、焦点进入和恢复
- 布局：desktop、mobile、折叠、滚动容器和层级
- 主题：light、dark、theme preset、颜色 token、focus ring、radius、density
- 可访问性：role、aria-label、aria-controls、aria-expanded、aria-invalid、live region
- 组合：与 Form、Modal、Drawer、Tabs、DataTable 的实际组合
- 交付：单元测试、边界测试、demo、create-app template、README/API 文档
- 差异：明确记录尚未验证的维度和后续 Issue，不在当前 PR 无限扩展

## 框架边界

- 组件代码只能进入 `packages/core`、`packages/ui-kit` 和必要的 demo/template/docs。
- `app-ui` 只放业务扩展。
- `apps/airhaven` 仅用于本地验证，不能提交、推送或进入 PR。
- 不迁移 new-api 的业务页面、渠道 API、用户 API、权限业务规则。

## 2026-10-15 证据快照

以下结果来自当前 `dev` 工作区和 new-api revision
`a0bf6a8a412764bc296a8e27cf8c4aaa3f3f0ed9`。快照记录已验证事实，不代表整张盘点表已经完成迁移。

### 自动化验证

| 命令 | 结果 |
| --- | --- |
| `pnpm lint` | 通过；全仓 22 个 lint task 完成 |
| `pnpm --filter @airovo/components test` | 通过；60 个测试文件、177 个测试 |
| `pnpm --filter @airovo/forms test` | 通过；5 个测试文件、55 个测试 |
| `pnpm --filter @airovo/layouts test` | 通过；6 个测试文件、15 个测试 |
| `pnpm --filter @airovo/router test` | 通过；2 个测试文件、21 个测试 |
| `pnpm --filter @airovo/stores test` | 通过；3 个测试文件、13 个测试 |
| `pnpm --filter playwright build` | 通过；保留既有 `@theme`、Rolldown annotation、chunk size 警告 |
| `pnpm build` | 通过；playwright、mock-api、airhaven 本地构建均完成，未提交 airhaven 产物 |

### 浏览器矩阵

Chrome 和 Edge 均使用本机可执行文件运行，demo 地址为
`http://127.0.0.1:5290`：

- `verify:primitives`：Calendar、Command、Combobox、dark、mobile 通过；Chrome 与 Edge 均通过。
- `verify:overlays`：Dialog、Drawer、右侧 Drawer、mobile Escape、focus 通过；Chrome 与 Edge 均通过。
- `verify:sidebar`：展开/折叠、active/hover/focus/disabled、dropdown Escape、主题、mobile Sheet 通过；Chrome 与 Edge 均通过。
- `verify:sectionpage`：sticky title、tabs、footer portal、长滚动、light/dark、320×844 通过；Chrome 与 Edge 均通过。
- `verify:datatable`：桌面、选择、ViewOptions、暗色、移动卡片通过；Chrome 与 Edge 均通过。
- `verify:json-form`：自定义 FormField、非法草稿保留、validate、reset 通过；Chrome 与 Edge 均通过。

### 仍未验证的范围

- Firefox、Safari 及其特有的 focus/portal/scroll 行为。
- 复杂嵌套 overlay 的跨层 focus stack、第三方浏览器差异。
- DataTable 全量服务端过滤/排序/取消请求在真实业务网络下的长时间并发行为。
- 业务应用组合、权限语义和真实生产数据；这些属于应用层验证，不进入框架 PR。

## 2026-10-15 continuation evidence

The following framework-only increments are merged into `dev` after the prior
snapshot: [#338](https://github.com/Airsado/airovo-frame/pull/338)
MultiSelect chips/input, [#340](https://github.com/Airsado/airovo-frame/pull/340)
Combobox input group, [#342](https://github.com/Airsado/airovo-frame/pull/342)
DateTimePicker row visuals, [#344](https://github.com/Airsado/airovo-frame/pull/344)
FrameworkTooltip trigger/surface, [#346](https://github.com/Airsado/airovo-frame/pull/346)
FrameworkPopover trigger/surface,
[#348](https://github.com/Airsado/airovo-frame/pull/348) DataTable row surfaces,
[#350](https://github.com/Airsado/airovo-frame/pull/350) DataTable density,
[#352](https://github.com/Airsado/airovo-frame/pull/352) SelectBox surface,
[#354](https://github.com/Airsado/airovo-frame/pull/354) SearchSelect input,
[#356](https://github.com/Airsado/airovo-frame/pull/356) collapsed sidebar child
surface, and [#358](https://github.com/Airsado/airovo-frame/pull/358)
DataTableToolbar search surface, and [#365](https://github.com/Airsado/airovo-frame/issues/365)
DataTableViewModeToggle with table/card persistence.

### Current automated evidence

| Command | Result |
| --- | --- |
| `pnpm lint` | Passed; all 22 workspace lint tasks |
| `pnpm --filter @airovo/components test` | Passed; 66 test files, 192 tests |
| `pnpm --filter @airovo/layouts test` | Passed; 6 test files, 15 tests |
| `pnpm --filter playwright exec vue-tsc --noEmit` | Passed |
| `pnpm build` | Passed; existing LightningCSS `@theme`, Rolldown annotation, and chunk-size warnings remain |

Recent Chrome evidence includes the DataTable matrix (desktop selection,
ViewOptions, dark theme and mobile cards), Sidebar matrix (collapsed dropdown
active states, reduced motion, mobile Sheet/Escape/outside), SelectBox and
SearchSelect desktop/mobile selection, overlay click/Escape/outside/focus, and
the DateTimePicker, Tooltip and Popover targeted demos. These targeted checks
were run against temporary local demo ports and are evidence for the listed
surfaces only; they do not mark the inventory complete.

Firefox and Safari remain unverified. Long-running server-side DataTable
concurrency, complex nested overlay stacks, and real business application
composition remain outside framework completion evidence. `apps/airhaven` was
not changed or included in these increments.
