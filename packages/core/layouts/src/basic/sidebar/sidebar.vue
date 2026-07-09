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
import { RouterLink, useRoute } from 'vue-router'
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
const route = useRoute()
const { state, isMobile, setOpenMobile } = useSidebar()

// ─── helpers ───

function hasChildren(item: SidebarMenuItemType): boolean {
    return !!item.children?.length
}

/** True when the current route path exactly matches the item URL. */
function isExactMatch(item: SidebarMenuItemType): boolean {
    return route.path === item.url
}

/** True when the item (or any of its children) is the current page. */
function isActiveScope(item: SidebarMenuItemType): boolean {
    if (isExactMatch(item)) return true
    if (!item.children) return false
    return item.children.some((c) => route.path === c.url)
}

// ─── open state (accordion — single open) ───

const openKey = ref<string | null>(null)

/** Find which top-level menu group (if any) contains the current route. */
function findActiveGroupKey(): string | null {
    for (const item of props.menus) {
        if (isActiveScope(item)) return item.url
    }
    return null
}

// On mount: open the group that contains the current route
openKey.value = findActiveGroupKey()

// On route change: switch open group to the new active group
watch(
    () => route.path,
    () => {
        openKey.value = findActiveGroupKey()
    },
)

function onParentToggle(item: SidebarMenuItemType, nextOpen: boolean): void {
    // Pure UI toggle — no navigation
    openKey.value = nextOpen ? item.url : null
}

// ─── close sidebar sheet (mobile) ───

function closeSidebarOnNavigate(): void {
    if (isMobile.value) setOpenMobile(false)
}
</script>

<template>
    <Sidebar
        class="text-sidebar-foreground top-[var(--header-height)] h-[calc(100svh-var(--header-height))]!"
        v-bind="props"
    >
        <SidebarContent class="px-2 py-3">
            <SidebarGroup>
                <SidebarGroupLabel class="px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {{ t('sidebar.navigation') }}
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in menus" :key="item.url">
                        <!-- ── Leaf item (no children) ── -->
                        <SidebarMenuItem v-if="!hasChildren(item)">
                            <SidebarMenuButton
                                as-child
                                :tooltip="item.title"
                                :is-active="isExactMatch(item)"
                            >
                                <RouterLink :to="item.url" @click="closeSidebarOnNavigate">
                                    <Icon :icon="item.icon" v-if="item.icon" />
                                    <span>{{ item.title }}</span>
                                </RouterLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <!-- ── Parent with children (expanded or mobile) ── -->
                        <Collapsible
                            v-else-if="state === 'expanded' || isMobile"
                            as-child
                            :open="openKey === item.url"
                            class="group/collapsible"
                            @update:open="(v) => onParentToggle(item, v)"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger as-child>
                                    <SidebarMenuButton
                                        :tooltip="item.title"
                                        :is-active="isActiveScope(item)"
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
                                            :key="subItem.url"
                                        >
                                            <SidebarMenuSubButton
                                                as-child
                                                :is-active="isExactMatch(subItem)"
                                            >
                                                <RouterLink
                                                    :to="subItem.url"
                                                    @click="closeSidebarOnNavigate"
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
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        <!-- ── Parent with children (collapsed desktop) ── -->
                        <SidebarMenuItem v-else>
                            <HoverCard :open-delay="100" :close-delay="80">
                                <HoverCardTrigger as-child>
                                    <SidebarMenuButton
                                        :is-active="isActiveScope(item)"
                                    >
                                        <Icon :icon="item.icon" v-if="item.icon" />
                                    </SidebarMenuButton>
                                </HoverCardTrigger>
                                <HoverCardContent
                                    side="right"
                                    :side-offset="8"
                                    class="min-w-48 p-2"
                                >
                                    <div class="text-foreground mb-1 px-2 text-xs font-medium">
                                        {{ item.title }}
                                    </div>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem
                                            v-for="subItem in item.children"
                                            :key="subItem.url"
                                        >
                                            <SidebarMenuSubButton
                                                as-child
                                                :is-active="isExactMatch(subItem)"
                                            >
                                                <RouterLink
                                                    :to="subItem.url"
                                                    @click="closeSidebarOnNavigate"
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
