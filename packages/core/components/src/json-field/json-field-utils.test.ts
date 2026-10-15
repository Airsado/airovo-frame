import { describe, expect, it } from 'vitest'
import { formatJson, jsonError, jsonRowsError, parseJsonRows, serializeJsonRows } from './json-field-utils'

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

    it('rejects invalid number rows without converting them to null', () => {
        const rows = [{ id: '1', key: 'age', value: 'not-a-number' }]
        expect(jsonRowsError(rows, 'number')).toContain('必须是数字')
    })

    it('flattens and rebuilds nested objects and arrays', () => {
        const rows = parseJsonRows('{"server":{"host":"localhost","ports":[80,443]}}', true)
        expect(rows.map((row) => row.key)).toEqual(['server.host', 'server.ports[0]', 'server.ports[1]'])
        expect(JSON.parse(serializeJsonRows(rows, 'any', true))).toEqual({ server: { host: 'localhost', ports: [80, 443] } })
    })
})
