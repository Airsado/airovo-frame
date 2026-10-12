export type JsonFieldValueType = 'string' | 'number' | 'any'

export interface JsonFieldRow {
    id: string
    key: string
    value: string
}

export function parseJsonValue(value: string): unknown {
    if (!value.trim()) return undefined
    return JSON.parse(value)
}

export function parseJsonRows(value: string): JsonFieldRow[] {
    try {
        const parsed = parseJsonValue(value)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
        return Object.entries(parsed).map(([key, item], index) => ({
            id: `${key}:${index}`,
            key,
            value: typeof item === 'string' ? item : JSON.stringify(item),
        }))
    } catch {
        return []
    }
}

export function serializeJsonRows(rows: JsonFieldRow[], valueType: JsonFieldValueType): string {
    const result: Record<string, unknown> = {}
    for (const row of rows) {
        const key = row.key.trim()
        if (!key) continue
        const value = row.value.trim()
        if (valueType === 'number') {
            result[key] = value === '' ? 0 : Number(value)
        } else if (valueType === 'any') {
            try { result[key] = value === '' ? '' : JSON.parse(value) } catch { result[key] = row.value }
        } else {
            result[key] = row.value
        }
    }
    return Object.keys(result).length ? JSON.stringify(result, null, 2) : ''
}

export function formatJson(value: string): string {
    return JSON.stringify(parseJsonValue(value), null, 2)
}

export function jsonError(value: string): string | undefined {
    if (!value.trim()) return undefined
    try { JSON.parse(value); return undefined } catch (error) { return error instanceof Error ? error.message : 'JSON 格式无效' }
}
