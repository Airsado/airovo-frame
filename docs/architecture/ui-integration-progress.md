# UI 与框架整合验收记录

本轮目标是让框架布局对齐 new-api 的壳层体验，并让工程边界采用 vben-admin 风格的
应用自注册方式。new-api 只作为布局和视觉参考；业务页面仍属于应用。

## 已完成

- Header、sidebar、inset 内容区、tabs、唯一滚动容器、加载条和布局插槽已统一到
  `AppShell`/`BasicLayoutHost`。
- Header 的搜索、消息、语言、主题和设置入口由 preferences 独立控制；账户入口由框架默认渲染，应用可通过 AppShell header 插槽替换。
- LayoutSettings 支持主题模式、配色预设、圆角、密度、字体、主色、内容宽度和侧栏
  变体；结构配置不会被旧缓存覆盖。
- `useForm`、`useAForm`、`AForm`、`FormApi` 共享同一字段和错误契约，必填字段显示标记。
- `useModal`、Dialog、Sheet、Drawer、DatePicker、DataTable、权限按钮和
  `v-permission` 作为框架级组件/组合式 API 暴露。
- auth store 只保存 session/token；应用 handlers 负责登录、注册、refresh、用户恢复、
  重认证和退出。
- 框架 request 层只负责唯一 Axios、默认 token/请求头、hooks 和 `RequestError`；应用
  request.ts 负责业务错误提示与 401 单飞刷新。
- `frontend`、`backend`、`mixed` 菜单模式支持 `/views/...` 页面路径白名单、权限过滤、
  动态路由、403 和 tabs/KeepAlive。
- `app-ui` 只保留开发者业务组合，框架组件位于 `packages/core/components`；
  shadcn-vue 继续作为基础组件源码层。
- `internal/create-app/template` 与 `apps/playwright` 使用相同的自注册结构；
  `apps/mock-api` 提供 Nitro 登录、注册、refresh、菜单、用户和受保护资源接口。
- pnpm 固定为 `9.15.4`；旧的第三方适配、设计和脚手架包已清理。

## 验证状态

- 核心包 lint、`git diff --check`、演示应用 `vue-tsc --noEmit` 与 Vite build 通过。
- 本机 4174 Nitro API 已验证：错误登录返回 401，`admin / 123456` 登录、菜单读取、
  受保护接口、access token 过期、refresh 轮换、注册及用户信息恢复可用。
- 核心 Vitest 在受限升级 shell 中通过；默认 Windows 沙箱会因 esbuild/worker 的
  `spawn EPERM` 无法启动它们。5174 浏览器截图与交互验收尚未完成，因此上面的源码
  能力不等同于视觉验收通过。

## 验收边界

暂不扩展第三方组件适配或新的视觉重构。后续应用只需在自己的 `src/api`、`src/auth`、
`src/router`、`src/locales` 和 `preferences.ts` 中注册业务能力即可。
