<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@airovo/uikit-shadcnui'
import type { CommandMenuGroup, CommandMenuItem, CommandMenuProps } from './types'

defineOptions({ name: 'CommandMenu' })

const props = defineProps({
    groups: { type: Array as PropType<readonly CommandMenuGroup[]>, default: () => [] },
    // An explicit undefined default keeps the prop distinguishable from a controlled false value.
    open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    defaultOpen: { type: Boolean, default: false },
    title: { type: String, default: 'Command Palette' },
    description: { type: String, default: 'Search for a command to run...' },
    placeholder: { type: String, default: '搜索命令…' },
    emptyText: { type: String, default: '没有找到结果。' },
    closeOnSelect: { type: Boolean, default: true },
    contentClass: { type: [String, Array, Object] as PropType<CommandMenuProps['contentClass']>, default: undefined },
})

const emit = defineEmits<{
    (event: 'update:open', value: boolean): void
    (event: 'select', item: CommandMenuItem, group: CommandMenuGroup): void
}>()

const internalOpen = ref(props.defaultOpen)
const isOpen = computed(() => props.open ?? internalOpen.value)

/** Update the dialog visibility while preserving the controlled v-model contract. */
function updateOpen(value: boolean): void {
    if (props.open === undefined) internalOpen.value = value
    emit('update:open', value)
}

/** Emit the selected business item and optionally close the command palette. */
function selectItem(item: CommandMenuItem, group: CommandMenuGroup): void {
    emit('select', item, group)
    if (props.closeOnSelect) updateOpen(false)
}
</script>

<template>
    <Dialog :open="isOpen" @update:open="updateOpen">
        <DialogContent :show-close-button="false" :class="['top-1/3 translate-y-0 overflow-hidden rounded-xl p-0', props.contentClass]">
            <DialogHeader class="sr-only">
                <DialogTitle>{{ props.title }}</DialogTitle>
                <DialogDescription>{{ props.description }}</DialogDescription>
            </DialogHeader>
            <Command>
                <CommandInput :placeholder="props.placeholder" />
                <CommandList>
                    <CommandEmpty>{{ props.emptyText }}</CommandEmpty>
                    <template v-for="(group, groupIndex) in props.groups" :key="group.id">
                        <slot name="group" :group="group" :index="groupIndex">
                            <CommandGroup :heading="group.label">
                                <CommandItem
                                    v-for="item in group.items"
                                    :key="item.id"
                                    :value="item.value ?? item.label"
                                    :disabled="item.disabled"
                                    @select="selectItem(item, group)"
                                >
                                    <slot name="item" :item="item" :group="group">
                                        {{ item.label }}
                                    </slot>
                                    <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
                                </CommandItem>
                            </CommandGroup>
                        </slot>
                    </template>
                    <slot />
                </CommandList>
            </Command>
        </DialogContent>
    </Dialog>
</template>
