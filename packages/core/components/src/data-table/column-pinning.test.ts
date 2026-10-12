import { describe, expect, it } from 'vitest'
import { parseStoredDataTableColumnPinning, resolveDataTableColumnPinning } from './column-pinning'

describe('data table column pinning', () => {
    it('computes cumulative left and right offsets in visible order', () => {
        const resolved = resolveDataTableColumnPinning([
            { id: 'name', width: 180 },
            { id: 'type', width: 120 },
            { id: 'status', width: 100 },
            { id: 'actions', width: 96 },
        ], { name: 'left', type: 'left', actions: 'right' })

        expect(resolved.get('name')).toEqual({ id: 'name', side: 'left', offset: 0, edge: false })
        expect(resolved.get('type')).toEqual({ id: 'type', side: 'left', offset: 180, edge: true })
        expect(resolved.get('actions')).toEqual({ id: 'actions', side: 'right', offset: 0, edge: true })
        expect(resolved.has('status')).toBe(false)
    })

    it('ignores invalid stored sides while keeping valid entries', () => {
        expect(parseStoredDataTableColumnPinning('{"name":"left","actions":"right","status":"middle"}'))
            .toEqual({ name: 'left', actions: 'right' })
        expect(parseStoredDataTableColumnPinning('invalid')).toEqual({})
        expect(parseStoredDataTableColumnPinning(null)).toEqual({})
    })
})
