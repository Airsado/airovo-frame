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
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from '@airovo/uikit-vue';

import UserDropDown from '../components/UserDropDown/index.vue';
import BasicSiteTitle from '../components/SiteTitle/index.vue';

import { Icon } from '@airovo/shared/icons';

defineOptions({ name: 'BasicHeader' });

const { isMobile } = useSidebar();

</script>

<template>
    <header class="h-[--app-header-height] w-full bg-sidebar sticky top-0 z-50">
        <div class="flex h-(--header-height) items-center justify-between">

            <div class="flex h-(--header-height) w-full items-center gap-2 px-2.5">
                <SidebarTrigger class="cursor-pointer">
                    <Icon icon="lucide:sidebar" />
                </SidebarTrigger>
                <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
                <!-- 站点标题 -->
                <BasicSiteTitle title="后台Frame" logo="https://www.airsado.cn/usr/uploads/avatar_24.jpg" />
                <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" v-if="!isMobile" />
                <!-- 面包屑导航 -->
                <span class="hidden sm:inline-flex" v-if="!isMobile">
                    <Breadcrumb class="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    首页
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>数据中心</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </span>
            </div>

            <!-- 右侧 -->
            <div class="flex h-(--header-height) items-center justify-end px-9 gap-2">
                <!-- 搜索框 -->
                <!-- <SearchForm class="w-full sm:ml-auto sm:w-auto" /> -->
                <!-- <ThemeToggle /> -->

                <!-- 消息 -->
                <HoverCard>
                    <HoverCardTrigger as-child
                        class="rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2">
                        <div class="cursor-pointer inline-flex items-center gap-2">
                            <Icon icon="lucide:bell"></Icon>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent class="mr-8">
                        <div class="flex flex-col space-y-1">
                            <p class="text-sm font-medium leading-none">用户名</p>
                            <p class="text-xs leading-none text-muted-foreground">
                                user@example.com
                            </p>
                        </div>
                    </HoverCardContent>
                </HoverCard>


                <!-- 用户信息 -->
                <UserDropDown />




            </div>


        </div>
    </header>
</template>
