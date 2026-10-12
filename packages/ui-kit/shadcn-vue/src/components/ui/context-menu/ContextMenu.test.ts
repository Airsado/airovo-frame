// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContextMenu from './ContextMenu.vue'
import ContextMenuTrigger from './ContextMenuTrigger.vue'
import ContextMenuContent from './ContextMenuContent.vue'
import ContextMenuItem from './ContextMenuItem.vue'

describe('ContextMenu primitives', () => {
    it('keeps stable data slots for trigger/content/item composition', () => {
        const wrapper = mount(ContextMenu, {
            slots: { default: () => [
                mount(ContextMenuTrigger, { slots: { default: 'target' } }).vm.$el,
                mount(ContextMenuContent, { slots: { default: () => mount(ContextMenuItem, { slots: { default: 'Copy' } }).vm.$el } }).vm.$el,
            ] },
        })
        expect(wrapper.attributes('data-slot')).toBe('context-menu')
    })
})
