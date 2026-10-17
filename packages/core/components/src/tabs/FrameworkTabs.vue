<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TabsRootEmits, TabsRootProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { useForwardPropsEmits } from 'reka-ui'
import { Tabs } from '@airovo/uikit-shadcnui'

const props = defineProps<TabsRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TabsRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
    <Tabs
        v-bind="forwarded"
        :data-horizontal="(props.orientation ?? 'horizontal') === 'horizontal' ? '' : undefined"
        :data-vertical="(props.orientation ?? 'horizontal') === 'vertical' ? '' : undefined"
        :class="['group/tabs flex gap-2 data-horizontal:flex-col', props.class]"
    >
        <slot />
    </Tabs>
</template>
