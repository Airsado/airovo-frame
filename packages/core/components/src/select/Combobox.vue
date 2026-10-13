<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { computed, ref, type PropType } from 'vue'
import { cn } from '@airovo/uikit-shadcnui'
import { Button } from '@airovo/uikit-shadcnui/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@airovo/uikit-shadcnui/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@airovo/uikit-shadcnui/components/ui/popover'
import { Icon } from '@airovo/shared/icons'
import { selectableSelectOptions, type SelectOption } from './options'

defineOptions({ name: 'Combobox' })

const props = defineProps({
    options: { type: Array as PropType<SelectOption[]>, default: () => [] },
    placeholder: { type: String, default: '请选择' },
    searchPlaceholder: { type: String, default: '搜索选项' },
    emptyText: { type: String, default: '没有匹配的选项' },
    disabled: { type: Boolean, default: false },
    allowCustomValue: { type: Boolean, default: false },
    showSelectedIcon: { type: Boolean, default: false },
    openOnFocus: { type: Boolean, default: false },
    popupClass: { type: String, default: undefined },
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    ariaLabel: { type: String, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
    ariaDescribedby: { type: String, default: undefined },
    ariaInvalid: { type: [Boolean, String] as PropType<boolean | string | undefined>, default: undefined },
    class: { type: String, default: undefined },
})

const modelValue = defineModel<string | undefined>()
const open = ref(false)
const search = ref('')
const selectableOptions = computed(() => selectableSelectOptions(props.options))
const filteredOptions = computed(() => {
    const term = search.value.trim().toLocaleLowerCase()
    if (!term) return selectableOptions.value
    return selectableOptions.value.filter((option) => option.label.toLocaleLowerCase().includes(term) || option.value?.toLocaleLowerCase().includes(term))
})
const selectedOption = computed(() => selectableOptions.value.find((option) => option.value === modelValue.value))
const selectedLabel = computed(() => selectedOption.value?.label ?? modelValue.value)

function select(value: string): void {
    modelValue.value = value
    updateOpen(false)
}

function updateOpen(value: boolean): void {
    open.value = value && !props.disabled
    if (!open.value) search.value = ''
}

function onSearchInput(event: Event): void {
    search.value = (event.target as HTMLInputElement | null)?.value ?? ''
}

function selectCustom(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        updateOpen(false)
        return
    }
    if (!props.allowCustomValue || event.key !== 'Enter') return
    const value = (event.target as HTMLInputElement | null)?.value?.trim()
    if (value) select(value)
}
</script>

<template>
    <Popover :open="open" @update:open="updateOpen">
        <PopoverTrigger as-child>
            <Button
                :id="props.id"
                :name="props.name"
                variant="outline"
                role="combobox"
                :aria-expanded="open"
                :aria-label="props.ariaLabel"
                :aria-labelledby="props.ariaLabelledby"
                :aria-describedby="props.ariaDescribedby"
                :aria-invalid="props.ariaInvalid"
                :disabled="props.disabled"
                :class="cn('h-8 w-full justify-between rounded-lg font-normal select-none', !selectedLabel && 'text-muted-foreground', props.class)"
                @focus="props.openOnFocus && updateOpen(true)"
            >
                <span v-if="props.showSelectedIcon && selectedOption?.icon" data-slot="combobox-selected-icon" class="mr-2 flex size-4 shrink-0 items-center" aria-hidden="true">
                    <Icon :icon="selectedOption.icon" class="size-4" />
                </span>
                <span class="min-w-0 truncate">{{ selectedLabel ?? props.placeholder }}</span>
                <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent :class="['w-(--reka-popover-trigger-width) min-w-48 rounded-lg border-0 p-0 ring-1 ring-foreground/10', props.popupClass]" align="start">
            <Command>
                <CommandInput
                    :placeholder="props.searchPlaceholder"
                    :model-value="search"
                    @input="onSearchInput"
                    @update:model-value="search = String($event ?? '')"
                    @keydown="selectCustom"
                />
                <CommandList>
                    <CommandEmpty>{{ props.emptyText }}</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in filteredOptions"
                            :key="option.value"
                            :value="`${option.label} ${option.value ?? ''}`"
                            :disabled="option.disabled"
                            class="relative rounded-md py-1 pr-8 pl-1.5"
                            @select="select(option.value!)"
                        >
                            <Check v-if="props.showSelectedIcon" :class="cn('size-4 shrink-0', modelValue === option.value ? 'opacity-100' : 'opacity-0')" />
                            <Icon v-if="option.icon" :icon="option.icon" class="size-4 shrink-0" aria-hidden="true" />
                            <span class="min-w-0 break-words">
                                <span>{{ option.label }}</span>
                                <span v-if="option.description" class="text-muted-foreground block text-xs break-all">{{ option.description }}</span>
                            </span>
                            <span aria-hidden="true" class="sr-only">{{ option.value }}</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
</template>
