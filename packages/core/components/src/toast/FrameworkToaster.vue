<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { computed } from 'vue'
import {
    CircleCheck,
    Info,
    LoaderCircle,
    CircleX,
    TriangleAlert,
    X,
} from '@lucide/vue'
import { Toaster as Sonner } from 'vue-sonner'

/**
 * Framework notification host.
 *
 * vue-sonner remains the low-level UI primitive. This framework host only
 * supplies the new-api defaults and icon treatment so applications get the
 * same top-center, rich-color notification surface without repeating them
 * in every root component.
 */
const props = withDefaults(defineProps<ToasterProps>(), {
    position: 'top-center',
    duration: 5000,
    closeButton: true,
    closeButtonPosition: 'top-left',
    richColors: true,
    // The new-api notification is a compact, fixed-width top-center surface.
    // Keep the offset here instead of relying on vue-sonner's 24px default.
    offset: 12,
    mobileOffset: 12,
    gap: 8,
})

const palette = computed(() => {
    if (props.theme === 'dark') {
        return {
            successBg: '#173923',
            successBorder: '#356746',
            successText: '#ffffff',
            successIcon: '#8ee6a8',
            infoBg: '#1d3347',
            infoBorder: '#3d6385',
            infoText: '#ffffff',
            infoIcon: '#8dc7f5',
            warningBg: '#3e3314',
            warningBorder: '#7c6728',
            warningText: '#ffffff',
            warningIcon: '#f4d36f',
            errorBg: '#4b202a',
            errorBorder: '#8a4552',
            errorText: '#ffffff',
            errorIcon: '#ff9eac',
        }
    }

    return {
        successBg: '#ddf8e3',
        successBorder: '#a8dcb2',
        successText: '#0a0a0a',
        successIcon: '#16803c',
        infoBg: '#e2efff',
        infoBorder: '#a9c9ef',
        infoText: '#0a0a0a',
        infoIcon: '#1769aa',
        warningBg: '#fff2cc',
        warningBorder: '#e8c778',
        warningText: '#0a0a0a',
        warningIcon: '#9a6500',
        errorBg: '#ffdee5',
        errorBorder: '#f1a9b3',
        errorText: '#0a0a0a',
        errorIcon: '#e7000b',
    }
})
</script>

<template>
    <Sonner
        v-bind="props"
        :class="['toaster group', props.class].filter(Boolean).join(' ')"
        :style="{
            // vue-sonner's 356px width is also the new-api notification width.
            // Keeping it means the 424px reference viewport lands at x=34.
            '--width': '356px',
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
            // new-api's notification palette: a semantic color wash with
            // theme-aware body text and a saturated status icon. These values
            // avoid the low-contrast shadcn rich-color defaults.
            '--success-bg': palette.successBg,
            '--success-border': palette.successBorder,
            '--success-text': palette.successText,
            '--success-icon': palette.successIcon,
            '--info-bg': palette.infoBg,
            '--info-border': palette.infoBorder,
            '--info-text': palette.infoText,
            '--info-icon': palette.infoIcon,
            '--warning-bg': palette.warningBg,
            '--warning-border': palette.warningBorder,
            '--warning-text': palette.warningText,
            '--warning-icon': palette.warningIcon,
            '--error-bg': palette.errorBg,
            '--error-border': palette.errorBorder,
            '--error-text': palette.errorText,
            '--error-icon': palette.errorIcon,
            '--border-radius': '16px',
            ...props.style,
        }"
    >
        <template #success-icon><CircleCheck class="size-4" /></template>
        <template #info-icon><Info class="size-4" /></template>
        <template #warning-icon><TriangleAlert class="size-4" /></template>
        <template #error-icon><CircleX class="size-4" /></template>
        <template #loading-icon><LoaderCircle class="size-4 animate-spin" /></template>
        <template #close-icon><X class="size-3" /></template>
    </Sonner>
</template>

<style src="vue-sonner/style.css"></style>

<style>
.toaster [data-sonner-toast][data-styled='true'] [data-description] { color: inherit; }
.toaster [data-sonner-toast][data-styled='true'] {
    min-height: 52px;
    font-size: 13px;
    font-weight: 400;
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}
.toaster [data-sonner-toast][data-type='success'] [data-icon] { color: var(--success-icon); }
.toaster [data-sonner-toast][data-type='info'] [data-icon] { color: var(--info-icon); }
.toaster [data-sonner-toast][data-type='warning'] [data-icon] { color: var(--warning-icon); }
.toaster [data-sonner-toast][data-type='error'] [data-icon] { color: var(--error-icon); }
.toaster [data-sonner-toast][data-styled='true'] [data-close-button] {
    color: var(--normal-text);
}
.toaster [data-sonner-toast][data-type='success'] [data-close-button] { color: var(--success-text); }
.toaster [data-sonner-toast][data-type='info'] [data-close-button] { color: var(--info-text); }
.toaster [data-sonner-toast][data-type='warning'] [data-close-button] { color: var(--warning-text); }
.toaster [data-sonner-toast][data-type='error'] [data-close-button] { color: var(--error-text); }
</style>
