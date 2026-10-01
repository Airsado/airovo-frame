# @airovo/request

`@airovo/request` owns the single Axios instance created by `createApp()`. The
application registers its transport policy before startup and receives the
client from `getRequestClient()` in its API modules.

```ts
// src/api/request.ts
import { registerRequestSetup } from '@airovo/app'
import { appConfig } from '../config/env'

registerRequestSetup({
  baseURL: appConfig.apiURL,
  hooks: {
    onRequest(config) {
      config.headers.set('X-App-Client', 'demo')
      return config
    },
    onError(context) {
      console.error(context.message)
      return false
    },
  },
  setup({ client }) {
    // Add application interceptors or a mock adapter here.
    void client
  },
})
```

The framework adds the access token and normalizes failures to `RequestError`.
Applications own endpoint paths, response envelopes, error text, 401 single
flight refresh and refresh-failure navigation. `registerSessionRestore()` is
used for the hard-refresh flow. API modules call `getRequestClient()` and do
not create another Axios instance.

Realtime helpers are also exported as `useWebSocket` and `useEventSource`.
