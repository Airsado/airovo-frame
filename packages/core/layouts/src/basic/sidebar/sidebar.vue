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
    CollapsibleContent,
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
    useSidebar,
} from '@airovo/uikit-shadcnui'

import { Icon } from '@airovo/shared/icons'
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SidebarMenuItemType } from './types'

defineOptions({ name: 'BasicSidebar' })

export interface SideBarPropsType extends SidebarProps {
    menus: SidebarMenuItemType[]
}

const props = withDefaults(defineProps<SideBarPropsType>(), {
    collapsible: 'icon',
})

const { t } = useI18n()
const route = useRoute() ?? { path: '' }
const router = useRouter()
const { state, isMobile, setOpenMobile } = useSidebar()

function isCurrent(url: string): boolean {
    if (!url) return false
    const path = route?.path ?? ''
    if (url === '/') return path === '/'
    return path === url || path.startsWith(url + '/')
}

function isInScope(item: SidebarMenuItemType): boolean {
    return isCurrent(item.url) || !!item.children?.some((c) => isCurrent(c.url))
}

// True when this item itself is the current page — uses EXACT match
// (not `isCurrent`'s `startsWith`) so that `/dashboard` doesn't also
// highlight when the user is on `/dashboard/overview`.
function isActivePage(item: SidebarMenuItemType): boolean {
    const path = route?.path ?? ''
    return path === item.url
}

function hasChildren(item: SidebarMenuItemType): boolean {
    return !!item.children?.length
}

// Fired when the user toggles a parent open via its inline trigger.
function onParentToggle(item: SidebarMenuItemType, nextOpen: boolean): void {
    openStates.value[item.title] = nextOpen
    if (nextOpen && item.url && !isInScope(item)) router.push(item.url)
}

// Close the sidebar (and any open flyout) when a sub-item is
// activated. On mobile this closes the Sheet; on desktop-collapsed
// it closes the parent's Collapsible flyout. Navigation itself goes
// through the @click RouterLink binding.
function closeSidebar(item: SidebarMenuItemType): void {
    if (isMobile.value) setOpenMobile(false)
    openStates.value[item.title] = false
}

const openStates = ref<Record<string, boolean>>({})

function recomputeOpenStates(): void {
    const next: Record<string, boolean> = {}
    for (const item of props.menus) {
        const previous = openStates.value[item.title]
        next[item.title] = !!item.isActive || (previous ?? isInScope(item))
    }
    openStates.value = next
}

watch(
    () => route.path,
    () => {
        for (const item of props.menus) {
            if (isInScope(item)) openStates.value[item.title] = true
        }
    },
)

recomputeOpenStates()
</script>

<template>
    <Sidebar
        class="text-sidebar-foreground top-[var(--header-height)] h-[calc(100svh-var(--header-height))]! bg-transparent border-none!"
        v-bind="props"
    >
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>{{ t('sidebar.navigation') }}</SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in menus" :key="item.title">
                        <SidebarMenuItem v-if="!hasChildren(item)">
                            <SidebarMenuButton
                                as-child
                                :tooltip="item.title"
                                :is-active="isActivePage(item)"
                            >
                                <RouterLink :to="item.url">
                                    <Icon :icon="item.icon" v-if="item.icon" />
                                    <span>{{ item.title }}</span>
                                </RouterLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <Collapsible
                            v-else-if="state === 'expanded' || isMobile"
                            as-child
                            :open="openStates[item.title]"
                            class="group/collapsible"
                            @update:open="(v) => onParentToggle(item, v)"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger as-child>
                                    <SidebarMenuButton
                                        :is-active="isActivePage(item)"
                                    >
                                        <Icon :icon="item.icon" v-if="item.icon" />
                                        <span>{{ item.title }}</span>
                                        <Icon
                                            icon="lucide:chevron-right"
                                            class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                        />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem
                                            v-for="subItem in item.children"
                                            :key="subItem.title"
                                        >
                                            <SidebarMenuSubButton
                                                as-child
                                                :is-active="isActivePage(subItem)"
                                            >
                                                <RouterLink :to="subItem.url">
                                                    <Icon
                                                        :icon="subItem.icon"
                                                        v-if="subItem.icon"
                                                    />
                                                    <span>{{ subItem.title }}</span>
                                                </RouterLink>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        <SidebarMenuItem v-else>
                            <HoverCard :open-delay="100">
                                <HoverCardTrigger as-child>
                                    <SidebarMenuButton
                                        :is-active="isActivePage(item)"
                                    >
                                        <Icon :icon="item.icon" v-if="item.icon" />
                                        <span class="sr-only">{{ item.title }}</span>
                                    </SidebarMenuButton>
                                </HoverCardTrigger>
                                <HoverCardContent
                                    side="right"
                                    :side-offset="8"
                                    class="min-w-48 p-2"
                                >
                                    <div
                                        class="text-foreground mb-1 px-2 text-xs font-medium"
                                    >
                                        {{ item.title }}
                                    </div>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem
                                            v-for="subItem in item.children"
                                            :key="subItem.title"
                                        >
                                            <SidebarMenuSubButton
                                                as-child
                                                :is-active="isActivePage(subItem)"
                                            >
                                                <RouterLink
                                                    :to="subItem.url"
                                                    @click="closeSidebar(item)"
                                                >
                                                    <Icon
                                                        :icon="subItem.icon"
                                                        v-if="subItem.icon"
                                                    />
                                                    <span>{{ subItem.title }}</span>
                                                </RouterLink>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </HoverCardContent>
                            </HoverCard>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
    </Sidebar>
</template>
