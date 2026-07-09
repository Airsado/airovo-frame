<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
    Separator,
    useSidebar,
    SidebarTrigger,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@airovo/uikit-shadcnui'
import { Icon } from '@airovo/shared/icons'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SidebarMenuItemType } from '../sidebar/types'

import UserDropDown from '../components/UserDropDown/index.vue'
import BasicSiteTitle from '../components/SiteTitle/index.vue'
import ThemeToggle from '../components/ThemeToggle/index.vue'
import LanguageSwitch from '../components/LanguageSwitch/index.vue'
import MessageDropdown from '../components/MessageDropdown/index.vue'
import CommandSearch from '../components/CommandSearch/index.vue'

const { isMobile } = useSidebar()
const { t } = useI18n()
const route = useRoute()

defineOptions({ name: 'BasicHeader' })

// 动态面包屑
const breadcrumbs = computed(() => {
    const matched = route.matched.filter(
        (item) => item.meta?.title && !item.meta?.hideInMenu,
    )
    return matched.map((item, index) => ({
        title: item.meta.title,
        path: item.path,
        isLast: index === matched.length - 1,
    }))
})

withDefaults(
    defineProps<{
        title?: string
        logo?: string
        menus?: SidebarMenuItemType[]
        showSearch?: boolean
        showMessages?: boolean
        showTheme?: boolean
        showLanguage?: boolean
    }>(),
    {
        title: 'airovo-frame',
        logo: 'https://www.airsado.cn/usr/uploads/avatar_24.jpg',
        menus: () => [] as SidebarMenuItemType[],
        showSearch: true,
        showMessages: true,
        showTheme: true,
        showLanguage: true,
    },
)
</script>

<template>
    <header class="h-[--header-height] w-full sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-md">
        <div class="flex items-center justify-between px-0 sm:px-3">
            <div class="flex w-full h-(--header-height) items-center gap-2">
                <SidebarTrigger class="cursor-pointer pl-2.5 sm:pl-0 w-(--sidebar-width)">
                    <Icon icon="lucide:sidebar" class="text-muted-foreground hover:text-foreground transition-colors" />
                </SidebarTrigger>
                <Separator orientation="vertical" class="data-[orientation=vertical]:h-5 bg-sidebar-border" />
                <BasicSiteTitle :title="title" :logo="logo" />
                <Separator
                    orientation="vertical"
                    class="mr-2 data-[orientation=vertical]:h-5 bg-sidebar-border"
                    v-if="!isMobile"
                />
                <span class="hidden sm:inline-flex" v-if="!isMobile">
                    <Breadcrumb class="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink as-child>
                                    <RouterLink to="/">{{ t('header.home') }}</RouterLink>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink v-if="!crumb.isLast" as-child>
                                        <RouterLink :to="crumb.path">{{ crumb.title }}</RouterLink>
                                    </BreadcrumbLink>
                                    <BreadcrumbPage v-else>{{ crumb.title }}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </template>
                        </BreadcrumbList>
                    </Breadcrumb>
                </span>
            </div>

            <div class="flex h-(--header-height) items-center justify-end sm:px-0 gap-2">
                <CommandSearch v-if="showSearch" :menus="menus" />
                <ThemeToggle v-if="showTheme" />
                <LanguageSwitch v-if="showLanguage" />
                <MessageDropdown v-if="showMessages" />
                <UserDropDown class="pl-2.5 sm:pl-0" />
            </div>
        </div>
    </header>
</template>
