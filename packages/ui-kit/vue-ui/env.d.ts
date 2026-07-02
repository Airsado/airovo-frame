import "@vue/runtime-core";

declare module "@vue/runtime-core" {
    export interface HTMLAttributes {
        'data-slot'?: string
        'data-sidebar'?: string
        'data-side'?: string
        'data-variant'?: string
        'data-collapsible'?: string
        'data-state'?: string
    }
}
