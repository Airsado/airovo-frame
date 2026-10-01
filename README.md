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
- **可组合的包** — `core / ui-kit` 按需采纳。
- **CLI 脚手架** — `pnpm create:app` 在本工作区生成业务应用。

---

## 环境要求

- **Node.js 20.19.x（或 ≥22.12.0）**
- **pnpm 9.15.4**（catalog protocol）。更早版本会在 `catalog:` 声明符上失败。

建议用 Corepack 固定包管理器版本：

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm --version       # 9.15.4
```

根目录的 `preinstall` 会拒绝其他 pnpm 版本。脚手架模板使用工作区依赖，
所以 `pnpm create:app <name>` 要在仓库根目录执行，
生成位置为 `apps/<name>`。

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
pnpm create:app my-app
pnpm install
pnpm --filter mock-api dev    # Nitro API，默认 4174；另开终端运行下一行
pnpm --filter my-app dev
```

---

## 目录结构

```
apps/
  playwright/                 ← 框架验收与开发者接入演示
  mock-api/                   ← Nitro mock 服务，供演示应用验收认证和请求链路
app-ui/                       ← 可选的业务级组合与 DIY 扩展层（不放框架组件）
packages/
  core/
    app/                      ← createApp() 工厂 —— 业务应用唯一入口
    router/                   ← 薄 vue-router 封装（菜单 + 进度条）
    layouts/                  ← BasicLayout / BasicHeader / BasicSidebar + 布局级插槽与 i18n
    components/               ← 框架级页面容器、数据展示、选择器、Drawer 等可复用组件
    views/                    ← 默认 Login / Register / Profile / NotFound / Redirect
    stores/                   ← auth / theme / i18n / preferences（Pinia + persist）
    forms/                    ← useForm + <AForm>（vee-validate + zod）
    composables/              ← useModal 与 controller host
    permission/               ← RBAC、菜单过滤、v-permission、PermissionButton
    request/                  ← Axios、Bearer、RequestError 与自注册器
    tabs/                     ← tabs/KeepAlive controller
    config/                   ← Preferences 类型定义
  ui-kit/shadcn-vue/          ← shadcn-vue 组件，源码直接消费（无构建步骤）
  shared/                     ← icons（@iconify/vue 再导出）+ utils
internal/
  vite-config/                ← defineViteConfig 工厂（tsup → dist 消费）
  typescript-config/          ← base.json + vite.json（JSON 配置，无构建）
  eslint-config/              ← 旧式 .eslintrc 配置（ESLint 8）
  create-app/                 ← CLI 脚手架（pnpm create:app）
```

### 依赖方向（无循环）

```
app          → layouts, components, router, stores, config, views, forms,
               request, permission, tabs
app-ui       → public framework APIs for app-owned business composition only
layouts      → router, stores, shared, uikit-shadcnui
components   → uikit-shadcnui, shared, Vue primitives
views        → uikit-shadcnui          （不依赖 stores —— 认证通过路由 props 注入）
forms        → uikit-shadcnui, vee-validate, zod
router       → vue + vue-router        （leaf）
shared       → @iconify/vue
  config       → （无依赖）
```

---

## 核心概念

### `createApp()` 工厂（`packages/core/app`）

业务应用先通过副作用导入注册请求、路由和语言包，再用唯一的 `createApp()` 入口启动：

```ts
import './api/request'
import './router'
import './locales'

import App from './App.vue'
import preferences from './preferences'
import { createApp } from '@airovo/app'

const { mount } = await createApp({ root: App, preferences })
mount('#app')
```

工厂负责创建并安装 Pinia、i18n、Axios、Router、Preferences、认证守卫、权限、tabs
和布局上下文。应用只覆写 `preferences`，业务 API、请求拦截器、认证 handlers、路由
和语言包都留在 `apps/<app>/src`。

`createApp()` 只接收 `{ root, preferences? }`，只返回 `{ mount }`。注册器由应用模块
通过副作用导入消费：`registerRequestSetup()`、`registerSessionRestore()`、
`registerAppRouter()`、`registerAppLocales()`。动态菜单的后端组件路径必须匹配应用
`views` glob 白名单中的 `/views/...` 路径。

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

### 视图与 stores 解耦

`@airovo/views`（Login / Register / Profile）只负责 UI。应用在 `src/views/_core/`
保留默认转发文件，handlers 和 API 位于应用自己的 `src/auth`、`src/api/core`；
开发者可以直接替换这些 view 或业务流程而不修改 `packages/core`。

### 表单系统（`packages/core/forms/`）

