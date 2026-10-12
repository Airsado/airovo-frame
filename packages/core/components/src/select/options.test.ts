import { describe, expect, it } from 'vitest'
import { flattenSelectOptions, selectableSelectOptions } from './options'

describe('select option hierarchy', () => {
    const options = [
        { label: '内容', children: [
            { label: '文章', value: 'articles' },
            { label: '媒体', children: [{ label: '视频', value: 'videos', disabled: true }] },
        ] },
        { label: '设置', value: 'settings' },
    ]

    it('flattens parent labels and nested selectable children with depth', () => {
        expect(flattenSelectOptions(options).map(item => [item.option.label, item.depth, item.group, item.key])).toEqual([
            ['内容', 0, true, '0'],
            ['文章', 1, false, '0.0'],
            ['媒体', 1, true, '0.1'],
            ['视频', 2, false, '0.1.0'],
            ['设置', 0, false, '1'],
        ])
    })

    it('keeps only leaf values in selected-label lookup', () => {
        expect(selectableSelectOptions(options).map(option => option.value)).toEqual(['articles', 'videos', 'settings'])
    })
})
