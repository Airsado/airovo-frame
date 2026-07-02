<script lang="ts" setup>
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
} from '@airovo/uikit-vue'
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

defineOptions({ name: 'BasicHeader' })

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
    <header class="h-[--header-height] w-full bg-sidebar sticky top-0 z-50">
        <div class="flex items-center justify-between px-0 sm:px-2.5">
            <div class="flex w-full h-(--header-height) items-center gap-2">
                <SidebarTrigger class="cursor-pointer pl-2.5 sm:pl-0 w-(--sidebar-width)">
                    <Icon icon="lucide:sidebar" />
                </SidebarTrigger>
                <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
                <BasicSiteTitle :title="title" :logo="logo" />
                <Separator
                    orientation="vertical"
                    class="mr-2 data-[orientation=vertical]:h-4"
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
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {{ t('header.dataCenter') }}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
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
