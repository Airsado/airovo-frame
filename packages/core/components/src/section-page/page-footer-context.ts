import type { InjectionKey, Ref } from 'vue'

export const pageFooterTargetKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('airovo-page-footer-target')
