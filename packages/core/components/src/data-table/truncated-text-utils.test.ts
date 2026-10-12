import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import { getTruncatedText } from './truncated-text-utils'

describe('getTruncatedText', () => {
    it('extracts strings, numbers and nested vnode text', () => {
        expect(getTruncatedText(['a', 2, h('span', 'b'), h('strong', ['c', h('em', 'd')])])).toBe('a2bcd')
    })

    it('ignores empty and non-text values', () => {
        expect(getTruncatedText([null, undefined, false, h('svg')])).toBe('')
    })
})
