# airovo-frame

pnpm + Turborepo monorepo，提供**零配置**的 Vue 3 框架。业务应用只需
`@import "@airovo/uikit-shadcnui/style.css"`、继承基础 tsconfig 并调用
`defineViteConfig()` —— 路径别名、Tailwind 扫描及工具链全部由框架层托管。

技术栈：**Vue 3 + Vite 8 + Tailwind 4 + shadcn-vue（基于 reka-ui）**，
图标统一通过 `@airovo/shared/icons`（基于 `@iconify/vue`）。

---

## 特性

- **零配置接入** — `defineViteConfig()` + 一行样式导入 + 继承 tsconfig。
- **完整工程栈** — Pinia（持久化）+ vue-router + vue-i18n + vee-validate/zod
  表单 + 主题偏好。
- **统一设计系统** — shadcn-vue 组件**源码直接消费**（无构建步骤），类型严格性贯穿。
- **可组合的包** — `core / ui-kit / effects / design` 按需采纳。
- **第三方 UI 适配** — Element Plus / Naive UI 作为可选 peer 依赖接入。
- **CLI 脚手架** — `pnpm create airovo-app` 一键生成业务应用。

---

## 环境要求

- **Node.js ≥ 18**
- **pnpm 9.15.4**（catalog protocol）。更早版本会在 `catalog:` 声明符上失败。

---

## 快速开始

```bash
pnpm install
pnpm dev          # turbo run dev —— 并行启动所有 apps
pnpm build        # turbo run build —— 按依赖顺序构建
pnpm lint         # turbo run lint —— 每个包执行 ESLint
pnpm format       # prettier --write "**/*.{ts,tsx,md}"
```

创建新业务应用：

```bash
pnpm create airovo-app my-app
```

---

## 目录结构

```
apps/
  playwright/                 ← 演示应用（demo）
packages/
  core/
    app/                      ← createApp() 工厂 —— 业务应用唯一入口
    router/                   ← 薄 vue-router 封装（菜单 + 进度条）
    layouts/                  ← BasicLayout / BasicHeader / BasicSidebar
    views/                    ← 默认 Login / Register / Profile / NotFound / Redirect
    stores/                   ← auth / theme / i18n / preferences（Pinia + persist）
    forms/                    ← useAForm + <AForm>（vee-validate + zod）
    config/                   ← Preferences 类型定义
  ui-kit/shadcn-vue/          ← shadcn-vue 组件，源码直接消费（无构建步骤）
  shared/                     ← icons（@iconify/vue 再导出）+ utils
  effects/                    ← 第三方 UI 适配（element-plus / naive-ui）
  design/                     ← 设计令牌 + Demo 展示
internal/
  vite-config/                ← defineViteConfig 工厂（tsup → dist 消费）
  typescript-config/          ← base.json + vite.json（JSON 配置，无构建）
  eslint-config/              ← 旧式 .eslintrc 配置（ESLint 8）
  create-airovo-app/          ← CLI 脚手架（pnpm create airovo-app）
```

### 依赖方向（无循环）

```
app          → effects, layouts, router, stores, config, views, forms
layouts      → stores, shared, uikit-shadcnui
views        → uikit-shadcnui          （不依赖 stores —— 认证通过路由 props 注入）
forms        → uikit-shadcnui, vee-validate, zod
effects      → stores                  （仅类型）
design       → uikit-shadcnui
router       → vue + vue-router        （leaf）
shared       → @iconify/vue
config       → （无依赖）
```

---

## 核心概念

### `createApp()` 工厂（`packages/core/app`）

业务应用通过一行代码接入框架：

```ts
import { createApp } from '@airovo/app'

await createApp({
    name: 'playwright',
    routeModules: import.meta.glob('./router/routes/modules/*.ts', { eager: true }),
    auth: { useStore: () => useAuthStore() },
    root: App,
    effects: { adapters: ['element-plus'] },
})
```

