export type JsonFieldValueType = 'string' | 'number' | 'any'

export interface JsonFieldRow {
    id: string
    key: string
    value: string
}

function scalarText(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value)
}

function flattenNested(value: unknown, path: string, rows: JsonFieldRow[]): void {
    if (Array.isArray(value)) {
        if (!value.length) rows.push({ id: path, key: path, value: '[]' })
        value.forEach((item, index) => flattenNested(item, `${path}[${index}]`, rows))
        return
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
        if (!entries.length) rows.push({ id: path, key: path, value: '{}' })
        entries.forEach(([key, item]) => flattenNested(item, path ? `${path}.${key}` : key, rows))
        return
    }
    rows.push({ id: path, key: path, value: scalarText(value) })
}

export function parseJsonValue(value: string): unknown {
    if (!value.trim()) return undefined
    return JSON.parse(value)
}

export function parseJsonRows(value: string, nested = false): JsonFieldRow[] {
    try {
        const parsed = parseJsonValue(value)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
        if (nested) {
            const rows: JsonFieldRow[] = []
            flattenNested(parsed, '', rows)
            return rows
        }
        return Object.entries(parsed).map(([key, item], index) => ({
            id: `${key}:${index}`,
            key,
            value: typeof item === 'string' ? item : JSON.stringify(item),
        }))
    } catch {
        return []
    }
}

export function serializeJsonRows(rows: JsonFieldRow[], valueType: JsonFieldValueType, nested = false): string {
    if (nested) {
        const result: Record<string, unknown> = {}
        for (const row of rows) {
            const path = row.key.trim()
            if (!path) continue
            let value: unknown = row.value
            if (valueType === 'number') value = row.value.trim() === '' ? 0 : Number(row.value)
            else if (valueType === 'any') {
                try { value = row.value.trim() === '' ? '' : JSON.parse(row.value) } catch { value = row.value }
            }
            setNestedValue(result, path, value)
        }
        return Object.keys(result).length ? JSON.stringify(result, null, 2) : ''
    }
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

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = [...path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)].map((match) => match[1] ?? Number(match[2]))
    if (!segments.length) return
    let current: unknown = target
    segments.forEach((segment, index) => {
        if (!current || typeof current !== 'object') return
        const record = current as Record<string | number, unknown>
        const key = segment as string | number
        if (index === segments.length - 1) {
            record[key] = value
            return
        }
        const next = segments[index + 1]
        if (record[key] === undefined) record[key] = typeof next === 'number' ? [] : {}
        current = record[key]
    })
}

export function formatJson(value: string): string {
    return JSON.stringify(parseJsonValue(value), null, 2)
}

export function jsonError(value: string): string | undefined {
    if (!value.trim()) return undefined
    try { JSON.parse(value); return undefined } catch (error) { return error instanceof Error ? error.message : 'JSON 格式无效' }
}
