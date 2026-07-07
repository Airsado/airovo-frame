<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Button } from '@airovo/uikit-shadcnui'
import { RESULT_PRESET, type ResultStatus } from './types'

const props = withDefaults(defineProps<{
    status: ResultStatus
    title?: string
    description?: string
    primaryText?: string
    secondaryText?: string
    class?: string
}>(), {})

defineEmits<{
    (e: 'primary', ev: MouseEvent): void
    (e: 'secondary', ev: MouseEvent): void
}>()

const router = useRouter()

const preset = computed(() => RESULT_PRESET[props.status])
const finalTitle = computed(() => props.title ?? preset.value.title)
const finalDescription = computed(() => props.description ?? preset.value.description)
const finalSecondaryText = computed(() => props.secondaryText ?? preset.value.secondaryText)
const hasSecondary = computed(() => !!finalSecondaryText.value)

function handleSecondary() {
    if (props.status === '403' || props.status === '404' || props.status === '500') {
        router.push('/')
    }
}
</script>

<template>
    <div
        :class="[
            'flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 text-foreground text-center',
            props.class,
        ]"
    >
        <Icon :icon="preset.icon" class="size-32 text-primary/80" />
        <div class="space-y-2">
            <h1 class="text-2xl font-semibold">{{ finalTitle }}</h1>
            <p v-if="finalDescription" class="max-w-md text-sm text-muted-foreground">
                {{ finalDescription }}
            </p>
        </div>
        <slot name="extra" />
        <div class="flex flex-wrap items-center justify-center gap-3">
            <Button v-if="primaryText" @click="$emit('primary', $event)">
                {{ primaryText }}
            </Button>
            <Button
                v-if="hasSecondary"
                variant="outline"
                @click="$emit('secondary', $event); handleSecondary()"
            >
                {{ finalSecondaryText }}
            </Button>
        </div>
    </div>
</template>
