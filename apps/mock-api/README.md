# Framework mock API

这是一个独立的 Nitro 服务，只提供框架验收所需的认证、刷新、登出、当前用户、受保护请求和动态菜单接口。它不包含业务页面，也不复用 playwright 的页面状态。

## 运行

```bash
pnpm --filter mock-api dev
```

默认读取 `apps/mock-api/.env`（可从 `.env.example` 复制），监听
`NITRO_HOST` 和 `NITRO_PORT` 指定的地址，默认是
`http://127.0.0.1:4174`。例如：

```dotenv
NITRO_HOST=127.0.0.1
NITRO_PORT=4174
```

健康检查：

```text
GET http://127.0.0.1:4174/health
```

playwright 默认使用 mock API，另开终端运行：

```bash
pnpm --filter mock-api dev
pnpm --filter playwright dev
```

演示应用的标题、命名空间、mock 开关、API 地址和 Vite 端口按 vben-admin
的方式分布在 `apps/playwright/.env`、`.env.development` 和
`.env.production`。开发环境默认使用
`VITE_GLOB_API_URL=/api`，由 Vite 开发代理转发到 `http://127.0.0.1:4174`，因此请求会经过框架真实 Axios/auth/request
层。将 `VITE_GLOB_API_URL` 改成其他兼容 REST 服务即可切换后端。

## 账号

默认账号：`admin / 123456`。

## 接口

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/health` | 服务健康检查 |
| `POST` | `/auth/login` | 登录并签发 access/refresh token |
| `POST` | `/auth/register` | 注册内存用户并登录 |
| `POST` | `/auth/refresh` | 校验并轮换 refresh token |
| `POST` | `/auth/logout` | 撤销 refresh/access 会话 |
| `GET` | `/auth/me` | 使用 Bearer token 获取当前用户 |
| `GET` | `/demo/protected/:resource` | 用于触发 401/单飞刷新验收 |
| `GET` | `/menus` | 使用 Bearer token 返回 `/views/...` 页面路径的动态菜单示例 |
| `GET` | `/demo/events` | SSE 进度、消息、心跳、完成/失败和 `lastEventId` 重放演示（演示端点不要求认证） |

`/demo/events` deliberately has no authentication requirement. This keeps the
native `EventSource` showcase independent from an Authorization header, which
the browser API cannot set. A real application must keep its authentication
choice in `src/api` (cookie, an explicitly allowed query token, or an injected
fetch/stream factory); this mock endpoint is not a production security model.

认证失败仍使用 HTTP 错误状态，并在 Nitro 错误体的 `data` 中返回稳定的业务码，方便前端按业务码做 i18n 映射：

| 场景 | HTTP | `data.code` |
| --- | ---: | --- |
| 登录凭据错误 | 401 | `INVALID_CREDENTIALS` |
| 注册用户名已存在 | 400 | `USERNAME_EXISTS` |

数据存储在进程内，服务重启后会恢复为默认 admin 用户。CORS 仅用于本机 playground 验收，生产环境不要直接复用。
