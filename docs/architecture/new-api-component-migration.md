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
| `components/data-table/core/*`、`layout/*`、`toolbar/*`、`hooks/*` | DataTable 工程化族 | `packages/core/components/src/data-table/*` | 已存在但行为不完整 | 更完整的移动/批量交互矩阵；querySync subscribe、TruncatedCell slot 文本与 ResponsiveCardList selection 已补 | P0 | router/component tests、demo、desktop/mobile browser |
| `components/json-editor.tsx` | JsonField / JsonEditor | `packages/core/components/src/json-field/*` | 已存在但行为不完整 | 已有双模式和回填；需要 FormFieldSchema 组合验证、复杂嵌套编辑和更完整 raw editor | P0 | component tests、MyFormDemo、form submit/reset browser |
| `components/json-code-editor.tsx` | JsonCodeEditor | `packages/core/components/src/json-field/JsonCodeEditor.vue` | 已存在但行为不完整 | FormField 组合、错误保留、光标/缩进、ARIA 和大文本 browser 矩阵 | P1 | utility/component tests、keyboard browser |
| `components/layout/components/section-page-layout.tsx` | SectionPageLayout | `packages/core/components/src/section-page/SectionPage.vue` | 已存在但行为不完整 | sticky 标题和 PageFooterPortal 已补；仍需 tabs/scroll 组合验证 | P0 | component tests、scroll browser |
| `components/ui/drawer.tsx`、`components/drawer-layout.ts` | Drawer / DrawerLayout | `packages/core/components/src/drawer/*`、`packages/core/composables/src/drawer/*` | 已存在但行为不完整 | right side、layout contract 已补；仍需 nested、mobile 和 result contract 矩阵 | P0 | overlay tests、browser focus/escape |
| `components/ui/dialog.tsx`、`components/dialog.tsx` | Dialog / Modal | ui-kit dialog、`packages/core/composables/src/modal/*` | 已存在但行为不完整 | Modal layout class、contentHeight、initialFocus 已补；仍需 close/outside/focus/stack 的完整跨层矩阵 | P1 | overlay tests、browser |
| `components/date-picker.tsx`、`components/datetime-picker.tsx` | DatePicker / DateTimePicker / DatePickerField | `packages/core/components/src/date-picker/*` | 已存在但行为不完整 | range、keyboard、disabled/validation 和 form reset 组合；locale、秒级时间、非原地 Date 合并及 FormField wrapper 已补 | P1 | date-picker tests、form/browser keyboard |
| `components/status-badge.tsx` | StatusBadge / StatusBadgeList | `packages/core/components/src/status-badge/*` | 已存在但行为不完整 | 已补 new-api variant/type/size/copyable/autoColor 和列表组合；仍需跨主题与移动密度矩阵 | P1 | component tests、demo、theme/browser |
| `components/empty-state.tsx`、`components/error-state.tsx`、`components/loading-state.tsx` | Empty/Error/Loading 状态 | `packages/core/components/src/empty-state/*`、DataPanel | 已存在但行为不完整 | EmptyState 已补 new-api 默认图标、标题和 300px 密度；仍需统一状态 API、retry、skeleton 和表格/图表组合 | P0 | component tests、demo |
| `components/table-action.tsx`、`data-table/core/row-action-menu.tsx`、`toolbar/bulk-actions.tsx` | TableAction / RowAction / BulkAction | `DataTableRowActions.vue`、`DataTableBulkActions.vue` | 已存在但行为不完整 | popConfirm、permission、divider、loading、与行操作的完整组合矩阵；RowAction dropdown API 已补齐 | P0 | component tests、table browser |
| `components/ui/chart.tsx`、`features/*/charts` | Chart / ChartCard | ui-kit chart、`packages/core/components/src/chart/*` | 已存在但行为不完整 | 空 dataset 与 loading/error ARIA 已补；仍需 tooltip model、响应式和主题 preset 矩阵 | P1 | chart tests、theme/browser |
| `components/layout/components/app-sidebar.tsx`、`nav-group.tsx`、`nav-link-item.tsx` | Sidebar / NavGroup | `packages/core/layouts/src/basic/sidebar/*` | 已存在但行为不完整 | order 已支持；collapsed parent active 已补，仍需 view drill-in、motion、expanded/collapsed browser 矩阵 | P0 | layout tests、browser |
| `components/data-table/toolbar/view-options.tsx` | ViewOptions / ColumnVisibility | `DataTableViewOptions.vue` | 已存在但行为不完整 | 列宽、固定列、持久化 schema 迁移和无障碍菜单；non-modal dropdown API 已补齐 | P1 | component tests、browser |
| `components/ui/context-menu.tsx`、`tooltip.tsx`、`popover.tsx`、`command.tsx`、`combobox.tsx`、`calendar.tsx` | ContextMenu / Tooltip / Popover / Command / Combobox / Calendar | `packages/ui-kit/shadcn-vue/src/components/ui/*` | ContextMenu 基础与高级 primitive 已存在且已完成 Chrome 右键/键盘/submenu 验证，其余只有 primitive | Tooltip / Popover / Command / Combobox / Calendar 仍需 new-api keyboard/focus/mobile behavior 和业务无关组合 API | P1 | primitive tests、keyboard browser |
| `components/ui/command.tsx` | CommandMenu | `packages/core/components/src/command-menu/*` | 已存在但行为不完整 | 先补业务无关分组、受控打开、搜索、快捷键、选择和键盘组合；异步命令与第三方插件另立 Issue | P1 | component tests、demo/template、keyboard browser |
| `components/ui/combobox.tsx`、`combobox-input.tsx` | Combobox | `packages/core/components/src/select/Combobox.vue` | 已存在但行为不完整 | 已补 label/value 搜索、description/icon、openOnFocus、ARIA/表单属性和 Escape 恢复；仍需多选 chips 与跨浏览器矩阵 | P1 | component tests、demo/template、keyboard browser |

