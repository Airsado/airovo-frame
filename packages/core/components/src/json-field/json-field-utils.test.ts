import { describe, expect, it } from 'vitest'
import { formatJson, jsonError, parseJsonRows, serializeJsonRows } from './json-field-utils'

describe('json field utilities', () => {
    it('round-trips visual rows for string, number and any values', () => {
        const rows = parseJsonRows('{"name":"Ada","age":36,"enabled":true}')
        expect(serializeJsonRows(rows, 'string')).toContain('"age": "36"')
        expect(serializeJsonRows(rows, 'number')).toContain('"age": 36')
        expect(serializeJsonRows(rows, 'any')).toContain('"enabled": true')
    })

    it('reports invalid drafts without destroying the draft', () => {
        expect(jsonError('{"name":}')).toBeTruthy()
        expect(formatJson('{"name":"Ada"}')).toBe('{\n  "name": "Ada"\n}')
    })
})
