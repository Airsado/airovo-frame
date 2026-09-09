# 路由 + 表单系统逻辑

airovo-frame 内部两个最复杂子系统的完整数据流笔记，方便查阅。

---

## 一、路由系统（3 个文件）

### 1. 路由元数据契约 — `packages/core/router/src/routeTypes.ts`

```ts
interface RouteMeta {
    title?: string       // 菜单名；没 title 就不进侧边栏
    icon?: string        // iconify 名称，如 'lucide:home'
    hideInMenu?: boolean // 注册但不进侧边栏
    active?: boolean     // 标为顶级活动项
    public?: boolean     // auth 守卫放行
    ignoreLayout?: boolean // 渲染时不套 BasicLayout（登录/错误页用）
    // v5 对齐后 permission 包还加：
    roles?: string[]              // 任意
    permissions?: string[]        // 任意
    keepAlive?: boolean           // 多 tab 缓存
    affix?: boolean               // tab 钉住不可关
    hideInTab?: boolean           // 不显示 tab
    requiresAuth?: boolean
    layout?: 'mix' | 'full-content'  // LayoutHost 解析
}
```

`declare module 'vue-router'` 把 `RouteMeta` 合并到 vue-router 全局类型上，所以**任何路由定义的 `meta:` 字段都自动得到这些类型提示**。

### 2. 路由工厂 — `packages/core/router/src/createRouter.ts`

`createAppRouter(options)` 返回 `AirovoRouter`：

| 字段 | 作用 |
|---|---|
| `router` | 原生 vue-router 实例，`app.use(router)` 用 |
| `menus` | `ComputedRef<MenuItem[]>` — 侧边栏菜单的响应式源 |
| `progress` | `Ref<number>` 0-100，LoadingBar 监听 |
| `setPermissionFilter(fn)` | **`installPermission` 调它注入 RBAC 过滤器** |
| `refreshMenus()` | 后端菜单模式时用 |

**核心数据流图**：

```
routes (RouteRecordRaw[])
   │
   ├─→ vue-router createRouter()  ────  router（原生 vue-router）
   │
   ├─→ progress (Ref<number>)     ────  router.beforeEach 启动 startProgress()，30→70→100
   │
   └─→ permissionFilter (Ref)       ←────  installPermission.setPermissionFilter(fn) 注入
         │
         ▼
       menus (ComputedRef<MenuItem[]>)  ←  deriveMenusFromRoutes(routes, '', permissionFilter.value)
                                          每次 roles 变 → permissionFilter.value 变 → menus 重算
```

**`deriveMenusFromRoutes` 关键逻辑**（`createRouter.ts:50-99`）：
- 跳过 `meta.hideInMenu` 的路由
- 用 `permissionFilter` 过滤用户没权限的项（**Sprint 1.1 前是空操作**）
- 处理 `redirect:` 链接
- 递归处理 `children`（子路由）
- 只输出有 `title` 的项

**进度条逻辑**（`createRouter.ts:103-137`）：
- `beforeEach` → `startProgress()`：`progress.value = 30` 立即；200ms 后如果还在跑就 `= 70`
- `afterEach` → `finishProgress()`：`progress.value = 100`；250ms 后重置 `= 0`
- LoadingBar 监听 `progress` ref 自动更新

### 3. 守卫/菜单过滤由 `@airovo/permission` 注入

`installPermission(app, { router, getAuth })` 在 `createApp` 里调用，做三件事：

1. **注册 `v-permission` 指令**：元素上 `v-permission="'sys.user.delete'"` 没权限时 `display: none`
2. **注入 `permissionFilter`**：调 `router.setPermissionFilter(permissionFilter({ hasAccess }))`，从此 `menus` computed 里的 `deriveMenusFromRoutes` 会用它过滤（**关键**：Sprint 1.1 之前这步是空操作）
3. **加 `beforeEach` 守卫**：调 `router.router.beforeEach((to) => ...)`：
   - `to.meta.public` → 放行
   - `allowPrefix` 前缀 → 放行
   - `isLoggedIn === false` → 重定向到 `loginPath?redirect=...`
   - `to.path === loginPath` 且已登录 → 重定向到 `homePath`
   - `store.hasAccess(meta)` 通过 → 放行
   - 否则 → `onDeny ?? { name: 'Forbidden' }`

### 4. `meta.layout` 解析 — `packages/core/layouts/src/basic/LayoutHost.vue`

`App.vue` 用 `<BasicLayoutHost>` 代替 `<BasicLayout>`。`LayoutHost` 读 `route.meta.layout`：

