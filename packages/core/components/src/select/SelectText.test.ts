// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import SearchSelect from './SearchSelect.vue'

const stubs = {
    Popover: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    Command: { template: '<div><slot /></div>' },
    CommandInput: { props: ['placeholder'], template: '<input data-command-input :placeholder="placeholder" />' },
    CommandList: { template: '<div><slot /></div>' },
    CommandEmpty: { template: '<div data-command-empty><slot /></div>' },
    CommandGroup: { template: '<div><slot /></div>' },
}

describe('Select text defaults', () => {
    it('uses locale defaults while explicit props remain authoritative', () => {
        const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { common: { selectPlaceholder: 'Select', selectSearch: 'Search', selectEmpty: 'No matches' } } } })
        const wrapper = mount(SearchSelect, { global: { plugins: [i18n], stubs }, props: { options: [] } })
        expect(wrapper.text()).toContain('Select')
        expect(wrapper.find('[data-command-input]').attributes('placeholder')).toBe('Search')
        expect(wrapper.find('[data-command-empty]').text()).toContain('No matches')
        const explicit = mount(SearchSelect, { global: { plugins: [i18n], stubs }, props: { options: [], placeholder: 'Pick', searchPlaceholder: 'Find', emptyText: 'Nothing' } })
        expect(explicit.text()).toContain('Pick')
        expect(explicit.find('[data-command-input]').attributes('placeholder')).toBe('Find')
        expect(explicit.find('[data-command-empty]').text()).toContain('Nothing')
    })
})