页面开发优先使用 tuple/controller API：

```ts
import { useForm } from '@airovo/forms'
import { useModal } from '@airovo/composables'

const [Form, formApi] = useForm({ schema, handleSubmit })
const [Modal, modalApi] = useModal({ title: '编辑' })
```

`useForm`、`useAForm`、`AForm` 与 `FormApi` 共享同一套字段 schema、值、错误和
提交契约。新页面优先使用 tuple/controller 形式的 `useForm`；已有页面可以使用
对象形式的 `useAForm`，两者返回同一个 `FormApi` 实例，不再维护两套行为。
`schema` 描述字段布局，`validation` 可传入 Zod schema。

预设工厂：`createLoginSchema()` / `createRegisterSchema()` /
`createChangePasswordSchema()`。

业务级组件见 [`app-ui/README.md`](app-ui/README.md)。新应用接入步骤见
[`docs/architecture/starter-integration.md`](docs/architecture/starter-integration.md)，
旧 API 迁移表见 [`docs/architecture/api-migration.md`](docs/architecture/api-migration.md)。
主题、i18n、路由、权限、认证、token 和 tabs 接入契约见
[`docs/architecture/framework-capabilities.md`](docs/architecture/framework-capabilities.md)。

### 偏好系统（`@airovo/config`）

框架默认配置在 `@airovo/config`，应用通过 `apps/*/src/preferences.ts` 覆盖：

```ts
import { definePreferences } from '@airovo/config/preferences'

const appPreferences = definePreferences({
    app: { name: 'playwright', homePath: '/dashboard', menusMod: 'frontend' },
    theme: { mode: 'system' },
    locale: { current: 'zh-CN', fallback: 'zh-CN' },
})

export { appPreferences }
export default appPreferences
```

将 `appPreferences` 传给 `createApp({ preferences: appPreferences })`；工厂合并框架
默认值与应用覆盖，偏好 store 持久化到 `localStorage`。

### 菜单访问模式（menusMod）

`@airovo/router` 支持三种模式：

| 模式 | 行为 | 适用场景 |
|---|---|---|
| `frontend`（默认） | 仅本地模块声明的菜单 | SPA，菜单完全由前端控制 |
| `backend` | 仅后端 API 返回的菜单 | 权限驱动，按用户角色下发 |
| `mixed` | 本地 + 后端混合，按 `url` 去重，本地优先 | 固定导航 + 动态菜单 |

应用通过 `preferences.app.menusMod` 选择模式；未覆盖时使用框架默认值 `frontend`。

`@airovo/layouts` 的 `BasicSidebar` 通过 `useRoute()` 自动展开匹配的父级菜单
组（`isInScope`），并用精确匹配（`path === url`）高亮当前项 —— 不会出现父子
同时高亮。

### Nitro mock 服务

`apps/mock-api` 是演示应用使用的独立 Nitro 服务，提供登录、refresh、当前用户、
动态菜单、健康检查和受保护资源接口。它只保存进程内数据，不属于框架运行时，
也不会占用演示应用的 `5174` 端口：

```bash
pnpm --filter mock-api dev             # http://127.0.0.1:4174
pnpm --filter playwright dev            # 默认连接 Nitro，走真实 request/auth 链路
```

演示应用的环境变量按 vben-admin 的方式分层：`.env` 放应用标题和命名空间，
`.env.development` / `.env.production` 放端口、`VITE_GLOB_API_URL`、mock 开关和
路由模式；开发环境的 `/api` 由 Vite 代理到 Nitro。生产构建会生成 `_app.config.js`，部署后可以直接调整
`VITE_GLOB_API_URL` 而不重新构建。启动 mock 服务后，普通
`pnpm --filter playwright dev` 和 `pnpm dev` 都会走真实 Axios、token 刷新和动态菜单。

---

## 业务应用结构（最小）

```
apps/my-app/src/
  main.ts          ← 导入注册模块后 createApp({ root, preferences })
  preferences.ts   ← 覆写框架默认偏好
  App.vue          ← AppShell + 业务 slots
  api/request.ts   ← 应用请求头、解包、错误和 401 刷新
  api/core/        ← 登录、用户、菜单等业务 API
  auth/handlers.ts ← 登录、注册、恢复、重认证和退出
  router/
    index.ts       ← registerAppRouter + 字面量 glob
    routes/modules/
      core.ts      ← login / register / profile / 默认错误页路由
      errors.ts    ← 可选的独立错误页路由
      dashboard.ts ← 业务路由
  views/_core/
    Login.vue      ← 应用级转发入口，默认引入 @airovo/views，可直接自定义
    Register.vue   ← 应用级注册视图入口
    Profile.vue    ← 应用级个人资料视图入口
    ...
```

