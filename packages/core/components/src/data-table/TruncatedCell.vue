<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@airovo/uikit-shadcnui'
import { getTruncatedText } from './truncated-text-utils'

defineOptions({ name: 'TruncatedCell' })

const props = withDefaults(defineProps<{
    text?: string | number
    tooltipContent?: string | number
    side?: 'top' | 'bottom' | 'left' | 'right'
    tabIndex?: number
    class?: string
    cellClassName?: string
    contentClass?: string
    contentClassName?: string
    tooltipClass?: string
    tooltipClassName?: string
}>(), {
    side: 'top',
    tabIndex: 0,
})

const slots = useSlots()
const slotContent = computed(() => getTruncatedText(slots.default?.({})))
const content = computed(() => props.tooltipContent !== undefined
    ? String(props.tooltipContent)
    : props.text !== undefined
        ? String(props.text)
        : slotContent.value)
</script>

<template>
    <TooltipProvider v-if="content" :delay-duration="0">
        <Tooltip>
            <TooltipTrigger as-child>
                <div :class="['block min-w-0 max-w-full truncate', props.class, props.cellClassName]" :tabindex="tabIndex">
                    <div :class="['truncate', props.contentClass, props.contentClassName]"><slot>{{ text }}</slot></div>
                </div>
            </TooltipTrigger>
            <TooltipContent :side="side" :class="['max-w-xs break-all', props.tooltipClass, props.tooltipClassName]">{{ content }}</TooltipContent>
        </Tooltip>
    </TooltipProvider>
    <div v-else :class="['block min-w-0 max-w-full truncate', props.class, props.cellClassName]" :tabindex="tabIndex">
        <div :class="['truncate', props.contentClass, props.contentClassName]"><slot>{{ text }}</slot></div>
    </div>
</template>
