<script setup lang="ts">
/**
 * Framework-owned SVG previews based on the geometry used by new-api's
 * ConfigDrawer (`web/src/assets/custom/icon-theme-*.tsx`,
 * `icon-sidebar-*.tsx`, and `icon-layout-*.tsx`). They intentionally use
 * currentColor/CSS tokens so presets and dark mode remain configurable.
 */
type PreviewKind =
    | 'theme-system'
    | 'theme-light'
    | 'theme-dark'
    | 'sidebar-sidebar'
    | 'sidebar-inset'
    | 'sidebar-floating'
    | 'layout-default'
    | 'layout-compact'
    | 'layout-full'
    | 'content-full'
    | 'content-centered'

withDefaults(defineProps<{ kind: PreviewKind }>(), { kind: 'theme-system' })
</script>

<template>
    <svg
        viewBox="0 0 80 52"
        aria-hidden="true"
        class="h-auto w-full overflow-hidden rounded-md"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <template v-if="kind === 'theme-system' || kind === 'theme-light' || kind === 'theme-dark'">
            <rect width="79" height="51" x=".5" y=".5" rx="4" :fill="kind === 'theme-dark' ? '#18263a' : '#dfe3e8'" />
            <path d="M23 0h53a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H23z" :fill="kind === 'theme-dark' ? '#0d1628' : '#f1f3f5'" stroke="none" />
            <path d="M5 15h13M5 21h11M5 25h9" :stroke="kind === 'theme-dark' ? '#7092bd' : '#fff'" stroke-width="2" opacity=".75" />
            <circle cx="7" cy="7" r="2.8" :fill="kind === 'theme-dark' ? '#426187' : '#fff'" stroke="none" />
            <path d="M30 20h3M29 17h3M37 14v9M41 11v12" :stroke="kind === 'theme-dark' ? '#3c78d8' : '#aeb6c0'" stroke-width="2.5" opacity=".7" />
            <circle cx="63" cy="16" r="8" :fill="kind === 'theme-dark' ? '#2f5491' : '#fff'" stroke="none" opacity=".8" />
            <path d="M63 16l4-7a8 8 0 0 1 4 7z" :fill="kind === 'theme-dark' ? '#628bd0' : '#d2d6db'" stroke="none" />
            <rect x="30" y="28" width="41" height="18" rx="2" :fill="kind === 'theme-dark' ? '#17273f' : '#fff'" stroke="none" />
            <path v-if="kind === 'theme-system'" d="M0 0h23v52H0z" fill="currentColor" opacity=".16" stroke="none" />
        </template>

        <template v-else-if="kind === 'sidebar-sidebar' || kind === 'sidebar-inset' || kind === 'sidebar-floating'">
            <rect
                v-if="kind !== 'sidebar-inset'"
                x="5"
                y="5"
                width="20"
                height="41"
                rx="2"
                fill="currentColor"
                :opacity="kind === 'sidebar-floating' ? '.75' : '.2'"
                stroke="none"
            />
            <rect v-else x="23" y="6" width="51" height="40" rx="2" fill="currentColor" opacity=".18" stroke="none" />
            <path d="M7 17h12M7 21h10M7 25h9" stroke-width="2" opacity=".65" />
            <circle cx="8" cy="9" r="2.5" fill="currentColor" opacity=".75" stroke="none" />
            <path v-if="kind === 'sidebar-floating'" d="M31 10h6M31 14h25M31 20h42M31 25h35M31 30h39M31 35h32M31 40h42" stroke-width="2" opacity=".45" />
            <path v-else d="M31 10h15M31 15h22M31 21h40M31 27h34M31 33h39M31 39h30" stroke-width="2" opacity=".45" />
        </template>

        <template v-else>
            <path v-if="kind !== 'layout-full'" d="M6 5h19v41H6z" fill="currentColor" opacity=".72" stroke="none" />
            <path d="M6 7h68M6 14h18M6 20h24M6 26h38M6 32h33M6 38h41" stroke-width="2" opacity=".46" />
            <rect :x="kind === 'layout-full' ? 6 : 30" y="24" :width="kind === 'layout-compact' ? 32 : kind === 'layout-full' ? 38 : 22" height="20" rx="2" fill="currentColor" opacity=".2" stroke="none" />
            <circle cx="63" cy="18" r="8" fill="currentColor" opacity=".18" stroke="none" />
            <path d="M63 18l4-7a8 8 0 0 1 4 7z" fill="currentColor" opacity=".5" stroke="none" />
            <path d="M57 39h2M61 36h2M65 33h2M69 29h2" stroke-width="2.5" opacity=".55" />
        </template>
    </svg>
</template>
