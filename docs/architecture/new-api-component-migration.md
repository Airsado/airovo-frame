# new-api → airovo-frame 组件迁移盘点

这份表是长期迁移的范围基线。new-api 只作为行为和交互参考，airovo-frame 使用 Vue 3、TypeScript、Reka UI 和 shadcn-vue 重新实现。`apps/airhaven` 只用于本地业务验证，不进入框架提交。

状态含义：

- **已存在且行为一致**：API、主要状态和组合方式已经足够接近。
- **已存在但行为不完整**：已有实现，但缺少 new-api 关键行为或工程化状态。
- **只有 primitive，缺少框架组合**：底层控件存在，页面级复用能力不足。
- **完全缺失**：当前没有可复用的框架实现。
- **业务组件，不迁移**：只保留在 new-api 业务 feature，不抽入框架。

## 第一批组件族

| new-api 源文件 | 组件名称 | airovo 落点 | 当前状态 | 主要缺口 | 优先级 | 验证方式 |
|---|---|---|---|---|---|---|
| `components/data-table/core/*`、`layout/*`、`toolbar/*`、`hooks/*` | DataTable 工程化族 | `packages/core/components/src/data-table/*` | 已存在但行为不完整 | URL/query 状态和更完整的移动/批量交互矩阵；TruncatedCell 已补自定义 slot 文本提取 | P0 | router/component tests、demo、desktop/mobile browser |
| `components/json-editor.tsx` | JsonField / JsonEditor | `packages/core/components/src/json-field/*` | 已存在但行为不完整 | 已有双模式和回填；需要 FormFieldSchema 组合验证、复杂嵌套编辑和更完整 raw editor | P0 | component tests、MyFormDemo、form submit/reset browser |
| `components/json-code-editor.tsx` | JsonCodeEditor | `packages/core/components/src/json-field/JsonCodeEditor.vue` | 已存在但行为不完整 | FormField 组合、错误保留、光标/缩进、ARIA 和大文本 browser 矩阵 | P1 | utility/component tests、keyboard browser |
| `components/layout/components/section-page-layout.tsx` | SectionPageLayout | `packages/core/components/src/section-page/SectionPage.vue` | 已存在但行为不完整 | sticky 标题和 PageFooterPortal 已补；仍需 tabs/scroll 组合验证 | P0 | component tests、scroll browser |
| `components/ui/drawer.tsx`、`components/drawer-layout.ts` | Drawer / DrawerLayout | `packages/core/components/src/drawer/*`、`packages/core/composables/src/drawer/*` | 已存在但行为不完整 | right side 已支持；需补 layout composition、focus、nested、mobile 和 result contract 矩阵 | P0 | overlay tests、browser focus/escape |
| `components/ui/dialog.tsx`、`components/dialog.tsx` | Dialog / Modal | ui-kit dialog、`packages/core/composables/src/modal/*` | 已存在但行为不完整 | 与 new-api close/outside/focus/stack 状态的完整对照 | P1 | overlay tests、browser |
| `components/date-picker.tsx`、`components/datetime-picker.tsx` | DatePicker / DateTimePicker | `packages/core/components/src/date-picker/*` | 已存在但行为不完整 | range、keyboard、disabled/validation 和 form reset 组合；本轮已补 locale 文本、秒级时间和非原地 Date 合并 | P1 | date-picker tests、browser keyboard |
| `components/status-badge.tsx` | StatusBadge | `packages/core/components/src/status-badge/*` | 已存在且行为一致 | 补 auto-color、copyable 等 new-api 业务差异时另立 Issue | P1 | component tests、theme browser |
| `components/empty-state.tsx`、`components/error-state.tsx`、`components/loading-state.tsx` | Empty/Error/Loading 状态 | `packages/core/components/src/empty-state/*`、DataPanel；Error/Loading 暂无独立导出 | 已存在但行为不完整 | 统一状态 API、retry、skeleton 和表格/图表组合 | P0 | component tests、demo |
| `components/table-action.tsx`、`data-table/core/row-action-menu.tsx`、`toolbar/bulk-actions.tsx` | TableAction / RowAction / BulkAction | `DataTableRowActions.vue`、`DataTableBulkActions.vue` | 已存在但行为不完整 | popConfirm、permission、divider、loading、与行操作的完整组合矩阵；RowAction dropdown API 已补齐 | P0 | component tests、table browser |
| `components/ui/chart.tsx`、`features/*/charts` | Chart / ChartCard | ui-kit chart、`packages/core/components/src/chart/*` | 已存在但行为不完整 | 空 dataset 与 loading/error ARIA 已补；仍需 tooltip model、响应式和主题 preset 矩阵 | P1 | chart tests、theme/browser |
| `components/layout/components/app-sidebar.tsx`、`nav-group.tsx`、`nav-link-item.tsx` | Sidebar / NavGroup | `packages/core/layouts/src/basic/sidebar/*` | 已存在但行为不完整 | order 已支持；collapsed parent active 已补，仍需 view drill-in、motion、expanded/collapsed browser 矩阵 | P0 | layout tests、browser |
| `components/data-table/toolbar/view-options.tsx` | ViewOptions / ColumnVisibility | `DataTableViewOptions.vue` | 已存在但行为不完整 | 列宽、固定列、持久化 schema 迁移和无障碍菜单；non-modal dropdown API 已补齐 | P1 | component tests、browser |
| `components/ui/context-menu.tsx`、`tooltip.tsx`、`popover.tsx`、`command.tsx`、`combobox.tsx`、`calendar.tsx` | ContextMenu / Tooltip / Popover / Command / Combobox / Calendar | `packages/ui-kit/shadcn-vue/src/components/ui/*` | ContextMenu 已有基础与高级 primitive，其余只有 primitive | ContextMenu 仍需 Chrome 右键、键盘和 submenu 验证；其他控件需要 new-api keyboard/focus/mobile behavior 和业务无关组合 API | P1 | primitive tests、keyboard browser |