工厂负责装配 Pinia、i18n、Router、Preferences、路由守卫，以及可选的 effects
适配器。

- `routeModules` 接受 glob map（业务应用在**模块顶层**调用 `import.meta.glob`
  —— Vite 要求静态字面量）。
- `auth.useStore: () => useAuthStore()` 启用内置路由守卫（检查
  `meta.public`，未登录跳转到 `/login?redirect=...`）。
- `effects.adapters` 选择性接入第三方 UI 库。
- `root` 为应用的 `App.vue` 组件。

### `defineViteConfig` 工厂（`internal/vite-config`）

```ts
import { defineViteConfig } from '@airovo/vite-config'
export default defineViteConfig()
```

工厂注入 Vue + Tailwind + 路径别名：

- `#` → `apps/<name>/src`
- `@` → `packages/ui-kit/shadcn-vue/src`（供 shadcn-vue 内部 `@/lib/utils` 使用）

> ⚠️ 通过 tsup 构建 —— 修改 `src/config.ts` 后**必须**运行
> `pnpm --filter @airovo/vite-config build`，否则改动不会生效。

### 源码直连的 ui-kit

`packages/ui-kit/shadcn-vue/package.json` 的 `exports["."]` 直接指向
`./src/index.ts`，**无构建步骤**；Vite 在应用中直接打包源码。应用的 tsconfig
严格性会反向作用于 shadcn-vue 源码（模板类型错误会在应用的 `vue-tsc` 中暴露）。

### Tailwind 扫描（`packages/ui-kit/shadcn-vue/src/styles/globals.css`）

```css
@import "tailwindcss";
@source "../../../../core";   /* 覆盖 packages/core */
```

业务应用只需 `@import "@airovo/uikit-shadcnui/style.css";` 一次。

### pnpm catalog

`pnpm-workspace.yaml` 中的 catalog 统一共享版本号。包清单中引用为
`"<dep>": "catalog:"`。

### Effects 适配器（`packages/effects/src/adapters/`）

Element Plus 和 Naive UI 是**可选 peer dependencies** —— 业务应用自行安装。
适配器使用 `new Function('m', 'return import(m)')(mod)` 动态加载，避开 Vite
的静态导入分析（若包未安装会报错）。

### 视图与 stores 解耦

`@airovo/views`（Login / Register / Profile）**不导入** `@airovo/stores`。
认证函数通过路由 `props` 注入 —— 业务应用在路由配置中传入 `useAuthStore()`
方法。这打破了原本会形成的循环依赖（views → stores → config → router →
views）。

### 表单系统（`packages/core/forms/`）

`useAForm(schema)` 封装 vee-validate + zod。`schema.fields` 描述字段布局，
`schema.validation` 是 Zod schema。

预设工厂：`createLoginSchema()` / `createRegisterSchema()` /
`createChangePasswordSchema()`。

### 偏好系统（`@airovo/config`）

框架默认配置在 `@airovo/config`，应用通过 `apps/*/src/preferences.ts` 覆盖：

```ts
import { defineOverridesPreferences } from '@airovo/config/preferences'

export const appOverrides = defineOverridesPreferences({
    app: { name: 'playwright', homePath: '/dashboard', menusMod: 'frontend' },
    theme: { mode: 'system' },
    locale: { current: 'zh-CN', fallback: 'zh-CN' },
})
```

`usePreferencesStore().applyOverrides(appOverrides)` 在 `main.ts` 中调用，合并
框架默认值与应用覆盖，持久化到 `localStorage`。

### 菜单访问模式（menusMod）

`@airovo/router` 支持三种模式：

| 模式 | 行为 | 适用场景 |
|---|---|---|
| `frontend`（默认） | 仅本地模块声明的菜单 | SPA，菜单完全由前端控制 |
| `backend` | 仅后端 API 返回的菜单 | 权限驱动，按用户角色下发 |
| `mixed` | 本地 + 后端混合，按 `url` 去重，本地优先 | 固定导航 + 动态菜单 |

