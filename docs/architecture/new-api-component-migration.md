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
| `components/data-table/core/*`、`layout/*`、`toolbar/*`、`hooks/*` | DataTable 工程化族 | `packages/core/components/src/data-table/*` | 已存在但行为不完整 | 截断单元格、URL/query 状态和更完整的移动/批量交互矩阵 | P0 | router/component tests、demo、desktop/mobile browser |
| `components/json-editor.tsx` | JsonField / JsonEditor | `packages/core/components/src/json-field/*` | 已存在但行为不完整 | 已有双模式和回填；需要 FormFieldSchema 组合验证、复杂嵌套编辑和更完整 raw editor | P0 | component tests、MyFormDemo、form submit/reset browser |
| `components/json-code-editor.tsx` | JsonCodeEditor | 暂无 | 完全缺失 | 格式化、错误保留、光标/缩进、ARIA 和大文本编辑 | P1 | utility tests、keyboard browser |
| `components/layout/components/section-page-layout.tsx` | SectionPageLayout | `packages/core/components/src/section-page/SectionPage.vue` | 已存在但行为不完整 | sticky 标题刚补入；需补 footer/slot 语义和 tabs/scroll 组合验证 | P0 | component tests、scroll browser |
| `components/ui/drawer.tsx`、`components/drawer-layout.ts` | Drawer / DrawerLayout | `packages/core/components/src/drawer/*`、`packages/core/composables/src/drawer/*` | 已存在但行为不完整 | right side 已支持；需补 layout composition、focus、nested、mobile 和 result contract 矩阵 | P0 | overlay tests、browser focus/escape |
| `components/ui/dialog.tsx`、`components/dialog.tsx` | Dialog / Modal | ui-kit dialog、`packages/core/composables/src/modal/*` | 已存在但行为不完整 | 与 new-api close/outside/focus/stack 状态的完整对照 | P1 | overlay tests、browser |
| `components/date-picker.tsx`、`components/datetime-picker.tsx` | DatePicker / DateTimePicker | `packages/core/components/src/date-picker/*` | 已存在但行为不完整 | locale、range、keyboard、disabled/validation 和 form reset 组合 | P1 | date-picker tests、browser keyboard |
| `components/status-badge.tsx` | StatusBadge | `packages/core/components/src/status-badge/*` | 已存在且行为一致 | 补 auto-color、copyable 等 new-api 业务差异时另立 Issue | P1 | component tests、theme browser |
| `components/empty-state.tsx`、`components/error-state.tsx`、`components/loading-state.tsx` | Empty/Error/Loading 状态 | `packages/core/components/src/empty-state/*`、DataPanel；Error/Loading 暂无独立导出 | 已存在但行为不完整 | 统一状态 API、retry、skeleton 和表格/图表组合 | P0 | component tests、demo |
| `components/table-action.tsx`、`data-table/core/row-action-menu.tsx`、`toolbar/bulk-actions.tsx` | TableAction / RowAction / BulkAction | `DataTableRowActions.vue`、`DataTableBulkActions.vue` | 已存在但行为不完整 | popConfirm、permission、divider、loading、与行操作的完整组合矩阵 | P0 | component tests、table browser |
| `components/ui/chart.tsx`、`features/*/charts` | Chart / ChartCard | ui-kit chart、`packages/core/components/src/chart/*` | 已存在但行为不完整 | 已有 ChartCard；需补 tooltip model、empty/loading/error、响应式和主题 preset 矩阵 | P1 | chart tests、theme/browser |
| `components/layout/components/app-sidebar.tsx`、`nav-group.tsx`、`nav-link-item.tsx` | Sidebar / NavGroup | `packages/core/layouts/src/basic/sidebar/*` | 已存在但行为不完整 | order 已支持；需补 view drill-in、motion、parent/child active、collapsed dropdown 验证 | P0 | layout tests、browser |
| `components/data-table/toolbar/view-options.tsx` | ViewOptions / ColumnVisibility | `DataTableViewOptions.vue` | 已存在但行为不完整 | 列宽、固定列、持久化 schema 迁移和无障碍菜单 | P1 | component tests、browser |
| `components/ui/tooltip.tsx`、`popover.tsx`、`command.tsx`、`combobox.tsx`、`calendar.tsx` | Tooltip / Popover / Command / Combobox / Calendar | `packages/ui-kit/shadcn-vue/src/components/ui/*` | 只有 primitive，缺少框架组合 | new-api keyboard/focus/mobile behavior 和业务无关组合 API | P1 | primitive tests、keyboard browser |

## Primitive 对照

| new-api primitive | ui-kit 当前状态 | 下一步 |
|---|---|---|
| Button / Input / Textarea / Label / Badge / Separator / Skeleton | 已存在 | 补状态和 visual regression，不重复实现 |
| Select / NativeSelect / Dialog / Drawer / Sheet / Tooltip / Popover / Command / ScrollArea | 已存在 | 对照 keyboard、focus、outside、mobile |
| Accordion / Alert / AlertDialog / AspectRatio / Card / Checkbox / Progress / RadioGroup / Switch / Tabs / Table | 部分缺失 | 以 ui-kit primitive Issue 分批补齐 |
| ButtonGroup / Combobox / ContextMenu / InputGroup / Kbd / Menubar / Resizable / Slider / Spinner / Toggle / ToggleGroup | 缺失或未公开 | 评估 Reka UI primitive 后分别建立 Issue |
| Calendar / Chart / Field / Form / Item / NativeSelect / Stepper | 已存在或已有近似 | 补框架组合和主题/可访问性验证 |

## 迁移规则

1. 每个组件族先引用本表中的 new-api 源文件，再创建独立 Issue。
2. 只迁移跨业务可复用的 props、slots、events、状态和组合；渠道、用户、权限、统计接口留在应用层。
3. 不直接复制 React 代码，也不修改 shadcn-vue primitive 来承载业务行为。
4. 每个 PR 必须同步单测、demo、create-app template 和 README/API 文档。
5. `apps/airhaven` 只允许本地验证，永远不加入 commit、push 或 PR。
6. 组件达到 API 冻结、核心状态测试、demo 可操作、类型检查通过后停止；剩余差异另开 Issue。
