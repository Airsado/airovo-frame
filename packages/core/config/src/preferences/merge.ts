function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

/**
 * Recursively merge `overrides` onto `base`. Only plain objects are
 * walked into — arrays, dates, regexps, class instances etc. are
 * replaced wholesale. `undefined` values in `overrides` are skipped,
 * which means they cannot clear a default; assign `null` instead.
 */
export function deepMerge<T>(base: T, overrides: Partial<T>): T {
    if (!isPlainObject(base) || !isPlainObject(overrides)) {
        return overrides === undefined ? base : (overrides as T)
    }
    const out: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(overrides)) {
        const baseValue = (base as Record<string, unknown>)[key]
        if (isPlainObject(baseValue) && isPlainObject(value)) {
            out[key] = deepMerge(baseValue, value as Record<string, unknown>)
        } else if (value !== undefined) {
            out[key] = value
        }
    }
    return out as T
}