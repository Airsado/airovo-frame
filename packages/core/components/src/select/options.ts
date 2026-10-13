export interface SelectOption {
    label: string
    value?: string
    description?: string
    icon?: string
    disabled?: boolean
    children?: SelectOption[]
}

export interface FlattenedSelectOption {
    option: SelectOption
    depth: number
    group: boolean
    key: string
}

export function flattenSelectOptions(options: SelectOption[], depth = 0, parentKey = ''): FlattenedSelectOption[] {
    return options.flatMap((option, index) => {
        const children = option.children ?? []
        const key = parentKey ? `${parentKey}.${index}` : `${index}`
        const current = children.length > 0
            ? [{ option, depth, group: true, key }]
            : [{ option, depth, group: false, key }]
        return children.length > 0 ? [...current, ...flattenSelectOptions(children, depth + 1, key)] : current
    })
}

export function selectableSelectOptions(options: SelectOption[]): SelectOption[] {
    return flattenSelectOptions(options).filter(item => !item.group && item.option.value !== undefined).map(item => item.option)
}
