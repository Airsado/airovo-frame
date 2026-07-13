/**
 * v-permission directive — hides an element if the current user
 * lacks the specified permission (or one of several). Usage:
 *
 *   <Button v-permission="'sys.user.delete'">删除</Button>
 *   <MenuItem v-permission="['sys.user.edit', 'sys.user.create']" />
 */
import type { App, Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from './store'

type PermBinding = string | string[]

function check(el: HTMLElement, binding: DirectiveBinding<PermBinding>) {
    const store = usePermissionStore()
    const value = binding.value
    if (!value) return
    const perms = Array.isArray(value) ? value : [value]
    const ok = perms.some((p) => store.hasPermission(p))
    // Use display:none rather than removing the element so the DOM
    // stays stable (v-if would re-render children and lose focus).
    el.style.display = ok ? '' : 'none'
}

export const permissionDirective: Directive<HTMLElement, PermBinding> = {
    mounted: check,
    updated: check,
}

export function registerVPermission(app: App) {
    app.directive('permission', permissionDirective)
}
