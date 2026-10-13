// @vitest-environment happy-dom
import { nextTick } from 'vue'
import { mount, type MountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import { describe, expect, it } from 'vitest'
import CommandMenu from './CommandMenu.vue'
import type { CommandMenuGroup } from './types'

const groups: CommandMenuGroup[] = [
    {
        id: 'navigation',
        label: '导航',
        items: [
            { id: 'overview', label: '概览', shortcut: 'G O' },
            { id: 'channels', label: '渠道' },
        ],
    },
    {
        id: 'actions',
        label: '操作',
        items: [{ id: 'disabled', label: '禁用操作', disabled: true }],
    },
]

function mountMenu(props: Record<string, unknown> = {}, options: MountingOptions<Component> = {}) {
    return mount(CommandMenu, {
        props: { groups, open: true, ...props },
        attachTo: document.body,
        ...options,
    })
}

describe('CommandMenu', () => {
    it('renders grouped items, shortcuts, and disabled state', async () => {
        const wrapper = mountMenu()
        await nextTick()

        expect(document.body.querySelectorAll('[data-slot="command-group"]')).toHaveLength(2)
        expect(document.body.textContent).toContain('导航')
        expect(document.body.textContent).toContain('概览')
        expect(document.body.textContent).toContain('G O')
        expect(document.body.querySelector('[data-slot="command-item"][data-disabled]')).toBeTruthy()
        wrapper.unmount()
    })

    it('filters items through the command input', async () => {
        const wrapper = mountMenu()
        await nextTick()
        const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!

        input.value = '渠道'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(document.body.textContent).toContain('渠道')
        expect(document.body.querySelector('[data-slot="command-item"][data-disabled]')).toBeNull()
        expect(document.body.textContent).not.toContain('概览')
        wrapper.unmount()
    })

    it('emits the selected item and closes uncontrolled menus', async () => {
        const wrapper = mount(CommandMenu, {
            props: { groups, defaultOpen: true },
            attachTo: document.body,
        })
        await nextTick()
        await nextTick()

        document.body.querySelector<HTMLElement>('[data-slot="command-item"]')!.click()
        await nextTick()

        expect(wrapper.emitted('select')?.[0]).toEqual([groups[0]!.items[0], groups[0]])
        expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
        expect(document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('data-state')).toBe('closed')
        wrapper.unmount()
    })

    it('supports ArrowDown/Enter selection and Escape dismissal', async () => {
        const wrapper = mountMenu()
        await nextTick()
        const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
        await nextTick()

        expect(wrapper.emitted('select')?.[0]).toEqual([groups[0]!.items[0], groups[0]])
        wrapper.unmount()

        const escapeWrapper = mountMenu()
        await nextTick()
        const escapeInput = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!
        escapeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        await nextTick()
        expect(escapeWrapper.emitted('update:open')?.at(-1)).toEqual([false])
        escapeWrapper.unmount()
    })

    it('allows an item slot and keeps disabled items inert', async () => {
        const select = [] as string[]
        const wrapper = mountMenu({}, {
            attrs: {
                onSelect: (item: { id: string }) => select.push(item.id),
            },
            slots: {
                item: ({ item }: { item: { label: string } }) => `命令：${item.label}`,
            },
        })
        await nextTick()

        expect(select).toEqual([])
        expect(document.body.querySelectorAll('[data-slot="command-item"]')[2]?.getAttribute('data-disabled')).toBeDefined()
        expect(document.body.textContent).toContain('命令：概览')
        wrapper.unmount()
    })
})