解析优先级：`RouterOptions.menusMod` > `preferences.app.menusMod` > `'frontend'`。

`@airovo/layouts` 的 `BasicSidebar` 通过 `useRoute()` 自动展开匹配的父级菜单
组（`isInScope`），并用精确匹配（`path === url`）高亮当前项 —— 不会出现父子
同时高亮。

---

## 业务应用结构（最小）

```
apps/my-app/src/
  main.ts          ← createApp({ routeModules, auth, root }) + mount('#app')
  App.vue          ← BasicLayout + RouterView（依 meta.ignoreLayout 条件渲染）
  router/
    routes.ts      ← import.meta.glob('./routes/modules/*.ts')
    routes/modules/
      auth.ts      ← login / register / profile 路由
      dashboard.ts ← 业务路由
  views/
    Login.vue      ← 自定义或从 @airovo/views 导入
    ...
```

---

## 布局 / 滚动模式（关键）

`BasicLayout` 使用垂直 `SidebarProvider`，sticky header + 内容区。**高度链必
须在顶部锁定**，使 `ScrollArea` 成为唯一的滚动容器：

```vue
<div class="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
  <SidebarProvider class="flex h-full flex-col">
    <BasicHeader />
    <div class="flex flex-1 min-h-0">
      <BasicSidebar />
      <SidebarInset>
        <main class="flex min-h-0 flex-1 flex-col">
          <ScrollArea class="flex-1 min-w-0 min-h-0 overflow-x-hidden">
```

规则：

- 滚动元素需要**有固定高度**的祖先（`h-svh`，**不要** `min-h-svh`）；
- 每个 `flex-1` 子项需要 `min-h-0` / `min-w-0`；
- 在 `ScrollArea` 上加 `overflow-x-hidden` 抑制横向滚动。

---

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | `turbo run dev` —— 启动所有应用 |
| `pnpm build` | `turbo run build` —— 按依赖顺序构建 |
| `pnpm --filter playwright dev` | 启动演示应用 |
| `pnpm --filter @airovo/vite-config build` | **修改 `src/config.ts` 后必须重建** |
| `pnpm --filter @airovo/stores test` | 单包 vitest |
| `pnpm --filter @airovo/forms test` | 表单包 vitest |
| `pnpm --filter @airovo/uikit-shadcnui exec shadcn-vue@latest add <component>` | 添加 shadcn-vue 组件 |

---

## 添加 shadcn-vue 组件

```bash
pnpm --filter @airovo/uikit-shadcnui exec shadcn-vue@latest add <component>
```

组件源码直接写入 `packages/ui-kit/shadcn-vue/src/components/ui/`，无需构建
步骤。

---

## 已知问题 / Gotchas

- **`@` 别名冲突** —— 工厂将 `@` → `shadcn-vue/src`（供其内部 `@/lib/utils`
  使用）。业务应用**不应**在 `vite.config.ts` 中覆盖 `@`；请使用 `#`（已提供）。
  演示应用的 `vite.config.ts` 当前未覆盖 `@`（正确）。
- **`vite-config` 需重建** —— `internal/vite-config` 通过 tsup 构建。修改
  `src/config.ts` 后必须 `pnpm --filter @airovo/vite-config build`，否则改动
  不生效。
- **`shadcn-vue/package.json`** 仍列出三个遗留图标库（`@lucide/vue`、
  `lucide-vue-next`、`@radix-icons/vue`）与标准化的 `@iconify/vue` 并存 ——
  待清理。
- **`optimizeDeps.exclude`** 在 `vite-config` 中列出 5 个包，但缺少较新的包
  （`@airovo/app`、`@airovo/forms`、`@airovo/views`、`@airovo/design`）。可能
  对没有相邻 `tsconfig.json` 的包产生 Vite 依赖扫描警告。