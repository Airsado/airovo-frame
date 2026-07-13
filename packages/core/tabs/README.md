# @airovo/tabs

vben-style multi-tab system. Renders a horizontal tab strip with per-tab
actions, persists open tabs to localStorage, and keeps component
identities for KeepAlive caching.

## Install

```ts
import { createApp } from '@airovo/app'
import { installTabs } from '@airovo/tabs'

const { app, router } = await createApp({ /* ... */ })

installTabs(app, { router: router.router, defaultTabPath: '/dashboard' })
```

## Mount the tab bar

In your app's `App.vue`, slot `BasicTabBar` inside the layout
**before** the `<RouterView>` and wrap the view in `<KeepAlive>`:

```vue
<template>
    <BasicLayout>
        <BasicTabBar />
        <KeepAlive :include="cachedNames">
            <RouterView v-slot="{ Component, route }">
                <component :is="Component" :key="route.fullPath" />
            </RouterView>
        </KeepAlive>
    </BasicLayout>
</template>

<script setup>
import { BasicLayout, BasicTabBar } from '@airovo/layouts'
import { useCachedTabNames } from '@airovo/tabs'
const cachedNames = useCachedTabNames()
</script>
```

The strip supports:
- Click to switch
- Middle-click to close
- Right-click for context menu (refresh, pin, close, close-others, close-all, maximize)
- Affix tabs (via `meta.affix`) are pinned and can't be closed
- Pinned tabs sort to the front

## Route meta

Augment your route meta to control tab behavior:
```ts
{
    path: '/dashboard',
    component: Dashboard,
    meta: {
        title: '仪表盘',
        icon: 'lucide:layout-dashboard',
        affix: true,         // pin this tab
        keepAlive: true,     // keep mounted when switching
        hideInTab: false,    // show in the tab strip
    },
}
```
