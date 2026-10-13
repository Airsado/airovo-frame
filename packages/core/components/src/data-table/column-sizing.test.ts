import { describe, expect, it } from 'vitest'
import { normalizeDataTableColumnSizing } from './column-sizing'

describe('data table column sizing persistence', () => {
    it('drops unknown/invalid widths and clamps current bounds', () => {
        expect(normalizeDataTableColumnSizing([
            { key: 'name', minSize: 100, maxSize: 220 },
            { key: 'kind', minSize: 80 },
        ], {
            name: 400,
            kind: 20,
            removed: 180,
            invalid: Number.NaN,
        })).toEqual({ name: 220, kind: 80 })
    })
})
