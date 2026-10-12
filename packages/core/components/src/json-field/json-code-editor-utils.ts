export interface JsonCursorLocation { line: number; column: number }

export interface JsonTextEdit { value: string; selectionStart: number; selectionEnd: number }

export function getJsonValidationState(value: string): { isValid: boolean; message: string } {
    if (!value.trim()) return { isValid: true, message: 'JSON' }
    try { JSON.parse(value); return { isValid: true, message: 'JSON' } } catch { return { isValid: false, message: 'JSON 格式无效' } }
}

export function formatJsonDraft(value: string): { didFormat: boolean; value: string } {
    if (!value.trim()) return { didFormat: false, value }
    try { return { didFormat: true, value: JSON.stringify(JSON.parse(value), null, 2) } } catch { return { didFormat: false, value } }
}

export function getCursorLocation(value: string, selectionStart: number): JsonCursorLocation {
    const bounded = Math.min(Math.max(selectionStart, 0), value.length)
    const lines = value.slice(0, bounded).split('\n')
    return { line: lines.length, column: (lines.at(-1) ?? '').length + 1 }
}

export function applyJsonSmartEnter(value: string, selectionStart: number, selectionEnd: number): JsonTextEdit | undefined {
    const before = value.slice(0, selectionStart)
    const after = value.slice(selectionEnd)
    const lineStart = before.lastIndexOf('\n') + 1
    const indent = before.slice(lineStart).match(/^\s*/)?.[0] ?? ''
    const previous = before.trimEnd().at(-1)
    const next = after.trimStart().at(0)
    const nested = previous === '{' || previous === '['
    const paired = (previous === '{' && next === '}') || (previous === '[' && next === ']')
    if (!nested && !indent) return undefined
    const inner = `${indent}  `
    const insert = paired ? `\n${inner}\n${indent}` : `\n${nested ? inner : indent}`
    const cursor = selectionStart + (paired ? 1 + inner.length : insert.length)
    return { value: `${before}${insert}${after}`, selectionStart: cursor, selectionEnd: cursor }
}
