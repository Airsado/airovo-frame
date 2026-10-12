<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@airovo/uikit-shadcnui'
import DrawerBody from './DrawerBody.vue'
import DrawerContent from './DrawerContent.vue'
import DrawerDescription from './DrawerDescription.vue'
import DrawerFooter from './DrawerFooter.vue'
import DrawerHeader from './DrawerHeader.vue'
import DrawerTitle from './DrawerTitle.vue'

defineOptions({ name: 'DrawerLayout' })

const props = withDefaults(defineProps<{
    title?: string
    description?: string
    side?: 'bottom' | 'right'
    showHandle?: boolean
    class?: HTMLAttributes['class']
    bodyClass?: HTMLAttributes['class']
    headerClass?: HTMLAttributes['class']
    footerClass?: HTMLAttributes['class']
}>(), {
    side: 'bottom',
    showHandle: true,
})
</script>

<template>
    <DrawerContent :side="props.side" :show-handle="props.showHandle" :class="props.class">
        <DrawerHeader v-if="$slots.header || props.title || props.description" :class="props.headerClass">
            <slot name="header">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <DrawerTitle v-if="props.title">{{ props.title }}</DrawerTitle>
                        <DrawerDescription v-if="props.description">{{ props.description }}</DrawerDescription>
                    </div>
                    <div v-if="$slots.actions" class="shrink-0"><slot name="actions" /></div>
                </div>
            </slot>
        </DrawerHeader>
        <DrawerBody :class="cn('min-h-0', props.bodyClass)"><slot /></DrawerBody>
        <DrawerFooter v-if="$slots.footer" :class="props.footerClass"><slot name="footer" /></DrawerFooter>
    </DrawerContent>
</template>
