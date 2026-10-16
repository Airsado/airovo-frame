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

export interface SelectOptionSection {
    group?: FlattenedSelectOption
    items: FlattenedSelectOption[]
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

/** Keep top-level parent groups as real SelectGroup boundaries. */
export function groupSelectOptions(options: SelectOption[]): SelectOptionSection[] {
    const sections: SelectOptionSection[] = []
    let current: SelectOptionSection | undefined

    function flush(): void {
        if (current && current.items.length) sections.push(current)
        current = undefined
    }

    for (const item of flattenSelectOptions(options)) {
        if (item.depth === 0) {
            flush()
            current = item.group ? { group: item, items: [] } : { items: [item] }
            continue
        }
        current ??= { items: [] }
        current.items.push(item)
    }
    flush()
    return sections
}