## Primitive 对照

| new-api primitive | ui-kit 当前状态 | 下一步 |
|---|---|---|
| Button / Input / Textarea / Label / Badge / Separator / Skeleton | 已存在 | 补状态和 visual regression，不重复实现 |
| Select / NativeSelect / Dialog / Drawer / Sheet / Tooltip / Popover / Command / ScrollArea | 已存在 | 对照 keyboard、focus、outside、mobile |
| Accordion / Alert / AlertDialog / AspectRatio / Card / Checkbox / Empty / Pagination / Progress / RadioGroup / Slider / Spinner / Switch / Table / Tabs / Toggle / ToggleGroup | 已存在但行为不完整 | 已有公开 API、测试、Demo 和模板；继续补 light/dark、mobile、visual regression 和组合验证 |
| ButtonGroup / ContextMenu / InputGroup / Kbd / Menubar / TagsInput / InputOTP / NumberField | 已存在但行为不完整 | 已有公开 API和基础测试；继续补 keyboard/focus、主题和 browser matrix |
| Carousel / Resizable | 已存在但行为不完整 | 核心 scroll-snap/pointer contract 已有；继续补 loop/plugin、多 panel 持久化和 mobile matrix |
| Calendar / Chart / Field / Form / Item / NativeSelect / Stepper | 已存在或已有近似 | 补框架组合和主题/可访问性验证 |

## 迁移规则

## 当前基线（2026-10-12）

`dev` 已公开并合并了 Accordion、Alert、AlertDialog、AspectRatio、Card、
Empty、Pagination、Table、Slider、Spinner、Toggle、ButtonGroup、Menubar、
Carousel、Resizable 以及 JsonCodeEditor 基础实现。
这些 primitive 的 API、基础状态和 Demo 已有证据，但这不代表
桌面/移动、light/dark、focus 和所有业务组合矩阵都已完成；这些差异继续
作为后续验证任务管理。Resizable 的多 panel 持久化、Carousel 的 loop/plugin
能力以及更复杂的 submenu/checkbox menu 组合仍未迁移。

1. 每个组件族先引用本表中的 new-api 源文件，再创建独立 Issue。
2. 只迁移跨业务可复用的 props、slots、events、状态和组合；渠道、用户、权限、统计接口留在应用层。
3. 不直接复制 React 代码，也不修改 shadcn-vue primitive 来承载业务行为。
4. 每个 PR 必须同步单测、demo、create-app template 和 README/API 文档。
5. `apps/airhaven` 只允许本地验证，永远不加入 commit、push 或 PR。
6. 组件达到 API 冻结、核心状态测试、demo 可操作、类型检查通过后停止；剩余差异另开 Issue。
