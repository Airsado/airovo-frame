import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export const DATA_TABLE_VIEW_MODES = {
    TABLE: 'table',
    CARD: 'card',
} as const

export type DataTableViewMode = typeof DATA_TABLE_VIEW_MODES[keyof typeof DATA_TABLE_VIEW_MODES]

export interface UseDataTableViewModeOptions {
    /** Optional localStorage key for persisting the selected view mode. */
    storageKey?: MaybeRefOrGetter<string | undefined>
    /** Initial mode used when no persisted value exists. */
    defaultMode?: MaybeRefOrGetter<DataTableViewMode | undefined>
}

function isViewMode(value: unknown): value is DataTableViewMode {
    return value === DATA_TABLE_VIEW_MODES.TABLE || value === DATA_TABLE_VIEW_MODES.CARD
}

function readViewMode(storageKey: string | undefined, fallback: DataTableViewMode): DataTableViewMode {
    if (!storageKey || typeof window === 'undefined') return fallback
    try {
        const value = window.localStorage.getItem(storageKey)
        return isViewMode(value) ? value : fallback
    } catch {
        return fallback
    }
}

function persistViewMode(storageKey: string | undefined, mode: DataTableViewMode): void {
    if (!storageKey || typeof window === 'undefined') return
    try { window.localStorage.setItem(storageKey, mode) } catch { /* storage can be unavailable */ }
}

/**
 * Keeps table/card view state independent from table query and row data state.
 * The optional storage key is deliberately owned by the caller so separate
 * tables do not share a preference accidentally.
 */
export function useDataTableViewMode(options: UseDataTableViewModeOptions = {}) {
    const storageKey = computed(() => toValue(options.storageKey))
    const defaultMode = computed(() => toValue(options.defaultMode) ?? DATA_TABLE_VIEW_MODES.TABLE)
    const viewMode = ref<DataTableViewMode>(readViewMode(storageKey.value, defaultMode.value))

    watch([storageKey, defaultMode], ([key, fallback], previous) => {
        if (key === previous?.[0] && fallback === previous?.[1]) return
        viewMode.value = readViewMode(key, fallback)
    })

    function setViewMode(mode: DataTableViewMode): void {
        if (!isViewMode(mode)) return
        viewMode.value = mode
        persistViewMode(storageKey.value, mode)
    }

    return { viewMode, setViewMode }
}
