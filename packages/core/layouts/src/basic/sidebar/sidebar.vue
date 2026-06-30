<script lang="ts" setup>

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuSubItem,
    SidebarMenuItem,
    SidebarMenuSubButton,
    SidebarRail,
    SidebarMenuSub,
    CollapsibleTrigger,
    Collapsible,
    SidebarProps,
} from '@airovo/uikit-vue';

import { Icon } from '@airovo/shared/icons';
import BasicSiteTitle from '../components/SiteTitle/index.vue';


defineOptions({ name: 'BasicSidebar' });

export interface SideBarPropsType extends SidebarProps {
    menus: {
        title: string
        url: string
        icon?: string
        isActive?: boolean
        items?: {
            title: string
            url: string
            icon?: string
        }[]
    }[]
}

const props = withDefaults(defineProps<SideBarPropsType>(), {
    collapsible: "icon",
})


</script>

<template>
    <Sidebar
        class="text-sidebar-foreground top-[var(--header-height)] h-[calc(100svh-var(--header-height))]! bg-transparent border-none!"
        v-bind="props">
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>导航</SidebarGroupLabel>
                <SidebarMenu>

                    <Collapsible v-for="item in menus" :key="item.title" as-child v-model:open="item.isActive"
                        class="group/collapsible select-none">

                        <SidebarMenuItem>
                            <CollapsibleTrigger as-child>
                                <SidebarMenuButton :tooltip="item.title">
                                    <Icon :icon="item.icon" v-if="item.icon" />
                                    <span>{{ item.title }}</span>
                                    <Icon icon="lucide:chevron-right"
                                        class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>

                            <CollapsibleContent v-show="item.isActive" class="overflow-hidden">
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                                        <SidebarMenuSubButton as-child>
                                            <a :href="subItem.url">
                                                <Icon :icon="subItem.icon" v-if="subItem.icon" />
                                                <span>{{ subItem.title }}</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>

                    </Collapsible>

                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
    </Sidebar>
</template>