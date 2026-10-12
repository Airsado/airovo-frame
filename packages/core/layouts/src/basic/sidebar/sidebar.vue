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
    Badge,
    CollapsibleTrigger,
    Collapsible,
    SidebarProps,
    CollapsibleContent,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    useSidebar,
} from '@airovo/uikit-shadcnui'

import { Icon } from '@airovo/shared/icons'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SidebarMenuItemType } from './types'
import { activeMenuPath, containsActiveMenu, isActiveMenu } from './menuActive'
import { groupSidebarMenus } from './menuGroups'

defineOptions({ name: 'BasicSidebar' })

export interface SideBarPropsType extends SidebarProps {
    menus: SidebarMenuItemType[]
}

const props = withDefaults(defineProps<SideBarPropsType>(), {
    collapsible: 'icon',
})

const { t, te } = useI18n({ useScope: 'global' })
function label(key: string | undefined, fallback: string): string {
    return key && te(key) ? t(key) : fallback
}

const groupedMenus = computed(() => groupSidebarMenus(props.menus))

const route = useRoute()
const router = useRouter()
const { state, isMobile, setOpenMobile } = useSidebar()

const selectedPath = computed(() => activeMenuPath(route))

// ─── helpers ───

function hasChildren(item: SidebarMenuItemType): boolean {
    return !!item.children?.length
}

/** True when the current route path exactly matches the item URL. */
function isExactMatch(item: SidebarMenuItemType): boolean {
    if (isActiveMenu(item, selectedPath.value)) return true
    // Mixed menus can be decorated by a backend item and lose the original
    // URL formatting. Keep local route names as a stable active-state key.
    return Boolean(item.name && route.name && item.name === String(route.name))
}

/** True when the item (or any of its children) is the current page. */
function isActiveScope(item: SidebarMenuItemType): boolean {
    return containsActiveMenu(item, selectedPath.value)
}

// ─── open state (accordion — single open) ───

const openKey = ref<string | null>(null)

/** Find which top-level menu group (if any) contains the current route. */
function findActiveGroupKey(): string | null {
    for (const group of groupedMenus.value) {
        for (const item of group.items) {
            if (hasChildren(item) && isActiveScope(item)) return item.url
        }
    }
    return null
}

// On mount: open the group that contains the current route
openKey.value = findActiveGroupKey()