### 框架组件与 `app-ui` 边界

`packages/core` 提供可跨应用复用的布局、页面容器、数据展示、状态、Modal、表单
和权限组件；这些组件可以直接从对应的 `@airovo/*` 公共包导入。`app-ui` 只用于
开发者组合框架组件、第三方组件和应用自己的业务组件，适合承载接口字段、业务
流程和应用专属视觉调整。将扩展放在 `app-ui` 不会覆盖或修改框架组件。

---

## 布局 / 滚动模式（关键）

`BasicLayout` 使用垂直 `SidebarProvider`，顶部 Header 与侧栏共享背景，内容区以
圆角 inset 工作区呈现。**高度链必
须在顶部锁定**，使内容区滚动节点成为唯一的滚动容器：

```vue
<div class="h-svh overflow-hidden bg-sidebar">
  <SidebarProvider class="flex h-full flex-col">
    <BasicHeader />
    <div class="flex min-h-0 flex-1">
      <BasicSidebar />
      <SidebarInset class="relative z-20 min-h-0 min-w-0 overflow-hidden bg-background">
        <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <slot name="tabs" />
          <div class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <slot name="content" />
          </div>
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
</div>
```

规则：

- 滚动元素需要**有固定高度**的祖先（`h-svh`，**不要** `min-h-svh`）；
- 每个 `flex-1` 子项需要 `min-h-0` / `min-w-0`；
- 内容滚动节点需要 `overflow-x-hidden` 抑制横向滚动。
- tabs 位于内容区域顶部，由 `tabs` 插槽提供；不要给 tabs 添加 `sticky`、`z-30`
  或额外的顶部偏移，避免内容区上方出现空白。

布局提供 `header`、`header-left`、`header-tools`、`header-right`、`business`、
`sidebar`、`tabs`、`content` 和 `footer` 命名插槽。`header-tools` 可以整体替换
默认工具区，`header-right` 用于在默认工具区之后追加应用入口。
Header 默认只放框架工具入口和一段演示业务文本；真实的业务导航、概览或认证入口
应由应用通过 `business` 插槽注入，避免框架替业务应用决定顶部菜单。

---

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | `turbo run dev` —— 同时启动 Nitro mock API 和演示应用 |
| `pnpm build` | `turbo run build` —— 按依赖顺序构建 |
| `pnpm --filter playwright dev` | 启动演示应用 |
| `pnpm --filter mock-api dev` | 启动 Nitro mock API（4174） |
| `pnpm --filter @airovo/vite-config build` | **修改 `src/config.ts` 后必须重建** |
| `pnpm --filter @airovo/stores test` | 单包 vitest |
| `pnpm --filter @airovo/forms test` | 表单包 vitest |
| `pnpm --filter @airovo/uikit-shadcnui exec -- pnpm dlx shadcn-vue@latest add <component>` | 添加 shadcn-vue 基础组件 |

---

## 添加 shadcn-vue 组件

```bash
pnpm --filter @airovo/uikit-shadcnui exec -- pnpm dlx shadcn-vue@latest add <component>
```

组件源码直接写入 `packages/ui-kit/shadcn-vue/src/components/ui/`，无需构建
步骤。这里的 `exec` 只负责进入 ui-kit 包目录，真正的 CLI 由 `pnpm dlx` 临时执行；直接写成 `pnpm ... exec shadcn-vue@latest` 会因为仓库没有安装本地 CLI 而找不到命令。

---

## 已知问题 / Gotchas

- **`@` 别名冲突** —— 工厂将 `@` → `shadcn-vue/src`（供其内部 `@/lib/utils`
  使用）。业务应用**不应**在 `vite.config.ts` 中覆盖 `@`；请使用 `#`（已提供）。
  演示应用的 `vite.config.ts` 当前未覆盖 `@`（正确）。
- **`vite-config` 需重建** —— `internal/vite-config` 通过 tsup 构建。修改
  `src/config.ts` 后必须 `pnpm --filter @airovo/vite-config build`，否则改动
  不生效。
### 应用级请求层扩展

应用在 `src/api/request.ts` 中调用 `registerRequestSetup()`，通过 `hooks` 自定义业务
请求头、响应解包和错误提示，并在同一模块实现 401 单飞刷新。框架只提供唯一 Axios
实例、默认 token 读取、基础请求头和 `RequestError` 标准化；登录、注册、刷新、用户
信息和菜单协议全部属于应用侧 API。
