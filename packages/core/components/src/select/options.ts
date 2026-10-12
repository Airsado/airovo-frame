export interface SelectOption {
    label: string
    value?: string
    disabled?: boolean
    children?: SelectOption[]
}

export interface FlattenedSelectOption {
    option: SelectOption
    depth: number
    group: boolean
}

export function flattenSelectOptions(options: SelectOption[], depth = 0): FlattenedSelectOption[] {
    return options.flatMap((option) => {
        const children = option.children ?? []
        const current = children.length > 0
            ? [{ option, depth, group: true }]
            : [{ option, depth, group: false }]
        return children.length > 0 ? [...current, ...flattenSelectOptions(children, depth + 1)] : current
    })
}

export function selectableSelectOptions(options: SelectOption[]): SelectOption[] {
    return flattenSelectOptions(options).filter(item => !item.group && item.option.value !== undefined).map(item => item.option)
}
