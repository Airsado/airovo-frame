import { describe, expect, it } from 'vitest'
import { normalizeDataTableColumnVisibility } from './column-visibility'

describe('data table column visibility', () => {
    const columns = [
        { key: 'name', title: '名称' },
        { key: 'kind', title: '类型' },
        { key: 'hidden', title: '隐藏', hidden: true },
    ]

    it('filters unknown and invalid stored values against current columns', () => {
        expect(normalizeDataTableColumnVisibility(columns, { name: false, kind: 'invalid' as never, old: false }))
            .toEqual({ name: false, kind: true })
    })

    it('keeps one configurable column visible when storage hides all', () => {
        expect(normalizeDataTableColumnVisibility(columns, { name: false, kind: false }))
            .toEqual({ name: true, kind: false })
    })
})
