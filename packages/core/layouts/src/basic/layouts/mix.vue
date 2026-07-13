<script setup lang="ts">
/**
 * BasicLayoutMix — dual-column / "header-nav + sidebar" variant.
 *
 * Renders a top header with horizontal nav (the main routes) and a
 * left sub-sidebar that drills into the active nav's children. This
 * is the vben-admin "header-nav-sidebar" mode. Wire to your app
 * via route meta `layout: 'mix'`.
 *
 * NOTE: This is a structural skeleton. A full vben-parity
 * implementation would have its own BasicHeader + BasicSidebar
 * variants with separate menus. For now we reuse the standard
 * BasicHeader / BasicSidebar so apps can swap layouts without
 * restructuring their route metadata.
 */
import {
    BasicLayout as DefaultLayout,
} from '../layout.vue'
import { SidebarInset, SidebarProvider } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'BasicLayoutMix' })
</script>
<template>
    <div class="h-svh flex flex-col">
        <SidebarProvider class="flex h-full flex-col">
            <div class="flex flex-1 min-h-0">
                <slot name="nav-sidebar" />
                <SidebarInset class="flex-1 min-w-0">
                    <slot name="main">
                        <div class="p-6 text-sm text-muted-foreground">
                            Mix-layout 占位 —— 通过 <code>nav-sidebar</code> 和 <code>main</code> 插槽填充顶部导航 + 子侧栏。
                        </div>
                    </slot>
                </SidebarInset>
            </div>
        </SidebarProvider>
    </div>
</template>
