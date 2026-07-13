# @airovo/permission

Standard RBAC for airovo-frame. Provides:

- `usePermissionStore` — reactive `hasRole` / `hasPermission` / `hasAccess(meta)` / `canAccessRoute(to)` helpers
- `v-permission` directive — hide elements the user can't use
- `installPermission(app, { getAuth, router, onDeny? })` — wires directive + route guard + menu filter
- `permissionFilter` — drop inaccessible items from a menu tree

## Install

```ts
import { createApp } from '@airovo/app'
import { useAuthStore } from '@airovo/stores/auth'
import { installPermission } from '@airovo/permission'

const { app, router } = await createApp({ /* ... */ })

installPermission(app, {
    getAuth: () => ({
        userRoles: useAuthStore().userRoles,
        userPermissions: useAuthStore().userPermissions,
        isLoggedIn: useAuthStore().isLoggedIn,
    }),
    router: router.router,
    onDeny: { name: 'Forbidden' },
})
```

## Use

```vue
<!-- element hidden when user lacks the permission -->
<Button v-permission="'sys.user.delete'">删除</Button>

<!-- accepts an array — hidden only if NONE of the listed perms are held -->
<MenuItem v-permission="['sys.user.edit', 'sys.user.create']" />
```

```ts
// In a route definition
{
    path: '/admin/users',
    component: () => import('@/views/AdminUsers.vue'),
    meta: {
        title: '用户管理',
        icon: 'lucide:users',
        permissions: ['sys.user.read'],   // ← guarded
        keepAlive: true,
    },
}
```

```ts
// In a component
import { usePermissionStore } from '@airovo/permission'
const perm = usePermissionStore()
if (perm.hasRole('admin')) { /* ... */ }
```

## RouteMeta augmentation

The package augments vue-router's `RouteMeta` with these fields:
- `roles?: string[]` — required roles (any-of)
- `permissions?: string[]` — required permission codes (any-of)
- `requiresAuth?: boolean` — explicit auth requirement
- `keepAlive?: boolean` / `affix?: boolean` / `hideInTab?: boolean` — for tab management

The `*` wildcard in `userPermissions` grants all permissions (super-admin).
