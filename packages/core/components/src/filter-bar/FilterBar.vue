<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@airovo/shared/icons'
import { Button, Input } from '@airovo/uikit-shadcnui'

defineOptions({ name: 'FilterBar' })

const props = withDefaults(defineProps<{
    modelValue?: string
    placeholder?: string
    clearable?: boolean
    class?: string
}>(), {
    modelValue: '',
    clearable: true,
})

const { t } = useI18n({ useScope: 'global' })

const emit = defineEmits<{
    'update:modelValue': [value: string]
    clear: []
}>()

const hasSearch = computed(() => props.modelValue.length > 0)

function clear() {
    emit('update:modelValue', '')
    emit('clear')
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-2" :class="$props.class">
        <div class="relative min-w-52 flex-1 sm:max-w-xs">
            <Icon icon="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input :model-value="modelValue" :placeholder="placeholder ?? t('common.search')" class="h-8 pl-8 pr-8 text-sm" @update:model-value="emit('update:modelValue', String($event ?? ''))" />
            <Button v-if="clearable && hasSearch" type="button" variant="ghost" size="icon" class="absolute right-0.5 top-0.5 size-7 text-muted-foreground hover:text-foreground" :aria-label="t('common.clearSearch')" @click="clear">
                <Icon icon="lucide:x" class="size-3.5" />
            </Button>
        </div>
        <div v-if="$slots.filters" class="flex flex-wrap items-center gap-1.5"><slot name="filters" /></div>
        <div v-if="$slots.actions" class="ml-auto flex flex-wrap items-center gap-1.5"><slot name="actions" /></div>
    </div>
</template>
