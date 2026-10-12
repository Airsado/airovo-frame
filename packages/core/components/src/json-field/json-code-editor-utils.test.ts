import { describe, expect, it } from 'vitest'
import { applyJsonSmartEnter, formatJsonDraft, getCursorLocation, getJsonValidationState } from './json-code-editor-utils'

describe('json code editor utilities', () => {
    it('validates and formats JSON without changing invalid drafts', () => {
        expect(getJsonValidationState('{"ok":true}')).toEqual({ isValid: true, message: 'JSON' })
        expect(getJsonValidationState('{"ok":}').isValid).toBe(false)
        expect(formatJsonDraft('{"ok":true}').value).toBe('{\n  "ok": true\n}')
        expect(formatJsonDraft('{"ok":}')).toEqual({ didFormat: false, value: '{"ok":}' })
    })

    it('reports cursor positions and inserts nested indentation', () => {
        expect(getCursorLocation('{\n  "a": 1', 4)).toEqual({ line: 2, column: 3 })
        expect(applyJsonSmartEnter('{\n  "a": {}}', 10, 10)?.value).toBe('{\n  "a": {\n    \n  }}')
    })
})