// On route change: switch open group to the new active group
watch(
    [selectedPath, groupedMenus],
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

function linkHref(item: SidebarMenuItemType): string {
    return item.external ? item.url : router.resolve(item.url).href
}

function navigateLink(event: MouseEvent, item: SidebarMenuItemType): void {
    if (item.external || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    void router.push(item.url)
}

function handleMenuClick(event: MouseEvent, item: SidebarMenuItemType): void {
    navigateLink(event, item)
    closeSidebarOnNavigate()
}
</script>

<template>
    <!-- Keep the fixed sidebar container transparent in its inset padding.
         Applying bg-sidebar here paints over the adjacent SidebarInset edge
         while expanded; Sidebar.vue already paints its inner surface. -->
    <Sidebar
        class="text-sidebar-foreground"
        :side="props.side"
        :variant="props.variant"
        :collapsible="props.collapsible"
    >
        <SidebarContent class="py-2">
            <SidebarGroup v-for="group in groupedMenus" :key="group.titleKey ?? group.title" class="px-2 py-1">
                <SidebarGroupLabel class="px-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
                    {{ label(group.titleKey, group.title) }}
                </SidebarGroupLabel>
                <SidebarMenu>
                    <template v-for="item in group.items" :key="item.url">
                        <!-- ── Leaf item (no children) ── -->
                        <SidebarMenuItem v-if="!hasChildren(item)">
                            <SidebarMenuButton
                                as="a"
                                :tooltip="label(item.titleKey, item.title)"
                                :is-active="isExactMatch(item)"
                                :href="linkHref(item)"
                                data-sidebar-menu-kind="leaf"
                                :data-menu-url="item.url"
                                :aria-current="isExactMatch(item) ? 'page' : undefined"
                                class="app-sidebar-nav-item"
                                :data-app-sidebar-active="isExactMatch(item) ? 'true' : 'false'"
                                :target="item.external ? '_blank' : undefined"
                                :rel="item.external ? 'noopener noreferrer' : undefined"
                                @click="handleMenuClick($event, item)"
                            >
                                <Icon :icon="item.icon" v-if="item.icon" />
                                <span>{{ label(item.titleKey, item.title) }}</span>
                                <Badge v-if="item.badge !== undefined && item.badge !== ''" class="ml-auto shrink-0 px-1 py-0 text-xs group-data-[collapsible=icon]:hidden">{{ item.badge }}</Badge>
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
                                        :tooltip="label(item.titleKey, item.title)"
                                        data-sidebar-menu-kind="parent"
                                        :data-menu-url="item.url"
                                        :aria-label="label(item.titleKey, item.title)"
                                        class="app-sidebar-nav-item"
                                    >
                                        <Icon :icon="item.icon" v-if="item.icon" />
                                        <span>{{ label(item.titleKey, item.title) }}</span>
                                        <Badge v-if="item.badge !== undefined && item.badge !== ''" class="ml-auto shrink-0 px-1 py-0 text-xs">{{ item.badge }}</Badge>
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
                                                as="a"
                                                :is-active="isExactMatch(subItem)"
                                                :href="linkHref(subItem)"
                                                data-sidebar-menu-kind="child"
                                                :data-menu-url="subItem.url"
                                                :aria-current="isExactMatch(subItem) ? 'page' : undefined"
                                                class="app-sidebar-nav-item data-[active=true]:font-medium"
                                                :data-app-sidebar-active="isExactMatch(subItem) ? 'true' : 'false'"
                                                :target="subItem.external ? '_blank' : undefined"
                                                :rel="subItem.external ? 'noopener noreferrer' : undefined"
                                                @click="handleMenuClick($event, subItem)"
                                            >
                                                <Icon :icon="subItem.icon" v-if="subItem.icon" />
                                                <span>{{ label(subItem.titleKey, subItem.title) }}</span>
                                                <Badge v-if="subItem.badge !== undefined && subItem.badge !== ''" class="ml-auto shrink-0 px-1 py-0 text-xs">{{ subItem.badge }}</Badge>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        <!-- ── Parent with children (collapsed desktop) ── -->
                        <SidebarMenuItem v-else>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child class="group/dropdown-trigger">
                                    <SidebarMenuButton
                                        :tooltip="label(item.titleKey, item.title)"
                                        :is-active="isActiveScope(item)"
                                        data-sidebar-menu-kind="parent-collapsed"
                                        :data-menu-url="item.url"
                                        :aria-label="label(item.titleKey, item.title)"
                                        :aria-current="isActiveScope(item) ? 'page' : undefined"
                                        class="app-sidebar-nav-item cursor-pointer"
                                        :data-app-sidebar-active="isActiveScope(item) ? 'true' : 'false'"
                                    >
                                        <Icon :icon="item.icon" v-if="item.icon" />
                                        <span class="min-w-0 flex-1 truncate">{{ label(item.titleKey, item.title) }}</span>
                                        <Badge v-if="item.badge !== undefined && item.badge !== ''" class="shrink-0 px-1 py-0 text-xs group-data-[collapsible=icon]:hidden">{{ item.badge }}</Badge>
                                        <Icon
                                            icon="lucide:chevron-right"
                                            class="ml-auto transition-transform duration-200 group-data-[state=open]/dropdown-trigger:rotate-90"
                                        />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" align="start" :side-offset="4">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>{{ label(item.titleKey, item.title) }}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            v-for="subItem in item.children"
                                            :key="subItem.url"
                                            as-child
                                            :data-sidebar-nav-active="isExactMatch(subItem) ? 'true' : 'false'"
                                            data-sidebar-menu-kind="collapsed-child"
                                            :data-menu-url="subItem.url"
                                            :aria-current="isExactMatch(subItem) ? 'page' : undefined"
                                            class="app-sidebar-nav-item"
                                        >
                                            <a
                                                :href="linkHref(subItem)"
                                                class="app-sidebar-nav-item cursor-pointer"
                                                :data-app-sidebar-active="isExactMatch(subItem) ? 'true' : 'false'"
                                                :target="subItem.external ? '_blank' : undefined"
                                                :rel="subItem.external ? 'noopener noreferrer' : undefined"
                                                @click="handleMenuClick($event, subItem)">
                                                <Icon :icon="subItem.icon" v-if="subItem.icon" />
                                                <span class="max-w-52 text-wrap">{{ label(subItem.titleKey, subItem.title) }}</span>
                                                <Badge v-if="subItem.badge !== undefined && subItem.badge !== ''" class="ml-auto shrink-0 px-1 py-0 text-xs">{{ subItem.badge }}</Badge>
                                            </a>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </template>
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
    </Sidebar>
</template>
