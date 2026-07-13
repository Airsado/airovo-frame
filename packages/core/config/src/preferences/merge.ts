import type { DeepPartial } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

/**
 * Recursively merge any number of `overrides` onto `base` (left-to-right:
 * later overrides win). Only plain objects are walked into — arrays,
 * dates, regexps, class instances etc. are replaced wholesale.
 * `undefined` values in `overrides` are skipped, which means they
 * cannot clear a default; assign `null` instead.
 */
export function deepMerge<T>(base: T, ...overrides: Array<DeepPartial<T>>): T {
    let acc: T = base
    for (const overridesLayer of overrides) {
        if (!isPlainObject(acc) || !isPlainObject(overridesLayer)) {
            acc = overridesLayer === undefined ? acc : (overridesLayer as T)
            continue
        }
        const out: Record<string, unknown> = { ...(acc as Record<string, unknown>) }
        for (const [key, value] of Object.entries(overridesLayer)) {
            const baseValue = (acc as Record<string, unknown>)[key]
            if (isPlainObject(baseValue) && isPlainObject(value)) {
                out[key] = deepMerge(baseValue, value as Record<string, unknown>)
            } else if (value !== undefined) {
                out[key] = value
            }
        }
        acc = out as T
    }
    return acc
}