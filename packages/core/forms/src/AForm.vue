<script setup lang="ts">

import FormFieldRender from './FormFieldRender.vue'
import type { FormFieldSchema } from './types'
import type { FormApi } from './form-api'
import { computed, toRefs } from 'vue';

const props = defineProps<{
    schema: FormFieldSchema[]
    api: FormApi
}>()

const emit = defineEmits<{
    submit: [values: Record<string, any>]
    'submit-fail': [errors: Record<string, string>]
}>()

const { api } = toRefs(props)
const { isSubmitting, submitForm } = api.value

function onReset() {
    props.api.resetForm()
}
</script>

<template>
    <form @submit.prevent="onSubmit" class="space-y-4">
        <FormFieldRender :schema="props.schema" :api="props.api" />

        <slot name="actions" :errors="props.api?.errors.value" :submitting="isSubmitting" :reset="onReset">
            <!-- 默认 actions 行（消费者可通过 slot="actions" 覆盖） -->
            <div class="flex justify-end gap-2">
                <button type="button"
                    class="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                    @click="onReset">重置</button>
                <button type="submit"
                    class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    :disabled="isSubmitting">{{ isSubmitting ? '提交中...' : '提交' }}</button>
            </div>
        </slot>
    </form>
</template>
