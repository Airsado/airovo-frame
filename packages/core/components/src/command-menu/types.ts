import type { HTMLAttributes } from 'vue'

export interface CommandMenuItem {
    id: string
    label: string
    value?: string
    shortcut?: string
    disabled?: boolean
}

export interface CommandMenuGroup {
    id: string
    label?: string
    items: readonly CommandMenuItem[]
}

export interface CommandMenuProps {
    groups: readonly CommandMenuGroup[]
    open?: boolean
    defaultOpen?: boolean
    title?: string
    description?: string
    placeholder?: string
    emptyText?: string
    closeOnSelect?: boolean
    contentClass?: HTMLAttributes['class']
}
