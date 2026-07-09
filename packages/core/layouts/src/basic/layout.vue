<script lang="ts" setup>
import { SidebarInset, SidebarProvider, ScrollArea } from '@airovo/uikit-shadcnui'
import { BasicHeader, BasicSidebar } from './index'
import type { SidebarMenuItemType } from './sidebar/types'

defineOptions({ name: 'BasicLayout' })

withDefaults(
    defineProps<{
        menus?: SidebarMenuItemType[]
        siteTitle?: string
        siteLogo?: string
        showSearch?: boolean
        showMessages?: boolean
        showTheme?: boolean
        showLanguage?: boolean
    }>(),
    {
        menus: () => [] as SidebarMenuItemType[],
        siteTitle: 'AirOvO',
        siteLogo: 'https://www.airsado.cn/usr/uploads/avatar_24.jpg',
        showSearch: true,
        showMessages: true,
        showTheme: true,
        showLanguage: true,
    },
)
</script>

<template>
    <!-- Root: lock height to screen -->
    <div class="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
        <SidebarProvider class="flex h-full flex-col" :style="{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' }">
            <!-- Header bar -->
            <BasicHeader
                :title="siteTitle"
                :logo="siteLogo"
                :menus="menus"
                :show-search="showSearch"
                :show-messages="showMessages"
                :show-theme="showTheme"
                :show-language="showLanguage"
            />

            <!-- Body: sidebar + content -->
            <div class="flex flex-1 min-h-0">
                <BasicSidebar :menus="menus" collapsible="icon" />

                <!-- Content area -->
                <SidebarInset class="flex-1">
                    <main class="flex min-h-0 flex-1 flex-col">
                        <!-- Page title bar -->
                        <div class="shrink-0 border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
                            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                <div class="min-w-0 flex-1">
                                    <h2 class="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                        <slot name="pageTitle">概览</slot>
                                    </h2>
                                </div>
                                <div class="flex shrink-0 items-center gap-2">
                                    <slot name="pageActions" />
                                </div>
                            </div>
                        </div>

                        <!-- Scrollable content -->
                        <ScrollArea class="flex-1 min-w-0 min-h-0 overflow-x-hidden">
                            <div class="p-4 sm:p-6">
                                <slot />
                            </div>
                        </ScrollArea>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    </div>
</template>
