// Adapters
export { installElementPlus, ElementPlusAdapter } from './adapters/element-plus'
export { installNaiveUI, NaiveUIAdapter } from './adapters/naive-ui'

// Unified installer
export { installAdapters, type InstallAdaptersOptions } from './install'

// Types
export type {
    Adapter,
    AdapterContext,
    ElementPlusOptions,
    NaiveUIOptions,
} from './types'
