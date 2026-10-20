import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { TagInput } from './index'

let wrapper: VueWrapper | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
})

function mountControlled(initial: string[] = [], options: Record<string, unknown> = {}) {
    const value = ref(initial)
    wrapper = mount(defineComponent({
        setup: () => () => h(TagInput, {
            ...options,
            modelValue: value.value,
            'onUpdate:modelValue': (next: string[]) => { value.value = next },
        }),
    }), { attachTo: document.body })
    return { value, input: wrapper.get<HTMLInputElement>('input') }
}

describe('TagInput', () => {
    it('commits trimmed unique tags on Enter, comma and blur and consumes draft-only input', async () => {
        const original = ['first']
        const { value, input } = mountControlled(original)
        await input.setValue('  second  ')
        expect(value.value).toEqual(['first'])
        await input.trigger('keydown', { key: 'Enter' })
        expect(value.value).toEqual(['first', 'second'])
        expect(original).toEqual(['first'])
        expect(input.element.value).toBe('')
        await input.setValue('second')
        await input.trigger('keydown', { key: ',' })
        expect(value.value).toEqual(['first', 'second'])
        expect(input.element.value).toBe('')
        await input.setValue('   ')
        await input.trigger('keydown', { key: 'Enter' })
        expect(value.value).toHaveLength(2)
        await input.setValue(' third ')
        await input.trigger('blur')
        expect(value.value).toEqual(['first', 'second', 'third'])
        value.value = ['loaded']
        await flushPromises()
        expect(wrapper!.findAll('[data-slot="tag-input-tag"]').map((tag) => tag.text())).toEqual(['loaded'])
    })

    it('prevents tag confirmation from bubbling into an outer form submit shortcut', async () => {
        const submit = vi.fn((event: Event) => event.preventDefault())
        const shortcut = vi.fn()
        wrapper = mount(defineComponent({
            setup: () => () => h('form', { onSubmit: submit, onKeydown: shortcut }, [h(TagInput)]),
        }), { attachTo: document.body })
        const input = wrapper.get('input')
        await input.setValue('tag')
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        input.element.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(true)
        expect(shortcut).not.toHaveBeenCalled()
        expect(submit).not.toHaveBeenCalled()
        const ime = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })
        input.element.dispatchEvent(ime)
        expect(ime.defaultPrevented).toBe(false)
        expect(shortcut).not.toHaveBeenCalled()
    })

    it('keeps IME confirmation out of tags and only removes the last tag from an empty draft', async () => {
        const { value, input } = mountControlled(['one', 'two'])
        await input.trigger('compositionstart')
        await input.setValue('中文')
        await input.trigger('keydown', { key: 'Enter', isComposing: true })
        expect(value.value).toEqual(['one', 'two'])
        expect(input.element.value).toBe('中文')
        await input.trigger('compositionend')
        await input.trigger('keydown', { key: 'Enter' })
        expect(value.value).toEqual(['one', 'two', '中文'])
        await input.setValue('draft')
        await input.trigger('keydown', { key: 'Backspace' })
        expect(value.value).toHaveLength(3)
        await input.setValue('')
        await input.trigger('keydown', { key: 'Backspace' })
        expect(value.value).toEqual(['one', 'two'])
        await wrapper!.get('[aria-label="Remove one"]').trigger('click')
        expect(value.value).toEqual(['two'])
        expect(document.activeElement).toBe(input.element)
    })

    it.each(['disabled', 'readOnly'] as const)('does not mutate values through the %s control', async (state) => {
        const { value, input } = mountControlled(['kept'], { [state]: true })
        expect(wrapper!.find('[data-slot="tag-input-remove"]').exists()).toBe(false)
        expect(input.attributes(state === 'disabled' ? 'disabled' : 'readonly')).toBeDefined()
        await input.setValue('blocked')
        await input.trigger('keydown', { key: 'Enter' })
        await input.trigger('blur')
        await input.setValue('')
        await input.trigger('keydown', { key: 'Backspace' })
        expect(value.value).toEqual(['kept'])
    })

    it('forwards field identity, validation and focus to the real input and localizes remove actions', async () => {
        const blur = vi.fn()
        const focus = vi.fn()
        const { input } = mountControlled(['existing'], {
            id: 'tags', name: 'tags', 'aria-invalid': true, 'aria-describedby': 'hint',
            onBlur: blur, onFocus: focus, removeTagLabel: (tag: string) => `删除 ${tag}`,
        })
        expect(input.attributes('id')).toBe('tags')
        expect(input.attributes('name')).toBe('tags')
        expect(input.attributes('aria-invalid')).toBe('true')
        expect(input.attributes('aria-describedby')).toBe('hint')
        expect(wrapper!.get('[data-slot="tag-input"]').attributes('id')).toBeUndefined()
        await wrapper!.get('[data-slot="tag-input"]').trigger('click')
        expect(document.activeElement).toBe(input.element)
        expect(focus).toHaveBeenCalledOnce()
        await input.trigger('blur')
        expect(blur).toHaveBeenCalledOnce()
        expect(wrapper!.get('button').attributes('aria-label')).toBe('删除 existing')
        expect(wrapper!.get('button').attributes('type')).toBe('button')
    })

    it('stays controlled rather than applying an emitted array locally', async () => {
        wrapper = mount(TagInput, { props: { modelValue: ['one'] } })
        const input = wrapper.get('input')
        await input.setValue('two')
        await input.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('update:modelValue')).toEqual([[['one', 'two']]])
        expect(wrapper.findAll('[data-slot="tag-input-tag"]').map((tag) => tag.text())).toEqual(['one'])
        await wrapper.setProps({ modelValue: ['one', 'two'] })
        expect(wrapper.findAll('[data-slot="tag-input-tag"]')).toHaveLength(2)
    })
})
