<script setup lang="ts">
/**
 * BasicLayoutMix — dual-column / "header-nav + sidebar" variant.
 *
 * Skeleton with two named slots: `nav-sidebar` for the top horizontal
 * nav and `main` for the page content. Apps fill both slots; the
 * `meta.layout: 'mix'` resolver in createApp renders this layout.
 */
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
