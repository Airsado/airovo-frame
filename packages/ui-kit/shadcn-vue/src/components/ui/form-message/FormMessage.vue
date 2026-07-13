<script setup lang="ts">
/**
 * FormMessage — v5-style error display for a form field.
 *
 * Two ways to use it:
 *   1. Standalone: pass `error` as a prop and place it under your
 *      field input.
 *   2. Form-context: if used inside `<BasicForm>` (which uses the
 *      form's `provide` context), it auto-pulls the error for the
 *      field named by the `for` prop.
 *
 * For most apps, `<FormFieldRender>` already renders the error
 * inline; `FormMessage` is the escape hatch for apps that roll
 * their own field layout.
 */
import { computed, inject } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
    /** Field name — used to look up the error from the form context. */
    for?: string
    /** Explicit error message (overrides the form-context lookup). */
    error?: string
    /** Show the warning icon (default true). */
    showIcon?: boolean
}>()

// Optional form-context lookup. Apps using the basic form provide
// `formApi` via provide/inject; this lets FormMessage auto-pull
// the error for `props.for`.
const formApi = inject<{ errors?: { value?: Record<string, string> } } | null>(
    'airovoFormApi',
    null,
)

const message = computed(() => {
    if (props.error !== undefined) return props.error
    if (props.for && formApi?.errors?.value) {
        return formApi.errors.value[props.for] ?? ''
    }
    return ''
})

const visible = computed(() => Boolean(message.value))
</script>

<template>
    <p
        v-if="visible"
        :id="props.for ? `${props.for}-error` : undefined"
        role="alert"
        class="flex items-start gap-1.5 text-sm text-destructive mt-1.5"
    >
        <Icon
            v-if="showIcon !== false"
            icon="lucide:circle-alert"
            class="mt-0.5 size-3.5 shrink-0"
        />
        <span>{{ message }}</span>
    </p>
</template>
