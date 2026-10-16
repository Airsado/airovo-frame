# new-api → airovo-frame 组件盘点


- 参考仓库：`QuantumNous/new-api`
- 参考 revision：`a0bf6a8a412764bc296a8e27cf8c4aaa3f3f0ed9`
- 盘点分支：`codex/issue-264-component-inventory`
- 状态枚举：`已存在且行为一致`、`已存在但行为不完整`、`只有 primitive，缺少框架组合`、`完全缺失`、`业务组件，不迁移`
- 范围：框架代码、公共组合组件、demo/template 和文档；`apps/airhaven` 永不进入框架提交。


## 第一批重点盘点


| new-api 源文件 | 组件名称 | airovo 落点 | 当前状态 | 缺口 | 优先级 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| `web/src/components/data-table/**`、`toolbar/view-mode-toggle.tsx`、`layout/card-grid.tsx`、`layout/mobile-card-list.tsx`、`layout/card-row-content.tsx`、`layout/card-cell-utils.ts` | DataTable core/layout/toolbar/hooks/view mode/card grid/mobile list | `packages/core/components/src/data-table` | 已存在但行为不完整 | 已补 ViewModeToggle、DataTableCardGrid、DataTableMobileCardList、DataTablePage 自动 mobile list fallback、共享 rows/columns/loading/error/selection/pagination/sort 契约、DataTableEmpty、new-api 键盘列宽分隔柄和 channels 风格 bordered table surface；仍需静态表格族、服务端 querySync 与完整跨浏览器矩阵 | P0 | 单测、demo、桌面/移动浏览器矩阵 |
| `web/src/components/data-table/static/static-data-table.tsx`、`static-data-table-classnames.ts` | StaticDataTable / static class map | `packages/core/components/src/data-table/StaticDataTable.vue`、`static-data-table-classnames.ts` | 已存在且行为一致 | 已迁移本地数组/children 两种渲染、稳定 row key、row slot/renderRow、空行、长文本 tooltip、属性透传和 compact/action class tokens；Firefox/Safari 视觉矩阵仍需长期核对 | P1 | 单测、demo/template、桌面/移动浏览器矩阵 |
| `web/src/components/json-editor.tsx` | JsonEditor / JsonField | `packages/core/components/src/json-field/JsonField.vue` | 已存在但行为不完整 | 已对齐 new-api 可视化 `space-y-2`、标题/空态/行操作密度、模板 placeholder、对象/数组编辑、模板回填、number 非法值拒绝和 parse-error 保留；仍需更复杂类型推断和完整表单矩阵 | P0 | 单测、表单 demo、键盘/错误/回填浏览器验证 |
| `web/src/components/json-code-editor.tsx` | JsonCodeEditor | `packages/core/components/src/json-field/JsonCodeEditor.vue` | 已存在但行为不完整 | 已对齐 new-api toolbar/surface/disabled token、模板 placeholder、root/textarea form marker，并保留行号层滚动同步、格式化、光标/草稿、剪贴板和错误提示；仍需大文本与跨浏览器矩阵 | P0 | 单测、demo、键盘/剪贴板/非法 JSON 浏览器验证 |
| `web/src/components/layout/components/section-page-layout.tsx` | SectionPageLayout | `packages/core/components/src/section-page/SectionPage.vue` | 已存在但行为不完整 | 已补 sticky title、可选 tabs slot、独立内容滚动层和 footer portal；仍需完整主题/移动键盘矩阵 | P0 | layout 单测、SectionPage 浏览器矩阵 |
| `web/src/components/drawer-layout.ts` | DrawerLayout | `packages/core/components/src/drawer/DrawerLayout.vue` | 已存在但行为不完整 | 已补右侧 `w-3/4`/`sm:max-w-md` 响应式宽度与底部 `mt-24` 间距；header/footer 固定、层级、移动端和焦点恢复仍需长期矩阵核对（Issue #463） | P0 | overlay 单测、桌面/移动浏览器矩阵 |
| `web/src/components/ui/dialog.tsx`、`web/src/components/confirm-dialog.tsx` | Modal / Dialog | `packages/core/components/src/overlay`、`packages/ui-kit/shadcn-vue` | 已存在但行为不完整 | 组合层 API、焦点、Escape/outside、主题 surface 和业务无关性需继续核对 | P0 | overlay 单测、焦点/Escape/outside 浏览器验证 |
| `web/src/components/date-picker.tsx` | DatePicker | `packages/core/components/src/date-picker/DatePicker.vue` | 已存在但行为不完整 | 已补 new-api 默认边界、locale alias/fallback、outside-days、popover trigger ARIA state 和键盘回归；仍需完整 range/disabled 边界、移动密度和 Firefox/Safari 矩阵 | P1 | 单测、demo、Chrome/Edge 键盘与主题验证 |
