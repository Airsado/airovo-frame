<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<SliderRootProps & { class?: HTMLAttributes['class'] }>(), {
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    disabled: false,
    defaultValue: () => [0],
})
const emits = defineEmits<SliderRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
const thumbCount = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : props.defaultValue ?? [props.min]))
</script>

<template>
    <SliderRoot
        v-bind="forwarded"
        data-slot="slider"
        :class="cn('data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full', props.class)"
        v-slot="{ modelValue }"
    >
        <SliderTrack data-slot="slider-track" class="bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1">
            <SliderRange data-slot="slider-range" class="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
        </SliderTrack>
        <SliderThumb
            v-for="(_, index) in (modelValue?.length ? modelValue : thumbCount)"
            :key="index"
            data-slot="slider-thumb"
            class="border-ring ring-ring/50 relative block size-3 shrink-0 rounded-full border bg-white transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
        />
    </SliderRoot>
</template>