| `meta.layout` | 渲染组件 | 说明 |
|---|---|---|
| `'mix'` | `BasicLayoutMix` | 双列骨架（nav-sidebar + main 插槽） |
| `'full-content'` | `BasicLayoutFullContent` | 无 chrome |
| 其它 / undefined | `BasicLayout`（默认） | 含 header + sidebar |

`App.vue:11-13` 的 `showLayout` computed 检查 `meta.ignoreLayout` —— `true` 时只渲染 `<RouterView />` 不套任何 layout（错误页和登录页通常这么做）。

### 5. `createApp` 装配顺序 — `packages/core/app/src/createApp.ts`

```
createApp({ routeModules, auth, effects, ... })
  ├─ 1.  resolvePreferences(overrides)              ←  框架默认 + app overrides 深合并
  ├─ 2.  createPinia() + piniaPersist               ←  Pinia + 持久化插件
  ├─ 3.  createLayoutsI18n()                       ←  加载 layouts/locales/* 消息
  ├─ 4.  加载 routeModules (import.meta.glob)      ←  遍历每个模块，default 导出 push 到 routes[]
  ├─ 5.  若无 '/' 路由，加 { path:'/', redirect: homePath ?? '/dashboard' }
  ├─ 6.  createAppRouter({ routes, menusMod })    →  router（AirovoRouter）
  ├─ 7.  auth 守卫：if (options.auth) router.router.beforeEach(...)
  ├─ 8.  options.beforeEach：layered 在 auth 之后
  ├─ 9.  createVueApp(root).use(pinia).use(i18n).use(router.router)
  ├─ 10. usePreferencesStore().init()              ←  从 localStorage 恢复偏好
  ├─ 11. useI18nStore().bindExternal()             ←  i18n locale 双向绑定
  ├─ 12. installAdapters(effects)                  ←  Element Plus / Naive UI 动态注入
  ├─ 13. installRequest(app, { baseURL, useStore: useAuthStore 形状 })
  │       axios + 单飞 refresh queue（@airovo/request）
  ├─ 14. installPermission(app, { getAuth, router })
  │       ★ 真正把 permissionFilter 注入 router.setPermissionFilter
  ├─ 15. installTabs(app, { router, defaultTabPath: homePath })
  │       注册 BasicTabBar 全局组件 + router.afterEach 同步 tab
  ├─ 16. app.provide(APP_CONTEXT_KEY, ctx)         ←  useAirovo() composable 源
  ├─ 17. app.config.errorHandler = (err) => console.error('[airovo/app]', err)
  └─ return { app, router, pinia, i18n, mount }
```

**关键点**：`installRequest` 和 `installPermission` 都用 `useAuthStore` 的**形状**（`getAccessToken/getRefreshToken/setTokens/clear`）而不是直接依赖 store —— 通过 `useStore` accessor 在 install 时才读取，保持解耦。

### 路由数据流（一次导航 + 一次登录）

```
用户点菜单 "/dashboard/users"
  ↓
vue-router 触发 beforeEach 链
  ├─ createAppRouter 的 progress beforeEach:    startProgress()  → progress.value = 30
  ├─ options.auth 守卫:                          isLoggedIn === true → 放行
  └─ options.beforeEach:                          (app 自定义)
  ↓
匹配路由 → 渲染对应组件
  ↓
afterEach 链
  ├─ createAppRouter:                             finishProgress() → progress.value = 100
  └─ installPermission 的 sync():                 permissionStore.syncFromAuth()  ←  触发 permissionStore.$subscribe 的 watch
  ↓
LayoutHost 看到 route.meta.layout 变化
  ↓
BasicLayout (默认) / BasicLayoutMix / BasicLayoutFullContent 渲染
  ↓
<RouterView /> 显示具体页面组件
  ↓
useAirovo() composable 通过 inject(APP_CONTEXT_KEY) 拿到 ctx（menus, progress, router）
  ↓
侧边栏渲染：BasicSidebar 用 props.menus (ComputedRef 自动响应) 过滤掉没权限的项
  ↓
LoadingBar 渲染：BasicLoadingBar 监听 progress (Ref<number>)
```

---

## 二、表单系统（4 个文件）

### 1. `useAForm(options)` 入口 — `packages/core/forms/src/index.ts`

```ts
const { api, values, errors, handleSubmit, ... } = useAForm({
    schema: [/* FormFieldSchema[] */],
    validation: z.object({ ... }),
    handleSubmit: (values) => { /* your submit logic */ },
    handleReset: (values) => { /* your reset logic */ },
})
```

`useAForm` 干三件事：
1. `new FormApi(options)` —— 创建 API 实例（含 schema 浅拷贝）
2. 构造 vee-validate 的 `useForm({ validationSchema: toTypedSchema(options.validation) })`
3. `onMounted` 里 `api.mount(formCtx)` —— 把 vee-validate 的 form context 注入 FormApi（启动 watch 同步 errors）

