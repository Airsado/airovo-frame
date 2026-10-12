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

    it('flattens and rebuilds nested objects and arrays', () => {
        const rows = parseJsonRows('{"server":{"host":"localhost","ports":[80,443]}}', true)
        expect(rows.map((row) => row.key)).toEqual(['server.host', 'server.ports[0]', 'server.ports[1]'])
        expect(JSON.parse(serializeJsonRows(rows, 'any', true))).toEqual({ server: { host: 'localhost', ports: [80, 443] } })
    })
})
