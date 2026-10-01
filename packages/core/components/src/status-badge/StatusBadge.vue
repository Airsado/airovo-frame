<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@airovo/shared/icons'
import {
    STATUS_PRESET_LABEL,
    STATUS_PRESET_ICON,
    type StatusPreset,
} from './types'

const TONE_CLASS: Record<StatusPreset, string> = {
    success: 'bg-success/15 text-success ring-success/30',
    error: 'bg-destructive/15 text-destructive ring-destructive/30',
    warning: 'bg-warning/15 text-warning ring-warning/30',
    processing: 'bg-info/15 text-info ring-info/30',
    pending: 'bg-warning/15 text-warning ring-warning/30',
    disabled: 'bg-neutral/10 text-neutral ring-neutral/20',
    info: 'bg-info/15 text-info ring-info/30',
    neutral: 'bg-neutral/10 text-neutral ring-neutral/20',
}

const props = withDefaults(
    defineProps<{
        status: StatusPreset
        text?: string
        pulse?: boolean
        class?: string
    }>(),
    {
        pulse: false,
    },
)

const label = computed(() => props.text ?? STATUS_PRESET_LABEL[props.status])
const iconName = computed(() => STATUS_PRESET_ICON[props.status])
const isProcessing = computed(() => props.status === 'processing')
const showPulse = computed(
    () =>
        props.pulse &&
        (props.status === 'processing' || props.status === 'warning'),
)
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            TONE_CLASS[status],
            props.class,
        ]"
    >
        <span
            v-if="showPulse"
            class="size-1.5 rounded-full bg-current animate-pulse"
        />
        <Icon
            :icon="iconName"
            :class="['size-3', isProcessing && 'animate-spin']"
        />
        <slot>{{ label }}</slot>
    </span>
</template>
