/**
 * Async glob loader: takes glob patterns + the bundler's `import.meta.glob`
 * result, resolves each match, and returns the merged default exports.
 *
 * Generic over the export shape so the helper works for route modules
 * or any other glob-discovered default export.
 */
export async function loadAllModules<T>(
    patterns: string[],
    globs: Record<string, () => Promise<{ default: T }>>,
): Promise<T[]> {
    const out: T[] = []
    for (const pattern of patterns) {
        const load = globs[pattern]
        if (!load) continue
        const mod = await load()
        if (mod?.default) out.push(mod.default)
    }
    return out
}
