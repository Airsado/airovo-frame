<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { STATUS_PRESET_LABEL, STATUS_PRESET_ICON, type StatusPreset } from './types'

const TONE_CLASS: Record<StatusPreset, string> = {
    success: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    error: 'bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300',
    warning: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    processing: 'bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300',
    pending: 'bg-yellow-500/15 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300',
    disabled: 'bg-gray-500/10 text-gray-600 ring-gray-500/20 dark:text-gray-400',
    info: 'bg-cyan-500/15 text-cyan-700 ring-cyan-500/30 dark:text-cyan-300',
    neutral: 'bg-gray-500/10 text-gray-700 ring-gray-500/20 dark:text-gray-300',
}

const props = withDefaults(defineProps<{
    status: StatusPreset
    text?: string
    pulse?: boolean
    class?: string
}>(), {
    pulse: false,
})

const label = computed(() => props.text ?? STATUS_PRESET_LABEL[props.status])
const iconName = computed(() => STATUS_PRESET_ICON[props.status])
const isProcessing = computed(() => props.status === 'processing')
const showPulse = computed(() => props.pulse && (props.status === 'processing' || props.status === 'warning'))
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            TONE_CLASS[status],
            props.class,
        ]"
    >
        <span v-if="showPulse" class="size-1.5 rounded-full bg-current animate-pulse" />
        <Icon
            :icon="iconName"
            :class="['size-3', isProcessing && 'animate-spin']"
        />
        <slot>{{ label }}</slot>
    </span>
</template>