### 2. `FormApi` 类 — `packages/core/forms/src/form-api.ts`

**核心字段**：
- `form: Record<string, any> | null` —— 原始 vee-validate context（null until mount）
- `errors: Ref<Record<string, string>>` —— **关键！** v5 对齐后是真正的 Vue Ref（不再是空操作）
- `schema: FormFieldSchema[]` —— 当前字段定义

**mount(formCtx)** 时建一个 watch（`form-api.ts` mount 方法内）：
```ts
watch(
    () => formCtx.errors?.value ?? formCtx.errors,  // 解包 Ref
    (v) => { this.errors.value = { ...(v ?? {}) } },
    { immediate: true, deep: true },
)
```

**这就是错误显示能从 store 反映到 UI 的根因。** vee-validate 的 errors 是 `ComputedRef`，里面包着 `.value`；外面这个 watch 把 `.value` 解包后赋值到 `this.errors.value`（一个真正的 `Ref`）。AForm 读 `props.api.errors.value` 就能触发模板更新。

**关键 action 签名**（v5 FormActionType 完整表面）：
- 值操作：`getValues()` / `setValues({...})` / `setFieldValue(name, value)`（单字段）
- 验证：`validate()` → `{ valid, errors }` / `validateField(name)` / `clearValid()`
- 重置：`resetForm()` / `resetFields(names?)`
- Schema 动态修改：
  - `updateSchema([{...}])` —— 改现有字段；未知名追加
  - `resetSchema([...])` —— 全替换
  - `appendSchemaByField({...}, 'afterField?')` —— 在某字段后插入
  - `removeSchemaByField('name')` —— 移除
- 运行时 props：`setProps({...})`
- UX：`scrollToField(name)` —— focus + scrollIntoView
- 提交：`submitForm(e?)` —— 失败时自动 `scrollToField(第一个错误字段)`

### 3. `<AForm>` 消费 — `packages/core/forms/src/AForm.vue`

接收 `props.api: FormApi`，干这些事：
- `currentValues = computed(() => props.api.form?.values?.value ?? props.api.form?.values)` —— 解包 vee-validate 的 values
- `formErrors = props.api.errors` —— **直接消费** FormApi 的 Ref（不镜像）
- `hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)` —— 控制顶部错误总览框显隐
- 对每个字段评估 `field.show` / `field.disabled` / `field.componentProps`（v5 inline 函数形式）
- 渲染时把解析好的 props 传给 `<FormFieldRender>`

### 4. `<FormFieldRender>` 单字段渲染 — `packages/core/forms/src/FormFieldRender.vue`

接收 AForm 传来的 props：`field`, `api`, `componentMap`, `currentValues`, `disabled`, `resolvedComponentProps`。

内部用 vee-validate 的 `useField(() => field.fieldName, rule)`：
- `rule` 是从 `field.rules`（Zod）派生的 adapter
- `value` / `errorMessage` / `handleChange` / `handleBlur` 来自 useField

**错误显示（两路取并）**：
```ts
const formError = computed(() => {
    const errors = props.api.form?.errors?.value ?? props.api.form?.errors
    return errors?.[field.fieldName] ?? ''
})
// 模板里：{{ formError || errorMessage }}
```
form-level 错误（schema-level 验证）优先；useField 的 per-field 错误（field.rules 实时校验）兜底。

`<FormMessage>`（shadcn-vue/ui-kit）是给"自定义 field 布局"用的 escape hatch —— 读 form context（inject `airovoFormApi`）按 `for` prop 取错误。

### 完整数据流（一次提交流程）

```
用户点 "提交"
  ↓
AForm.handleSubmit(e) → api.submitForm(e)
  ↓
FormApi.submitForm:
  e.preventDefault()
  await this.form.validate()   ←  vee-validate 跑 zod schema
    │
    ├─ valid: true  → this.latestSubmissionValues = getValues()
    │                  await this.state.handleSubmit?.(values)
    │                  return values
    │
    └─ valid: false → form.errors (ComputedRef) 自动更新
                      ↓ mount 时的 watch 触发 → this.errors.value 更新
                      ↓ scrollToField(Object.keys(errors)[0])
                      return {}  ←  AForm 不显示成功
  ↓
AForm 的 formErrors (props.api.errors) 已更新
  ↓
hasFormErrors computed 重新计算 → true
  ↓
模板里 <div v-if="hasFormErrors"> 渲染
  ↓
<li v-for="(message, field) in formErrors">{{ field }}: {{ message }}</li>

同时 FormFieldRender 的 formError computed 也更新
  ↓
<p v-if="hasError">{{ formError || errorMessage }}</p>  ←  单字段红字
```

