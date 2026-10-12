<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'TruncatedCell' })

const props = withDefaults(defineProps<{
    text?: string | number
    tooltipContent?: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    tabIndex?: number
    class?: string
    contentClass?: string
    tooltipClass?: string
}>(), {
    side: 'top',
    tabIndex: 0,
})

const content = computed(() => props.tooltipContent ?? (props.text === undefined ? '' : String(props.text)))
</script>

<template>
    <TooltipProvider v-if="content" :delay-duration="0">
        <Tooltip>
            <TooltipTrigger as-child>
                <div :class="['block min-w-0 max-w-full truncate', props.class]" :tabindex="tabIndex">
                    <div :class="['truncate', props.contentClass]"><slot>{{ text }}</slot></div>
                </div>
            </TooltipTrigger>
            <TooltipContent :side="side" :class="['max-w-xs break-all', props.tooltipClass]">{{ content }}</TooltipContent>
        </Tooltip>
    </TooltipProvider>
    <div v-else :class="['block min-w-0 max-w-full truncate', props.class]" :tabindex="tabIndex">
        <div :class="['truncate', props.contentClass]"><slot>{{ text }}</slot></div>
    </div>
</template>
