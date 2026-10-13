# @airovo/layouts

框架层的布局壳、导航和布局级插槽。

本包负责 `BasicLayout`、`BasicHeader`、`BasicSidebar` 和设置/i18n；面向业务页面的通用框架组件从 `@airovo/components` 导入：

布局系统参考 new-api 的后台工作区模式独立重写，框架负责壳层、导航和视觉偏好，业务包只提供菜单与页面内容。内置 `LayoutSettings` 设置抽屉，可切换侧栏布局、侧栏样式、内容宽度、主题和密度；偏好由 `@airovo/config` / `@airovo/stores` 持久化。

- `LayoutSettings`：统一调整布局和外观偏好的设置抽屉。

这些组件属于框架内置能力，业务包只负责提供领域语义组件。布局包不再承载通用组件，也不再 re-export `@airovo/components`；应用应直接从 `@airovo/components` 导入页面、数据和交互封装。

```vue
<BasicLayoutHost :menus="menus">
  <RouterView />
</BasicLayoutHost>
```

For new-api-style contextual navigation, register optional path-driven sidebar
views. A matching view replaces the root menu, renders a back affordance, and
keeps the same grouping, ordering, active-state and collapsed-dropdown rules:

```ts
import type { SidebarView } from '@airovo/layouts'

const sidebarViews: SidebarView[] = [
  {
    id: 'settings',
    pathPattern: /^\/settings(?:\/|$)/,
    parent: { title: 'Dashboard', url: '/' },
    menus: [
      { title: 'Profile', url: '/settings/profile', group: 'Settings', order: 10 },
      { title: 'Security', url: '/settings/security', group: 'Settings', order: 20 },
    ],
  },
]
```

Pass the registry through `AppShell` or `BasicLayoutHost`:

```vue
<AppShell :sidebar-views="sidebarViews" />
```

The view transition respects `prefers-reduced-motion`; applications that do
not register views continue to render the root `menus` tree unchanged.

Menu entries may be kept visible but unavailable with `disabled: true`. The
framework preserves that state in sorted copies of the menu tree, exposes
`aria-disabled`, removes disabled anchors from the tab order, prevents route
navigation, and applies the primitive disabled opacity in expanded and
collapsed rendering:

```ts
{
  title: 'Restricted settings',
  url: '/settings/restricted',
  disabled: true,
}
```

The Playwright demo and create-app template include a disabled entry in the
contextual view fixture. Their mobile sidebar is opened through the standard
Sidebar trigger so outside dismissal and focus behavior can be checked without
using business routes.

Header 右侧的业务区通过 `business` 插槽提供。默认只显示“开发者菜单”演示文本，框架不会把真实路由菜单复制到 Header；业务应用可以按需放入自己的链接或操作：

```vue
<BasicLayoutHost :menus="menus">
  <template #business>
    <nav class="flex items-center gap-4 text-sm">
      <RouterLink to="/orders">订单</RouterLink>
      <RouterLink to="/reports">报表</RouterLink>
    </nav>
  </template>
</BasicLayoutHost>
```

如果应用提供了完整的 `header` 插槽，该插槽会替换内置 Header，此时由自定义 Header 自己决定业务区内容。

`BasicLayoutHost` 也提供壳层插槽，应用可以替换局部实现而不复制整个布局：

```vue
<BasicLayoutHost :menus="menus">
  <template #header="{ title }">
    <MyHeader :title="title" />
  </template>
  <template #sidebar="{ menus, variant, collapsible }">
    <MySidebar :menus="menus" :variant="variant" :collapsible="collapsible" />
  </template>
  <template #content>
    <RouterView />
  </template>
  <template #footer>
    <AppFooter />
  </template>
</BasicLayoutHost>
```

没有提供这些具名插槽时，框架会使用内置 header、sidebar 和默认内容插槽。路由切换进度由 AppShell 读取框架布局上下文并驱动 `BasicLoadingBar`，应用不需要在每个页面重复处理加载状态。

默认布局读取 `preferences.layout`。路由的 `meta.layout` 仍可对单个页面覆盖，支持 `sidebar`、`mix` 和 `full-content`。

```vue
<PageContainer>
  <template #title>记录</template>
  <DataPanel>
    <DataTable :columns="columns" :data="rows" caption="记录列表">
      <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
    </DataTable>
  </DataPanel>
</PageContainer>
```
