<script lang="ts" setup>
import { SidebarInset, SidebarProvider, ScrollArea } from '@airovo/uikit-vue'
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
    <div class="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
        <SidebarProvider class="flex h-full flex-col">
            <BasicHeader :title="siteTitle" :logo="siteLogo" :menus="menus" :show-search="showSearch"
                :show-messages="showMessages" :show-theme="showTheme" :show-language="showLanguage" />
            <div class="flex flex-1 min-h-0 bg-sidebar">
                <BasicSidebar :menus="menus" collapsible="icon" />
                <SidebarInset class="rounded-tl-lg bg-background sm:border-l sm:border-t border-border">
                    <main class="flex min-h-0 flex-1 flex-col">
                        <div class="shrink-0 pt-3 pb-2.5 px-3 sm:pt-5 sm:pb-3 border-border sm:border-b">
                            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-x-4">
                                <div class="min-w-0 flex-1">
                                    <h2 class="truncate text-base font-bold tracking-tight sm:text-lg">
                                        <slot name="pageTitle">概览</slot>
                                    </h2>
                                </div>
                                <slot name="pageActions" />
                            </div>
                        </div>

                        <ScrollArea class="flex-1 min-w-0 min-h-0 overflow-x-hidden sm:p-5 p-0">
                            <slot />
                        </ScrollArea>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    </div>
</template>