### 关键不变量

- **单一数据源**：`FormApi.errors`（Ref）—— 所有错误显示都从这里读
- **单一消费方**：`AForm`（读 form-level 错误总览）+ `FormFieldRender`（读 per-field 错误）
- **没有 watch 镜像**、**没有 props 传递**错误信息 —— 全部走响应式引用

### 早期 bug 模式（已修）

早期版本里 AForm 自己 `watch(() => props.api.form?.errors, ...)` 试图同步 errors 到本地 ref。但 `props.api.form` 是普通对象的属性，**Vue 无法追踪非响应式对象的属性读 ref.value**。结果：watch 永远只跑一次，formErrors 永远是空。

修复路径是**在 FormApi.mount() 内部**建 watch，**让 watch 的依赖追踪进 .value 访问**，然后把结果存入一个真正的 Ref。FormApi 暴露的 `errors` Ref 就是这个修复的体现。

---

## 三、改这两块时的关键陷阱

| 系统 | 陷阱 |
|---|---|
| **路由** | `permissionFilter` 必须放 **Ref** 里（不是普通变量）—— `menus` computed 才会在 `setPermissionFilter` 后重算 |
| **路由** | `meta.layout` 解析在 `LayoutHost` 里；`App.vue` 必须用 `<BasicLayoutHost>` 而非 `<BasicLayout>` |
| **路由** | 错误页路由要 `meta.ignoreLayout: true`（让 `App.vue` 的 `showLayout` 不套 layout） |
| **路由** | `progress` Ref 由 `createAppRouter` 内部管理；app 不要自己设 progress（LoadingBar 自动跟随） |
| **路由** | `AirovoRouter.router` 是原 vue-router 实例，`AirovoRouter.menus/setPermissionFilter` 是框架扩展；混用 `router.beforeEach` 和 `menus` 时记得走对层 |
| **表单** | 改 `FormApi` 时保持 `errors: Ref<...>` 公开（这是 v5 行为契约）；不要换成普通对象 |
| **表单** | 新加字段级错误显示必须从 `api.errors[fieldName]` 读，不要只读 useField 的 `errorMessage`（per-field 实时 vs form-level schema 错误是两路） |
| **表单** | `submitForm` 失败时记得 `scrollToField(第一个错误字段)`（v5 UX 标准） |
| **表单** | `useAForm` 的 `values` 也要解包 `.value`（同 errors 的 Ref 模式） |
| **两者** | 修改任一文件后跑 `pnpm --filter playwright exec vue-tsc --noEmit`（单关卡 typecheck 覆盖整个 framework） |

---

## 四、关键文件清单

| 用途 | 路径 |
|---|---|
| 路由元数据契约 | `packages/core/router/src/routeTypes.ts` |
| 路由工厂 | `packages/core/router/src/createRouter.ts` |
| 路由类型导出 | `packages/core/router/src/index.ts` |
| 权限注入 | `packages/core/permission/src/index.ts` |
| 权限 store | `packages/core/permission/src/store.ts` |
| 权限过滤器 | `packages/core/permission/src/menu-filter.ts` |
| 权限指令 | `packages/core/permission/src/directive.ts` |
| 布局 host | `packages/core/layouts/src/basic/LayoutHost.vue` |
| Mix 布局 | `packages/core/layouts/src/basic/layouts/mix.vue` |
| Full-content 布局 | `packages/core/layouts/src/basic/layouts/full-content.vue` |
| 基础布局 | `packages/core/layouts/src/basic/layout.vue` |
| 布局导出 | `packages/core/layouts/src/basic/index.ts` |
| createApp 装配 | `packages/core/app/src/createApp.ts` |
| 错误页组件 | `packages/core/views/src/FrameworkForbidden.vue` |
| `useAForm` 入口 | `packages/core/forms/src/index.ts` |
| `FormApi` 类 | `packages/core/forms/src/form-api.ts` |
| `AForm` 渲染 | `packages/core/forms/src/AForm.vue` |
| 单字段渲染 | `packages/core/forms/src/FormFieldRender.vue` |
| 表单 schema 类型 | `packages/core/forms/src/types.ts` |
| 错误显示组件 | `packages/ui-kit/shadcn-vue/src/components/ui/form-message/FormMessage.vue` |
| HTTP/WS/SSE | `packages/core/request/src/index.ts` |
| 多 tab | `packages/core/tabs/src/index.ts` |
| 主题偏好 | `packages/core/config/src/preferences/manager.ts` |