## Primitive 对照

| new-api primitive | ui-kit 当前状态 | 下一步 |
|---|---|---|
| Button / Input / Textarea / Label / Badge / Separator / Skeleton | 已存在 | 补状态和 visual regression，不重复实现 |
| Select / NativeSelect / Dialog / Drawer / Sheet / Tooltip / Popover / Command / ScrollArea | 已存在 | 对照 keyboard、focus、outside、mobile |
| Accordion / Alert / AlertDialog / AspectRatio / Card / Checkbox / Empty / Pagination / Progress / RadioGroup / Slider / Spinner / Switch / Table / Tabs / Toggle / ToggleGroup | 已存在但行为不完整 | 已有公开 API、测试、Demo 和模板；继续补 light/dark、mobile、visual regression 和组合验证 |
| ButtonGroup / ContextMenu / InputGroup / Kbd / Menubar / TagsInput / InputOTP / NumberField | 已存在但行为不完整 | 已有公开 API和基础测试；继续补 keyboard/focus、主题和 browser matrix |
| Carousel / Resizable | 已存在但行为不完整 | Carousel 已补 loop/autoplayInterval；第三方 plugin 仍未迁移；Resizable 已补 `storageKey` 多 panel 持久化，仍需 mobile matrix |
| Calendar / Chart / Field / Form / Item / NativeSelect / Stepper | 已存在或已有近似 | 补框架组合和主题/可访问性验证 |

## 迁移规则

## 当前基线（2026-10-13）

`dev` 已合并 ContextMenu 高级组合、DatePicker 秒级时间、TruncatedCell
slot 文本提取、RowActions/ViewOptions dropdown API、collapsed Sidebar
parent active、PageFooterPortal、ChartCard 空 dataset 状态、Modal/Drawer layout/
initialFocus、ResponsiveCardList mobile selection、Resizable storageKey、
Carousel loop/autoplay 和 DataTable querySync subscribe 等后续增量。
这些能力已有组件测试、demo/template 和部分 Chrome 证据，但完整的
desktop/mobile、light/dark、focus、nested overlay 和业务组合矩阵仍未完成。
未完成差异继续按本表和独立 Issue 管理，不将当前增量宣称为完整迁移。

最近可追溯的框架合并包括：[#167](https://github.com/Airsado/airovo-frame/pull/167)、
[#169](https://github.com/Airsado/airovo-frame/pull/169)、
[#171](https://github.com/Airsado/airovo-frame/pull/171)、
[#173](https://github.com/Airsado/airovo-frame/pull/173)、
[#175](https://github.com/Airsado/airovo-frame/pull/175)、
[#177](https://github.com/Airsado/airovo-frame/pull/177)、
[#179](https://github.com/Airsado/airovo-frame/pull/179)、
[#181](https://github.com/Airsado/airovo-frame/pull/181)、
[#183](https://github.com/Airsado/airovo-frame/pull/183)、
[#185](https://github.com/Airsado/airovo-frame/pull/185)、
[#187](https://github.com/Airsado/airovo-frame/pull/187)、
[#189](https://github.com/Airsado/airovo-frame/pull/189)、
[#191](https://github.com/Airsado/airovo-frame/pull/191)、
[#193](https://github.com/Airsado/airovo-frame/pull/193)、
[#195](https://github.com/Airsado/airovo-frame/pull/195)、
[#197](https://github.com/Airsado/airovo-frame/pull/197)、
[#199](https://github.com/Airsado/airovo-frame/pull/199)。

1. 每个组件族先引用本表中的 new-api 源文件，再创建独立 Issue。
2. 只迁移跨业务可复用的 props、slots、events、状态和组合；渠道、用户、权限、统计接口留在应用层。
3. 不直接复制 React 代码，也不修改 shadcn-vue primitive 来承载业务行为。
4. 每个 PR 必须同步单测、demo、create-app template 和 README/API 文档。
5. `apps/airhaven` 只允许本地验证，永远不加入 commit、push 或 PR。
6. 组件达到 API 冻结、核心状态测试、demo 可操作、类型检查通过后停止；剩余差异另开 Issue。
