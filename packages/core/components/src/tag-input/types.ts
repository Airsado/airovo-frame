import type { HTMLAttributes } from 'vue'

export interface TagInputProps {
    /** Committed tags. The draft text stays local until Enter, comma or blur. */
    modelValue?: string[]
    disabled?: boolean
    readOnly?: boolean
    placeholder?: string
    class?: HTMLAttributes['class']
    inputClass?: HTMLAttributes['class']
    /** Accessible, localizable name of each remove action. */
    removeTagLabel?: (tag: string) => string
}
