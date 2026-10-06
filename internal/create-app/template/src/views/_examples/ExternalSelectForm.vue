<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from '@airovo/forms'

const [SelectForm, selectFormApi] = useForm({
    layout: 'vertical',
    showDefaultActions: false,
    schema: [{
        component: 'Select',
        fieldName: 'category',
        label: '外部子表单分类',
        rules: 'required',
        defaultValue: 'general',
        componentProps: {
            'aria-label': '外部子表单分类',
            'data-test': 'external-select-category',
            options: [
                { label: '常规', value: 'general' },
                { label: '自定义', value: 'custom' },
                { label: '停用（不可选）', value: 'disabled', disabled: true },
            ],
        },
    }],
})

const selectedCategory = computed(() => {
    const value = selectFormApi.values.value.category
    return Array.isArray(value) ? value[0]?.value ?? '' : value ?? ''
})
</script>

<template>
    <div data-test="external-select-form">
        <SelectForm />
        <p class="mt-2 text-xs text-muted-foreground" data-test="external-select-value">外部子表单当前值：{{ selectedCategory }}</p>
    </div>
</template>
