# @airovo/request

Unified HTTP client for airovo-frame. Wraps a single axios instance with
auth interceptors (Bearer token, single-flight 401 refresh) and exposes
WebSocket / SSE composables as side benefits.

## Install

```ts
import { createApp } from '@airovo/app'
import { useAuthStore } from '@airovo/stores/auth'
import { installRequest } from '@airovo/request'

const { app } = await createApp({ /* ... */ })

installRequest(app, {
    baseURL: import.meta.env.VITE_API_BASE ?? '/api',
    useStore: () => ({
        getAccessToken: () => useAuthStore().accessToken,
        getRefreshToken: () => useAuthStore().refreshToken,
        setTokens: (t) => useAuthStore().setTokens(t),
        clear: () => useAuthStore().clearAuth(),
    }),
})
```

## Use

In a component or composable:

```ts
import { useRequest } from '@airovo/request'

const http = useRequest()
const { data } = await http.get('/users')
```

In a Pinia store, prefer `inject(REQUEST_KEY)` from `@airovo/request` so
the dependency on Vue is explicit.

## Error handling

All non-2xx responses throw a `RequestError`:

```ts
import { RequestError } from '@airovo/request'

try {
    await http.post('/login', payload)
} catch (e) {
    if (e instanceof RequestError) {
        console.error(e.httpStatus, e.code, e.message)
    }
}
```

## Realtime (bonus)

```ts
import { useWebSocket, useEventSource } from '@airovo/request'

const ws = useWebSocket({ url: 'wss://example.com/echo', onMessage: (m) => console.log(m) })
const sse = useEventSource({ url: '/api/events', eventName: 'tick' })
```
