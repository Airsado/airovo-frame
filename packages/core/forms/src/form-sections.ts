import type { FormFieldSchema } from './types'

/** Keep a contiguous section heading with its first rendered field. */
export function isFormSectionStart(
    schema: FormFieldSchema[],
    index: number,
    isRendered: (item: FormFieldSchema) => boolean,
): boolean {
    const item = schema[index]
    if (!item?.section || !isRendered(item)) return false
    for (let previous = index - 1; previous >= 0; previous--) {
        const sibling = schema[previous]!
        if (sibling.section !== item.section) break
        if (isRendered(sibling)) return false
    }
    return true
}
